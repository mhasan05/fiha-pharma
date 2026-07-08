from django.db import models
from accounts.models import UserAuth
from orders.models import Order

class Notification(models.Model):

    user = models.ForeignKey(UserAuth, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.user.full_name or self.user.user_id} - {self.title}"
    



class PushToken(models.Model):
    """An Expo push token for one of a user's devices.

    Registered by the mobile app after login; used to deliver push
    notifications via the (free) Expo Push Service. A device can be re-used by
    a different user, so `token` is globally unique and re-pointed on register.
    """
    user = models.ForeignKey(UserAuth, on_delete=models.CASCADE, related_name='push_tokens')
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=20, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user_id}: {self.token[:24]}"


class AdminNotification(models.Model):

    user = models.ForeignKey(UserAuth, on_delete=models.CASCADE, related_name='admin_notifications')
    order_id = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='admin_notifications', null=True, blank=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Admin Notification to {self.user.full_name or self.user.user_id} - {self.title}"
