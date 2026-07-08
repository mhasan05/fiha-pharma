from django.db import migrations, models


class Migration(migrations.Migration):
    """Merges the two 0002 leaves (the server-generated AppRelease/SiteInfo
    migration and the hand-written TermsAndConditions one) and adds the `app`
    column to AppRelease so releases can target the Shop app (bdm) or the Rider
    app (da). Defaults to 'bdm' so existing rows/clients are unaffected."""

    dependencies = [
        ("settings", "0002_apprelease_siteinfomodel_maintenance_message_and_more"),
        ("settings", "0002_termsandconditions"),
    ]

    operations = [
        migrations.AddField(
            model_name="apprelease",
            name="app",
            field=models.CharField(
                choices=[("bdm", "BDM (Shop app)"), ("da", "Delivery Assist (Rider app)")],
                default="bdm",
                help_text="Which mobile app this release is for.",
                max_length=10,
            ),
        ),
    ]
