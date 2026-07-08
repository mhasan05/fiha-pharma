from rest_framework import viewsets
from .models import *
from .serializers import *
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from settings.models import *
from notification.models import *
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_naive, is_aware, now
from django.db.models import Sum
from openpyxl import Workbook
from django.http import HttpResponse
from accounts.models import Area



class OrderPagination(PageNumberPagination):
    page_size = 10  # default page size
    page_size_query_param = 'page_size'  # let client override page size using ?page_size=
    max_page_size = 500

class DownloadOrderView(APIView):
    def get(self, request):
        from_datetime = request.query_params.get('from_datetime')
        to_datetime = request.query_params.get('to_datetime')
        area = request.query_params.get('area', None)
        status_param = request.query_params.get('status', None)
        shop_name = request.query_params.get('shop_name', None)

        orders = Order.objects.all()
        if shop_name:
            orders = orders.filter(user_id__shop_name__iexact=shop_name)
        from_dt = None
        to_dt = None

        if from_datetime:
            from_dt = parse_datetime(from_datetime)
            if from_dt:
                if is_aware(from_dt):
                    from_dt = make_naive(from_dt)
                orders = orders.filter(order_date__gte=from_dt)

        if to_datetime:
            to_dt = parse_datetime(to_datetime)
            if to_dt:
                if is_aware(to_dt):
                    to_dt = make_naive(to_dt)
                orders = orders.filter(order_date__lte=to_dt)

        if area and area not in ('all', 'null'):
            orders = orders.filter(user_id__area_id=area)
            try:
                get_area = Area.objects.get(area_id=area)
                area_label = str(get_area.area_name)
            except Area.DoesNotExist:
                area_label = f"Area #{area}"
        else:
            area_label = "All Areas"

        if status_param and status_param not in ('all', 'null'):
            orders = orders.filter(order_status=status_param)
            status_label = status_param.capitalize()
        else:
            status_label = "All Statuses"

        serializer = OrderSerializer(orders, many=True)

        # create Excel workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Orders"


        # ============================
        # Report Filters (Metadata)
        # ============================
        ws.append(["Report Filters"])
        ws.append(["From Date", from_dt.strftime("%d-%m-%Y %I:%M %p") if from_dt else ""])
        ws.append(["To Date", to_dt.strftime("%d-%m-%Y %I:%M %p") if to_dt else ""])
        ws.append(["Area", area_label])
        ws.append(["Status", status_label])
        ws.append([])  # empty row before table

        # header row
        headers = [
            "Product ID",
            "Product Name",
            "Company Name",
            "Order Quantity",
            "MRP",
            "Buying Price",
            "Selling Price",
            "Available Stock",
            "Adjustment Qty"
        ]
        ws.append(headers)

        # aggregate product quantities
        product_summary = {}

        for order in serializer.data:
            for item in order["items"]:
                product_id = item.get("product", None)
                order_qty = item.get("quantity", 0)

                if product_id:
                    if product_id not in product_summary:
                        try:
                            product = Product.objects.get(pk=product_id)
                            available_stock = int(product.stock_quantity) + int(order_qty)
                            buying_price = product.cost_price
                        except Product.DoesNotExist:
                            available_stock = "N/A"
                            buying_price = "N/A"

                        product_summary[product_id] = {
                            "product_name": item.get("product_name", ""),
                            "company_name": item.get("company_name", ""),
                            "mrp": item.get("mrp", ""),
                            "selling_price": item.get("selling_price", ""),
                            "buying_price": buying_price,
                            "available_stock": available_stock,
                            "total_qty": order_qty,
                        }
                    else:
                        # accumulate quantities
                        product_summary[product_id]["total_qty"] += order_qty
                        product_summary[product_id]["available_stock"] += order_qty

        # write aggregated rows
        for product_id, data in product_summary.items():
            adjustment_qty = (
                data["available_stock"] - data["total_qty"]
                if isinstance(data["available_stock"], int)
                else "N/A"
            )

            ws.append([
                product_id,
                data["product_name"],
                data["company_name"],
                data["total_qty"],
                data["mrp"],
                data["buying_price"],
                data["selling_price"],
                data["available_stock"],
                adjustment_qty,
            ])

        # prepare response for direct download
        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="order_items.xlsx"'
        wb.save(response)
        return response


# class DownloadOrderView(APIView):
#     def get(self, request):
#         from_datetime = request.query_params.get('from_datetime')
#         to_datetime = request.query_params.get('to_datetime')
#         area = request.query_params.get('area',None)

#         if not (from_datetime and to_datetime and area):
#             return HttpResponse("Missing required parameters", status=400)

#         from_dt = parse_datetime(from_datetime)
#         to_dt = parse_datetime(to_datetime)

#         if is_aware(from_dt):
#             from_dt = make_naive(from_dt)
#         if is_aware(to_dt):
#             to_dt = make_naive(to_dt)

#         if area == 'all' or not area or area =='null':
#                 orders = Order.objects.filter(
#                 order_status='pending',
#                 order_date__range=(from_dt, to_dt)
#                 )
#         else:

#             # Filter orders by datetime and area
#             orders = Order.objects.filter(
#                 order_status='pending',
#                 order_date__range=(from_dt, to_dt),
#                 user_id__area_id=area
#             )

#         serializer = OrderSerializer(orders, many=True)

#         # create Excel workbook
#         wb = Workbook()
#         ws = wb.active
#         ws.title = "Orders"

#         # header row
#         headers = [
#             "Product ID",
#             "Product Name",
#             "Company Name",
#             "Order Quantity",
#             "MRP",
#             "Buying Price",
#             "Selling Price",
#             "Available Stock",
#             "Adjustment Qty"
#         ]
#         ws.append(headers)

#         # write data rows
#         for order in serializer.data:
#             for item in order["items"]:
#                 product_id = item.get("product", None)
#                 order_qty = item.get("quantity", 0)
#                 available_stock = None
#                 adjustment_qty = None

#                 if product_id:
#                     try:
#                         product = Product.objects.get(pk=product_id)
#                         available_stock = product.stock_quantity
#                         buying_price = product.cost_price
#                         # adjustment = stock - ordered
#                         adjustment_qty = available_stock - order_qty
#                     except Product.DoesNotExist:
#                         available_stock = "N/A"
#                         adjustment_qty = "N/A"

#                 ws.append([
#                     product_id or "",
#                     item.get("product_name", ""),
#                     item.get("company_name", ""),
#                     order_qty,
#                     item.get("mrp", ""),
#                     buying_price,
#                     item.get("selling_price", ""),
#                     available_stock,
#                     adjustment_qty,
#                 ])

#         # prepare response for direct download
#         response = HttpResponse(
#             content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
#         )
#         response["Content-Disposition"] = 'attachment; filename="order_items.xlsx"'
#         wb.save(response)
#         return response




class OrderViewSet(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = OrderPagination()

    def _current_month_special_discount(self, user):
        """Current-month special discount (special_bonus). Admin/staff see the
        total across all orders; a regular user sees only their own orders."""
        _now = now()
        if is_aware(_now):
            _now = make_naive(_now)
        month_start = _now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if _now.month == 12:
            month_end = month_start.replace(year=_now.year + 1, month=1)
        else:
            month_end = month_start.replace(month=_now.month + 1)
        qs = Order.objects.filter(order_date__gte=month_start, order_date__lt=month_end)
        if not (user.is_superuser or user.is_staff):
            qs = qs.filter(user_id=user)
        return float(qs.aggregate(s=Sum('special_bonus'))['s'] or 0)

    def get(self, request, pk=None):
        user = request.user
        from_datetime = request.query_params.get('from_datetime')
        to_datetime = request.query_params.get('to_datetime')
        area = request.query_params.get('area')
        status_param = request.query_params.get('status')
        shop_name = request.query_params.get('shop_name')

        has_filters = bool(
            from_datetime
            or to_datetime
            or (area and area not in ('all', 'null'))
            or (status_param and status_param not in ('all', 'null'))
            or shop_name
        )

        if has_filters:
            # Scope by user role first, then layer on whichever filters are present.
            if user.is_superuser or user.is_staff:
                orders = Order.objects.all()
            else:
                orders = Order.objects.filter(user_id=user)

            if from_datetime:
                from_dt = parse_datetime(from_datetime)
                if from_dt:
                    if is_aware(from_dt):
                        from_dt = make_naive(from_dt)
                    orders = orders.filter(order_date__gte=from_dt)

            if to_datetime:
                to_dt = parse_datetime(to_datetime)
                if to_dt:
                    if is_aware(to_dt):
                        to_dt = make_naive(to_dt)
                    orders = orders.filter(order_date__lte=to_dt)

            if area and area not in ('all', 'null'):
                orders = orders.filter(user_id__area_id=area)

            if status_param and status_param not in ('all', 'null'):
                orders = orders.filter(order_status=status_param)

            if shop_name:
                orders = orders.filter(user_id__shop_name__iexact=shop_name)

            orders = orders.order_by('-created_on')
            total_amount_sum = float(orders.aggregate(s=Sum('total_amount'))['s'] or 0)

            # Apply pagination
            paginator = self.pagination_class
            paginated_orders = paginator.paginate_queryset(orders, request)
            serializer = OrderSerializer(paginated_orders, many=True)
            return paginator.get_paginated_response({
                "status": "success",
                "data": serializer.data,
                "total_amount_sum": total_amount_sum,
                "current_month_special_discount": self._current_month_special_discount(user),
            })
        if pk:
            try:
                order = Order.objects.get(pk=pk)
                # A regular user may only view their own order.
                if not (user.is_superuser or user.is_staff) and order.user_id_id != user.pk:
                    return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
                serializer = OrderSerializer(order)
                return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
            except Order.DoesNotExist:
                return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        if user.is_superuser or user.is_staff:
            orders = Order.objects.all().order_by('-created_on')
        else:
            orders = Order.objects.filter(user_id=user).order_by('-created_on')
        total_amount_sum = float(orders.aggregate(s=Sum('total_amount'))['s'] or 0)
        # Apply pagination
        paginator = self.pagination_class
        paginated_orders = paginator.paginate_queryset(orders, request)
        serializer = OrderSerializer(paginated_orders, many=True)
        return paginator.get_paginated_response({
            "status": "success",
            "data": serializer.data,
            "total_amount_sum": total_amount_sum,
            "current_month_special_discount": self._current_month_special_discount(user),
        })

    def post(self, request):
        # return Response({"status": "error", "message": "Order system currently down. try again later."}, status=status.HTTP_404_NOT_FOUND)
        user = request.user
        site_info = SiteInfoModel.objects.first()
        delivery_charge = site_info.delivery_charge if site_info else 0
        district_name = None
        if user.area and user.area.district:
            district_name = str(user.area.district.name)

        data = request.data.copy()
        if district_name and district_name.lower() == 'dhaka':
            data['delivery_charge'] = 0
        else:
            data['delivery_charge'] = delivery_charge

        # Determine before serialization whether a pending order already exists
        is_merge = Order.objects.filter(user_id=user, order_status='pending').exists()

        serializer = OrderSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            if not is_merge:
                AdminNotification.objects.create(
                    user=request.user,
                    title='New Order Created',
                    order_id=serializer.instance,
                    message=f"New Order from {request.user.shop_name}."
                )
                return Response({"status": "success", "data": serializer.data}, status=status.HTTP_201_CREATED)
            return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
        return Response({"status": "error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk)
            customer = order.user_id

            # Regular (non-admin) users may only edit their OWN order, and only
            # while it is still 'pending'. Once it moves to processing/shipped/
            # delivered/etc it is locked for them. Admin/staff are unrestricted.
            is_admin = request.user.is_superuser or request.user.is_staff
            data = request.data

            # Delivery agents "update" an order only to RETURN items. Their item
            # reductions are turned into a PENDING return request (admin confirms
            # later) — the order itself is not mutated here. Admins, by contrast,
            # fall through to the normal serializer update which auto-applies.
            if getattr(request.user, 'role', None) == 'delivery_man':
                if order.assigned_to_id != request.user.pk:
                    return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

                items_data = data.get('items')
                if not isinstance(items_data, list):
                    return Response({"status": "error", "message": "items list is required."}, status=status.HTTP_400_BAD_REQUEST)

                current = {oi.product_id: oi for oi in order.items.all()}
                incoming = {}
                try:
                    for it in items_data:
                        incoming[int(it.get('product'))] = int(it.get('quantity') or 0)
                except (TypeError, ValueError):
                    return Response({"status": "error", "message": "Invalid item data."}, status=status.HTTP_400_BAD_REQUEST)

                # Agents may only reduce existing lines (a return) — not add or increase.
                for pid, qty in incoming.items():
                    if pid not in current:
                        return Response({"status": "error", "message": "Agents cannot add new products to an order."}, status=status.HTTP_400_BAD_REQUEST)
                    if qty > current[pid].quantity:
                        return Response({"status": "error", "message": "Agents cannot increase quantities."}, status=status.HTTP_400_BAD_REQUEST)

                reason = data.get('reason') or 'Returned via order update'
                return_lines = []
                for pid, oi in current.items():
                    reduction = oi.quantity - incoming.get(pid, 0)  # missing product => full return
                    if reduction > 0:
                        return_lines.append({"product": pid, "quantity": reduction, "reason": reason})

                if not return_lines:
                    return Response({"status": "error", "message": "No reduced items to return."}, status=status.HTTP_400_BAD_REQUEST)

                from delivery.services import create_return_request, ReturnRequestError
                from delivery.serializers import ReturnRequestSerializer
                try:
                    req = create_return_request(order, request.user, return_lines, note=data.get('note') or "")
                except ReturnRequestError as e:
                    return Response({"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                return Response(
                    {"status": "success", "message": "Return request submitted for approval.", "data": ReturnRequestSerializer(req).data},
                    status=status.HTTP_201_CREATED,
                )

            if not is_admin:
                if order.user_id_id != request.user.pk:
                    return Response(
                        {"status": "error", "message": "Order not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                if order.order_status != 'pending':
                    return Response(
                        {
                            "status": "error",
                            "message": "This order can no longer be updated because it is already being processed.",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
                # Regular users cannot change order status (it stays admin-controlled).
                data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
                data.pop('order_status', None)

            old_status = order.order_status
            new_status = data.get('order_status')

            serializer = OrderSerializer(order, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()

                # Stock adjustment on status transition involving 'cancelled'
                if new_status and new_status != old_status:
                    if new_status == 'cancelled' and old_status != 'cancelled':
                        # Order being cancelled: restore product stock for current items
                        for item in order.items.select_related('product').all():
                            if item.product:
                                item.product.stock_quantity += item.quantity
                                item.product.save(update_fields=['stock_quantity'])
                    elif old_status == 'cancelled' and new_status != 'cancelled':
                        # Order being reactivated from cancelled: deduct stock again
                        for item in order.items.select_related('product').all():
                            if item.product:
                                new_stock = item.product.stock_quantity - item.quantity
                                item.product.stock_quantity = max(0, new_stock)
                                item.product.save(update_fields=['stock_quantity'])

                # Auto-assign to an area delivery agent when the order is shipped.
                if new_status == 'shipped' and old_status != 'shipped':
                    from delivery.services import assign_order_by_area
                    assign_order_by_area(order)

                if new_status and new_status != old_status:
                    from notification.services import notify_user
                    notify_user(
                        customer,
                        'Order Update',
                        f"Your order {order.invoice_number} has been {new_status}",
                        data={"type": "order", "status": new_status, "order_id": order.pk},
                    )

                return Response(
                    {"status": "success", "data": OrderSerializer(order).data},
                    status=status.HTTP_200_OK
                )

            return Response(
                {"status": "error", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Order.DoesNotExist:
            return Response(
                {"status": "error", "message": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk)
            order.delete()
            return Response({"status": "success", "message": "Order deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Order.DoesNotExist:
            return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)


class AreaWiseOrder(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        area = request.query_params.get("area")
        status_param = request.query_params.get("status")

        orders = Order.objects.all()

        if area:
            orders = orders.filter(user_id__area_id=area)

        if status_param:
            orders = orders.filter(order_status=status_param)

        orders = orders.order_by("-created_on")

        serializer = OrderSerializer(orders, many=True)

        return Response({
            "status": "success",
            "data": serializer.data
        })

class PendingOrderViewSet(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_superuser:
            orders = Order.objects.filter(order_status='pending').order_by('-created_on')
        else:
            orders = Order.objects.filter(order_status='pending', user_id=user).order_by('-created_on')
        pending_orders = orders.count()
        total_amount_sum = float(orders.aggregate(s=Sum('total_amount'))['s'] or 0)
        serializer = OrderSerializer(orders, many=True)
        return Response({
            "status": "success",
            'total': pending_orders,
            "data": serializer.data,
            "total_amount_sum": total_amount_sum,
        }, status=status.HTTP_200_OK)


class OrderItemViewSet(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        user = request.user
        if pk:
            try:
                order_item = OrderItem.objects.get(pk=pk)
                serializer = OrderItemSerializer(order_item)
                return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
            except OrderItem.DoesNotExist:
                return Response({"status": "error", "message": "Order item not found"}, status=status.HTTP_404_NOT_FOUND)
        if user.is_superuser:
            order_items = OrderItem.objects.all().order_by('-created_on')
        else:
            order_items = OrderItem.objects.filter(user_id=user).order_by('-created_on')

        
        serializer = OrderItemSerializer(order_items, many=True)
        return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = OrderItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response({"status": "error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        try:
            order_item = OrderItem.objects.get(pk=pk)
            serializer = OrderItemSerializer(order_item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
            return Response({"status": "error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except OrderItem.DoesNotExist:
            return Response({"status": "error", "message": "Order item not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk=None):
        try:
            order_item = OrderItem.objects.get(pk=pk)
            order_item.delete()
            return Response({"status": "success", "message": "Order item deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except OrderItem.DoesNotExist:
            return Response({"status": "error", "message": "Order item not found"}, status=status.HTTP_404_NOT_FOUND)


class ShopNameSuggestionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = (request.query_params.get('q') or '').strip()
        if len(q) < 2:
            return Response({"status": "success", "data": []}, status=status.HTTP_200_OK)

        shop_names = (
            Order.objects.filter(user_id__shop_name__icontains=q)
            .exclude(user_id__shop_name__isnull=True)
            .exclude(user_id__shop_name__exact='')
            .values_list('user_id__shop_name', flat=True)
            .distinct()
        )

        # Collapse near-duplicates that the DB's .distinct() keeps apart because
        # it's case- and whitespace-sensitive ("ma pharmecy" vs "Ma Pharmecy "
        # vs "ma pharmecy"). Dedupe on a normalized key so each pharmacy shows
        # exactly once, keeping the first spelling we encounter.
        unique_names = {}
        for name in shop_names:
            key = name.strip().lower()
            if key not in unique_names:
                unique_names[key] = name.strip()

        # Rank names that START with the query ahead of names that merely
        # contain it, then alphabetically. Return ALL matches (no cap) so every
        # available pharmacy shows up; the dropdown scrolls if needed.
        # Previously this was capped at 10 after an alphabetical sort, which let
        # substring matches like "Rahman" (contains "ma") crowd out prefix
        # matches like "ma pharmecy" and drop them entirely.
        q_lower = q.lower()
        ranked = sorted(
            unique_names.values(),
            key=lambda name: (0 if name.lower().startswith(q_lower) else 1, name.lower()),
        )
        return Response({"status": "success", "data": ranked}, status=status.HTTP_200_OK)

