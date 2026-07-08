from decimal import Decimal

from django.db.models import Sum, Count, Value, DecimalField, Q
from django.db.models.functions import Coalesce
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_naive, is_aware

from orders.models import Order

from reports.base import BaseReport, register


@register
class CustomerBalanceReport(BaseReport):
    """Per-customer totals: order amount, collected, and outstanding due.

    Admin/staff see all customers; a regular customer sees only their own.
    Optional filters: customer=<user_id>, from_datetime / to_datetime (order date).
    """

    name = "customer_balance"
    title = "Customer Balance"
    description = "Per-customer total order amount, collected amount and total due."

    def generate(self):
        zero = Value(Decimal("0.00"), output_field=DecimalField(max_digits=18, decimal_places=2))

        user = self.request.user
        orders = Order.objects.all()
        if not (user.is_superuser or user.is_staff):
            orders = orders.filter(user_id=user)

        customer = self.params.get("customer")
        if customer and customer not in ("all", "null"):
            orders = orders.filter(user_id=customer)

        from_dt = parse_datetime(self.params.get("from_datetime") or "")
        to_dt = parse_datetime(self.params.get("to_datetime") or "")
        if from_dt:
            if is_aware(from_dt):
                from_dt = make_naive(from_dt)
            orders = orders.filter(order_date__gte=from_dt)
        if to_dt:
            if is_aware(to_dt):
                to_dt = make_naive(to_dt)
            orders = orders.filter(order_date__lte=to_dt)

        rows = (
            orders.values(
                "user_id", "user_id__full_name", "user_id__shop_name", "user_id__phone"
            )
            .annotate(
                order_count=Count("order_id"),
                total_order_amount=Coalesce(Sum("total_amount"), zero),
                total_collected=Coalesce(Sum("collected_amount"), zero),
                # Outstanding due is only meaningful for DELIVERED orders — the
                # goods are out and not fully paid. Cancelled/pending/processing/
                # shipped orders are excluded so they don't inflate the due.
                total_due=Coalesce(
                    Sum("due_amount", filter=Q(order_status="delivered")), zero
                ),
            )
            .order_by("-total_due")
        )

        data = []
        g_order = g_collected = g_due = Decimal("0.00")
        g_count = 0
        for r in rows:
            order_amt = Decimal(str(r["total_order_amount"] or 0))
            collected = Decimal(str(r["total_collected"] or 0))
            due = Decimal(str(r["total_due"] or 0))
            g_order += order_amt
            g_collected += collected
            g_due += due
            g_count += r["order_count"]
            data.append({
                "customer": r["user_id"],
                "name": r["user_id__full_name"],
                "shop_name": r["user_id__shop_name"],
                "phone": r["user_id__phone"],
                "order_count": r["order_count"],
                "total_order_amount": float(order_amt),
                "total_collected": float(collected),
                "total_due": float(due),
            })

        summary = {
            "customers": len(data),
            "order_count": g_count,
            "total_order_amount": float(g_order),
            "total_collected": float(g_collected),
            "total_due": float(g_due),
        }
        return {"summary": summary, "data": data}
