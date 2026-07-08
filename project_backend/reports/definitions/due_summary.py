from django.db.models import Sum, Q
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_naive, is_aware

from orders.models import Order
from delivery.models import CollectionPayment

from reports.base import BaseReport, register


@register
class DueSummaryReport(BaseReport):
    """Admin: customer dues (outstanding per customer) and delivery-man dues
    (cash collected but not yet settled by an approved deposit)."""

    name = "due_summary"
    title = "Due Summary"
    description = "Customer dues and delivery-man cash-in-hand."
    admin_only = True

    def generate(self):
        from_dt = parse_datetime(self.params.get("from_datetime") or "")
        to_dt = parse_datetime(self.params.get("to_datetime") or "")
        if from_dt and is_aware(from_dt):
            from_dt = make_naive(from_dt)
        if to_dt and is_aware(to_dt):
            to_dt = make_naive(to_dt)

        # Customer dues: DELIVERED orders with outstanding due, optionally within
        # order_date. Only delivered orders represent a real owed balance —
        # cancelled/pending/etc are excluded.
        cust_orders = Order.objects.filter(order_status="delivered", due_amount__gt=0)
        if from_dt:
            cust_orders = cust_orders.filter(order_date__gte=from_dt)
        if to_dt:
            cust_orders = cust_orders.filter(order_date__lte=to_dt)

        customer_dues = [
            {
                "customer": r["user_id"],
                "name": r["user_id__full_name"],
                "shop_name": r["user_id__shop_name"],
                "due": float(r["due"] or 0),
            }
            for r in cust_orders
            .values("user_id", "user_id__full_name", "user_id__shop_name")
            .annotate(due=Sum("due_amount"))
            .order_by("-due")
        ]

        # Delivery-man dues = cash collected (optionally within the period) but
        # not yet settled by an approved deposit.
        not_settled = CollectionPayment.objects.filter(
            delivery_man__isnull=False
        ).filter(Q(deposit__isnull=True) | Q(deposit__status="pending"))
        if from_dt:
            not_settled = not_settled.filter(collected_at__gte=from_dt)
        if to_dt:
            not_settled = not_settled.filter(collected_at__lte=to_dt)

        delivery_man_dues = [
            {
                "delivery_man": r["delivery_man"],
                "name": r["delivery_man__full_name"],
                "cash_in_hand": float(r["total"] or 0),
            }
            for r in not_settled.values("delivery_man", "delivery_man__full_name")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        ]

        return {
            "summary": {
                "total_customer_due": float(sum(c["due"] for c in customer_dues)),
                "total_delivery_man_due": float(sum(d["cash_in_hand"] for d in delivery_man_dues)),
            },
            "customer_dues": customer_dues,
            "delivery_man_dues": delivery_man_dues,
        }
