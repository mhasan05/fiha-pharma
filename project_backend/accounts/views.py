from rest_framework import viewsets
from .models import UserAuth, Area, Address
from .serializers import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Count
from accounts.models import *
from rest_framework.pagination import PageNumberPagination


class UserPagination(PageNumberPagination):
    page_size = 10  # default page size
    page_size_query_param = 'page_size'  # let client override page size using ?page_size=
    max_page_size = 1000

class HomeView(APIView):
    def get(self,request):
        return Response({'status': 'success',"message": "Welcome to teamerror :)."})


class LoginView(APIView):
    """
    Handle user login.
    """
    def post(self, request):
        phone = request.data.get('phone')
        password = request.data.get('password')

        if not phone or not password:
            return Response({'status': 'error',"message": "Both phone and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, phone=phone, password=password)


        if user is None:
            return Response({'status': 'error', "message": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        # Admin/staff accounts must use the admin login endpoint, not this one.
        elif user.is_superuser or user.is_staff:
            return Response({'status': 'error', "message": "Please log in through the admin portal."}, status=status.HTTP_403_FORBIDDEN)

        elif user.is_approved == False:
            return Response({'status': 'error', "message": "Wait for admin approval."}, status=status.HTTP_401_UNAUTHORIZED)


        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        return Response({
            'status': 'success',
            'access_token': str(access_token),
            'data': UserAuthSerializer(user).data
        }, status=status.HTTP_200_OK)


class AdminLoginView(APIView):
    """
    Handle user login.
    """
    def post(self, request):
        phone = request.data.get('phone')
        password = request.data.get('password')

        if not phone or not password:
            return Response({'status': 'error',"message": "Both phone and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, phone=phone, password=password)

        if user.is_superuser is False and user.is_staff is False:
            return Response({'status': 'error', "message": "You are not authorized to access this resource."}, status=status.HTTP_403_FORBIDDEN)

        if user is None:
            return Response({'status': 'error', "message": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'status': 'error', "message": "Your account is inactive."}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        return Response({
            'status': 'success',
            'access_token': str(access_token),
            'data': UserAuthSerializer(user).data
        }, status=status.HTTP_200_OK)


class SignupView(APIView):
    """
    Handle user signup.
    """
    def post(self, request):
        full_name = request.data.get('full_name')
        email = request.data.get('email')
        phone = request.data.get('phone')
        shop_name = request.data.get('shop_name')
        shop_address = request.data.get('shop_address')
        area_id = request.data.get('area_id')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')

        if not email or not phone or not shop_name or not shop_address or not area_id or not password or not full_name:
            return Response({'status':'error',"message": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        elif UserAuth.objects.filter(email=email).exists():
            return Response({'status':'error',"message": "The email is already taken."}, status=status.HTTP_400_BAD_REQUEST)
        elif UserAuth.objects.filter(phone=phone).exists():
            return Response({'status':'error',"message": "The phone number is already taken."}, status=status.HTTP_400_BAD_REQUEST)

        elif password != confirm_password:
            return Response({'status':'error',"message": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            pass
        area = Area.objects.filter(area_id=area_id).first()
        
        user = UserAuth(email=email, full_name=full_name, phone=phone, shop_name=shop_name, shop_address=shop_address, area=area)
        try:
            user.set_password(password)
            user.save()
        except:
            return Response({'status':'error',"message": "Failed to create user. Please try again."}, status=status.HTTP_400_BAD_REQUEST)

        # access_token, error = self.send_otp_and_respond(user)
        
        # if error:
        #     return Response({'status':'error',"message": error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'status': 'success',
            'message': 'User created successfully. Please log in.',
        }, status=status.HTTP_201_CREATED)


class CustomerView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = UserPagination()

    def get(self, request, pk=None):
        if not request.user.is_superuser:
            return Response({"status": "success", "data": []}, status=200)
        if pk:
            try:
                customer = UserAuth.objects.get(pk=pk)
                serializer = UserAuthSerializer(customer)
                return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
            except UserAuth.DoesNotExist:
                return Response({"status": "error", "message": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
            
        
        
        customers = (
            UserAuth.objects.annotate(orders_count=Count('order'))
            .all()
            .order_by('-date_joined')
        )
        paginator = self.pagination_class
        paginated_customers = paginator.paginate_queryset(customers, request)
        serializer = UserAuthSerializer(customers, many=True)
        return paginator.get_paginated_response({
            "status": "success",
            "data": serializer.data
        })

    def post(self, request):
        # Admin-only: create a staff/delivery account directly (no self-signup).
        # Defaults to a delivery man and auto-approves so the agent can log in
        # to the mobile app immediately.
        if not request.user.is_superuser:
            return Response(
                {"status": "error", "message": "You are not authorized to create accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data
        full_name = data.get("full_name")
        email = data.get("email") or ""
        phone = data.get("phone")
        password = data.get("password")
        role = data.get("role") or "delivery_man"
        area_id = data.get("area")

        if not full_name or not phone or not password:
            return Response(
                {"status": "error", "message": "Full name, phone and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if UserAuth.objects.filter(phone=phone).exists():
            return Response(
                {"status": "error", "message": "The phone number is already taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if email and UserAuth.objects.filter(email=email).exists():
            return Response(
                {"status": "error", "message": "The email is already taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # A delivery man must be assigned an area (used for auto-assignment).
        area = Area.objects.filter(area_id=area_id).first() if area_id else None
        if role == "delivery_man" and area is None:
            return Response(
                {"status": "error", "message": "Please assign an area for the delivery man."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_staff = role in ("admin", "staff")
        is_superuser = role == "admin"

        try:
            user = UserAuth.objects.create_user(
                phone=phone,
                password=password,
                full_name=full_name,
                email=email,
                role=role,
                area=area,
                is_approved=True,
                is_active=True,
                is_staff=is_staff,
                is_superuser=is_superuser,
            )
        except Exception:
            return Response(
                {"status": "error", "message": "Failed to create account. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UserAuthSerializer(user)
        return Response(
            {"status": "success", "message": "Account created successfully", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, pk=None):
        data = request.data.copy()

        try:
            customer = UserAuth.objects.get(pk=pk)

            is_staff = data.get("is_staff", None)

            # Normalize boolean value safely
            if isinstance(is_staff, str):
                value = is_staff.strip().lower()
                if value in ["true", "1", "yes"]:
                    is_staff = True
                elif value in ["false", "0", "no"]:
                    is_staff = False
                else:
                    is_staff = None

            # Only derive role from is_staff when the caller didn't send an
            # explicit role. This lets admins set role='delivery_man' (or any
            # other role) directly without it being overwritten.
            if not data.get("role"):
                if is_staff is True:
                    data["role"] = "staff"
                elif is_staff is False:
                    data["role"] = "customer"

            serializer = UserAuthSerializer(customer, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {
                        "status": "success",
                        "message": "Customer updated successfully",
                        "data": serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"status": "error", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except UserAuth.DoesNotExist:
            return Response(
                {"status": "error", "message": "Customer not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


    def delete(self, request, pk=None):
        try:
            customer = UserAuth.objects.get(pk=pk)
            customer.delete()
            return Response({"status": "success", "message": "Customer deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except UserAuth.DoesNotExist:
            return Response({"status": "error", "message": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        try:
            user_profile = request.user  # Access the current logged-in user
            serializer = UserAuthSerializer(user_profile)  # Serialize the user data
            return Response(serializer.data, status=status.HTTP_200_OK)
        except UserAuth.DoesNotExist:
            return Response({'status': 'error',"message": "User profile not found."}, status=status.HTTP_404_NOT_FOUND)
        
    def post(self, request, pk=None):
        user = request.user  # Access the current logged-in user
        if user.is_superuser:
            try:
                customer = UserAuth.objects.get(pk=pk)
                customer.is_approved = True  # Approve the customer
                customer.save()
                serializer = UserAuthSerializer(customer)
                return Response({"status": "success","message": "Customer approved successfully","data": serializer.data}, status=status.HTTP_200_OK)
            except UserAuth.DoesNotExist:
                return Response({"status": "error", "message": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"status": "error", "message": "You are not authorized to approve users."}, status=status.HTTP_403_FORBIDDEN)

    def patch(self, request, pk=None):
        customer = request.user  # Access the current logged-in user
        data = request.data.copy()
        
        # Only allow admin to change restricted fields
        restricted_fields = ['is_superuser','is_staff', 'is_active', 'is_approved']
        if not customer.is_superuser:
            for field in restricted_fields:
                data.pop(field, None)
        serializer = UserAuthSerializer(customer, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
        return Response({"status": "error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """POST /auth/change_password/ — change my own password by supplying the
    current one for verification. Body: {current_password, new_password}."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current = (request.data.get("current_password") or "").strip()
        new = (request.data.get("new_password") or "").strip()

        if not current or not new:
            return Response(
                {"status": "error", "message": "Current and new password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.check_password(current):
            return Response(
                {"status": "error", "message": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new) < 6:
            return Response(
                {"status": "error", "message": "New password must be at least 6 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if current == new:
            return Response(
                {"status": "error", "message": "New password must be different from the current password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new)
        user.save(update_fields=["password"])
        return Response(
            {"status": "success", "message": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


class AreaViewSet(APIView):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    def get(self, request, pk=None):
        if pk:
            try:
                area = Area.objects.get(pk=pk)
                serializer = AreaSerializer(area)
                return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
            except Area.DoesNotExist:
                return Response({"status": "error", "message": "Area not found"}, status=status.HTTP_404_NOT_FOUND)

        areas = Area.objects.all().order_by('-created_on')
        serializer = AreaSerializer(areas, many=True)
        return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
    def post(self, request):
        serializer = AreaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response({"status": "error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    def patch(self, request, pk=None):
        try:
            area = Area.objects.get(pk=pk)
            serializer = AreaSerializer(area, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
            return Response({"status": "error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Area.DoesNotExist:
            return Response({"status": "error", "message": "Area not found"}, status=status.HTTP_404_NOT_FOUND)
    def delete(self, request, pk=None):
        try:
            area = Area.objects.get(pk=pk)
            area.delete()
            return Response({"status": "success", "message": "Area deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Area.DoesNotExist:
            return Response({"status": "error", "message": "Area not found"}, status=status.HTTP_404_NOT_FOUND)


class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer


class DistrictListAPIView(APIView):
    """
    API to list all districts
    """
    def get(self, request, *args, **kwargs):
        districts = District.objects.all().order_by("name")
        serializer = DistrictSerializer(districts, many=True)
        return Response(
        {"status": "success", "data": serializer.data},
        status=status.HTTP_200_OK
    )