from django.db import models
from django.utils.timezone import now

from accounts.models import UserAuth
from orders.models import Order
from products.models import Product


class ReturnRequest(models.Model):
    """A delivery agent's return submission for one order.

    The order is adjusted IMMEDIATELY on submission (its line quantities and
    total/due drop) so the agent collects the correct reduced amount from the
    customer. The request then stays `pending` until staff physically receive
    the goods at end of day:
      - confirm  -> stock is restored and the return is logged (order already
                    reduced at submission, so nothing further changes there).
      - reject   -> the order adjustment is reversed (quantities and total
                    restored), because the goods were never handed back.
    """
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("rejected", "Rejected"),
    )
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="return_requests")
    delivery_man = models.ForeignKey(
        UserAuth, on_delete=models.SET_NULL, null=True, blank=True, related_name="return_requests"
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    note = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(default=now)
    reviewed_by = models.ForeignKey(
        UserAuth, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_returns"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Return Requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"ReturnRequest #{self.pk} for order {self.order_id} ({self.status})"


class ReturnRequestItem(models.Model):
    return_request = models.ForeignKey(ReturnRequest, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    # --- Order line snapshot at request time (so a rejected return can be
    #     reversed exactly, even if the order line was fully removed) ---
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    product_name = models.CharField(max_length=255, null=True, blank=True)
    reason = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.quantity} x {self.product_id}"


class DepositRequest(models.Model):
    """An agent's end-of-day cash deposit submission, reviewed by an admin.

    Submitting auto-covers all of the agent's currently-undeposited collections
    (links them to this request and sums them). Approval settles them; rejection
    releases them back to the undeposited pool for the next submission.
    """
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )
    delivery_man = models.ForeignKey(
        UserAuth, on_delete=models.CASCADE, related_name="deposit_requests"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    note = models.CharField(max_length=255, null=True, blank=True)
    requested_at = models.DateTimeField(default=now)
    reviewed_by = models.ForeignKey(
        UserAuth, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_deposits"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Deposit Requests"
        ordering = ["-requested_at"]

    def __str__(self):
        return f"Deposit {self.amount} by {self.delivery_man_id} ({self.status})"


class CollectionPayment(models.Model):
    """A single cash collection against an order (invoice).

    The order's `collected_amount` is the cached SUM of these rows, and
    `due_amount` is auto-derived from it. Multiple payments per invoice are
    allowed (on-delivery collection, later due payments, partial payments,
    admin adjustments).
    """
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="collection_payments"
    )
    delivery_man = models.ForeignKey(
        UserAuth, on_delete=models.SET_NULL, null=True, blank=True, related_name="collections"
    )
    deposit = models.ForeignKey(
        DepositRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    note = models.CharField(max_length=255, null=True, blank=True)
    collected_at = models.DateTimeField(default=now)
    created_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Collection Payments"
        ordering = ["-collected_at"]

    def __str__(self):
        return f"{self.amount} on {self.order_id}"
