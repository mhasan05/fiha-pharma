from rest_framework import serializers
from .models import *
from products.models import Product
from django.utils import timezone
from accounts.models import UserAuth
from django.db import transaction
from settings.models import *
from decimal import Decimal, ROUND_HALF_UP

# class OrderItemSerializer(serializers.ModelSerializer):
#     product_name = serializers.CharField(source='product.product_name', read_only=True)
#     product_image = serializers.ImageField(source='product.product_image', read_only=True, use_url=True)
#     company_name = serializers.CharField(source='product.company_id', read_only=True)
#     discount_percent = serializers.FloatField(source='product.discount_percent', read_only=True)
#     discount = serializers.SerializerMethodField()
#     mrp = serializers.FloatField(source='product.mrp', read_only=True)
#     selling_price = serializers.FloatField(source='product.selling_price', read_only=True)

#     class Meta:
#         model = OrderItem
#         fields = ['id','product', 'product_name','product_image','company_name', 'quantity', 'mrp','selling_price', 'discount_percent','discount', 'items_total','created_on', 'updated_on']
#         # fields = '__all__'

#     def validate_quantity(self, value):
#         if value == 0:
#             raise serializers.ValidationError("Quantity must be greater than zero.")
#         return value
    
#     def items_total(self, obj):
#         """
#         Calculates the total price for this item based on quantity and unit price.
#         """
#         return obj.unit_price * obj.quantity
#     def get_discount(self, obj):
#         """
#         Retrieves the discount amount from the product's discount method.
#         """
#         return (obj.product.mrp - obj.product.selling_price) * obj.quantity


class OrderItemSerializer(serializers.ModelSerializer):
    # Map JSON product ID to Product instance
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    # product_name/image/company come from the snapshot (name) or the product
    # (image/company are not price-sensitive). All price fields read the frozen
    # snapshot stored on the OrderItem — never the live product price.
    product_name = serializers.SerializerMethodField()
    product_image = serializers.ImageField(source='product.product_image', read_only=True, use_url=True)
    company_name = serializers.CharField(source='product.company_id', read_only=True)
    discount_percent = serializers.SerializerMethodField()
    discount = serializers.SerializerMethodField()
    mrp = serializers.SerializerMethodField()
    selling_price = serializers.SerializerMethodField()
    items_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id','product','product_name','product_image','company_name',
            'quantity','mrp','selling_price','discount_percent','discount',
            'items_total','created_on','updated_on'
        ]

    # ------------------------
    # Validation
    # ------------------------
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    # ------------------------
    # Snapshot-based read fields (frozen at order time)
    # ------------------------
    def get_product_name(self, obj):
        return obj.product_name or (obj.product.product_name if obj.product else None)

    def get_selling_price(self, obj):
        return float(obj.unit_price or 0)

    def get_mrp(self, obj):
        return float(obj.mrp or 0)

    def get_discount_percent(self, obj):
        return float(obj.discount_percent or 0)

    def get_items_total(self, obj):
        return float((obj.unit_price or 0) * obj.quantity)

    def get_discount(self, obj):
        return float(((obj.mrp or 0) - (obj.unit_price or 0)) * obj.quantity)



class ReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.product_name", read_only=True)
    product_image = serializers.ImageField(source='product.product_image', read_only=True, use_url=True)
    company_name = serializers.CharField(source='product.company_id', read_only=True)
    mrp = serializers.SerializerMethodField()
    selling_price = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    total_return = serializers.SerializerMethodField()

    class Meta:
        model = ReturnItem
        fields = [
            "id", "product", "product_name",'product_image','company_name', "quantity",
            "mrp", "selling_price", "discount_percent",
            "reason", "created_on", "updated_on",
            "total_return",
        ]

    def get_mrp(self, obj):
        return float(obj.product.mrp) if obj.product else 0.0

    def get_selling_price(self, obj):
        # Snapshot price at return time; fall back to product for legacy rows.
        if obj.unit_price is not None:
            return float(obj.unit_price)
        return float(obj.product.selling_price) if obj.product else 0.0

    def get_discount_percent(self, obj):
        return float(obj.product.discount_percent) if obj.product else 0.0

    def get_total_return(self, obj):
        unit = obj.unit_price if obj.unit_price is not None else (
            obj.product.selling_price if obj.product else 0
        )
        return float(obj.quantity * (unit or 0))


class OrderSerializer(serializers.ModelSerializer):
    total_amount = serializers.FloatField(read_only=True)
    collected_amount = serializers.FloatField(required=False)
    due_amount = serializers.FloatField(read_only=True)
    special_bonus = serializers.FloatField(read_only=True)
    special_bonus_percentage = serializers.FloatField(read_only=True)
    delivery_charge = serializers.FloatField()
    items = OrderItemSerializer(many=True)
    return_items = ReturnItemSerializer(many=True, read_only=True)

    subtotal_amount = serializers.SerializerMethodField()
    total_return_amount = serializers.SerializerMethodField()
    final_amount = serializers.SerializerMethodField()

    shipping_address = serializers.CharField(required=False, allow_blank=True)
    full_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField(read_only=True)
    shop_name = serializers.SerializerMethodField()
    area = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'order_id',
            'invoice_number',
            'user_id',
            'full_name',
            'phone',
            'subtotal_amount',
            'special_bonus_percentage',
            'delivery_charge',
            'special_bonus',
            'total_amount',
            'collected_amount',
            'due_amount',
            'final_amount',
            'total_return_amount',
            'area',
            'shop_name',
            'shipping_address',
            'order_status',
            'order_date',
            'assigned_to',
            'assigned_to_name',
            'items',
            'return_items',
        ]
        read_only_fields = [
            'order_id',
            'invoice_number',
            'total_amount',
            'special_bonus',
            'special_bonus_percentage',
        ]

    # -------------------------
    # SerializerMethodFields
    # -------------------------
    def get_assigned_to_name(self, obj):
        agent = getattr(obj, 'assigned_to', None)
        return getattr(agent, 'full_name', None) if agent else None

    def get_subtotal_amount(self, obj):
        return float(sum(item.items_total() for item in obj.items.all()))

    def get_final_amount(self, obj):
        return float(obj.total_amount or 0)

    def get_total_return_amount(self, obj):
        # Use the snapshot price stored on the return line; fall back to the
        # product price for legacy rows that predate the snapshot.
        total = Decimal("0.00")
        for item in obj.return_items.all():
            unit = item.unit_price if item.unit_price is not None else (
                item.product.selling_price if item.product else 0
            )
            total += Decimal(str(item.quantity)) * Decimal(str(unit or 0))
        return float(total)

    def get_full_name(self, obj):
        user = getattr(obj, 'user_id', None)
        return getattr(user, 'full_name', None) if user else None

    def get_phone(self, obj):
        user = getattr(obj, 'user_id', None)
        return getattr(user, 'phone', '') if user else ''

    def get_area(self, obj):
        user = getattr(obj, 'user_id', None)
        return getattr(user.area, "area_name", None) if user and user.area else None

    def get_shop_name(self, obj):
        user = getattr(obj, 'user_id', None)
        return getattr(user, 'shop_name', '') if user else None

    # -------------------------
    # Internal helper
    # -------------------------
    def _get_bonus_rule(self, subtotal):
        return (
            ConditionalDiscount.objects
            .filter(is_active=True, minimum_purchase_amount__lte=subtotal)
            .order_by('-minimum_purchase_amount')
            .first()
        )

    def _recalculate_order_totals(self, order):
        subtotal = Decimal("0.00")
        for item in order.items.all():
            subtotal += Decimal(str(item.items_total()))

        delivery_charge = Decimal(str(order.delivery_charge or 0))

        bonus_rule = self._get_bonus_rule(subtotal)

        if bonus_rule:
            special_bonus_percentage = Decimal(str(bonus_rule.bonus_percentage))
            special_bonus = (subtotal * special_bonus_percentage / Decimal("100")).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )
        else:
            special_bonus_percentage = Decimal("0.00")
            special_bonus = Decimal("0.00")

        final_total = (subtotal + delivery_charge - special_bonus).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )

        if final_total < 0:
            final_total = Decimal("0.00")

        order.special_bonus_percentage = special_bonus_percentage
        order.special_bonus = special_bonus
        order.total_amount = final_total
        order.save(update_fields=[
            'special_bonus_percentage',
            'special_bonus',
            'total_amount',
            'updated_on'
        ])

    # -------------------------
    # Create order
    # -------------------------
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        user = validated_data.get('user_id')

        if not items_data:
            raise serializers.ValidationError({
                "items": "Order items are required."
            })

        if user and getattr(user, 'shop_address', None):
            validated_data['shipping_address'] = user.shop_address

        with transaction.atomic():
            # Merge into existing pending order if one exists
            existing_order = Order.objects.filter(
                user_id=user, order_status='pending'
            ).first()

            if existing_order:
                existing_items = {
                    item.product_id: item
                    for item in existing_order.items.select_related('product').all()
                }

                for item_data in items_data:
                    product = Product.objects.select_for_update().get(pk=item_data['product'].pk)
                    quantity = item_data['quantity']

                    product.stock_quantity -= quantity
                    product.save(update_fields=['stock_quantity'])

                    if product.pk in existing_items:
                        existing_item = existing_items[product.pk]
                        existing_item.quantity += quantity
                        existing_item.save(update_fields=['quantity', 'updated_on'])
                    else:
                        OrderItem.objects.create(order=existing_order, **item_data)

                self._recalculate_order_totals(existing_order)
                return existing_order

            # No pending order — create a new one
            order = Order.objects.create(**validated_data)

            subtotal = Decimal("0.00")

            for item_data in items_data:
                product = Product.objects.select_for_update().get(pk=item_data['product'].pk)
                quantity = item_data['quantity']

                product.stock_quantity -= quantity
                product.save(update_fields=['stock_quantity'])

                order_item = OrderItem.objects.create(order=order, **item_data)
                subtotal += Decimal(str(order_item.items_total()))

            delivery_charge = Decimal(str(order.delivery_charge or 0))
            bonus_rule = self._get_bonus_rule(subtotal)

            if bonus_rule:
                special_bonus_percentage = Decimal(str(bonus_rule.bonus_percentage))
                special_bonus = (subtotal * special_bonus_percentage / Decimal("100")).quantize(
                    Decimal("0.01"),
                    rounding=ROUND_HALF_UP
                )
            else:
                special_bonus_percentage = Decimal("0.00")
                special_bonus = Decimal("0.00")

            final_total = (subtotal + delivery_charge - special_bonus).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )

            if final_total < 0:
                final_total = Decimal("0.00")

            order.special_bonus_percentage = special_bonus_percentage
            order.special_bonus = special_bonus
            order.total_amount = final_total
            order.save(update_fields=[
                'special_bonus_percentage',
                'special_bonus',
                'total_amount',
                'updated_on'
            ])

        return order

    # -------------------------
    # Update order
    # -------------------------
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        # collected_amount is a cached sum of the collection ledger — never set
        # it directly. An admin-entered value is reconciled via the ledger below.
        collected_input = validated_data.pop('collected_amount', None)

        # A still-'pending' order has not left inventory yet, so reducing or
        # removing a line is a plain edit: restore stock, but do NOT record a
        # ReturnItem. Once the order is processing/shipped/delivered, the goods
        # are out, so a reduction is a genuine return and is recorded. Capture
        # the status BEFORE applying any changes from validated_data below.
        was_pending = instance.order_status == 'pending'

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if items_data is not None:
                existing_items = {
                    item.product_id: item
                    for item in instance.items.select_related('product').all()
                }

                incoming_items = {}
                for item_data in items_data:
                    product = item_data['product']
                    product_id = product.pk if isinstance(product, Product) else int(product)
                    incoming_items[product_id] = item_data

                # Handle removed and updated items
                for product_id, old_item in existing_items.items():
                    old_qty = old_item.quantity
                    new_item_data = incoming_items.get(product_id)

                    if not new_item_data:
                        if not was_pending:
                            ReturnItem.objects.create(
                                order=instance,
                                product=old_item.product,
                                quantity=old_qty,
                                unit_price=old_item.unit_price,
                                reason="Removed by admin during order update"
                            )

                        old_item.product.stock_quantity += old_qty
                        old_item.product.save(update_fields=['stock_quantity'])
                        old_item.delete()
                        continue

                    new_qty = int(new_item_data['quantity'])

                    if new_qty < old_qty:
                        removed_qty = old_qty - new_qty
                        if not was_pending:
                            ReturnItem.objects.create(
                                order=instance,
                                product=old_item.product,
                                quantity=removed_qty,
                                unit_price=old_item.unit_price,
                                reason="Quantity reduced by admin during order update"
                            )

                        old_item.product.stock_quantity += removed_qty
                        old_item.product.save(update_fields=['stock_quantity'])

                    elif new_qty > old_qty:
                        added_qty = new_qty - old_qty
                        product = Product.objects.select_for_update().get(pk=product_id)

                        if product.stock_quantity < added_qty:
                            raise serializers.ValidationError({
                                "items": f"Not enough stock for {product.product_name}."
                            })

                        product.stock_quantity -= added_qty
                        product.save(update_fields=['stock_quantity'])

                    old_item.quantity = new_qty
                    old_item.save(update_fields=['quantity'])

                # Handle newly added products
                for product_id, item_data in incoming_items.items():
                    if product_id not in existing_items:
                        product = item_data['product']
                        if not isinstance(product, Product):
                            product = Product.objects.select_for_update().get(pk=product_id)

                        quantity = int(item_data['quantity'])

                        if product.stock_quantity < quantity:
                            raise serializers.ValidationError({
                                "items": f"Not enough stock for {product.product_name}."
                            })

                        product.stock_quantity -= quantity
                        product.save(update_fields=['stock_quantity'])

                        OrderItem.objects.create(
                            order=instance,
                            product=product,
                            quantity=quantity
                        )

                self._recalculate_order_totals(instance)

            # Reconcile an admin-entered collection total through the ledger so
            # collected_amount stays equal to SUM(CollectionPayment).
            if collected_input is not None:
                from delivery.services import set_collected_total
                set_collected_total(instance, collected_input)

        return instance


# class OrderSerializer(serializers.ModelSerializer):
#     delivery_charge = serializers.FloatField()  # ensure number
#     items = OrderItemSerializer(many=True)
#     return_items = ReturnItemSerializer(many=True, read_only=True)
#     total_return_amount = serializers.SerializerMethodField()  # NEW field
#     total_amount = serializers.SerializerMethodField()
#     final_amount = serializers.SerializerMethodField()
#     shipping_address = serializers.CharField(required=False, allow_blank=True)
#     full_name = serializers.SerializerMethodField()  # NEW
#     phone = serializers.SerializerMethodField()  # NEW
#     shop_name = serializers.SerializerMethodField()  # NEW

#     class Meta:
#         model = Order
#         fields = [
#             'order_id', 'invoice_number', 'user_id','full_name','phone',
#             'total_amount', 'delivery_charge', 'final_amount',
#             'total_return_amount','shop_name', 'shipping_address',
#             'order_status', 'order_date', 'items', 'return_items'
#         ]


#     # --------------------
#     # Calculate total amount from order items
#     # --------------------
#     def get_total_amount(self, obj):
#         total = sum([item.items_total() for item in obj.items.all()])
#         return float(total)

#     # --------------------
#     # Final amount including delivery
#     # --------------------
#     def get_final_amount(self, obj):
#         return self.get_total_amount(obj) + float(obj.delivery_charge or 0.0)
        
#     def get_full_name(self, obj):
#         return obj.user_id.full_name if obj.user_id else None

#     def get_phone(self, obj):
#         return obj.user_id.phone if obj.user_id else ''
        
#     def get_shop_name(self, obj):
#         return obj.user_id.shop_name if obj.user_id else None

#     # --------------------
#     # Create order with items
#     # --------------------
#     def create(self, validated_data):
#         items_data = validated_data.pop('items', [])

#         # Set shipping_address from user if available
#         user = validated_data.get('user_id')
#         if user and hasattr(user, 'shop_address'):
#             validated_data['shipping_address'] = user.shop_address

#         # Temporarily create order
#         order = Order.objects.create(**validated_data)

#         # Create order items and calculate total
#         total_amount = 0
#         for item_data in items_data:
#             product = Product.objects.select_for_update().get(pk=item_data['product'].pk)
#             quantity = item_data['quantity']

#             # if product.stock_quantity < quantity:
#             #     raise serializers.ValidationError({
#             #         'product': f"Not enough stock for {product.product_name}."
#             #     })

#             product.stock_quantity -= quantity
#             product.save()

#             order_item = OrderItem.objects.create(order=order, **item_data)
#             total_amount += order_item.items_total()

#         order.total_amount = total_amount
#         order.save()
#         return order
    
#     def update(self, instance, validated_data):
#         items_data = validated_data.pop('items', None)

#         # Update order fields
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
#         instance.save()
#         order = instance
#         if items_data is not None:
#             # Remove existing items (or implement partial update logic if needed)
#             instance.items.all().delete()

#             # Create new items from incoming data
#             total_amount = 0
#             for item_data in items_data:
#                 order_item = OrderItem.objects.create(order=order, **item_data)
#                 total_amount += order_item.items_total()

#             # Update total_amount and save order
#             order.total_amount = total_amount
#             order.save()

#         return order
    

#     def get_total_amount(self, obj):
#         # Sum the total for all related OrderItems
#         return sum(item.items_total() for item in obj.items.all())
#     def get_final_amount(self, obj):
#         total_amt = sum(item.items_total() for item in obj.items.all())
#         return float(total_amt) + float(obj.delivery_charge)
    
#     def get_total_return_amount(self, obj):
#         """Sum of all return item amounts"""
#         total = 0
#         for item in obj.return_items.all():
#             total += float(item.quantity) * float(item.product.selling_price)
#         return total
    
#     def get_shipping_address(self, obj):
#         return obj.user_id.shop_address if obj.user_id and obj.user_id.shop_address else None





