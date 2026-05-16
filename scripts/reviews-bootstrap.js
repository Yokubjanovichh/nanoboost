// Fetches /public/reviews and replaces the hard-coded testimonials grid.
// Renders shimmer skeletons immediately so the static markup doesn't flash
// in for the half-second before the API resolves. On failure the original
// hardcoded markup is restored — the user always sees content.

(function () {
  "use strict";

  const TESTIMONIALS_SELECTOR = ".testimonials__grid";
  const MAX_REVIEWS = 12;
  const SKELETON_COUNT = 3;

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

  function buildSkeleton() {
    return (
      '<article class="testimonial testimonial--skeleton" aria-hidden="true">' +
      '<div class="testimonial__stars testimonial__stars--skeleton skeleton"></div>' +
      '<div class="testimonial__text testimonial__text--skeleton skeleton"></div>' +
      '<div class="testimonial__author testimonial__author--skeleton skeleton"></div>' +
      "</article>"
    );
  }

  async function bootstrap() {
    const grid = document.querySelector(TESTIMONIALS_SELECTOR);
    if (!grid) return;

    // Snapshot the original markup so we can restore the hardcoded
    // testimonials if the API call fails — the user always sees content.
    const originalHtml = grid.innerHTML;
    const defsSvg = grid.querySelector("svg");
    const defsHtml = defsSvg ? defsSvg.outerHTML : "";

    // Show skeletons immediately so the user doesn't briefly see the
    // hardcoded names flash before being replaced.
    grid.innerHTML =
      defsHtml + new Array(SKELETON_COUNT).fill(buildSkeleton()).join("");

    if (!window.NB_API || typeof window.NB_API.fetchReviews !== "function") {
      grid.innerHTML = originalHtml;
      return;
    }

    try {
      const reviews = await window.NB_API.fetchReviews();
      if (!Array.isArray(reviews) || reviews.length === 0) {
        grid.innerHTML = originalHtml;
        return;
      }

      grid.innerHTML =
        defsHtml + reviews.slice(0, MAX_REVIEWS).map(buildTestimonial).join("");
    } catch (e) {
      if (console && typeof console.warn === "function") {
        console.warn("[NB] reviews bootstrap failed:", e);
      }
      grid.innerHTML = originalHtml;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
