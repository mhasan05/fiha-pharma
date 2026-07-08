from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("settings", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TermsAndConditions",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(default="Terms & Conditions", max_length=255)),
                ("content", models.TextField()),
                ("is_active", models.BooleanField(default=True)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("updated_on", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name_plural": "Terms & Conditions",
                "db_table": "terms_and_conditions",
                "ordering": ["-created_on"],
            },
        ),
    ]
