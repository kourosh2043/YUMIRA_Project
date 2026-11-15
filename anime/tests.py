from django.test import TestCase
from django.urls import reverse

from .models import Anime, Episode

COMPLETED = Anime.STATUS_CHOICES[1][0]  # "تکمیل‌شده"


class YumiraTests(TestCase):
    # Loads the 8 sample anime and their episodes before every test.
    fixtures = ["sample_data.json"]

    def get_slugs(self, response):
        """Slugs of the anime shown on the archive page."""
        return [anime.slug for anime in response.context["animes"]]

    # ---------- the four pages work ----------
    def test_four_pages_return_200(self):
        urls = [
            reverse("home"),
            reverse("anime_list"),
            reverse("anime_detail", args=["terminal-nine"]),
            reverse("watch", args=["terminal-nine", 1]),
        ]
        for url in urls:
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 200)

    # ---------- wrong address gives 404 ----------
    def test_wrong_slug_or_episode_number_returns_404(self):
        urls = [
            reverse("anime_detail", args=["no-such-anime"]),
            reverse("watch", args=["no-such-anime", 1]),
            reverse("watch", args=["terminal-nine", 99]),
        ]
        for url in urls:
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 404)

    # ---------- search and filters ----------
    def test_search_by_persian_title(self):
        response = self.client.get(reverse("anime_list"), {"q": "ترمینال"})
        self.assertEqual(self.get_slugs(response), ["terminal-nine"])

    def test_search_by_english_title(self):
        # Lower case on purpose: the search ignores letter case.
        response = self.client.get(reverse("anime_list"), {"q": "starfall"})
        self.assertEqual(self.get_slugs(response), ["starfall-echo"])

    def test_detail_page_shows_genre(self):
        response = self.client.get(reverse("anime_detail", args=["moon-beneath-the-tide"]))
        self.assertContains(response, "رمانس")

    def test_genre_parameter_is_ignored(self):
        # The archive has no genre filter any more, so every anime is returned.
        response = self.client.get(reverse("anime_list"), {"genre": "رمانس"})
        self.assertEqual(len(self.get_slugs(response)), Anime.objects.count())

    def test_status_filter(self):
        response = self.client.get(reverse("anime_list"), {"status": COMPLETED})
        slugs = self.get_slugs(response)
        self.assertEqual(len(slugs), 4)
        for anime in response.context["animes"]:
            self.assertEqual(anime.status, COMPLETED)

    # ---------- previous / next buttons ----------
    def test_first_episode_has_no_previous_button(self):
        response = self.client.get(reverse("watch", args=["terminal-nine", 1]))
        self.assertIsNone(response.context["previous_episode"])
        self.assertIsNotNone(response.context["next_episode"])
        self.assertNotContains(response, "قسمت قبلی")

    def test_last_episode_has_no_next_button(self):
        response = self.client.get(reverse("watch", args=["terminal-nine", 3]))
        self.assertIsNone(response.context["next_episode"])
        self.assertIsNotNone(response.context["previous_episode"])
        self.assertNotContains(response, "قسمت بعدی")

    # ---------- anime without episodes ----------
    def test_anime_without_episodes_shows_message(self):
        Anime.objects.create(
            title="Empty Anime",
            title_fa="انیمه خالی",
            slug="empty-anime",
            release_year=2026,
            status="در حال پخش",
            anime_type="سریال",
        )
        response = self.client.get(reverse("anime_detail", args=["empty-anime"]))
        self.assertContains(response, "هنوز قسمتی برای این انیمه ثبت نشده است.")
