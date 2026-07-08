from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .base import REPORT_REGISTRY, get_report


class ReportIndexView(APIView):
    """GET /reports/ -> list of available reports (for dynamic menus/UIs)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_admin = request.user.is_superuser or request.user.is_staff
        data = [
            {"name": cls.name, "title": cls.title, "description": cls.description}
            for cls in REPORT_REGISTRY.values()
            if is_admin or not getattr(cls, "admin_only", False)
        ]
        return Response({"status": "success", "data": data}, status=status.HTTP_200_OK)


class ReportView(APIView):
    """GET /reports/<report_name>/ -> runs the matching registered report."""
    permission_classes = [IsAuthenticated]

    def get(self, request, report_name):
        report_cls = get_report(report_name)
        if report_cls is None:
            return Response(
                {"status": "error", "message": f"Unknown report '{report_name}'."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if getattr(report_cls, "admin_only", False) and not (
            request.user.is_superuser or request.user.is_staff
        ):
            return Response(
                {"status": "error", "message": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            payload = report_cls(request).generate()
            return Response({"status": "success", **payload}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"status": "error", "message": f"Something went wrong: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
