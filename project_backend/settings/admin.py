from django.contrib import admin
from .models import *
admin.site.register(SiteInfoModel)


@admin.register(AppRelease)
class AppReleaseAdmin(admin.ModelAdmin):
    list_display = ["id", "app", "version", "version_code", "is_available", "force_update", "created_on"]
    list_filter = ["app", "is_available", "force_update"]
    search_fields = ["version", "release_notes"]


@admin.register(PrivacyPolicy)
class PrivacyPolicyAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "is_active", "created_on", "updated_on"]
    list_filter = ["is_active", "created_on"]
    search_fields = ["title", "content"]


@admin.register(TermsAndConditions)
class TermsAndConditionsAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "is_active", "created_on", "updated_on"]
    list_filter = ["is_active", "created_on"]
    search_fields = ["title", "content"]


@admin.register(ConditionalDiscount)
class ConditionalDiscountAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "minimum_purchase_amount", "bonus_percentage", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name"]