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
    getOrderStatus: function (orderNumber) {
      return request(
        "/public/orders/" + encodeURIComponent(orderNumber) + "/status",
      );
    },
    invalidateCache: function () {
      cache.clear();
    },
  };
})();
