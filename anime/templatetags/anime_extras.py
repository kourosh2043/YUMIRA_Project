from django import template

register = template.Library()

PERSIAN_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


@register.filter
def fa_digits(value):
    """Show numbers with Persian digits (2024 -> ۲۰۲۴), as in the original design."""
    return str(value).translate(PERSIAN_DIGITS)


# Dark purple/blue/indigo color pairs for posters and banners without an image.
# Each pair is (top color, bottom color). With the sample data, anime id 1..8
# gets the same colors the original design used.
POSTER_COLORS = [
    ("#6a2aa0", "#0a1226"),
    ("#3a2a8a", "#070a14"),
    ("#7a2a70", "#1a0f2e"),
    ("#4a1fa8", "#0c1030"),
    ("#0e5a68", "#0c1030"),
    ("#123a6b", "#0a0f26"),
    ("#2a3a9a", "#1a0a36"),
    ("#1f2f6b", "#14091f"),
]


@register.filter
def poster_style(anime):
    """Pick a color pair from the anime id, for use as style="{{ anime|poster_style }}"."""
    color_a, color_b = POSTER_COLORS[(anime.id - 1) % len(POSTER_COLORS)]
    return f"--poster-a: {color_a}; --poster-b: {color_b};"
