from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Anime",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("title_fa", models.CharField(max_length=200)),
                ("slug", models.SlugField(unique=True)),
                ("description", models.TextField(blank=True)),
                ("poster", models.ImageField(blank=True, upload_to="posters/")),
                ("banner", models.ImageField(blank=True, upload_to="banners/")),
                ("genres", models.CharField(blank=True, max_length=200)),
                ("release_year", models.PositiveSmallIntegerField()),
                (
                    "status",
                    models.CharField(
                        choices=[("در حال پخش", "در حال پخش"), ("تکمیل‌شده", "تکمیل‌شده")],
                        max_length=20,
                    ),
                ),
                (
                    "anime_type",
                    models.CharField(
                        choices=[("سریال", "سریال"), ("فیلم", "فیلم"), ("OVA", "OVA")],
                        max_length=20,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Episode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("number", models.PositiveIntegerField()),
                ("title", models.CharField(max_length=200)),
                ("video_file", models.FileField(blank=True, upload_to="episodes/")),
                (
                    "anime",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="episodes",
                        to="anime.anime",
                    ),
                ),
            ],
            options={
                "ordering": ["number"],
            },
        ),
        migrations.AddConstraint(
            model_name="episode",
            constraint=models.UniqueConstraint(
                fields=("anime", "number"), name="unique_episode_number_per_anime"
            ),
        ),
    ]
