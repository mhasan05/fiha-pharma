from django.db import migrations, models


class Migration(migrations.Migration):
    """Adds SiteInfoModel.whatsapp_number for the app's 'Order on WhatsApp' button."""

    dependencies = [
        ("settings", "0003_apprelease_app"),
    ]

    operations = [
        migrations.AddField(
            model_name="siteinfomodel",
            name="whatsapp_number",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
    ]
