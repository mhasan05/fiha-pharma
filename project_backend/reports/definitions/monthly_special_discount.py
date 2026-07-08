from decimal import Decimal
from datetime import datetime

from django.db.models import Sum, Value, DecimalField
from django.db.models.functions import Coalesce, ExtractYear, ExtractMonth
from django.utils.dateformat import DateFormat
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_naive, is_aware, now

from orders.models import Order

from reports.base import BaseReport, register


@register
class MonthlySpecialDiscountReport(BaseReport):
    """
    Total special discount (Order.special_bonus) grouped by month.

    Optional filters: from_datetime / to_datetime (by order date).
    Each row: {"month": "June 2026", "year": 2026, "month_number": 6,
               "total_special_discount": 1234.56}
    """

    name = "monthly_special_discount"
    title = "Monthly Special Discount"
    description = "Total special discount (special bonus) grouped by month."

    def generate(self):
        from_dt = parse_datetime(self.params.get("from_datetime") or "")
        to_dt = parse_datetime(self.params.get("to_datetime") or "")

        # Admin/staff see all; a regular user sees only their own orders.
        # Cancelled orders are void and excluded from every discount figure.
        user = self.request.user
        base_orders = Order.objects.exclude(order_status="cancelled")
        if not (user.is_superuser or user.is_staff):
            base_orders = base_orders.filter(user_id=user)

        # Current-month total — independent of the from/to filters below.
        _now = now()
        if is_aware(_now):
            _now = make_naive(_now)
        month_start = _now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if _now.month == 12:
            month_end = month_start.replace(year=_now.year + 1, month=1)
        else:
            month_end = month_start.replace(month=_now.month + 1)
        current_month_special_discount = float(
            base_orders.filter(
                order_date__gte=month_start, order_date__lt=month_end
            ).aggregate(s=Sum("special_bonus"))["s"] or 0
        )

        orders = base_orders
        if from_dt:
            if is_aware(from_dt):
                from_dt = make_naive(from_dt)
            orders = orders.filter(order_date__gte=from_dt)
        if to_dt:
            if is_aware(to_dt):
                to_dt = make_naive(to_dt)
            orders = orders.filter(order_date__lte=to_dt)

        rows = (
            orders.annotate(
                year=ExtractYear("order_date"),
                month=ExtractMonth("order_date"),
            )
            .values("year", "month")
            .annotate(total=Coalesce(Sum("special_bonus"), Value(Decimal("0.00"))))
            .order_by("year", "month")
        )

        data = []
        grand_total = Decimal("0.00")
        for r in rows:
            total = Decimal(str(r["total"] or 0))
            grand_total += total
            data.append({
                "year": r["year"],
                "month_number": r["month"],
                "month": DateFormat(datetime(r["year"], r["month"], 1)).format("F Y"),
                "total_special_discount": float(total),
            })

        summary = {
            "months": len(data),
            "total_special_discount": float(grand_total),
            "current_month_special_discount": current_month_special_discount,
        }
        return {"summary": summary, "data": data}
