// GA4 loader + nbTrack() helper.
//
// Reads window.NB_GA4_MEASUREMENT_ID (set per page in the HTML <head>).
// When it's empty/missing, nbTrack becomes a silent no-op and the page
// makes zero network requests to Google — handy for dev, staging and
// for graceful degradation when an ad blocker drops gtag.js. Set
// window.NB_DEBUG_ANALYTICS=true to mirror every event to the console.

(function () {
  "use strict";

  const measurementId = String(window.NB_GA4_MEASUREMENT_ID || "").trim();
  const debug = Boolean(window.NB_DEBUG_ANALYTICS);

  // window.nbTrack is always installed so call sites don't have to guard
  // their own usage — it just does nothing when gtag isn't around.
  window.nbTrack = function (eventName, params) {
    if (debug && console && typeof console.log === "function") {
      console.log("[NB GA4]", eventName, params || {});
    }
    if (typeof window.gtag !== "function") return;
    try {
      window.gtag("event", eventName, params || {});
    } catch (err) {
      if (debug && console && typeof console.warn === "function") {
        console.warn("[NB GA4] track failed:", err);
      }
    }
  };

  if (!measurementId) {
    // No ID — leave nbTrack as a logger-only stub and don't load gtag.
    return;
  }

  // dataLayer + gtag bootstrap (the snippet Google ships, inlined so we
  // don't depend on the page already declaring it).
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: true });

  const script = document.createElement("script");
  script.async = true;
  script.src =
    "https://www.googletagmanager.com/gtag/js?id=" +
    encodeURIComponent(measurementId);
  script.onerror = function () {
    if (debug && console && typeof console.warn === "function") {
      console.warn("[NB GA4] gtag.js failed to load (ad blocker?)");
    }
  };
  (document.head || document.documentElement).appendChild(script);
})();
