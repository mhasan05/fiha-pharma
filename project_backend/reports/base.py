"""
Extensible report framework.

Add a new report by creating a class in ``reports/definitions/`` that subclasses
``BaseReport``, sets a unique ``name`` and implements ``generate()``, then decorate
it with ``@register`` and import it in ``reports/definitions/__init__.py``.

No new view or URL is needed — the generic dispatcher serves every registered
report at ``/reports/<name>/`` and lists them at ``/reports/``.
"""
from abc import ABC, abstractmethod

# name -> report class
REPORT_REGISTRY = {}


def register(report_cls):
    """Class decorator that adds a report to the registry."""
    name = getattr(report_cls, "name", None)
    if not name:
        raise ValueError(f"{report_cls.__name__} must define a unique `name`.")
    if name in REPORT_REGISTRY:
        raise ValueError(f"Duplicate report name '{name}'.")
    REPORT_REGISTRY[name] = report_cls
    return report_cls


def get_report(name):
    return REPORT_REGISTRY.get(name)


class BaseReport(ABC):
    """Base class for all reports.

    Subclasses set:
      name        -> URL slug (e.g. "product_wise"), must be unique
      title       -> human-readable title
      description -> short description (shown in the report index)
    and implement ``generate()`` returning a JSON-serializable dict, typically
    ``{"summary": {...}, "data": [...]}``.
    """

    name: str = None
    title: str = ""
    description: str = ""
    admin_only: bool = False  # if True, only admin/staff may run it

    def __init__(self, request):
        self.request = request
        self.params = request.query_params

    @abstractmethod
    def generate(self) -> dict:
        raise NotImplementedError
