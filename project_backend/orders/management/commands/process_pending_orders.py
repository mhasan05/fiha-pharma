from django.core.management.base import BaseCommand
from django.utils.timezone import now

from orders.models import Order


class Command(BaseCommand):
    help = "Move every 'pending' order to 'processing'. Intended to run daily at 10 AM via a systemd timer."

    def handle(self, *args, **options):
        # .update() runs a single bulk SQL UPDATE (fast, no per-row save()).
        # Order.save() only generates invoice numbers for new orders, so it is
        # safe to bypass here — these orders already have invoice numbers.
        updated = Order.objects.filter(order_status="pending").update(
            order_status="processing",
            updated_on=now(),
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"[{now():%Y-%m-%d %H:%M:%S}] Moved {updated} pending order(s) to processing."
            )
        )
