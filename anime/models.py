from django.db import models


class Anime(models.Model):
    STATUS_CHOICES = [
        ("در حال پخش", "در حال پخش"),
        ("تکمیل‌شده", "تکمیل‌شده"),
    ]
    TYPE_CHOICES = [
        ("سریال", "سریال"),
        ("فیلم", "فیلم"),
        ("OVA", "OVA"),
    ]

    title = models.CharField(max_length=200)  # original English title
    title_fa = models.CharField(max_length=200)  # Persian title
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    poster = models.ImageField(upload_to="posters/", blank=True)
    banner = models.ImageField(upload_to="banners/", blank=True)
    # Genres separated by commas, for example: اکشن,فانتزی
    genres = models.CharField(max_length=200, blank=True)
    release_year = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    anime_type = models.CharField(max_length=20, choices=TYPE_CHOICES)

    def __str__(self):
        return self.title_fa

    def genre_list(self):
        return [genre.strip() for genre in self.genres.split(",") if genre.strip()]


class Episode(models.Model):
    anime = models.ForeignKey(Anime, on_delete=models.CASCADE, related_name="episodes")
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    # One video file per episode. Blank is allowed so sample episodes can exist without a video.
    video_file = models.FileField(upload_to="episodes/", blank=True)

    class Meta:
        ordering = ["number"]
        constraints = [
            models.UniqueConstraint(fields=["anime", "number"], name="unique_episode_number_per_anime"),
        ]

    def __str__(self):
        return f"{self.anime.title_fa} - EP {self.number:02d}"
