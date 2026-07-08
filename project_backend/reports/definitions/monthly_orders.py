from datetime import datetime
from decimal import Decimal

from django.db.models import Sum, Count, Value, DecimalField
from django.db.models.functions import Coalesce, ExtractYear, ExtractMonth
from django.utils.timezone import now, make_naive, is_aware

from orders.models import Order

from reports.base import BaseReport, register


@register
class MonthlyOrdersReport(BaseReport):
    """This month's order amount + a month-wise breakdown of order count and
    amount. Pass ?month=YYYY-MM to also get that month's order details.

    Admin/staff see all orders; a regular user sees only their own. Cancelled
    orders are excluded from the amounts (they are void).
    Optional: ?customer=<user_id> (admin), ?month=YYYY-MM.
    """

    name = "monthly_orders"
    title = "Monthly Orders"
    description = "This month's order amount and a month-wise breakdown; ?month=YYYY-MM for that month's order details."

    def generate(self):
        zero = Value(Decimal("0.00"), output_field=DecimalField(max_digits=18, decimal_places=2))

        user = self.request.user
        orders = Order.objects.exclude(order_status="cancelled")
        if not (user.is_superuser or user.is_staff):
            orders = orders.filter(user_id=user)

        customer = self.params.get("customer")
        if customer and customer not in ("all", "null"):
            orders = orders.filter(user_id=customer)

        # ---- Current month total ----
        _now = now()
        if is_aware(_now):
            _now = make_naive(_now)
        month_start = _now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = (
            month_start.replace(year=_now.year + 1, month=1)
            if _now.month == 12
            else month_start.replace(month=_now.month + 1)
        )
        cur = orders.filter(
            order_date__gte=month_start, order_date__lt=next_month
        ).aggregate(
            order_count=Count("order_id"),
            total_amount=Coalesce(Sum("total_amount"), zero),
        )
        current_month = {
            "month": month_start.strftime("%B %Y"),
            "year": _now.year,
            "month_num": _now.month,
            "order_count": cur["order_count"],
            "total_amount": float(cur["total_amount"]),
        }

        # ---- Month-wise breakdown (newest first) ----
        rows = (
            orders.annotate(
                year=ExtractYear("order_date"), month=ExtractMonth("order_date")
            )
            .values("year", "month")
            .annotate(
                order_count=Count("order_id"),
                total_amount=Coalesce(Sum("total_amount"), zero),
            )
            .order_by("-year", "-month")
        )
        months = [
            {
                "month": datetime(r["year"], r["month"], 1).strftime("%B %Y"),
                "year": r["year"],
                "month_num": r["month"],
                "order_count": r["order_count"],
                "total_amount": float(r["total_amount"]),
            }
            for r in rows
        ]

        result = {"current_month": current_month, "months": months}

        # ---- Optional: order details for a specific month (?month=YYYY-MM) ----
        month_param = self.params.get("month")
        if month_param:
            try:
                y_str, m_str = month_param.split("-")
                y, m = int(y_str), int(m_str)
                start = datetime(y, m, 1)
                end = datetime(y + 1, 1, 1) if m == 12 else datetime(y, m + 1, 1)
            except (ValueError, TypeError):
                start = end = None

            if start:
                detail_qs = (
                    orders.filter(order_date__gte=start, order_date__lt=end)
                    .select_related("user_id")
                    .order_by("-order_date")
                )
                result["selected_month"] = month_param
                result["orders"] = [
                    {
                        "order_id": o.order_id,
                        "invoice_number": o.invoice_number,
                        "order_date": o.order_date,
                        "order_status": o.order_status,
                        "customer": o.user_id_id,
                        "customer_name": getattr(o.user_id, "full_name", None),
                        "shop_name": getattr(o.user_id, "shop_name", None),
                        "phone": getattr(o.user_id, "phone", None),
                        "total_amount": float(o.total_amount or 0),
                        "collected_amount": float(o.collected_amount or 0),
                        "due_amount": float(o.due_amount or 0),
                    }
                    for o in detail_qs
                ]

        return result
