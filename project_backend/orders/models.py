from django.db import models
from django.utils import timezone
from accounts.models import UserAuth  # Import User model from accounts app
from products.models import Product  # Import Product model from products app
import datetime
import random

from django.db.models.signals import post_save
from django.dispatch import receiver

class Order(models.Model):
    ORDER_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('due', 'Due'),
    )

    order_id = models.BigAutoField(primary_key=True)
    invoice_number = models.CharField(max_length=20, unique=True,null=True, blank=True)  # Unique invoice number for the order
    user_id = models.ForeignKey(UserAuth, on_delete=models.CASCADE)  # Link to User model
    special_bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    special_bonus_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Total price of the order
    collected_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Amount actually collected from the customer
    due_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Auto-calculated: total_amount - collected_amount
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=1, default=80.0)  # Delivery charge for the order
    shipping_address = models.CharField(max_length=255,null=True, blank=True)  # Shipping address for the order
    order_date = models.DateTimeField(default=timezone.now)
    order_status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    # Delivery assignment (set automatically by area when the order is shipped)
    assigned_to = models.ForeignKey(
        UserAuth, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_orders'
    )
    assigned_at = models.DateTimeField(null=True, blank=True)
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Orders"
        ordering = ['-order_date']

    def __str__(self):
        return self.invoice_number

    def generate_invoice_number(self):
        """
        Generates a unique invoice number based on the current date and a random number.
        """
        date_part = datetime.datetime.now().strftime("%Y%m%d")
        random_part = random.randint(1000, 9999)
        return f"INV-{date_part}-{random_part}"

    def save(self, *args, **kwargs):
        # Generate a unique invoice number if it doesn't exist
        if not self.invoice_number:
            while True:
                new_invoice_number = self.generate_invoice_number()
                if not Order.objects.filter(invoice_number=new_invoice_number).exists():
                    self.invoice_number = new_invoice_number
                    break

        # Due amount is always derived, never set manually.
        self.due_amount = (self.total_amount or 0) - (self.collected_amount or 0)

        # If this is a partial save that touches total/collected, make sure the
        # recomputed due_amount is persisted too.
        update_fields = kwargs.get('update_fields')
        if update_fields is not None:
            update_fields = set(update_fields)
            if 'total_amount' in update_fields or 'collected_amount' in update_fields:
                update_fields.add('due_amount')
                kwargs['update_fields'] = list(update_fields)

        super().save(*args, **kwargs)






class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')  # Link to the Order
    product = models.ForeignKey(Product, on_delete=models.PROTECT)  # Link to the Product
    quantity = models.PositiveIntegerField(default=1)  # Quantity of the product in the order
    # --- Price snapshot, frozen at the time the order is placed ---
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # selling price at order time
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # cost price at order time
    mrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # MRP at order time
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # discount % at order time
    product_name = models.CharField(max_length=255, null=True, blank=True)  # product name at order time
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Order Items"
        ordering = ['order', 'product']

    def __str__(self):
        return f"{self.quantity} x {self.product_name or self.product.product_name}"

    def items_total(self):
        """
        Line total based on the snapshotted unit price (NOT the live product price).
        """
        return (self.unit_price or 0) * self.quantity

    def save(self, *args, **kwargs):
        # Snapshot product pricing ONCE, when the line is first created.
        # Never re-stamp on later saves, so editing a product's price afterwards
        # does not change the price recorded on existing orders.
        if self._state.adding:
            if self.unit_price is None:
                self.unit_price = self.product.selling_price
            if self.cost_price is None:
                self.cost_price = self.product.cost_price
            if self.mrp is None:
                self.mrp = self.product.mrp
            if not self.product_name:
                self.product_name = self.product.product_name
            self.discount_percent = self.product.discount_percent
        super().save(*args, **kwargs)





class ReturnItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='return_items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # selling price snapshot at return time
    reason = models.TextField(blank=True, null=True)  # why the item was returned
    created_by = models.ForeignKey(
        UserAuth, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_returns'
    )  # delivery agent / admin who recorded the return
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Return Items"

    def __str__(self):
        return f"Return {self.quantity} x {self.product.product_name}"

