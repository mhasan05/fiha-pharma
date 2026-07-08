from django.db import migrations, models


class Migration(migrations.Migration):
    """Adds shop GPS location (latitude/longitude) to UserAuth so the delivery
    man can navigate to the exact shop pin."""

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="userauth",
            name="latitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="userauth",
            name="longitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
    ]
