from rest_framework.permissions import BasePermission


class IsDeliveryMan(BasePermission):
    """Allow only authenticated users with the delivery_man role."""
    message = "Only delivery agents can access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == "delivery_man"
        )


class IsAdminStaff(BasePermission):
    """Allow only admins/staff (superuser or is_staff)."""
    message = "Admin access required."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.is_staff)
        )
