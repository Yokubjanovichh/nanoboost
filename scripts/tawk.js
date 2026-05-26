// Tawk.to live chat — deferred smart loader.
// Loads on browser idle, first user interaction, or 5s timeout (whichever first).
// Zero impact on initial page load, LCP, FID.
(function () {
  "use strict";

  var TAWK_SRC =
    "https://embed.tawk.to/6a1381315568261c36f51c9d/1jpe31b4n";
  var FALLBACK_TIMEOUT = 5000;
  var TRIGGERS = ["scroll", "click", "mousemove", "touchstart", "keydown"];
  var loaded = false;

  function loadTawk() {
    if (loaded) return;
    loaded = true;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    var s = document.createElement("script");
    s.async = true;
    s.src = TAWK_SRC;
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    var firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(s, firstScript);
    } else {
      document.head.appendChild(s);
    }

    removeTriggers();
  }

  function onInteraction() {
    loadTawk();
  }

  function removeTriggers() {
    TRIGGERS.forEach(function (ev) {
      window.removeEventListener(ev, onInteraction);
    });
  }

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadTawk, { timeout: FALLBACK_TIMEOUT });
  } else {
    setTimeout(loadTawk, FALLBACK_TIMEOUT);
  }

  TRIGGERS.forEach(function (ev) {
    window.addEventListener(ev, onInteraction, { passive: true, once: true });
  });
})();
