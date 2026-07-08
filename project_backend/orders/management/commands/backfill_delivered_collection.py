from django.core.management.base import BaseCommand
from django.db.models import F

from orders.models import Order


class Command(BaseCommand):
    help = (
        "One-time backfill: mark every DELIVERED order as fully collected "
        "(collected_amount = total_amount, due_amount = 0)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show how many orders would change without writing.",
        )

    def handle(self, *args, **options):
        delivered = Order.objects.filter(order_status="delivered")
        count = delivered.count()

        if options["dry_run"]:
            self.stdout.write(
                self.style.WARNING(f"[dry-run] {count} delivered order(s) would be set to fully collected.")
            )
            return

        # Single bulk UPDATE: collection = total, due = 0 (total - total).
        updated = delivered.update(collected_amount=F("total_amount"), due_amount=0)
        self.stdout.write(
            self.style.SUCCESS(
                f"Updated {updated} delivered order(s): collected_amount = total_amount, due_amount = 0."
            )
        )
