from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils.timezone import now

from accounts.models import UserAuth


def assign_order_by_area(order):
    """
    Auto-assign an order to a delivery agent based on the customer's area.

    Rule: among active delivery_man users in the same area, pick the one with
    the fewest pending (shipped) deliveries; tie-break by lowest user_id.
    Returns the chosen agent, or None if the order is already assigned or no
    suitable agent exists (left unassigned for manual admin assignment).
    """
    # Imported here to avoid a circular import (orders.views -> this module).
    from orders.models import Order

    if order.assigned_to_id:
        return order.assigned_to

    customer = order.user_id
    area_id = getattr(customer, "area_id", None)
    if not area_id:
        return None

    candidates = UserAuth.objects.filter(
        role="delivery_man", is_active=True, area_id=area_id
    ).order_by("user_id")
    if not candidates:
        return None

    best, best_load = None, None
    for agent in candidates:
        load = Order.objects.filter(assigned_to=agent, order_status="shipped").count()
        if best_load is None or load < best_load:
            best, best_load = agent, load

    if best is not None:
        order.assigned_to = best
        order.assigned_at = now()
        order.save(update_fields=["assigned_to", "assigned_at", "updated_on"])
        notify_order_assigned(order, best)
    return best


def notify_order_assigned(order, agent):
    """Push + in-app notification to the agent an order was assigned to."""
    from notification.services import notify_user

    notify_user(
        agent,
        "New delivery assigned",
        f"Order {order.invoice_number} has been assigned to you.",
        data={"type": "order_assigned", "order_id": order.pk},
    )


def recalc_order_collection(order):
    """Recompute Order.collected_amount as the SUM of its ledger payments.
    Saving recomputes due_amount automatically (Order.save)."""
    from .models import CollectionPayment

    total = CollectionPayment.objects.filter(order=order).aggregate(s=Sum("amount"))["s"] or 0
    order.collected_amount = total
    order.save(update_fields=["collected_amount", "updated_on"])
    return order.collected_amount


def record_payment(order, amount, delivery_man=None, note=""):
    """Add a collection payment to an order's ledger and refresh the cached
    collected/due amounts. Returns the created CollectionPayment."""
    from .models import CollectionPayment

    amount = Decimal(str(amount or 0))
    payment = CollectionPayment.objects.create(
        order=order, delivery_man=delivery_man, amount=amount, note=note
    )
    recalc_order_collection(order)
    return payment


def set_collected_total(order, target_total, note="Admin adjustment"):
    """Reconcile an absolute collected total (e.g. entered by an admin) through
    the ledger: create an adjustment entry for the difference vs the current
    ledger sum, so collected_amount stays = SUM(ledger)."""
    from .models import CollectionPayment

    current = CollectionPayment.objects.filter(order=order).aggregate(s=Sum("amount"))["s"] or 0
    delta = Decimal(str(target_total or 0)) - Decimal(str(current))
    if delta != 0:
        CollectionPayment.objects.create(
            order=order, delivery_man=None, amount=delta, note=note
        )
    recalc_order_collection(order)


# ---------------------------------------------------------------------------
# Cash settlement / deposits
# ---------------------------------------------------------------------------

def undeposited_amount(agent):
    """Cash the agent has collected that isn't attached to any deposit yet."""
    from .models import CollectionPayment

    return CollectionPayment.objects.filter(
        delivery_man=agent, deposit__isnull=True
    ).aggregate(s=Sum("amount"))["s"] or Decimal("0.00")


def pending_deposit_amount(agent):
    """Cash submitted but awaiting admin approval."""
    from .models import CollectionPayment

    return CollectionPayment.objects.filter(
        delivery_man=agent, deposit__status="pending"
    ).aggregate(s=Sum("amount"))["s"] or Decimal("0.00")


def cash_in_hand(agent):
    """Total cash the agent holds that the company hasn't settled (approved):
    undeposited + pending."""
    return Decimal(str(undeposited_amount(agent))) + Decimal(str(pending_deposit_amount(agent)))


def submit_deposit(agent, note=""):
    """Create a deposit request covering ALL of the agent's undeposited
    collections. Returns the DepositRequest, or None if there's nothing to
    deposit."""
    from .models import CollectionPayment, DepositRequest

    with transaction.atomic():
        payments = list(
            CollectionPayment.objects.select_for_update().filter(
                delivery_man=agent, deposit__isnull=True
            )
        )
        total = sum((p.amount for p in payments), Decimal("0.00"))
        if not payments or total <= 0:
            return None

        deposit = DepositRequest.objects.create(
            delivery_man=agent, amount=total, status="pending", note=note or ""
        )
        CollectionPayment.objects.filter(pk__in=[p.pk for p in payments]).update(deposit=deposit)
    return deposit


def approve_deposit(deposit, admin):
    from notification.services import notify_user

    deposit.status = "approved"
    deposit.reviewed_by = admin
    deposit.reviewed_at = now()
    deposit.save(update_fields=["status", "reviewed_by", "reviewed_at"])
    notify_user(
        deposit.delivery_man,
        "Deposit approved",
        f"Your deposit of {deposit.amount} has been approved.",
        data={"type": "deposit", "status": "approved", "deposit_id": deposit.pk},
    )
    return deposit


def reject_deposit(deposit, admin, review_note=""):
    """Reject and release its collections back to the undeposited pool."""
    from notification.services import notify_user
    from .models import CollectionPayment

    with transaction.atomic():
        deposit.status = "rejected"
        deposit.reviewed_by = admin
        deposit.reviewed_at = now()
        deposit.review_note = review_note or ""
        deposit.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_note"])
        CollectionPayment.objects.filter(deposit=deposit).update(deposit=None)

    msg = f"Your deposit of {deposit.amount} was rejected."
    if review_note:
        msg += f" Note: {review_note}"
    notify_user(
        deposit.delivery_man,
        "Deposit rejected",
        msg,
        data={"type": "deposit", "status": "rejected", "deposit_id": deposit.pk},
    )
    return deposit


# ---------------------------------------------------------------------------
# Return requests (agent submits -> staff confirms -> stock restored)
# ---------------------------------------------------------------------------

class ReturnRequestError(Exception):
    pass


def create_return_request(order, agent, items, note=""):
    """Create a return request AND apply it to the order immediately.

    `items` = [{"product": <id>, "quantity": <n>, "reason": "..."}].
    Validates each line against the order, snapshots the order line, then
    reduces the order line quantity (removing the line if fully returned) and
    recomputes the order total/due — so the agent collects the correct reduced
    amount on the spot. Stock is NOT restored here; that happens when staff
    confirm the physical return (see `apply_return_request`).
    """
    from orders.models import OrderItem
    from orders.services import recalculate_order_totals
    from .models import ReturnRequest, ReturnRequestItem

    if not items:
        raise ReturnRequestError("No return items provided.")

    with transaction.atomic():
        req = ReturnRequest.objects.create(order=order, delivery_man=agent, status="pending", note=note or "")
        for line in items:
            product_id = line.get("product")
            qty = int(line.get("quantity") or 0)
            reason = line.get("reason") or ""
            if not product_id or qty <= 0:
                raise ReturnRequestError("Each item needs a product and a positive quantity.")
            oi = OrderItem.objects.select_related("product").filter(order=order, product_id=product_id).first()
            if not oi:
                raise ReturnRequestError(f"Product {product_id} is not in this order.")
            if qty > oi.quantity:
                raise ReturnRequestError(f"Cannot return {qty}; only {oi.quantity} ordered for product {product_id}.")

            # Snapshot the full order line so a later rejection can restore it exactly.
            ReturnRequestItem.objects.create(
                return_request=req, product=oi.product, quantity=qty,
                unit_price=oi.unit_price, cost_price=oi.cost_price, mrp=oi.mrp,
                discount_percent=oi.discount_percent, product_name=oi.product_name,
                reason=reason,
            )

            # Apply to the order NOW (reduce qty/amount) — stock stays out until confirmed.
            if qty == oi.quantity:
                oi.delete()
            else:
                oi.quantity -= qty
                oi.save(update_fields=["quantity"])

        recalculate_order_totals(order)
    return req


def apply_return_request(req, reviewer):
    """Confirm a return: the goods are physically back, so restore stock and
    log the finalized ReturnItem rows. The order was already reduced at
    submission, so its totals are left untouched here."""
    from orders.models import ReturnItem

    if req.status != "pending":
        raise ReturnRequestError(f"Return request already {req.status}.")

    with transaction.atomic():
        for line in req.items.select_related("product").all():
            product = line.product
            product.stock_quantity += line.quantity
            product.save(update_fields=["stock_quantity"])

            ReturnItem.objects.create(
                order=req.order,
                product=product,
                quantity=line.quantity,
                unit_price=line.unit_price,
                reason=line.reason or "Returned at delivery",
                created_by=req.delivery_man,
            )

        req.status = "confirmed"
        req.reviewed_by = reviewer
        req.reviewed_at = now()
        req.save(update_fields=["status", "reviewed_by", "reviewed_at"])

    from notification.services import notify_user

    notify_user(
        req.delivery_man,
        "Return confirmed",
        f"Your return for order {req.order.invoice_number} has been confirmed.",
        data={"type": "return", "status": "confirmed", "order_id": req.order_id},
    )
    return req


def reject_return_request(req, reviewer, review_note=""):
    """Reject a return: the goods were never handed back, so REVERSE the order
    adjustment made at submission — restore each order line (recreating it if it
    was fully removed) and recompute the order total/due."""
    from orders.models import OrderItem
    from orders.services import recalculate_order_totals

    if req.status != "pending":
        raise ReturnRequestError(f"Return request already {req.status}.")

    with transaction.atomic():
        for line in req.items.select_related("product").all():
            oi = OrderItem.objects.filter(order=req.order, product=line.product).first()
            if oi:
                oi.quantity += line.quantity
                oi.save(update_fields=["quantity"])
            else:
                OrderItem.objects.create(
                    order=req.order,
                    product=line.product,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    cost_price=line.cost_price,
                    mrp=line.mrp,
                    discount_percent=line.discount_percent or 0,
                    product_name=line.product_name or line.product.product_name,
                )

        recalculate_order_totals(req.order)

        req.status = "rejected"
        req.reviewed_by = reviewer
        req.reviewed_at = now()
        req.review_note = review_note or ""
        req.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_note"])

    from notification.services import notify_user

    msg = f"Your return for order {req.order.invoice_number} was rejected."
    if review_note:
        msg += f" Note: {review_note}"
    notify_user(
        req.delivery_man,
        "Return rejected",
        msg,
        data={"type": "return", "status": "rejected", "order_id": req.order_id},
    )
    return req
