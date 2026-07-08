from django.core.management.base import BaseCommand
from django.db.models import Sum

from orders.models import Order
from delivery.models import CollectionPayment


class Command(BaseCommand):
    help = (
        "One-time seed: create an opening collection-ledger entry for every order "
        "that has a collected_amount but no ledger rows yet. Run once after "
        "deploying Phase 2 so legacy collected amounts are preserved when agents "
        "record new payments."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Report how many orders would be seeded without writing.",
        )

    def handle(self, *args, **options):
        dry = options["dry_run"]
        seeded = 0
        rows = []

        for o in Order.objects.filter(collected_amount__gt=0):
            existing = (
                CollectionPayment.objects.filter(order=o).aggregate(s=Sum("amount"))["s"] or 0
            )
            if existing:
                continue  # already has ledger entries — skip
            seeded += 1
            if not dry:
                rows.append(
                    CollectionPayment(
                        order=o,
                        delivery_man=o.assigned_to,
                        amount=o.collected_amount,
                        note="Opening collection (seed)",
                    )
                )

        if dry:
            self.stdout.write(self.style.WARNING(f"[dry-run] {seeded} order(s) would be seeded."))
            return

        if rows:
            CollectionPayment.objects.bulk_create(rows, batch_size=500)
        self.stdout.write(self.style.SUCCESS(f"Seeded opening ledger entries for {seeded} order(s)."))
