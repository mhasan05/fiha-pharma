from django.core.validators import FileExtensionValidator
from django.db import models


class AppRelease(models.Model):
    """A published build of the mobile app. Admin uploads the APK and toggles
    `is_available`; the app fetches the latest available release and shows a
    download button (or forces the update when `force_update` is on)."""

    APP_CHOICES = [
        ("bdm", "BDM (Shop app)"),
        ("da", "Delivery Assist (Rider app)"),
    ]
    app = models.CharField(
        max_length=10, choices=APP_CHOICES, default="bdm",
        help_text="Which mobile app this release is for.",
    )
    version = models.CharField(max_length=20, help_text="Human version, e.g. 1.2.0")
    version_code = models.PositiveIntegerField(
        help_text="Numeric build code used for comparison, e.g. 12. Higher = newer."
    )
    apk = models.FileField(
        upload_to="apks/",
        validators=[FileExtensionValidator(allowed_extensions=["apk"])],
    )
    release_notes = models.TextField(blank=True, default="")
    is_available = models.BooleanField(
        default=False, help_text="When on, this release is offered to app users."
    )
    force_update = models.BooleanField(
        default=False, help_text="When on, the app should require updating to this build."
    )
    file_size = models.BigIntegerField(default=0, help_text="APK size in bytes (auto).")
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "app_release"
        ordering = ["-version_code", "-created_on"]

    def save(self, *args, **kwargs):
        # Capture the APK size whenever a (new) file is attached.
        try:
            if self.apk and hasattr(self.apk, "size"):
                self.file_size = self.apk.size
        except (ValueError, OSError):
            pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.version} ({self.version_code})"


# Create your models here.
class SiteInfoModel(models.Model):
    name = models.CharField(max_length=100, default='BDM')
    logo = models.ImageField(upload_to='logos/', default='logos/logo.png')
    version = models.CharField(max_length=10, default='1.0')
    description = models.TextField(default='A platform for managing orders.')
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=1, default=80.0)
    contact_email = models.EmailField(default='info@bdm.com')
    contact_phone = models.CharField(max_length=15, default='1234567890')
    # WhatsApp number for the "Order on WhatsApp" button in the app (with country
    # code, digits only, e.g. 8801XXXXXXXXX). Blank hides the button.
    whatsapp_number = models.CharField(max_length=20, blank=True, default='')
    # Maintenance mode: when on, the mobile app shows a maintenance banner.
    maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.CharField(
        max_length=255,
        blank=True,
        default='We are currently under maintenance. Please check back soon.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.version}"
    


class PrivacyPolicy(models.Model):
    title = models.CharField(max_length=255, default="Privacy Policy")
    content = models.TextField()
    is_active = models.BooleanField(default=True)
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "privacy_policy"
        ordering = ["-created_on"]
        verbose_name_plural = "Privacy Policies"

    def __str__(self):
        return self.title


class TermsAndConditions(models.Model):
    title = models.CharField(max_length=255, default="Terms & Conditions")
    content = models.TextField()
    is_active = models.BooleanField(default=True)
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "terms_and_conditions"
        ordering = ["-created_on"]
        verbose_name_plural = "Terms & Conditions"

    def __str__(self):
        return self.title
    



class ConditionalDiscount(models.Model):
    name = models.CharField(max_length=255)

    minimum_purchase_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Minimum order amount required to activate this discount"
    )

    bonus_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Bonus percentage applied when condition is met"
    )

    is_active = models.BooleanField(default=True)

    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "conditional_discount"
        ordering = ["-minimum_purchase_amount"]

    def __str__(self):
        return f"{self.minimum_purchase_amount} → {self.bonus_percentage}%"