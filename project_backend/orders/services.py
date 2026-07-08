from decimal import Decimal, ROUND_HALF_UP

from settings.models import ConditionalDiscount


def get_bonus_rule(subtotal):
    """The active conditional-discount rule that applies to a given subtotal."""
    return (
        ConditionalDiscount.objects
        .filter(is_active=True, minimum_purchase_amount__lte=subtotal)
        .order_by("-minimum_purchase_amount")
        .first()
    )


def recalculate_order_totals(order):
    """Recompute special bonus + total_amount from the order's current items
    (using snapshot unit prices). Saving recomputes due_amount automatically.
    Shared by the admin order update and the delivery return flow."""
    subtotal = Decimal("0.00")
    for item in order.items.all():
        subtotal += Decimal(str(item.items_total()))

    delivery_charge = Decimal(str(order.delivery_charge or 0))
    bonus_rule = get_bonus_rule(subtotal)

    if bonus_rule:
        special_bonus_percentage = Decimal(str(bonus_rule.bonus_percentage))
        special_bonus = (subtotal * special_bonus_percentage / Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
    else:
        special_bonus_percentage = Decimal("0.00")
        special_bonus = Decimal("0.00")

    final_total = (subtotal + delivery_charge - special_bonus).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    if final_total < 0:
        final_total = Decimal("0.00")

    order.special_bonus_percentage = special_bonus_percentage
    order.special_bonus = special_bonus
    order.total_amount = final_total
    order.save(update_fields=[
        "special_bonus_percentage", "special_bonus", "total_amount", "due_amount", "updated_on"
    ])
    return order