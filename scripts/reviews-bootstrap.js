// Fetches /public/reviews and replaces the hard-coded testimonials grid.
// Mirrors the original design: 5 SVG stars (gradient-filled for the
// rated portion, white outline for the rest), avatar circle, name and
// service label. Skeletons keep the same overall shape so the layout
// doesn't jump when the API resolves.

(function () {
  "use strict";

  const TESTIMONIALS_SELECTOR = ".testimonials__grid";
  const MAX_REVIEWS = 12;
  const SKELETON_COUNT = 3;

  const STAR_PATH =
    "M12 3.6l2.66 5.38 5.94.86-4.3 4.2 1.01 5.92L12 17.17l-5.31 2.79 1.01-5.92-4.3-4.2 5.94-.86L12 3.6z";

  const PLATFORM_SHORT = { ps: "PS", xbox: "Xbox", pc: "PC" };

  function escape(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clampRating(rating) {
    return Math.max(0, Math.min(5, Math.round(Number(rating) || 5)));
  }

  function buildStars(rating) {
    const filled = clampRating(rating);
    let html = "";
    for (let i = 0; i < 5; i += 1) {
      const cls = i < filled ? ' class="is-filled"' : "";
      html +=
        '<svg viewBox="0 0 24 24"' + cls + '><path d="' + STAR_PATH + '"/></svg>';
    }
    return html;
  }

  // "GTA Online Cash + Cars Boost PS4/PS5" → "GTA Cash + Cars (PS)"
  function formatServiceLabel(svc) {
    if (!svc) return "";
    if (svc.short_label) return String(svc.short_label);
    const raw = String(svc.title || "")
      .replace(/^\s*GTA\s+Online\s+/i, "GTA ")
      .replace(/\s*(Boost\s+)?(PS4\s*\/\s*PS5|Xbox\s+One\s*\/\s*Series|PC)\s*$/i, "")
      .trim();
    const plat = PLATFORM_SHORT[(svc.platform || "").toLowerCase()] || "";
    return plat ? raw + " (" + plat + ")" : raw;
  }

  function buildTestimonial(review) {
    const author = escape(review.author_name || "Anonymous");
    const text = escape(review.text || "");
    const rating = clampRating(review.rating);
    // Backend may expose the linked service either as a nested object or
    // as flat fields; try both shapes before giving up on the line.
    const svc =
      review.service ||
      (review.service_title || review.service_platform
        ? {
            title: review.service_title,
            platform: review.service_platform,
            short_label: review.service_short_label,
          }
        : null);
    const serviceLabel = escape(formatServiceLabel(svc));

    return (
      '<article class="testimonial" role="listitem">' +
      '<div class="testimonial__stars" aria-label="' +
      rating +
      ' out of 5 stars">' +
      buildStars(rating) +
      "</div>" +
      '<p class="testimonial__text">' +
      text +
      "</p>" +
      '<div class="testimonial__user">' +
      '<span class="testimonial__avatar" aria-hidden="true"></span>' +
      '<div class="testimonial__meta">' +
      '<p class="testimonial__name">' +
      author +
      "</p>" +
      (serviceLabel
        ? '<p class="testimonial__service">' + serviceLabel + "</p>"
        : "") +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function buildSkeleton() {
    return (
      '<article class="testimonial testimonial--skeleton" aria-hidden="true">' +
      '<div class="testimonial__stars testimonial__stars--skeleton skeleton"></div>' +
      '<div class="testimonial__text testimonial__text--skeleton skeleton"></div>' +
      '<div class="testimonial__user">' +
      '<div class="testimonial__avatar testimonial__avatar--skeleton skeleton"></div>' +
      '<div class="testimonial__meta">' +
      '<div class="testimonial__name testimonial__name--skeleton skeleton"></div>' +
      '<div class="testimonial__service testimonial__service--skeleton skeleton"></div>' +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  async function bootstrap() {
    const grid = document.querySelector(TESTIMONIALS_SELECTOR);
    if (!grid) return;

    // Snapshot so we can restore the hardcoded fallback if the API fails.
    const originalHtml = grid.innerHTML;
    const defsSvg = grid.querySelector("svg");
    const defsHtml = defsSvg ? defsSvg.outerHTML : "";

    // Skeleton first — no hardcoded names flash through.
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
