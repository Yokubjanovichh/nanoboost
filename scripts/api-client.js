// Public API helpers for nanoboost.io.
// Reads window.NB_PUBLIC_API_URL (set by build.js or HTML head),
// falls back to the production Railway URL.

(function () {
  "use strict";

  const DEFAULT_BASE = "https://nanoboost-api-production.up.railway.app/api/v1";
  const API_BASE = window.NB_PUBLIC_API_URL || DEFAULT_BASE;
  const CACHE_TTL_MS = 60 * 1000;
  const cache = new Map();

  function cacheKey(path, params) {
    return path + "?" + new URLSearchParams(params || {}).toString();
  }

  function buildUrl(path, params) {
    const qs =
      params && Object.keys(params).length
        ? "?" + new URLSearchParams(params).toString()
        : "";
    return API_BASE + path + qs;
  }

  async function request(path, params) {
    const key = cacheKey(path, params);
    const hit = cache.get(key);
    const now = Date.now();
    if (hit && now - hit.ts < CACHE_TTL_MS) {
      return hit.data;
    }

    const res = await fetch(buildUrl(path, params), {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
    });

    if (!res.ok) {
      const err = new Error("HTTP " + res.status + " for " + path);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    cache.set(key, { ts: now, data });
    return data;
  }

  async function postRequest(path, body) {
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "omit",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) {
      const err = new Error(data.detail || data.message || "HTTP " + res.status);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function unwrap(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    return payload;
  }

  // ---- Service shape adapter -----------------------------------------
  // Converts a backend Service payload into the legacy NB_SERVICE_CONFIG
  // shape that services-bootstrap.js and service-page.js both consume.
  // Kept here (not inside services-bootstrap) so service-page can hydrate
  // a single service from /public/services/{slug} without depending on
  // the bulk-list bootstrap finishing first.

  const PLATFORM_LABEL = {
    ps: "PS4/PS5",
    xbox: "Xbox One/Series",
    pc: "PC",
  };

  const API_ORIGIN = (function () {
    try {
      return API_BASE ? new URL(API_BASE).origin : "";
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
    return (
      options.find(function (o) {
        return o && o.is_default;
      }) || options[0]
    );
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

  function adaptService(service) {
    if (!service || typeof service !== "object") return null;
    const options = Array.isArray(service.options) ? service.options : [];
    const defaultOpt = pickDefaultOption(options);
    const platformKey = (service.platform || "").toLowerCase();
    return {
      seoTitle: service.seo_title || "",
      seoDescription: service.seo_description || "",
      titleHtml: service.title || "",
      imageSrcDesktop: absolutizeBackendUrl(
        service.image_desktop_url || service.image_url || "",
      ),
      imageSrcMobile: absolutizeBackendUrl(service.image_mobile_url || ""),
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
      slug: service.slug || "",
      optionsRaw: options,
      gameSlug: String(
        service.game_slug || (service.game && service.game.slug) || "",
      ).toLowerCase(),
      gameName: String(
        (service.game && service.game.name) || service.game_name || "",
      ),
    };
  }

  window.NB_API = {
    fetchGames: async function () {
      return unwrap(await request("/public/games"));
    },
    fetchServices: async function (params) {
      return unwrap(await request("/public/services", params || {}));
    },
    fetchService: async function (slug) {
      return await request("/public/services/" + encodeURIComponent(slug));
    },
    fetchReviews: async function (params) {
      return unwrap(await request("/public/reviews", params || {}));
    },
    createOrder: function (payload) {
      return postRequest("/public/orders", payload);
    },
    submitContact: function (payload) {
      return postRequest("/public/contact", payload);
    },
    getOrderStatus: function (orderNumber) {
      return request(
        "/public/orders/" + encodeURIComponent(orderNumber) + "/status",
      );
    },
    adaptService: adaptService,
    invalidateCache: function () {
      cache.clear();
    },
  };
})();
