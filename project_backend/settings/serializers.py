# serializers.py
from rest_framework import serializers
from .models import *


class AppReleaseSerializer(serializers.ModelSerializer):
    apk = serializers.FileField(write_only=True)
    apk_url = serializers.SerializerMethodField()

    class Meta:
        model = AppRelease
        fields = [
            "id", "app", "version", "version_code", "apk", "apk_url", "release_notes",
            "is_available", "force_update", "file_size", "created_on", "updated_on",
        ]
        read_only_fields = ["id", "apk_url", "file_size", "created_on", "updated_on"]

    def get_apk_url(self, obj):
        if not obj.apk:
            return None
        request = self.context.get("request")
        url = obj.apk.url
        return request.build_absolute_uri(url) if request else url

    def validate_version_code(self, value):
        if value <= 0:
            raise serializers.ValidationError("version_code must be a positive number.")
        return value


class SiteInfoSerializer(serializers.ModelSerializer):
    delivery_charge = serializers.FloatField()  # force as number
    logo = serializers.SerializerMethodField()
    class Meta:
        model = SiteInfoModel
        fields = ['name', 'logo', 'description', 'version', 'delivery_charge', 'contact_email', 'contact_phone', 'whatsapp_number', 'maintenance_mode', 'maintenance_message']


    def get_logo(self, obj):
        if obj.logo:
            return obj.logo.url   # returns /media/logo.png instead of full URL
        return None
    
    def get_delivery_charge(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        try:
            # Safely access user's district name
            district_name = user.area.district.name.lower()
            if district_name == 'dhaka':
                return 0.0
        except AttributeError:
            # If any of the attributes are missing, fallback to default
            pass

        return obj.delivery_charge
    

class PrivacyPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivacyPolicy
        fields = [
            "id",
            "title",
            "content",
            "is_active",
            "created_on",
            "updated_on",
        ]
        read_only_fields = ["id", "created_on", "updated_on"]


class TermsAndConditionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TermsAndConditions
        fields = [
            "id",
            "title",
            "content",
            "is_active",
            "created_on",
            "updated_on",
        ]
        read_only_fields = ["id", "created_on", "updated_on"]



class ConditionalDiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConditionalDiscount
        fields = [
            "id",
            "name",
            "minimum_purchase_amount",
            "bonus_percentage",
            "is_active",
            "created_on",
            "updated_on",
        ]
        read_only_fields = ["id", "created_on", "updated_on"]

    def validate_minimum_purchase_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Minimum purchase amount must be greater than 0.")
        return value

    def validate_bonus_percentage(self, value):
        if value <= 0:
            raise serializers.ValidationError("Bonus percentage must be greater than 0.")
        if value > 100:
            raise serializers.ValidationError("Bonus percentage cannot be greater than 100.")
        return value