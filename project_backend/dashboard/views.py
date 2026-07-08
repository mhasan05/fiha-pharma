from decimal import Decimal
from datetime import datetime
from django.db.models import Q
from django.db.models import (
    Count, Sum, F, DecimalField, ExpressionWrapper, Value
)
from django.db.models.functions import Coalesce, ExtractYear, ExtractMonth
from django.utils.timezone import now
from django.utils.dateformat import DateFormat
from django.utils.dateparse import parse_datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from accounts.models import UserAuth
from products.models import Product
from orders.models import Order, OrderItem


class DashboardInfoView(APIView):
    """
    Optimized dashboard:
    - DB-level aggregation
    - grouped monthly sales/profit
    - grand total product cost price added
    """

    def get(self, request, *args, **kwargs):
        try:
            # -----------------------------
            # Basic counts
            # -----------------------------
            all_users = UserAuth.objects.filter(is_active=True, is_staff=False).count()
            all_products = Product.objects.filter(is_active=True).count()

            order_counts = Order.objects.aggregate(
                total_orders=Count("order_id"),
                total_pending_orders=Count("order_id", filter=Q(order_status="pending")),
                total_shipped_orders=Count("order_id", filter=Q(order_status="shipped")),
                total_delivered_orders=Count("order_id", filter=Q(order_status="delivered")),
                total_cancelled_orders=Count("order_id", filter=Q(order_status="cancelled")),
            )

            # -----------------------------
            # Current month range
            # -----------------------------
            current_date = now()
            start_of_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

            if current_date.month == 12:
                end_of_month = current_date.replace(
                    year=current_date.year + 1, month=1, day=1,
                    hour=0, minute=0, second=0, microsecond=0
                )
            else:
                end_of_month = current_date.replace(
                    month=current_date.month + 1, day=1,
                    hour=0, minute=0, second=0, microsecond=0
                )

            # All-time delivered querysets (used for lifetime/current figures)
            delivered_orders_all = Order.objects.filter(order_status="delivered")
            delivered_items_all = OrderItem.objects.filter(order__order_status="delivered")

            # -----------------------------
            # Optional date-range filter (today / month / custom range).
            # The frontend sends the resolved range as from_datetime/to_datetime;
            # sell/profit figures follow it, while stock figures stay current.
            # -----------------------------
            from_dt = parse_datetime(request.query_params.get("from_datetime") or "")
            to_dt = parse_datetime(request.query_params.get("to_datetime") or "")

            delivered_orders = delivered_orders_all
            delivered_items = delivered_items_all
            if from_dt:
                delivered_orders = delivered_orders.filter(order_date__gte=from_dt)
                delivered_items = delivered_items.filter(order__order_date__gte=from_dt)
            if to_dt:
                delivered_orders = delivered_orders.filter(order_date__lte=to_dt)
                delivered_items = delivered_items.filter(order__order_date__lte=to_dt)

            # -----------------------------
            # Reusable expressions
            # -----------------------------
            # Use the price/cost snapshotted on each OrderItem at order time, not
            # the live product price, so historical profit/cost stay accurate when
            # a product's price changes later.
            profit_expr = ExpressionWrapper(
                (Coalesce(F("unit_price"), Value(Decimal("0.00")))
                 - Coalesce(F("cost_price"), Value(Decimal("0.00")))) * F("quantity"),
                output_field=DecimalField(max_digits=18, decimal_places=2)
            )

            cost_expr = ExpressionWrapper(
                Coalesce(F("cost_price"), Value(Decimal("0.00"))) * F("quantity"),
                output_field=DecimalField(max_digits=18, decimal_places=2)
            )

            # -----------------------------
            # Grand totals
            # -----------------------------
            sales_summary = delivered_orders.aggregate(
                total_sales=Coalesce(Sum("total_amount"), Value(Decimal("0.00"))),
                total_delivery_cost=Coalesce(Sum("delivery_charge"), Value(Decimal("0.00"))),
                # "Total Given Discount" = per-invoice special bonus across delivered orders
                total_discount=Coalesce(Sum("special_bonus"), Value(Decimal("0.00"))),
            )

            # item_summary = delivered_items.aggregate(
            #     grand_total_product_cost_price=Coalesce(
            #         Sum(cost_expr), Value(Decimal("0.00"))
            #     ),
            # )

            stock_value_expr = ExpressionWrapper(
                F("cost_price") * F("stock_quantity"),
                output_field=DecimalField(max_digits=18, decimal_places=2)
            )

            item_summary = Product.objects.filter(is_active=True).aggregate(
                grand_total_product_cost_price=Coalesce(
                    Sum(stock_value_expr), Value(Decimal("0.00"))
                )
            )

            # Period metrics from the (optionally) date-filtered delivered items:
            # cost-price value, units sold, and profit.
            period_item_summary = delivered_items.aggregate(
                total_sold_cost=Coalesce(Sum(cost_expr), Value(Decimal("0.00"))),
                total_units=Coalesce(Sum("quantity"), Value(0)),
                total_profit=Coalesce(Sum(profit_expr), Value(Decimal("0.00"))),
            )
            sold_items_cost = period_item_summary["total_sold_cost"]
            total_sell_units = period_item_summary["total_units"]
            total_profit = period_item_summary["total_profit"]

            # Lifetime stock = current stock value + cost of ALL items ever sold
            # (always all-time, independent of the date filter).
            sold_items_cost_all = delivered_items_all.aggregate(
                total_sold_cost=Coalesce(Sum(cost_expr), Value(Decimal("0.00")))
            )["total_sold_cost"]
            lifetime_stock_amount = float(item_summary["grand_total_product_cost_price"]) + float(sold_items_cost_all)

            # -----------------------------
            # Current month profit
            # -----------------------------
            total_profit_current_month = delivered_items_all.filter(
                order__order_date__gte=start_of_month,
                order__order_date__lt=end_of_month
            ).aggregate(
                total_profit=Coalesce(Sum(profit_expr), Value(Decimal("0.00")))
            )["total_profit"]

            # -----------------------------
            # Top-selling products this month
            # -----------------------------
            top_product_qs = Product.objects.filter(
            orderitem__order__order_status="delivered"
            # orderitem__order__order_date__gte=start_of_month,
            # orderitem__order__order_date__lt=end_of_month
            ).values(
                "product_id",
                "product_name"
            ).annotate(
                total_quantity_sold=Coalesce(Sum("orderitem__quantity"), 0)
            ).order_by("-total_quantity_sold")[:5]

            top_selling_products = list(top_product_qs)

            # -----------------------------
            # Sales by month
            # -----------------------------
            sales_by_month_qs = delivered_orders.annotate(
                year=ExtractYear("order_date"),
                month=ExtractMonth("order_date")
            ).values(
                "year", "month"
            ).annotate(
                total_sales=Coalesce(Sum("total_amount"), Value(Decimal("0.00")))
            ).order_by("year", "month")

            sales_by_month = [
                {
                    "month": DateFormat(datetime(row["year"], row["month"], 1)).format("F Y"),
                    "total_sales": float(row["total_sales"]),
                }
                for row in sales_by_month_qs
            ]

            # -----------------------------
            # Profit by month
            # -----------------------------
            profit_by_month_qs = delivered_items.annotate(
                year=ExtractYear("order__order_date"),
                month=ExtractMonth("order__order_date")
            ).values(
                "year", "month"
            ).annotate(
                revenue=Coalesce(Sum(profit_expr), Value(Decimal("0.00")))
            ).order_by("year", "month")

            profit_by_month = [
                {
                    "month": DateFormat(datetime(row["year"], row["month"], 1)).format("F Y"),
                    "revenue": float(row["revenue"]),
                }
                for row in profit_by_month_qs
            ]

            dashboard_data = {
                "total_customers": all_users,
                "total_products": all_products,
                "total_orders": order_counts["total_orders"],
                "total_pending_orders": order_counts["total_pending_orders"],
                "total_shipped_orders": order_counts["total_shipped_orders"],
                "total_delivered_orders": order_counts["total_delivered_orders"],
                "total_cancelled_orders": order_counts["total_cancelled_orders"],
                "total_sales": float(sales_summary["total_sales"]),
                "total_sell_cost_price": float(sold_items_cost),
                "total_sell_units": int(total_sell_units),
                "total_profit": float(total_profit),
                "total_discount": float(sales_summary["total_discount"]),
                "total_delivery_cost": float(sales_summary["total_delivery_cost"]),
                "grand_total_product_cost_price": float(item_summary["grand_total_product_cost_price"]),
                "lifetime_stock_amount": lifetime_stock_amount,
                "monthly_revenue": float(total_profit_current_month),
                "top_selling_product": top_selling_products,
                "sales_by_month": sales_by_month,
                "profit_by_month": profit_by_month,
            }

            return Response(
                {"status": "success", "data": dashboard_data},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"status": "error", "message": f"Something went wrong: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# from django.shortcuts import render
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.db.models import F, ExpressionWrapper, DecimalField, Sum
# from django.utils.timezone import now
# from datetime import datetime

# from accounts.models import UserAuth
# from products.models import Product
# from orders.models import Order, OrderItem
# from django.db.models.functions import TruncMonth
# from django.utils.timezone import localtime
# from django.utils.dateformat import DateFormat

# class DashboardInfoView(APIView):
#     """
#     View to handle dashboard information.
#     """
#     def get(self, request, *args, **kwargs):
#         # Basic counts
#         all_users = UserAuth.objects.filter(is_active=True).count()
#         all_products = Product.objects.filter(is_active=True).count()
#         total_orders = Order.objects.all().count()
#         total_pending_orders = Order.objects.filter(order_status='pending').count()
#         total_shipped_orders = Order.objects.filter(order_status='shipped').count()
#         total_delivered_orders = Order.objects.filter(order_status='delivered').count()
#         total_cancelled_orders = Order.objects.filter(order_status='cancelled').count()

#         # Total sales and delivery cost
#         total_sales = Order.objects.filter(order_status='delivered').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
#         total_delivery_cost = Order.objects.filter(order_status='delivered').aggregate(Sum('delivery_charge'))['delivery_charge__sum'] or 0

#         # Get current month range
#         current_date = now()
#         start_of_month = datetime(current_date.year, current_date.month, 1)
#         if current_date.month == 12:
#             end_of_month = datetime(current_date.year + 1, 1, 1)
#         else:
#             end_of_month = datetime(current_date.year, current_date.month + 1, 1)

#         # Query top-selling product this month
#         top_product = Product.objects.filter(
#             orderitem__order__order_status='delivered',
#             orderitem__order__order_date__gte=start_of_month,
#             orderitem__order__order_date__lt=end_of_month
#         ).annotate(
#             total_quantity_sold=Sum('orderitem__quantity')
#         ).order_by('-total_quantity_sold')[:5]

#         # Serialize the result
#         top_selling_products = []
#         for product in top_product:
#             top_selling_products.append({
#                 "product_id": product.product_id,
#                 "product_name": product.product_name,
#                 "total_quantity_sold": product.total_quantity_sold or 0
#             })

#         # Profit expression: (selling_price - cost_price) * quantity
#         profit_expr = ExpressionWrapper(
#             (F('product__selling_price') - F('product__cost_price')) * F('quantity'),
#             output_field=DecimalField(max_digits=12, decimal_places=2)
#         )

#         # Total profit (monthly revenue)
#         monthly_revenue = OrderItem.objects.filter(
#             order__order_status='delivered',
#             order__order_date__gte=start_of_month,
#             order__order_date__lt=end_of_month
#         ).aggregate(
#             total_profit=Sum(profit_expr)
#         )['total_profit'] or 0

#         # sales_by_month (monthly sales)
#         sales_by_month = (
#             Order.objects.filter(order_status='delivered')
#             .annotate(month=TruncMonth('order_date', tzinfo=None))
#             .values('month')
#             .annotate(total_sales=Sum('total_amount'))
#             .order_by('month')
#         )

#         # Format the response
#         report = []
#         for entry in sales_by_month:
#             month_date = entry['month']  # Use the datetime directly
#             month_name = DateFormat(month_date).format('F')  # Full month name
#             report.append({
#                 "month": month_name,
#                 "total_sales": float(entry['total_sales'] or 0)
#             })



#         profit_expr = ExpressionWrapper(
#             (F('product__selling_price') - F('product__cost_price')) * F('quantity'),
#             output_field=DecimalField(max_digits=12, decimal_places=2)
#         )

#         # Annotate revenue grouped by month from delivered orders
#         monthly_revenue = (
#         OrderItem.objects
#         .filter(order__order_status='delivered')
#         .annotate(month=TruncMonth('order__order_date', tzinfo=None))
#         .values('month')
#         .annotate(total_revenue=Sum(profit_expr))
#         .order_by('month')
#     )

#         # Format month name
#         data = []
#         for item in monthly_revenue:
#             month_name = DateFormat(item['month']).format('F')
#             data.append({
#                 "month": month_name,
#                 "revenue": float(item['total_revenue'] or 0)
#             })

#         # Response data
#         dashboard_data = {
#             "total_customers": all_users,
#             "total_products": all_products,
#             "total_orders": total_orders,
#             "total_pending_orders": total_pending_orders,
#             "total_shipped_orders": total_shipped_orders,
#             "total_delivered_orders": total_delivered_orders,
#             "total_cancelled_orders": total_cancelled_orders,
#             "total_sales": total_sales,
#             "total_delivery_cost": total_delivery_cost,
#             "monthly_revenue": monthly_revenue,
#             "top_selling_product": top_selling_products,
#             "sales_by_month": report,
#             "profit_by_month": data

#         }

#         return Response({'status': 'success', 'data': dashboard_data}, status=status.HTTP_200_OK)