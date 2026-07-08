"""Importing each module here triggers its @register decorator.

To add a new report: create a module beside these and add one import line.
"""
from . import product_wise  # noqa: F401
from . import order_report  # noqa: F401
from . import monthly_special_discount  # noqa: F401
from . import collection_summary  # noqa: F401
from . import returns_summary  # noqa: F401
from . import due_summary  # noqa: F401
from . import delivery_performance  # noqa: F401
from . import customer_balance  # noqa: F401
from . import monthly_orders  # noqa: F401
