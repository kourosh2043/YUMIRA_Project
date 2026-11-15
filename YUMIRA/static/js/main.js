// YUMIRA — main.js
// Two small features: the mobile menu and the archive search/filter.

// ---------- 1. Mobile menu ----------
const menuButton = document.querySelector("#menu-button");
const siteNav = document.querySelector("#site-nav");

if (menuButton && siteNav) {
  menuButton.addEventListener("click", function () {
    const isOpen = siteNav.classList.toggle("is-open");
    menuButton.classList.toggle("is-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

// ---------- 2. Archive search and filters ----------
// Works only on the cards that are already in the page (sample data).
// Each card has data-title-fa, data-title-en, data-genres and data-status.
const filterForm = document.querySelector("#filter-form");

if (filterForm) {
  const searchInput = document.querySelector("#search-input");
  const genreSelect = document.querySelector("#genre-select");
  const statusSelect = document.querySelector("#status-select");
  const clearButton = document.querySelector("#clear-filters");
  const cards = document.querySelectorAll("#anime-grid .anime-card");
  const noResults = document.querySelector("#no-results");
  const resultsCount = document.querySelector("#results-count");

  // Make Arabic and Persian letters equal, ignore case and half-spaces
  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/\u200c/g, " ")
      .trim();
  }

  function applyFilters() {
    const query = normalize(searchInput.value);
    const genre = genreSelect.value;
    const status = statusSelect.value;
    let visibleCount = 0;

    cards.forEach(function (card) {
      const titles = normalize(card.dataset.titleFa + " " + card.dataset.titleEn);
      const cardGenres = card.dataset.genres.split(",");

      const matchesSearch = titles.includes(query);
      const matchesGenre = genre === "" || cardGenres.includes(genre);
      const matchesStatus = status === "" || card.dataset.status === status;
      const isVisible = matchesSearch && matchesGenre && matchesStatus;

      card.hidden = !isVisible;
      if (isVisible) {
        visibleCount += 1;
      }
    });

    noResults.hidden = visibleCount > 0;
    resultsCount.textContent =
      visibleCount.toLocaleString("fa-IR") + " انیمه نمایش داده می‌شود";
  }

  function clearFilters() {
    searchInput.value = "";
    genreSelect.value = "";
    statusSelect.value = "";
    applyFilters();
  }

  searchInput.addEventListener("input", applyFilters);
  genreSelect.addEventListener("change", applyFilters);
  statusSelect.addEventListener("change", applyFilters);
  clearButton.addEventListener("click", clearFilters);

  // Pressing Enter in the search box should not reload the page
  filterForm.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  applyFilters();
}
