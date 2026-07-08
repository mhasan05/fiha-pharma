from django.urls import path, include
from .views import *

urlpatterns = [
    path('orders/', OrderViewSet.as_view(), name='order_list'),
    path('download_orders/', DownloadOrderView.as_view(), name='download_orders'),
    path('orders/<int:pk>/', OrderViewSet.as_view(), name='order_detail'),
    path('order_items/', OrderItemViewSet.as_view(), name='order_item_list'),
    path('order_items/<int:pk>/', OrderItemViewSet.as_view(), name='order_item_detail'),
    path('pending_order/', PendingOrderViewSet.as_view(), name='pending_order'),
    path('area_wise_order/', AreaWiseOrder.as_view(), name='area_wise_order'),
    path('shop_name_suggestions/', ShopNameSuggestionView.as_view(), name='shop_name_suggestions'),
]
