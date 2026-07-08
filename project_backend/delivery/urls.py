from django.urls import path
from .views import (
    AssignedOrderListView,
    DeliveryOrderDetailView,
    DeliveryDashboardView,
    DeliverySummaryView,
    DeliverOrderView,
    CollectPaymentView,
    PaymentLookupView,
    DueListView,
    ReturnItemsView,
    ReturnRequestListView,
    ReturnedProductListView,
    DepositView,
    AdminDepositListView,
    AdminDepositReviewView,
    AdminAgentListView,
    AdminAssignableOrdersView,
    AdminAssignOrderView,
    AdminReturnRequestListView,
    AdminReturnRequestReviewView,
)

urlpatterns = [
    path("orders/", AssignedOrderListView.as_view(), name="delivery_orders"),
    path("orders/<int:pk>/", DeliveryOrderDetailView.as_view(), name="delivery_order_detail"),
    path("dashboard/", DeliveryDashboardView.as_view(), name="delivery_dashboard"),
    path("summary/", DeliverySummaryView.as_view(), name="delivery_summary"),
    path("orders/<int:pk>/deliver/", DeliverOrderView.as_view(), name="delivery_deliver"),
    path("orders/<int:pk>/collect/", CollectPaymentView.as_view(), name="delivery_collect"),
    path("payment/", PaymentLookupView.as_view(), name="delivery_payment_lookup"),
    path("dues/", DueListView.as_view(), name="delivery_dues"),
    path("orders/<int:pk>/return/", ReturnItemsView.as_view(), name="delivery_return"),
    path("return-requests/", ReturnRequestListView.as_view(), name="delivery_return_requests"),
    path("returned-products/", ReturnedProductListView.as_view(), name="delivery_returned_products"),
    # Deposits / cash settlement
    path("deposits/", DepositView.as_view(), name="delivery_deposits"),
    path("admin/deposits/", AdminDepositListView.as_view(), name="delivery_admin_deposits"),
    path("admin/deposits/<int:pk>/<str:action>/", AdminDepositReviewView.as_view(), name="delivery_admin_deposit_review"),
    # Admin assignment management
    path("admin/agents/", AdminAgentListView.as_view(), name="delivery_admin_agents"),
    path("admin/orders/", AdminAssignableOrdersView.as_view(), name="delivery_admin_orders"),
    path("admin/orders/<int:pk>/assign/", AdminAssignOrderView.as_view(), name="delivery_admin_assign"),
    # Admin return-request review
    path("admin/return-requests/", AdminReturnRequestListView.as_view(), name="delivery_admin_return_requests"),
    path("admin/return-requests/<int:pk>/<str:action>/", AdminReturnRequestReviewView.as_view(), name="delivery_admin_return_review"),
]
