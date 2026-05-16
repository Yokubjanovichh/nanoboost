// Fetches /public/reviews and replaces the hard-coded testimonials grid.
// If the API call fails (offline, CORS, 500, …) the static markup stays
// in place — the user keeps seeing testimonials either way.

(function () {
  "use strict";

  const TESTIMONIALS_SELECTOR = ".testimonials__grid";
  const MAX_REVIEWS = 12;

  function stars(rating) {
    const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 5)));
    return "★".repeat(r) + "☆".repeat(5 - r);
  }

  function escape(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildTestimonial(review) {
    const author = escape(review.author_name || "Anonymous");
    const text = escape(review.text || "");
    const rating = Number(review.rating) || 5;
    return (
      '<article class="testimonial" role="listitem">' +
      '<div class="testimonial__stars" aria-label="' +
      rating +
      ' stars">' +
      stars(rating) +
      "</div>" +
      '<p class="testimonial__text">' +
      text +
      "</p>" +
      '<p class="testimonial__author">' +
      author +
      "</p>" +
      "</article>"
    );
  }

  async function bootstrap() {
    const grid = document.querySelector(TESTIMONIALS_SELECTOR);
    if (!grid) return;
    if (!window.NB_API || typeof window.NB_API.fetchReviews !== "function") {
      return;
    }

    try {
      const reviews = await window.NB_API.fetchReviews();
      if (!Array.isArray(reviews) || reviews.length === 0) return;

      // Preserve the SVG gradient <defs> so other elements on the page
      // that may reference it keep rendering after replacement.
      const defsSvg = grid.querySelector("svg");
      const defsHtml = defsSvg ? defsSvg.outerHTML : "";

      grid.innerHTML =
        defsHtml + reviews.slice(0, MAX_REVIEWS).map(buildTestimonial).join("");
    } catch (e) {
      if (console && typeof console.warn === "function") {
        console.warn("[NB] reviews bootstrap failed:", e);
      }
      // Static testimonials remain — graceful fallback.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
