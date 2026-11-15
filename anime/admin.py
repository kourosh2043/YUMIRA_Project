from django.contrib import admin

from .models import Anime, Episode


class EpisodeInline(admin.TabularInline):
    model = Episode
    extra = 1


@admin.register(Anime)
class AnimeAdmin(admin.ModelAdmin):
    list_display = ("title_fa", "title", "release_year", "status", "anime_type")
    list_filter = ("status", "anime_type")
    search_fields = ("title", "title_fa")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [EpisodeInline]


@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = ("anime", "number", "title")
    list_filter = ("anime",)
    search_fields = ("title", "anime__title", "anime__title_fa")
