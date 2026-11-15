from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("anime/", views.anime_list, name="anime_list"),
    path("anime/<slug:slug>/", views.anime_detail, name="anime_detail"),
    path("anime/<slug:slug>/episode/<int:number>/", views.watch, name="watch"),
]
