// YUMIRA — main.js
// Mobile menu, archive filters, and the motion effects (header, card reveal, card tilt, hero parallax).

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

// ---------- 2. Archive filters ----------
// Searching and filtering is done by Django (GET form).
// The only job here: send the form when a select box changes.
const filterForm = document.querySelector("#filter-form");

if (filterForm) {
  filterForm.querySelectorAll("select").forEach(function (select) {
    select.addEventListener("change", function () {
      filterForm.submit();
    });
  });
}

// ---------- 3. Motion effects ----------
// Mouse effects only run on devices with a real mouse and when the person
// has not asked the system to reduce motion.
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Header: shadow after scrolling and a thin progress line (--scroll goes from 0 to 1)
const siteHeader = document.querySelector(".site-header");
if (siteHeader) {
  let scrollTicking = false;
  const updateHeader = function () {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    siteHeader.style.setProperty("--scroll", progress.toFixed(4));
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
    scrollTicking = false;
  };
  window.addEventListener("scroll", function () {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateHeader);
    }
  }, { passive: true });
  updateHeader();
}

const animeCards = document.querySelectorAll(".anime-card");

// Cards rise in one after another when they scroll into view
if ("IntersectionObserver" in window) {
  document.querySelectorAll(".anime-grid").forEach(function (grid) {
    grid.querySelectorAll(".anime-card").forEach(function (card, index) {
      card.style.setProperty("--i", index % 4);
    });
  });
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
  animeCards.forEach(function (card) { revealObserver.observe(card); });
} else {
  animeCards.forEach(function (card) { card.classList.add("is-visible"); });
}

// Cards tilt toward the mouse and a light follows the cursor
if (canHover && !reduceMotion) {
  animeCards.forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      card.classList.add("is-tilting");
      card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      card.style.setProperty("--ry", ((x - 0.5) * 9).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y) * 7).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", function () {
      card.classList.remove("is-tilting");
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
    });
  });
}

// Hero glyph drifts slightly with the mouse
const heroSection = document.querySelector(".hero");
if (heroSection && canHover && !reduceMotion) {
  heroSection.addEventListener("pointermove", function (event) {
    const box = heroSection.getBoundingClientRect();
    heroSection.style.setProperty("--px", ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
    heroSection.style.setProperty("--py", ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
  });
  heroSection.addEventListener("pointerleave", function () {
    heroSection.style.setProperty("--px", 0);
    heroSection.style.setProperty("--py", 0);
  });
}
