from decimal import Decimal

from django.db.models import Sum, F, DecimalField, ExpressionWrapper, Value
from django.db.models.functions import Coalesce

from products.models import Product
from orders.models import OrderItem, ReturnItem

from reports.base import BaseReport, register


@register
class ProductWiseReport(BaseReport):
    """
    Per-product historical report.

      current_stock_qty   : Product.stock_quantity (live inventory)
      total_sold_qty      : net units that left stock across ALL orders
      delivered_sold_qty  : units sold on delivered orders
      total_returned_qty  : gross units returned
      lifetime_stocked_qty: current_stock + total_sold (everything ever stocked)
      value columns       : current stock value (cost) and sold value (selling)
    """

    name = "product_wise"
    title = "Product Wise"
    description = "Lifetime stocked, sold, returned and current stock per product."

    def generate(self):
        # Aggregate each relation separately, then merge in Python — combining
        # multiple Sums over different relations in one annotate() inflates rows.
        sold_qty_map = {
            row["product"]: row["q"]
            for row in OrderItem.objects.values("product").annotate(
                q=Coalesce(Sum("quantity"), Value(0))
            )
        }
        delivered_qty_map = {
            row["product"]: row["q"]
            for row in OrderItem.objects.filter(order__order_status="delivered")
            .values("product")
            .annotate(q=Coalesce(Sum("quantity"), Value(0)))
        }
        sold_value_expr = ExpressionWrapper(
            F("quantity") * F("unit_price"),
            output_field=DecimalField(max_digits=18, decimal_places=2),
        )
        delivered_value_map = {
            row["product"]: row["v"]
            for row in OrderItem.objects.filter(order__order_status="delivered")
            .values("product")
            .annotate(v=Coalesce(Sum(sold_value_expr), Value(Decimal("0.00"))))
        }
        returned_qty_map = {
            row["product"]: row["q"]
            for row in ReturnItem.objects.values("product").annotate(
                q=Coalesce(Sum("quantity"), Value(0))
            )
        }

        products = Product.objects.select_related("company_id").order_by("product_name")

        report = []
        tot = {
            "lifetime": 0, "sold": 0, "delivered": 0, "returned": 0,
            "current": 0, "stock_value": Decimal("0.00"), "sold_value": Decimal("0.00"),
        }

        for p in products:
            current = int(p.stock_quantity or 0)
            sold = int(sold_qty_map.get(p.product_id, 0) or 0)
            delivered = int(delivered_qty_map.get(p.product_id, 0) or 0)
            returned = int(returned_qty_map.get(p.product_id, 0) or 0)
            lifetime = current + sold
            stock_value = Decimal(str(p.cost_price or 0)) * current
            sold_value = Decimal(str(delivered_value_map.get(p.product_id, 0) or 0))

            tot["lifetime"] += lifetime
            tot["sold"] += sold
            tot["delivered"] += delivered
            tot["returned"] += returned
            tot["current"] += current
            tot["stock_value"] += stock_value
            tot["sold_value"] += sold_value

            report.append({
                "product_id": p.product_id,
                "product_name": p.product_name,
                "sku": p.sku,
                "company_name": getattr(p.company_id, "company_name", None),
                "lifetime_stocked_qty": lifetime,
                "total_sold_qty": sold,
                "delivered_sold_qty": delivered,
                "total_returned_qty": returned,
                "current_stock_qty": current,
                "cost_price": float(p.cost_price or 0),
                "mrp": float(p.mrp or 0),
                "selling_price": float(p.selling_price or 0),
                "current_stock_value": float(stock_value),
                "sold_value": float(sold_value),
            })

        summary = {
            "total_products": len(report),
            "lifetime_stocked_qty": tot["lifetime"],
            "total_sold_qty": tot["sold"],
            "delivered_sold_qty": tot["delivered"],
            "total_returned_qty": tot["returned"],
            "current_stock_qty": tot["current"],
            "current_stock_value": float(tot["stock_value"]),
            "sold_value": float(tot["sold_value"]),
        }

        return {"summary": summary, "data": report}
