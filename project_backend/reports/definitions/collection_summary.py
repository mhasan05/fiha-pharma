from decimal import Decimal

from django.db.models import Sum
from django.utils.dateparse import parse_datetime
from django.utils.timezone import now, make_naive, is_aware

from delivery.models import CollectionPayment

from reports.base import BaseReport, register


@register
class CollectionSummaryReport(BaseReport):
    """Admin: collections today, by delivery man, and by customer.

    Optional filters: from_datetime / to_datetime (by collected_at).
    """

    name = "collection_summary"
    title = "Collection Summary"
    description = "Collections today, by delivery man and by customer."
    admin_only = True

    def generate(self):
        from_dt = parse_datetime(self.params.get("from_datetime") or "")
        to_dt = parse_datetime(self.params.get("to_datetime") or "")

        payments = CollectionPayment.objects.all()
        if from_dt:
            if is_aware(from_dt):
                from_dt = make_naive(from_dt)
            payments = payments.filter(collected_at__gte=from_dt)
        if to_dt:
            if is_aware(to_dt):
                to_dt = make_naive(to_dt)
            payments = payments.filter(collected_at__lte=to_dt)

        _now = now()
        today_start = _now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_total = float(
            CollectionPayment.objects.filter(collected_at__gte=today_start)
            .aggregate(s=Sum("amount"))["s"] or 0
        )

        by_delivery_man = [
            {
                "delivery_man": r["delivery_man"],
                "name": r["delivery_man__full_name"],
                "total": float(r["total"] or 0),
            }
            for r in payments.filter(delivery_man__isnull=False)
            .values("delivery_man", "delivery_man__full_name")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        ]

        by_customer = [
            {
                "customer": r["order__user_id"],
                "name": r["order__user_id__full_name"],
                "shop_name": r["order__user_id__shop_name"],
                "total": float(r["total"] or 0),
            }
            for r in payments.values(
                "order__user_id", "order__user_id__full_name", "order__user_id__shop_name"
            )
            .annotate(total=Sum("amount"))
            .order_by("-total")
        ]

        grand_total = float(payments.aggregate(s=Sum("amount"))["s"] or 0)

        return {
            "summary": {"today_collection": today_total, "total_collection": grand_total},
            "by_delivery_man": by_delivery_man,
            "by_customer": by_customer,
        }
