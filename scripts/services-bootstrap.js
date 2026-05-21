// Single source of truth: populates window.NB_SERVICE_CONFIG and
// window.NB_GTA5_SERVICES from the live backend API. There is NO static
// fallback — if the API fails the page shows an error banner so the user
// knows to retry or contact support.
//
// On success, dispatches the "nb:services-loaded" event so consumers
// (gta5-page.js, service-page.js, …) can re-render.

(function () {
  "use strict";

  const PLATFORM_BUCKETS = ["ps", "xbox", "pc"];

  const ERROR_BANNER_ID = "nb-error-banner";
  const ERROR_BANNER_TEXT =
    "Failed to load data. Please refresh the page or contact support.";

  const API_ORIGIN = (function () {
    try {
      const base = window.NB_PUBLIC_API_URL || "";
      return base ? new URL(base).origin : "";
    } catch (_) {
      return "";
    }
  })();

  function absolutizeBackendUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (path.indexOf("/uploads/") === 0 && API_ORIGIN) return API_ORIGIN + path;
    return path;
  }

  function stripHtml(html) {
    if (typeof html !== "string") return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || "").trim();
  }

  function pickDefaultOption(options) {
    if (!Array.isArray(options) || options.length === 0) return null;
    return options.find(function (o) {
      return o && o.is_default;
    }) || options[0];
  }

  function formatPriceNow(option, currency) {
    if (!option) return "";
    return currency === "EUR"
      ? "€" + Number(option.price_eur || 0).toFixed(2)
      : "$" + Number(option.price_usd || 0).toFixed(2);
  }

  // Delegates to the shared NB_API.adaptService so service-page.js can
  // hydrate a single service via /public/services/{slug} using the same
  // shape (DRY across consumers).
  function adaptToLegacyConfig(service) {
    return window.NB_API.adaptService(service);
  }

  // Convert backend Service into the legacy NB_GTA5_SERVICES[platform][] entry.
  function adaptToLegacySummary(service) {
    const defaultOpt = pickDefaultOption(service.options);
    return {
      serviceParam: service.slug,
      imageSrc: absolutizeBackendUrl(
        service.image_desktop_url || service.image_url || "",
      ),
      imageSrcDesktop: absolutizeBackendUrl(
        service.image_desktop_url || service.image_url || "",
      ),
      imageSrcMobile: absolutizeBackendUrl(service.image_mobile_url || ""),
      imageAlt: service.image_alt || "",
      title: stripHtml(service.title || ""),
      priceNow: formatPriceNow(defaultOpt, "USD"),
      eurPriceNow: formatPriceNow(defaultOpt, "EUR"),
    };
  }

  // ---- "Hot right now" homepage grid -------------------------------

  const HOT_GRID_SELECTOR = "#hot-services-grid";
  const HOT_LIMIT = 4;

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const HOT_SKELETON_CARD =
    '<article class="service-card service-card--skeleton" aria-hidden="true">' +
    '<div class="service-card__img service-card__img--skeleton skeleton"></div>' +
    '<div class="service-card__content">' +
    '<div class="service-card__name service-card__name--skeleton skeleton"></div>' +
    '<div class="service-card__price service-card__price--skeleton skeleton"></div>' +
    '<div class="service-card__btn service-card__btn--skeleton skeleton"></div>' +
    "</div>" +
    "</article>";

  // "Need a custom service?" conversion card appended after the four
  // featured tiles on every Hot Right Now grid. Owned by the script
  // (single source of truth) so a new page only needs <div id="hot-
  // services-grid"> to get the same CTA — no HTML duplication. Uses
  // an absolute /pages/contact.html so it resolves from any directory.
  const HOT_CUSTOM_CARD =
    '<article class="service-card service-card--custom">' +
    '<div class="service-card__content service-card__content--custom">' +
    '<h3 class="service-card__name service-card__name--custom">' +
    "NEED A CUSTOM SERVICE?" +
    "</h3>" +
    '<p class="service-card__text">' +
    "Tell our support team exactly what you want - we'll build a " +
    "personalized order around your goals." +
    "</p>" +
    '<a href="/pages/contact.html" class="service-card__btn service-card__btn--custom">' +
    "CONTACT SUPPORT" +
    "</a>" +
    "</div>" +
    "</article>";

  function paintHotSkeletons() {
    const grid = document.querySelector(HOT_GRID_SELECTOR);
    if (!grid) return;
    grid.innerHTML = HOT_SKELETON_CARD.repeat(HOT_LIMIT) + HOT_CUSTOM_CARD;
  }

  function buildHotServiceCard(service) {
    const opt =
      (Array.isArray(service.options) && service.options[0]) || {};
    const usd = Number(opt.price_usd || 0);
    const eur = Number(opt.price_eur || 0);
    const slug = escapeHtml(service.slug || "");
    // Title is rendered as-is from admin — no game-prefix stripping,
    // no platform-suffix stripping. The services-list-page style
    // ("Cayo Perico Heist Pack PS4/PS5") is the source of truth.
    const title = escapeHtml(
      String(service.title || "").replace(/<br\s*\/?>/g, " "),
    );
    const desk = escapeHtml(
      absolutizeBackendUrl(service.image_desktop_url || service.image_url || ""),
    );
    const mob = escapeHtml(
      absolutizeBackendUrl(
        service.image_mobile_url ||
          service.image_desktop_url ||
          service.image_url ||
          "",
      ),
    );
    const alt = escapeHtml(service.image_alt || title);
    const ariaLabel = escapeHtml("View " + title.replace(/&[^;]+;/g, "") + " service");
    // The whole card is an <a> so the entire tile is tappable on
    // phones. BUY NOW degrades to a <span> styled like the button —
    // it can't be a nested <a> (invalid HTML) and clicking anywhere
    // on the card already triggers the parent link.
    return (
      '<a class="service-card service-card--link" href="./pages/services.html?service=' +
      slug +
      '" data-service="' +
      slug +
      '" aria-label="' +
      ariaLabel +
      '">' +
      "<picture>" +
      '<source media="(max-width: 640px)" srcset="' +
      mob +
      '">' +
      '<img class="service-card__img" src="' +
      desk +
      '" alt="' +
      alt +
      '" width="1600" height="1300" loading="lazy">' +
      "</picture>" +
      '<div class="service-card__content">' +
      '<h3 class="service-card__name">' +
      title +
      "</h3>" +
      '<p class="service-card__price">' +
      '<span class="service-card__from">From</span>' +
      '<span class="service-card__amount" data-usd="' +
      usd.toFixed(2) +
      '" data-eur="' +
      eur.toFixed(2) +
      '">$' +
      usd.toFixed(2) +
      "</span>" +
      "</p>" +
      '<span class="service-card__btn">BUY NOW</span>' +
      "</div>" +
      "</a>"
    );
  }

  function syncHotPrices() {
    const isEur = window.nbGetCurrency && window.nbGetCurrency() === "EUR";
    document
      .querySelectorAll(HOT_GRID_SELECTOR + " .service-card__amount[data-usd]")
      .forEach(function (el) {
        const usd = parseFloat(el.dataset.usd);
        const eur = parseFloat(el.dataset.eur);
        if (isEur && !Number.isNaN(eur)) {
          el.textContent = "€" + eur.toFixed(2);
        } else if (window.nbFormatPrice) {
          el.textContent = window.nbFormatPrice(usd);
        } else {
          el.textContent = "$" + (Number.isNaN(usd) ? "0.00" : usd.toFixed(2));
        }
      });
  }

  function renderHotServices(services) {
    const grid = document.querySelector(HOT_GRID_SELECTOR);
    if (!grid) return;
    const hot = services.slice(0, HOT_LIMIT);
    grid.innerHTML = hot.map(buildHotServiceCard).join("") + HOT_CUSTOM_CARD;
    syncHotPrices();
    trackHotListView(hot);
  }

  // "Hot right now" used to be `bulkServices.slice(0, 4)` which gave the
  // first four services on the page no curator control. Now we fetch
  // /public/services?featured=true so the admin's "Избранная" toggle is
  // the source of truth. Three fallbacks keep the grid populated:
  //   1) featured returns empty   → first 4 of the bulk list
  //   2) featured request errors  → first 4 of the bulk list
  //   3) featured not supported   → same fallback (request still returns)
  async function bootstrapHotServices(bulkServices) {
    const grid = document.querySelector(HOT_GRID_SELECTOR);
    if (!grid) return;
    try {
      const featured = await window.NB_API.fetchServices({ featured: "true" });
      if (Array.isArray(featured) && featured.length > 0) {
        renderHotServices(featured);
        return;
      }
      if (console && typeof console.info === "function") {
        console.info(
          "[NB] no featured services configured, falling back to first " +
            HOT_LIMIT,
        );
      }
    } catch (err) {
      if (console && typeof console.warn === "function") {
        console.warn(
          "[NB] featured services request failed, falling back to first " +
            HOT_LIMIT,
          err,
        );
      }
    }
    renderHotServices(bulkServices);
  }

  function trackHotListView(hot) {
    if (typeof window.nbTrack !== "function") return;
    window.nbTrack("view_item_list", {
      item_list_id: "hot_right_now",
      item_list_name: "Hot Right Now",
      items: hot.map(function (s, i) {
        const opt =
          (Array.isArray(s.options) && s.options[0]) || {};
        return {
          item_id: s.slug || "",
          item_name: String(s.title || "").replace(/<br\s*\/?>/g, " "),
          item_category: (s.platform || "").toLowerCase(),
          index: i,
          price: Number(opt.price_usd || 0),
        };
      }),
    });
  }

  document.addEventListener("nb:currency-change", syncHotPrices);

  // -------------------------------------------------------------------

  function showLoadError(msg) {
    if (document.getElementById(ERROR_BANNER_ID)) return;
    const banner = document.createElement("div");
    banner.id = ERROR_BANNER_ID;
    banner.className = "nb-error-banner";
    banner.setAttribute("role", "alert");
    banner.textContent = ERROR_BANNER_TEXT;
    if (msg && console && typeof console.error === "function") {
      console.error("[NB] services bootstrap error:", msg);
    }
    if (document.body) {
      document.body.prepend(banner);
    }
  }

  async function bootstrapServices() {
    if (!window.NB_API || typeof window.NB_API.fetchServices !== "function") {
      showLoadError("api-client.js not loaded");
      return;
    }
    paintHotSkeletons();

    try {
      const services = await window.NB_API.fetchServices();
      if (!Array.isArray(services) || services.length === 0) {
        showLoadError("services list is empty");
        return;
      }

      const config = {};
      const byGame = {};
      const emptyBuckets = function () {
        return PLATFORM_BUCKETS.reduce(function (acc, key) {
          acc[key] = [];
          return acc;
        }, {});
      };

      services.forEach(function (service) {
        if (!service || !service.slug) return;
        config[service.slug] = adaptToLegacyConfig(service);
        const platformKey = (service.platform || "").toLowerCase();
        // Service is linked to a game either by `game_slug` (preferred,
        // backend Phase 5+) or by a nested `game` object. Fall back to
        // "gta5" so older payloads keep populating the gta5 bucket.
        const gameSlug = (
          service.game_slug ||
          (service.game && service.game.slug) ||
          "gta5"
        ).toLowerCase();
        if (!byGame[gameSlug]) byGame[gameSlug] = emptyBuckets();
        if (byGame[gameSlug][platformKey]) {
          byGame[gameSlug][platformKey].push(adaptToLegacySummary(service));
        }
      });

      window.NB_SERVICE_CONFIG = config;
      window.NB_SERVICES_BY_GAME = byGame;
      // Backward-compat alias for gta5-page.js consumers still in flight.
      window.NB_GTA5_SERVICES = byGame.gta5 || emptyBuckets();

      // Kick off the featured fetch but don't block the rest of the
      // bootstrap (NB_SERVICE_CONFIG and nb:services-loaded shouldn't
      // wait on the smaller request).
      bootstrapHotServices(services);

      window.dispatchEvent(
        new CustomEvent("nb:services-loaded", {
          detail: { count: services.length, source: "api" },
        }),
      );
    } catch (err) {
      showLoadError(err && err.message ? err.message : String(err));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapServices, {
      once: true,
    });
  } else {
    bootstrapServices();
  }
})();
