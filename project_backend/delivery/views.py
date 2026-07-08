from decimal import Decimal, InvalidOperation

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from django.db.models import Sum
from django.utils.timezone import now

from orders.models import Order, ReturnItem
from notification.models import Notification

from .models import DepositRequest, ReturnRequest
from .permissions import IsDeliveryMan, IsAdminStaff
from .serializers import (
    DeliveryOrderSerializer,
    DeliveryOrderDetailSerializer,
    DepositRequestSerializer,
    ReturnedProductSerializer,
    ReturnRequestSerializer,
)
from .services import (
    record_payment,
    submit_deposit,
    approve_deposit,
    reject_deposit,
    undeposited_amount,
    pending_deposit_amount,
    cash_in_hand,
    create_return_request,
    apply_return_request,
    reject_return_request,
    ReturnRequestError,
)


def _parse_amount(raw):
    """Return a non-negative Decimal, or None if invalid."""
    if raw is None:
        return None
    try:
        amt = Decimal(str(raw))
    except (InvalidOperation, ValueError, TypeError):
        return None
    if amt < 0:
        return None
    return amt


def _fmt_taka(value):
    """Format a Decimal/number as a taka string, dropping a trailing .00."""
    s = f"{float(value or 0):,.2f}"
    return s[:-3] if s.endswith(".00") else s


class DeliveryPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200


class AssignedOrderListView(APIView):
    """GET /delivery/orders/?status=pending|delivered  — orders assigned to me."""
    permission_classes = [IsAuthenticated, IsDeliveryMan]
    pagination_class = DeliveryPagination()

    def get(self, request):
        orders = Order.objects.filter(assigned_to=request.user).select_related(
            "user_id", "user_id__area"
        )

        status_param = (request.query_params.get("status") or "").lower()
        if status_param == "pending":
            orders = orders.filter(order_status="shipped")
        elif status_param == "delivered":
            orders = orders.filter(order_status="delivered")
        elif status_param and status_param not in ("all", "null"):
            orders = orders.filter(order_status=status_param)

        orders = orders.order_by("-order_date")

        paginator = self.pagination_class
        page = paginator.paginate_queryset(orders, request)
        serializer = DeliveryOrderSerializer(page, many=True)
        return paginator.get_paginated_response(
            {"status": "success", "data": serializer.data}
        )


class DeliveryOrderDetailView(APIView):
    """GET /delivery/orders/<pk>/ — full detail (incl. line items) for one of my
    assigned orders. The app uses this to show what's deliverable/returnable."""
    permission_classes = [IsAuthenticated, IsDeliveryMan]

    def get(self, request, pk=None):
        order = (
            Order.objects.filter(pk=pk, assigned_to=request.user)
            .select_related("user_id", "user_id__area")
            .prefetch_related("items__product")
            .first()
        )
        if not order:
            return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {"status": "success", "data": DeliveryOrderDetailSerializer(order).data},
            status=status.HTTP_200_OK,
        )


class DeliveryDashboardView(APIView):
    """GET /delivery/dashboard/ — KPIs for the logged-in agent."""
    permission_classes = [IsAuthenticated, IsDeliveryMan]

    def get(self, request):
        agent = request.user
        mine = Order.objects.filter(assigned_to=agent)

        _now = now()
        today_start = _now.replace(hour=0, minute=0, second=0, microsecond=0)

        delivered = mine.filter(order_status="delivered")
        outstanding_dues = float(delivered.aggregate(s=Sum("due_amount"))["s"] or 0)
        returned_products = (
            ReturnItem.objects.filter(order__assigned_to=agent).aggregate(q=Sum("quantity"))["q"]
            or 0
        )
        today_collection = float(
            agent.collections.filter(collected_at__gte=today_start).aggregate(
                s=Sum("amount")
            )["s"]
            or 0
        )

        data = {
            "total_assigned": mine.count(),
            "pending_deliveries": mine.filter(order_status="shipped").count(),
            "delivered_total": delivered.count(),
            "delivered_today": delivered.filter(updated_on__gte=today_start).count(),
            "outstanding_dues": outstanding_dues,
            "returned_products": int(returned_products),
            "today_collection": today_collection,
            # Cash settlement (Phase 3)
            "undeposited_amount": float(undeposited_amount(agent)),
            "pending_deposit_amount": float(pending_deposit_amount(agent)),
            "cash_in_hand": float(cash_in_hand(agent)),
        }
        return Response({"status": "success", "data": data}, status=status.HTTP_200_OK)


class DeliverySummaryView(APIView):
    """GET /delivery/summary/ — the logged-in agent's overall delivery summary
    ("top sheet"): totals across ALL their assigned orders / collections /
    returns. All figures are derived — no extra stored fields."""
    permission_classes = [IsAuthenticated, IsDeliveryMan]

    def get(self, request):
        agent = request.user

        orders = Order.objects.filter(assigned_to=agent).exclude(order_status="cancelled")

        number_of_orders = orders.count()
        unique_pharmacies = orders.values("user_id").distinct().count()
        delivered_count = orders.filter(order_status="delivered").count()

        # `total_amount` is already net of confirmed returns (returns reduce the
        # order total), so it IS Net Sales. Invoice (gross) adds returns back.
        net_sales = float(orders.aggregate(s=Sum("total_amount"))["s"] or 0)
        collected_amount = float(orders.aggregate(s=Sum("collected_amount"))["s"] or 0)
        due_amount = float(orders.aggregate(s=Sum("due_amount"))["s"] or 0)

        return_items = ReturnItem.objects.filter(order__assigned_to=agent)
        return_amount = float(
            sum((it.quantity or 0) * float(it.unit_price or 0) for it in return_items)
        )
        return_qty = sum((it.quantity or 0) for it in return_items)

        invoice_amount = net_sales + return_amount
        payment_percent = round((collected_amount / net_sales) * 100) if net_sales > 0 else 0

        data = {
            "code": agent.pk,
            "delivery_man_name": agent.full_name,
            "phone": agent.phone,
            "area": getattr(agent.area, "area_name", None) if agent.area else None,
            "number_of_orders": number_of_orders,
            "delivered_count": delivered_count,
            "unique_pharmacies": unique_pharmacies,
            "invoice_amount": invoice_amount,
            "return_amount": return_amount,
            "return_qty": int(return_qty),
            "net_sales": net_sales,
            "collected_amount": collected_amount,
            "due_amount": due_amount,
            "payment_percent": payment_percent,
            "money_collected": collected_amount > 0,
        }
        return Response({"status": "success", "data": data}, status=status.HTTP_200_OK)


class DeliverOrderView(APIView):
    """POST /delivery/orders/<pk>/deliver/  — mark my shipped order delivered,
    optionally collecting payment at the same time (body: amount)."""
    permission_classes = [IsAuthenticated, IsDeliveryMan]

    def post(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.assigned_to_id != request.user.pk:
            return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.order_status != "shipped":
            return Response(
                {"status": "error", "message": f"Order cannot be delivered from status '{order.order_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount = _parse_amount(request.data.get("amount"))
        if request.data.get("amount") is not None and amount is None:
            return Response({"status": "error", "message": "Invalid collection amount."}, status=status.HTTP_400_BAD_REQUEST)

        if amount and amount > 0:
            due = order.due_amount or Decimal("0")
            if amount > due:
                return Response(
                    {"status": "error", "message": f"Cannot collect more than the due amount (৳{_fmt_taka(due)})."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        order.order_status = "delivered"
        order.save(update_fields=["order_status", "updated_on"])

        if amount and amount > 0:
            record_payment(order, amount, delivery_man=request.user, note="Delivery collection")

        order.refresh_from_db()

        from notification.services import notify_user

        # Tell the customer how much they paid against this invoice; fall back to
        # a plain delivered message when nothing was collected.
        paid = float(order.collected_amount or 0)
        if paid > 0:
            paid_str = f"{paid:,.2f}"
            if paid_str.endswith(".00"):
                paid_str = paid_str[:-3]
            delivered_msg = f"You paid ৳{paid_str} against {order.invoice_number}."
        else:
            delivered_msg = f"Your order {order.invoice_number} has been delivered."

        notify_user(
            order.user_id,
            "Order Delivered",
            delivered_msg,
            data={"type": "order", "status": "delivered", "order_id": order.pk},
        )
        return Response(
            {"status": "success", "data": DeliveryOrderSerializer(order).data},
            status=status.HTTP_200_OK,
        )


class CollectPaymentView(APIView):
    """POST /delivery/orders/<pk>/collect/  — record a payment (due / partial)
    against one of my orders. Works whether or not it's already delivered."""
    permission_classes = [IsAuthenticated, IsDeliveryMan]

    def post(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.assigned_to_id != request.user.pk:
            return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        amount = _parse_amount(request.data.get("amount"))
        if amount is None or amount <= 0:
            return Response({"status": "error", "message": "A positive collection amount is required."}, status=status.HTTP_400_BAD_REQUEST)

        due = order.due_amount or Decimal("0")
        if amount > due:
            return Response(
                {"status": "error", "message": f"Cannot collect more than the due amount (৳{_fmt_taka(due)})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        record_payment(order, amount, delivery_man=request.user, note=request.data.get("note") or "Due collection")

        order.refresh_from_db()
        return Response(
            {"status": "success", "data": DeliveryOrderSerializer(order).data},
            status=status.HTTP_200_OK,
        )


class PaymentLookupView(APIView):
    """GET /delivery/payment/?invoice=INV-... — payment screen lookup for one of
    my invoices (invoice amount, previous due, total collectable)."""
    permission_classes = [IsAuthenticated, IsDeliveryMan]

    def get(self, request):
        invoice = (request.query_params.get("invoice") or "").strip()
        if not invoice:
            return Response({"status": "error", "message": "invoice is required."}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.filter(
            invoice_number=invoice, assigned_to=request.user
        ).select_related("user_id", "user_id__area").first()
        if not order:
            return Response({"status": "error", "message": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)

        base = DeliveryOrderSerializer(order).data
        base.update({
            "invoice_amount": float(order.total_amount or 0),
            "previous_due": float(order.due_amount or 0),
            "total_collectable": float(order.due_amount or 0),
        })
        return Response({"status": "success", "data": base}, status=status.HTTP_200_OK)


class DueListView(APIView):
    """GET /delivery/dues/ — my DELIVERED invoices that still have an outstanding
    due. A not-yet-delivered (shipped) order isn't a due — its amount is only
    collected on delivery — so it's excluded here (matches the dashboard's
    delivered-only outstanding-dues KPI)."""
    permission_classes = [IsAuthenticated, IsDeliveryMan]
    pagination_class = DeliveryPagination()

    def get(self, request):
        orders = (
            Order.objects.filter(
                assigned_to=request.user, order_status="delivered", due_amount__gt=0
            )
            .select_related("user_id", "user_id__area")
            .order_by("-order_date")
        )
        paginator = self.pagination_class
        page = paginator.paginate_queryset(orders, request)
        serializer = DeliveryOrderSerializer(page, many=True)
        total_due = float(orders.aggregate(s=Sum("due_amount"))["s"] or 0)
        return paginator.get_paginated_response(
            {"status": "success", "total_due": total_due, "data": serializer.data}
        )


class ReturnItemsView(APIView):
    """Agent return requests.
    POST /delivery/orders/<pk>/return/ — submit a return for my order. Body:
        {"items":[{"product":<id>,"quantity":<n>,"reason":"..."}], "note":""}
        The order total/due drop immediately so the agent collects the reduced
        amount. Stock is NOT restored here — staff confirm the physical return
        in the admin panel first (rejection reverses the order adjustment).
    """
    permission_classes = [IsAuthenticated, IsDeliveryMan]

    def post(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.assigned_to_id != request.user.pk:
            return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        # Returns must be submitted before the order is marked delivered — once
        # delivered the due is settled, so post-delivery returns aren't allowed.
        if order.order_status == "delivered":
            return Response(
                {"status": "error", "message": "Returns must be submitted before the order is marked delivered."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        items = request.data.get("items")
        if not isinstance(items, list) or not items:
            return Response({"status": "error", "message": "items list is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            req = create_return_request(order, request.user, items, note=request.data.get("note") or "")
        except (ReturnRequestError, ValueError, TypeError) as e:
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"status": "success", "data": ReturnRequestSerializer(req).data},
            status=status.HTTP_201_CREATED,
        )


class ReturnRequestListView(APIView):
    """GET /delivery/return-requests/?status= — my return requests + their status."""
    permission_classes = [IsAuthenticated, IsDeliveryMan]
    pagination_class = DeliveryPagination()

    def get(self, request):
        qs = ReturnRequest.objects.filter(delivery_man=request.user).select_related("order", "order__user_id").prefetch_related("items")
        status_param = (request.query_params.get("status") or "").lower()
        if status_param in ("pending", "confirmed", "rejected"):
            qs = qs.filter(status=status_param)
        paginator = self.pagination_class
        page = paginator.paginate_queryset(qs, request)
        serializer = ReturnRequestSerializer(page, many=True)
        return paginator.get_paginated_response({"status": "success", "data": serializer.data})


class ReturnedProductListView(APIView):
    """GET /delivery/returned-products/?source=admin|agent — every finalized
    returned product (orders.ReturnItem) for orders assigned to me, including
    returns generated by admin order edits. Read-only."""
    permission_classes = [IsAuthenticated, IsDeliveryMan]
    pagination_class = DeliveryPagination()

    def get(self, request):
        qs = (
            ReturnItem.objects.filter(order__assigned_to=request.user)
            .select_related("order", "order__user_id", "product", "created_by")
            .order_by("-created_on")
        )
        source = (request.query_params.get("source") or "").lower()
        if source == "admin":
            qs = qs.filter(created_by__isnull=True)
        elif source == "agent":
            qs = qs.filter(created_by__isnull=False)

        total_quantity = qs.aggregate(q=Sum("quantity"))["q"] or 0
        paginator = self.pagination_class
        page = paginator.paginate_queryset(qs, request)
        serializer = ReturnedProductSerializer(page, many=True)
        return paginator.get_paginated_response(
            {"status": "success", "total_quantity": int(total_quantity), "data": serializer.data}
        )


class AdminReturnRequestListView(APIView):
    """GET /delivery/admin/return-requests/?status=pending — review queue."""
    permission_classes = [IsAuthenticated, IsAdminStaff]
    pagination_class = DeliveryPagination()

    def get(self, request):
        qs = ReturnRequest.objects.select_related("order", "order__user_id", "delivery_man", "reviewed_by").prefetch_related("items")
        status_param = (request.query_params.get("status") or "").lower()
        if status_param in ("pending", "confirmed", "rejected"):
            qs = qs.filter(status=status_param)
        agent_id = request.query_params.get("delivery_man")
        if agent_id and agent_id not in ("all", "null"):
            qs = qs.filter(delivery_man_id=agent_id)
        paginator = self.pagination_class
        page = paginator.paginate_queryset(qs, request)
        serializer = ReturnRequestSerializer(page, many=True)
        return paginator.get_paginated_response({"status": "success", "data": serializer.data})


class AdminReturnRequestReviewView(APIView):
    """POST /delivery/admin/return-requests/<pk>/<action>/  action = confirm|reject.
    Confirm restores stock (order was already reduced at submission); reject
    reverses that reduction and restores the order."""
    permission_classes = [IsAuthenticated, IsAdminStaff]

    def post(self, request, pk=None, action=None):
        try:
            req = ReturnRequest.objects.get(pk=pk)
        except ReturnRequest.DoesNotExist:
            return Response({"status": "error", "message": "Return request not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            if action == "confirm":
                apply_return_request(req, request.user)
            elif action == "reject":
                reject_return_request(req, request.user, review_note=request.data.get("note") or "")
            else:
                return Response({"status": "error", "message": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)
        except ReturnRequestError as e:
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"status": "success", "data": ReturnRequestSerializer(req).data},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Deposits & cash settlement
# ---------------------------------------------------------------------------

class DepositView(APIView):
    """Agent deposit endpoints.
    GET  /delivery/deposits/        -> my deposit history (day-wise)
    POST /delivery/deposits/        -> submit a deposit (auto-covers all
                                       undeposited cash)
    """
    permission_classes = [IsAuthenticated, IsDeliveryMan]
    pagination_class = DeliveryPagination()

    def get(self, request):
        deposits = DepositRequest.objects.filter(delivery_man=request.user)
        status_param = (request.query_params.get("status") or "").lower()
        if status_param in ("pending", "approved", "rejected"):
            deposits = deposits.filter(status=status_param)

        paginator = self.pagination_class
        page = paginator.paginate_queryset(deposits, request)
        serializer = DepositRequestSerializer(page, many=True)
        return paginator.get_paginated_response(
            {
                "status": "success",
                "cash_in_hand": float(cash_in_hand(request.user)),
                "undeposited_amount": float(undeposited_amount(request.user)),
                "data": serializer.data,
            }
        )

    def post(self, request):
        deposit = submit_deposit(request.user, note=request.data.get("note") or "")
        if deposit is None:
            return Response(
                {"status": "error", "message": "No undeposited cash to submit."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"status": "success", "data": DepositRequestSerializer(deposit).data},
            status=status.HTTP_201_CREATED,
        )


class AdminDepositListView(APIView):
    """GET /delivery/admin/deposits/?status=&delivery_man=  — all deposits (admin)."""
    permission_classes = [IsAuthenticated, IsAdminStaff]
    pagination_class = DeliveryPagination()

    def get(self, request):
        deposits = DepositRequest.objects.select_related("delivery_man", "reviewed_by")
        status_param = (request.query_params.get("status") or "").lower()
        if status_param in ("pending", "approved", "rejected"):
            deposits = deposits.filter(status=status_param)
        agent_id = request.query_params.get("delivery_man")
        if agent_id and agent_id not in ("all", "null"):
            deposits = deposits.filter(delivery_man_id=agent_id)

        paginator = self.pagination_class
        page = paginator.paginate_queryset(deposits, request)
        serializer = DepositRequestSerializer(page, many=True)
        return paginator.get_paginated_response(
            {"status": "success", "data": serializer.data}
        )


class AdminAgentListView(APIView):
    """GET /delivery/admin/agents/ — delivery agents with their area + current load."""
    permission_classes = [IsAuthenticated, IsAdminStaff]

    def get(self, request):
        from accounts.models import UserAuth

        agents = UserAuth.objects.filter(role="delivery_man").select_related("area").order_by("full_name")
        data = []
        for a in agents:
            data.append({
                "user_id": a.user_id,
                "full_name": a.full_name,
                "phone": a.phone,
                "area": a.area_id,
                "area_name": getattr(a.area, "area_name", None) if a.area else None,
                "is_active": a.is_active,
                "pending_deliveries": Order.objects.filter(assigned_to=a, order_status="shipped").count(),
            })
        return Response({"status": "success", "data": data}, status=status.HTTP_200_OK)


class AdminAssignableOrdersView(APIView):
    """GET /delivery/admin/orders/?assigned=unassigned|assigned&status=&area=
    Orders for the assignment screen (defaults to shipped)."""
    permission_classes = [IsAuthenticated, IsAdminStaff]
    pagination_class = DeliveryPagination()

    def get(self, request):
        orders = Order.objects.select_related("user_id", "user_id__area", "assigned_to")

        status_param = (request.query_params.get("status") or "shipped").lower()
        if status_param not in ("all", "null"):
            orders = orders.filter(order_status=status_param)

        assigned = (request.query_params.get("assigned") or "").lower()
        if assigned == "unassigned":
            orders = orders.filter(assigned_to__isnull=True)
        elif assigned == "assigned":
            orders = orders.filter(assigned_to__isnull=False)

        area = request.query_params.get("area")
        if area and area not in ("all", "null"):
            orders = orders.filter(user_id__area_id=area)

        orders = orders.order_by("-order_date")
        paginator = self.pagination_class
        page = paginator.paginate_queryset(orders, request)
        serializer = DeliveryOrderSerializer(page, many=True)
        return paginator.get_paginated_response({"status": "success", "data": serializer.data})


class AdminAssignOrderView(APIView):
    """POST /delivery/admin/orders/<pk>/assign/  body {delivery_man: <id>} — manual (re)assign."""
    permission_classes = [IsAuthenticated, IsAdminStaff]

    def post(self, request, pk=None):
        from accounts.models import UserAuth

        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        agent_id = request.data.get("delivery_man")
        if not agent_id:
            return Response({"status": "error", "message": "delivery_man is required."}, status=status.HTTP_400_BAD_REQUEST)

        agent = UserAuth.objects.filter(user_id=agent_id, role="delivery_man").first()
        if not agent:
            return Response({"status": "error", "message": "Delivery agent not found."}, status=status.HTTP_400_BAD_REQUEST)

        order.assigned_to = agent
        order.assigned_at = now()
        order.save(update_fields=["assigned_to", "assigned_at", "updated_on"])

        from .services import notify_order_assigned
        notify_order_assigned(order, agent)

        return Response(
            {"status": "success", "data": DeliveryOrderSerializer(order).data},
            status=status.HTTP_200_OK,
        )


class AdminDepositReviewView(APIView):
    """POST /delivery/admin/deposits/<pk>/<action>/  where action = approve|reject."""
    permission_classes = [IsAuthenticated, IsAdminStaff]

    def post(self, request, pk=None, action=None):
        try:
            deposit = DepositRequest.objects.get(pk=pk)
        except DepositRequest.DoesNotExist:
            return Response({"status": "error", "message": "Deposit not found"}, status=status.HTTP_404_NOT_FOUND)

        if deposit.status != "pending":
            return Response(
                {"status": "error", "message": f"Deposit already {deposit.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == "approve":
            approve_deposit(deposit, request.user)
        elif action == "reject":
            reject_deposit(deposit, request.user, review_note=request.data.get("note") or "")
        else:
            return Response({"status": "error", "message": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"status": "success", "data": DepositRequestSerializer(deposit).data},
            status=status.HTTP_200_OK,
        )
