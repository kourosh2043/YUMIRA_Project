import re

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path

from .media_views import serve_media

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("anime.urls")),
]

# Uploaded files (posters, banners, videos) are served by Django only while testing.
# serve_media replaces static() because it supports HTTP Range, which video seeking needs.
if settings.DEBUG:
    urlpatterns += [
        re_path(r"^%s(?P<path>.*)$" % re.escape(settings.MEDIA_URL.lstrip("/")), serve_media),
    ]
