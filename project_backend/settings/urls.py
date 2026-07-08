# urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('site_info/', SiteInfoListCreateAPIView.as_view(), name='site_info_list_create'),
    path("privacy-policy/", PrivacyPolicyListCreateAPIView.as_view(), name="privacy-policy-list-create"),
    path("privacy-policy-detail/<int:pk>/", PrivacyPolicyDetailAPIView.as_view(), name="privacy-policy-detail"),

    path("terms-conditions/", TermsAndConditionsListCreateAPIView.as_view(), name="terms-conditions-list-create"),
    path("terms-conditions-detail/<int:pk>/", TermsAndConditionsDetailAPIView.as_view(), name="terms-conditions-detail"),

    path("conditional-discounts/", ConditionalDiscountListCreateAPIView.as_view(), name="conditional-discount-list-create"),
    path("conditional-discounts-details/", ConditionalDiscountDetailAPIView.as_view(), name="conditional-discount-detail"),
    path("conditional-discounts-details/<int:pk>/", ConditionalDiscountDetailAPIView.as_view(), name="conditional-discount-detail"),

    # App update / APK distribution
    path("app-releases/", AppReleaseListCreateAPIView.as_view(), name="app-release-list-create"),
    path("app-releases/<int:pk>/", AppReleaseDetailAPIView.as_view(), name="app-release-detail"),
    path("app-update/latest/", LatestAppReleaseAPIView.as_view(), name="app-update-latest"),
]
