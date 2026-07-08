from django.contrib import admin

from .models import (
    CollectionPayment,
    DepositRequest,
    ReturnRequest,
    ReturnRequestItem,
)


class ReturnRequestItemInline(admin.TabularInline):
    model = ReturnRequestItem
    extra = 0
    readonly_fields = (
        "product", "quantity", "unit_price", "cost_price",
        "mrp", "discount_percent", "product_name", "reason",
    )
    can_delete = False


@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "delivery_man", "status", "created_at", "reviewed_by", "reviewed_at")
    list_filter = ("status", "created_at")
    search_fields = ("order__invoice_number", "delivery_man__full_name", "delivery_man__phone")
    readonly_fields = ("created_at", "reviewed_at")
    date_hierarchy = "created_at"
    inlines = [ReturnRequestItemInline]


@admin.register(ReturnRequestItem)
class ReturnRequestItemAdmin(admin.ModelAdmin):
    list_display = ("id", "return_request", "product", "quantity", "unit_price", "reason")
    search_fields = ("product__product_name", "return_request__order__invoice_number")


@admin.register(DepositRequest)
class DepositRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "delivery_man", "amount", "status", "requested_at", "reviewed_by", "reviewed_at")
    list_filter = ("status", "requested_at")
    search_fields = ("delivery_man__full_name", "delivery_man__phone")
    readonly_fields = ("requested_at", "reviewed_at")
    date_hierarchy = "requested_at"


@admin.register(CollectionPayment)
class CollectionPaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "delivery_man", "amount", "deposit", "collected_at")
    list_filter = ("collected_at",)
    search_fields = ("order__invoice_number", "delivery_man__full_name", "delivery_man__phone")
    readonly_fields = ("created_on",)
    date_hierarchy = "collected_at"
