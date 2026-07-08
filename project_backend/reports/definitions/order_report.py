from decimal import Decimal

from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_naive, is_aware

from orders.models import Order

from reports.base import BaseReport, register


@register
class OrderReport(BaseReport):
    """
    One row per order with collection/due tracking.

      final_total  = order.total_amount (already net of returns)
      return_amount= sum(return qty * product selling price)
      inv_amount   = final_total + return_amount (gross invoice)
      collection   = order.collected_amount
      due_amount   = final_total - collection

    Filters (all optional): from_datetime / to_datetime, customer (user_id),
    area (area_id).
    """

    name = "order"
    title = "Order Report"
    description = "Invoice, return, collection and due per order — filter by date, customer or area."

    def generate(self):
        p = self.params
        from_dt = parse_datetime(p.get("from_datetime") or "")
        to_dt = parse_datetime(p.get("to_datetime") or "")
        customer = p.get("customer")
        area = p.get("area")

        orders = Order.objects.select_related("user_id", "user_id__area").prefetch_related(
            "return_items__product"
        ).exclude(order_status="cancelled")  # void orders are excluded from the report and its totals

        # Admin/staff see all invoices; a regular user sees only their own.
        user = self.request.user
        if not (user.is_superuser or user.is_staff):
            orders = orders.filter(user_id=user)

        if from_dt:
            if is_aware(from_dt):
                from_dt = make_naive(from_dt)
            orders = orders.filter(order_date__gte=from_dt)
        if to_dt:
            if is_aware(to_dt):
                to_dt = make_naive(to_dt)
            orders = orders.filter(order_date__lte=to_dt)
        if customer and customer not in ("all", "null"):
            orders = orders.filter(user_id=customer)
        if area and area not in ("all", "null"):
            orders = orders.filter(user_id__area_id=area)

        orders = orders.order_by("-order_date")  # newest orders first

        report = []
        tot = {
            "inv": Decimal("0.00"), "ret": Decimal("0.00"), "final": Decimal("0.00"),
            "coll": Decimal("0.00"), "due": Decimal("0.00"),
        }

        for idx, o in enumerate(orders, start=1):
            user = o.user_id
            final_total = Decimal(str(o.total_amount or 0))
            ret = sum(
                (
                    Decimal(str(ri.quantity)) * Decimal(str(
                        ri.unit_price if ri.unit_price is not None
                        else (ri.product.selling_price if ri.product else 0)
                    ))
                    for ri in o.return_items.all()
                ),
                Decimal("0.00"),
            )
            inv = final_total + ret
            collection = Decimal(str(o.collected_amount or 0))
            due = final_total - collection

            tot["inv"] += inv
            tot["ret"] += ret
            tot["final"] += final_total
            tot["coll"] += collection
            tot["due"] += due

            report.append({
                "sl_no": idx,
                "order_id": o.order_id,
                "invoice_number": o.invoice_number,
                "area": getattr(getattr(user, "area", None), "area_name", None),
                "date": o.order_date.strftime("%Y-%m-%d") if o.order_date else None,
                "party": getattr(user, "shop_name", None),
                "inv_amount": float(inv),
                "return_amount": float(ret),
                "final_total": float(final_total),
                "collection": float(collection),
                "due_amount": float(due),
            })

        summary = {
            "total_orders": len(report),
            "inv_amount": float(tot["inv"]),
            "return_amount": float(tot["ret"]),
            "final_total": float(tot["final"]),
            "collection": float(tot["coll"]),
            "due_amount": float(tot["due"]),
        }

        return {"summary": summary, "data": report}
