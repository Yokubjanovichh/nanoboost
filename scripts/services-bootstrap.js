// Single source of truth: populates window.NB_SERVICE_CONFIG and
// window.NB_GTA5_SERVICES from the live backend API. There is NO static
// fallback — if the API fails the page shows an error banner so the user
// knows to retry or contact support.
//
// On success, dispatches the "nb:services-loaded" event so consumers
// (gta5-page.js, service-page.js, …) can re-render.

(function () {
  "use strict";

  const PLATFORM_LABEL = {
    ps: "PS4/PS5",
    xbox: "Xbox One/Series",
    pc: "PC",
  };

  const PLATFORM_BUCKETS = ["ps", "xbox", "pc"];

  const ERROR_BANNER_ID = "nb-error-banner";
  const ERROR_BANNER_TEXT =
    "Ошибка загрузки данных. Обновите страницу или свяжитесь с поддержкой.";

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

  function formatOptionString(option, currency) {
    if (!option) return "";
    const label = option.label || "";
    const price =
      currency === "EUR"
        ? "€" + Number(option.price_eur || 0).toFixed(2)
        : "$" + Number(option.price_usd || 0).toFixed(2);
    return label + " - " + price;
  }

  function formatPriceNow(option, currency) {
    if (!option) return "";
    return currency === "EUR"
      ? "€" + Number(option.price_eur || 0).toFixed(2)
      : "$" + Number(option.price_usd || 0).toFixed(2);
  }

  // Convert backend Service into the legacy NB_SERVICE_CONFIG[slug] shape.
  function adaptToLegacyConfig(service) {
    const options = Array.isArray(service.options) ? service.options : [];
    const defaultOpt = pickDefaultOption(options);
    const platformKey = (service.platform || "").toLowerCase();
    return {
      seoTitle: service.seo_title || "",
      seoDescription: service.seo_description || "",
      titleHtml: service.title || "",
      imageSrcDesktop:
        service.image_desktop_url || service.image_url || "",
      imageSrcMobile: service.image_mobile_url || "",
      imageAlt: service.image_alt || "",
      platform: PLATFORM_LABEL[platformKey] || service.platform || "",
      options: options.map(function (o) {
        return formatOptionString(o, "USD");
      }),
      eurOptions: options.map(function (o) {
        return formatOptionString(o, "EUR");
      }),
      defaultOption: defaultOpt ? formatOptionString(defaultOpt, "USD") : "",
      description: Array.isArray(service.description) ? service.description : [],
      whatYouGet: Array.isArray(service.what_you_get) ? service.what_you_get : [],
      sections: Array.isArray(service.sections) ? service.sections : [],
      // Raw fields kept so checkout can build POST payloads without re-fetching.
      slug: service.slug || "",
      optionsRaw: options,
    };
  }

  // Convert backend Service into the legacy NB_GTA5_SERVICES[platform][] entry.
  function adaptToLegacySummary(service) {
    const defaultOpt = pickDefaultOption(service.options);
    return {
      serviceParam: service.slug,
      imageSrc:
        service.image_desktop_url || service.image_url || "",
      imageSrcDesktop:
        service.image_desktop_url || service.image_url || "",
      imageSrcMobile: service.image_mobile_url || "",
      imageAlt: service.image_alt || "",
      title: stripHtml(service.title || ""),
      priceNow: formatPriceNow(defaultOpt, "USD"),
      eurPriceNow: formatPriceNow(defaultOpt, "EUR"),
    };
  }

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

    try {
      const services = await window.NB_API.fetchServices();
      if (!Array.isArray(services) || services.length === 0) {
        showLoadError("services list is empty");
        return;
      }

      const config = {};
      const buckets = PLATFORM_BUCKETS.reduce(function (acc, key) {
        acc[key] = [];
        return acc;
      }, {});

      services.forEach(function (service) {
        if (!service || !service.slug) return;
        config[service.slug] = adaptToLegacyConfig(service);
        const platformKey = (service.platform || "").toLowerCase();
        if (buckets[platformKey]) {
          buckets[platformKey].push(adaptToLegacySummary(service));
        }
      });

      window.NB_SERVICE_CONFIG = config;
      window.NB_GTA5_SERVICES = buckets;

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
