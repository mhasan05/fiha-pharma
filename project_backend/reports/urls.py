from django.urls import path
from .views import ReportIndexView, ReportView

urlpatterns = [
    path('', ReportIndexView.as_view(), name='report_index'),
    path('<str:report_name>/', ReportView.as_view(), name='report_detail'),
]
