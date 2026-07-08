from decimal import Decimal

from django.db.models import Sum, Count, F, DecimalField, ExpressionWrapper, Value
from django.db.models.functions import Coalesce
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_naive, is_aware

from orders.models import ReturnItem

from reports.base import BaseReport, register


@register
class ReturnsSummaryReport(BaseReport):
    """Admin: product returns broken down by product, reason and agent."""

    name = "returns_summary"
    title = "Returns Summary"
    description = "Product returns by product, reason and delivery man."
    admin_only = True

    def generate(self):
        value_expr = ExpressionWrapper(
            F("quantity") * Coalesce(F("unit_price"), Value(Decimal("0.00"))),
            output_field=DecimalField(max_digits=18, decimal_places=2),
        )
        zero = Value(Decimal("0.00"), output_field=DecimalField(max_digits=18, decimal_places=2))

        # Optional date filter (by return date).
        from_dt = parse_datetime(self.params.get("from_datetime") or "")
        to_dt = parse_datetime(self.params.get("to_datetime") or "")
        returns = ReturnItem.objects.all()
        if from_dt:
            if is_aware(from_dt):
                from_dt = make_naive(from_dt)
            returns = returns.filter(created_on__gte=from_dt)
        if to_dt:
            if is_aware(to_dt):
                to_dt = make_naive(to_dt)
            returns = returns.filter(created_on__lte=to_dt)

        by_product = [
            {
                "product": r["product"],
                "product_name": r["product__product_name"],
                "quantity": int(r["qty"] or 0),
                "count": r["cnt"],
                "value": float(r["val"] or 0),
            }
            for r in returns.values("product", "product__product_name")
            .annotate(qty=Sum("quantity"), cnt=Count("id"), val=Coalesce(Sum(value_expr), zero))
            .order_by("-qty")
        ]

        by_reason = [
            {"reason": r["reason"] or "—", "quantity": int(r["qty"] or 0), "count": r["cnt"]}
            for r in returns.values("reason")
            .annotate(qty=Sum("quantity"), cnt=Count("id"))
            .order_by("-qty")
        ]

        by_agent = [
            {
                "delivery_man": r["created_by"],
                "name": r["created_by__full_name"],
                "quantity": int(r["qty"] or 0),
            }
            for r in returns.filter(created_by__isnull=False)
            .values("created_by", "created_by__full_name")
            .annotate(qty=Sum("quantity"))
            .order_by("-qty")
        ]

        totals = returns.aggregate(
            total_quantity=Coalesce(Sum("quantity"), Value(0)),
            total_value=Coalesce(Sum(value_expr), zero),
        )

        return {
            "summary": {
                "total_quantity": int(totals["total_quantity"] or 0),
                "total_value": float(totals["total_value"] or 0),
            },
            "by_product": by_product,
            "by_reason": by_reason,
            "by_delivery_man": by_agent,
        }
