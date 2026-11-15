from django.db.models import Q
from django.shortcuts import get_object_or_404, render

from .models import Anime, Episode

# Fixed option list for the archive filter form
STATUSES = ["در حال پخش", "تکمیل‌شده"]


def home(request):
    # Featured: newest release years first. Latest: most recently added.
    featured = Anime.objects.order_by("-release_year", "id")[:4]
    latest = Anime.objects.order_by("-id")[:4]
    return render(request, "home.html", {"featured": featured, "latest": latest})


def anime_list(request):
    search = request.GET.get("q", "").strip()
    status = request.GET.get("status", "")

    animes = Anime.objects.order_by("-id")
    if search:
        animes = animes.filter(Q(title__icontains=search) | Q(title_fa__icontains=search))
    if status:
        animes = animes.filter(status=status)

    context = {
        "animes": animes,
        "search": search,
        "status": status,
        "statuses": STATUSES,
    }
    return render(request, "anime_list.html", context)


def anime_detail(request, slug):
    anime = get_object_or_404(Anime, slug=slug)
    episodes = anime.episodes.all()
    return render(request, "anime_detail.html", {"anime": anime, "episodes": episodes})


def watch(request, slug, number):
    anime = get_object_or_404(Anime, slug=slug)
    episode = get_object_or_404(Episode, anime=anime, number=number)
    # Nearest existing episode before and after this one (None if there is none)
    previous_episode = anime.episodes.filter(number__lt=number).order_by("-number").first()
    next_episode = anime.episodes.filter(number__gt=number).order_by("number").first()
    context = {
        "anime": anime,
        "episode": episode,
        "previous_episode": previous_episode,
        "next_episode": next_episode,
    }
    return render(request, "watch.html", context)
