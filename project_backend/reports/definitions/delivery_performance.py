from django.db.models import Count, Q
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_naive, is_aware

from orders.models import Order

from reports.base import BaseReport, register


def _rate(delivered, assigned):
    return round((delivered / assigned) * 100, 1) if assigned else 0.0


@register
class DeliveryPerformanceReport(BaseReport):
    """Admin: delivery success rate and pending deliveries, overall and per agent."""

    name = "delivery_performance"
    title = "Delivery Performance"
    description = "Delivery success rate and pending deliveries per delivery man."
    admin_only = True

    def generate(self):
        from_dt = parse_datetime(self.params.get("from_datetime") or "")
        to_dt = parse_datetime(self.params.get("to_datetime") or "")
        base = Order.objects.filter(assigned_to__isnull=False)
        if from_dt:
            if is_aware(from_dt):
                from_dt = make_naive(from_dt)
            base = base.filter(order_date__gte=from_dt)
        if to_dt:
            if is_aware(to_dt):
                to_dt = make_naive(to_dt)
            base = base.filter(order_date__lte=to_dt)

        rows = (
            base
            .values("assigned_to", "assigned_to__full_name")
            .annotate(
                assigned=Count("order_id"),
                delivered=Count("order_id", filter=Q(order_status="delivered")),
                pending=Count("order_id", filter=Q(order_status="shipped")),
                cancelled=Count("order_id", filter=Q(order_status="cancelled")),
            )
            .order_by("-assigned")
        )

        by_delivery_man = [
            {
                "delivery_man": r["assigned_to"],
                "name": r["assigned_to__full_name"],
                "assigned": r["assigned"],
                "delivered": r["delivered"],
                "pending": r["pending"],
                "cancelled": r["cancelled"],
                "success_rate": _rate(r["delivered"], r["assigned"]),
            }
            for r in rows
        ]

        agg = base.aggregate(
            assigned=Count("order_id"),
            delivered=Count("order_id", filter=Q(order_status="delivered")),
            pending=Count("order_id", filter=Q(order_status="shipped")),
        )

        return {
            "summary": {
                "assigned": agg["assigned"] or 0,
                "delivered": agg["delivered"] or 0,
                "pending_deliveries": agg["pending"] or 0,
                "success_rate": _rate(agg["delivered"] or 0, agg["assigned"] or 0),
            },
            "by_delivery_man": by_delivery_man,
        }
