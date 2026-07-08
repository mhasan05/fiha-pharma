# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import *
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny


class AppReleaseListCreateAPIView(APIView):
    """Admin: list all app releases / upload a new one (multipart with `apk`)."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        releases = AppRelease.objects.all()
        serializer = AppReleaseSerializer(releases, many=True, context={"request": request})
        return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AppReleaseSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"status": "success", "message": "Release uploaded.", "data": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        return Response({"status": "error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class AppReleaseDetailAPIView(APIView):
    """Admin: update (toggle availability / force) or delete a release."""
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        return get_object_or_404(AppRelease, pk=pk)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        serializer = AppReleaseSerializer(obj, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"status": "success", "message": "Release updated.", "data": serializer.data},
                status=status.HTTP_200_OK,
            )
        return Response({"status": "error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if obj.apk:
            obj.apk.delete(save=False)  # remove the file from disk too
        obj.delete()
        return Response({"status": "success", "message": "Release deleted."}, status=status.HTTP_200_OK)


class LatestAppReleaseAPIView(APIView):
    """Public (app): the latest available release. Optional `?version_code=` lets
    the app know whether the installed build is older.

    Response: { status, update_available, data: {version, version_code, apk_url,
    release_notes, force_update, file_size, created_on} | null }
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # Which app is asking (bdm shop app vs. da rider app). Defaults to "bdm"
        # so existing BDM clients keep working unchanged.
        app = request.query_params.get("app") or "bdm"
        latest = AppRelease.objects.filter(is_available=True, app=app).order_by("-version_code", "-created_on").first()
        if not latest:
            return Response(
                {"status": "success", "update_available": False, "data": None},
                status=status.HTTP_200_OK,
            )

        # Current live version comes from Platform Settings (SiteInfoModel.version).
        site = SiteInfoModel.objects.first()
        current_version = site.version if site else None

        installed = request.query_params.get("version_code")
        if installed is not None:
            try:
                update_available = int(installed) < latest.version_code
            except (TypeError, ValueError):
                update_available = True
        else:
            # No installed code supplied: an update is available when the latest
            # release version differs from the current version in settings.
            update_available = (current_version != latest.version) if current_version else True

        s = AppReleaseSerializer(latest, context={"request": request}).data
        data = {
            "id": s["id"],
            "version": current_version,            # current app version (from settings)
            "updated_version": s["version"],       # the new release's version
            "version_code": s["version_code"],
            "apk_url": s["apk_url"],
            "release_notes": s["release_notes"],
            "is_available": s["is_available"],
            "force_update": s["force_update"],
            "file_size": s["file_size"],
            "created_on": s["created_on"],
            "updated_on": s["updated_on"],
        }
        return Response(
            {"status": "success", "update_available": update_available, "data": data},
            status=status.HTTP_200_OK,
        )


class SiteInfoListCreateAPIView(APIView):
    def get(self, request):
        site_infos = SiteInfoModel.objects.all()
        serializer = SiteInfoSerializer(site_infos, many=True, context={'request': request})
        return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)

    def patch(self, request):
        site_info = SiteInfoModel.objects.first()
        if not site_info:
            return Response({"status": "error", "message": "No SiteInfoModel found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SiteInfoSerializer(site_info, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "message": "Settings updated", "data": serializer.data}, status=status.HTTP_200_OK)
        return Response({"status": "error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class PrivacyPolicyListCreateAPIView(APIView):
    """
    GET: List all privacy policies
    POST: Create a new privacy policy
    """

    def get(self, request):
        queryset = PrivacyPolicy.objects.all()
        serializer = PrivacyPolicySerializer(queryset, many=True)
        return Response(
            {
                "status": "success",
                "message": "Privacy policy list fetched successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = PrivacyPolicySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Privacy policy created successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            {
                "status": "error",
                "message": "Validation failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class PrivacyPolicyDetailAPIView(APIView):
    """
    GET: Retrieve single privacy policy
    PUT: Update privacy policy
    PATCH: Partial update privacy policy
    DELETE: Delete privacy policy
    """

    def get_object(self, pk):
        return get_object_or_404(PrivacyPolicy, pk=pk)

    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer = PrivacyPolicySerializer(obj)
        return Response(
            {
                "status": "success",
                "message": "Privacy policy fetched successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK
        )

    def patch(self, request, pk=None):
        if pk:
            obj = self.get_object(pk)
        else:
            obj = PrivacyPolicy.objects.first()
        serializer = PrivacyPolicySerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Privacy policy updated successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "status": "error",
                "message": "Validation failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        obj = self.get_object(pk)
        obj.delete()
        return Response(
            {
                "status": "success",
                "message": "Privacy policy deleted successfully",
            },
            status=status.HTTP_200_OK
        )


class TermsAndConditionsListCreateAPIView(APIView):
    """
    GET: List all terms & conditions (public).
    POST: Create new terms & conditions.
    """

    def get(self, request):
        queryset = TermsAndConditions.objects.all()
        serializer = TermsAndConditionsSerializer(queryset, many=True)
        return Response(
            {
                "status": "success",
                "message": "Terms & conditions list fetched successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = TermsAndConditionsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Terms & conditions created successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            {
                "status": "error",
                "message": "Validation failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class TermsAndConditionsDetailAPIView(APIView):
    """
    GET / PUT / PATCH / DELETE a single terms & conditions record.
    """

    def get_object(self, pk):
        return get_object_or_404(TermsAndConditions, pk=pk)

    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer = TermsAndConditionsSerializer(obj)
        return Response(
            {
                "status": "success",
                "message": "Terms & conditions fetched successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK
        )

    def patch(self, request, pk=None):
        if pk:
            obj = self.get_object(pk)
        else:
            obj = TermsAndConditions.objects.first()
        serializer = TermsAndConditionsSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Terms & conditions updated successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "status": "error",
                "message": "Validation failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        obj = self.get_object(pk)
        obj.delete()
        return Response(
            {
                "status": "success",
                "message": "Terms & conditions deleted successfully",
            },
            status=status.HTTP_200_OK
        )


class ConditionalDiscountListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        discounts = ConditionalDiscount.objects.all().order_by("-minimum_purchase_amount")
        serializer = ConditionalDiscountSerializer(discounts, many=True)
        return Response({
            "status": "success",
            "message": "Conditional discount list fetched successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ConditionalDiscountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "message": "Conditional discount created successfully.",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            "status": "error",
            "message": "Validation failed.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ConditionalDiscountDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(ConditionalDiscount, pk=pk)

    def get(self, request, pk):
        discount = self.get_object(pk)
        serializer = ConditionalDiscountSerializer(discount)
        return Response({
            "status": "success",
            "message": "Conditional discount fetched successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def put(self, request, pk):
        discount = self.get_object(pk)
        serializer = ConditionalDiscountSerializer(discount, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "message": "Conditional discount updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            "status": "error",
            "message": "Validation failed.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        if pk:
            discount = self.get_object(pk)
        else:
            discount = ConditionalDiscount.objects.first()
        serializer = ConditionalDiscountSerializer(discount, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "message": "Conditional discount partially updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            "status": "error",
            "message": "Validation failed.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        discount = self.get_object(pk)
        discount.delete()
        return Response({
            "status": "success",
            "message": "Conditional discount deleted successfully."
        }, status=status.HTTP_200_OK)