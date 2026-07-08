from django.contrib import admin
from .models import Notification, AdminNotification, PushToken


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("user__full_name", "user__phone", "title", "message")
    date_hierarchy = "created_at"


@admin.register(AdminNotification)
class AdminNotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "order_id", "title", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("user__full_name", "title", "message")
    date_hierarchy = "created_at"


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "platform", "updated_at")
    list_filter = ("platform",)
    search_fields = ("user__full_name", "user__phone", "token")
    readonly_fields = ("created_at", "updated_at")
