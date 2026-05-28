// Per-service FAQ on pages/services.html. Renders the parent game's FAQ
// list dynamically via window.NB_API.fetchGameFaqs. The service's gameSlug
// is read from window.NB_SERVICE_CONFIG, which service-page.js populates
// async — if it isn't ready at load time we wait for the nb:service-loaded
// custom event service-page.js dispatches once the service config lands.
//
// Unlike game-faq.js there is no static mock fallback: an empty/404/error
// response simply hides the section so the page stays clean.

(function () {
  "use strict";

  const SECTION = document.querySelector("[data-faq-section]");
  const LIST = document.getElementById("service-faq-list");
  if (!SECTION || !LIST || !window.NB_API) return;

  function getRequestedSlug() {
    return new URLSearchParams(window.location.search).get("service") || "";
  }

  function readGameSlugFromConfig(serviceSlug) {
    if (!serviceSlug) return "";
    const cfg = window.NB_SERVICE_CONFIG && window.NB_SERVICE_CONFIG[serviceSlug];
    return cfg && typeof cfg.gameSlug === "string" ? cfg.gameSlug : "";
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Only safe schemes survive — anything else collapses to "#" so we never
  // emit javascript: or data: links from an admin-authored answer.
  function safeHref(raw) {
    const v = String(raw || "").trim();
    if (/^https?:\/\//i.test(v)) return v;
    if (/^mailto:/i.test(v)) return v;
    if (/^\//.test(v)) return v;
    return "#";
  }

  // Inline mini-markdown: paragraphs (split on blank line), bold (**text**),
  // links ([text](url)). Source is escaped first, then markdown tokens are
  // rewritten as HTML, so authored content can never inject tags.
  function renderMarkdown(src) {
    const safe = escapeHtml(src);
    const paragraphs = safe.split(/\n{2,}/);
    return paragraphs
      .map(function (block) {
        let html = block.replace(/\n/g, "<br>");
        html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        html = html.replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          function (_m, text, url) {
            const href = escapeHtml(safeHref(url));
            return '<a href="' + href + '">' + text + "</a>";
          },
        );
        return '<p class="faq-item__a">' + html + "</p>";
      })
      .join("");
  }

  function renderFaq(faq, index) {
    const qId = "service-faq-q" + (index + 1);
    const aId = "service-faq-a" + (index + 1);
    const isOpen = index === 0;
    return (
      '<article class="faq-item' +
      (isOpen ? " is-open" : "") +
      '" role="listitem">' +
      '<button class="faq-item__trigger" type="button" id="' +
      qId +
      '" aria-expanded="' +
      (isOpen ? "true" : "false") +
      '" aria-controls="' +
      aId +
      '">' +
      '<span class="faq-item__q">' +
      escapeHtml(faq.question) +
      "</span>" +
      '<svg class="faq-item__chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M6 10l6 6 6-6" />' +
      "</svg>" +
      "</button>" +
      '<div class="faq-item__panel" id="' +
      aId +
      '" role="region" aria-labelledby="' +
      qId +
      '">' +
      renderMarkdown(faq.answer) +
      "</div>" +
      "</article>"
    );
  }

  function sortFaqs(list) {
    return list.slice().sort(function (a, b) {
      const ai = typeof a.order_index === "number" ? a.order_index : 9999;
      const bi = typeof b.order_index === "number" ? b.order_index : 9999;
      return ai - bi;
    });
  }

  function wireAccordion() {
    const items = LIST.querySelectorAll(".faq-item:not(.faq-item--skeleton)");
    items.forEach(function (item) {
      const trigger = item.querySelector(".faq-item__trigger");
      if (!trigger) return;
      trigger.addEventListener("click", function () {
        const wasOpen = item.classList.contains("is-open");
        items.forEach(function (other) {
          other.classList.remove("is-open");
          const t = other.querySelector(".faq-item__trigger");
          if (t) t.setAttribute("aria-expanded", "false");
        });
        if (!wasOpen) {
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  function showFaqs(faqs) {
    LIST.innerHTML = sortFaqs(faqs).map(renderFaq).join("");
    LIST.setAttribute("data-faq-state", "ready");
    SECTION.removeAttribute("hidden");
    wireAccordion();
  }

  function hideSection() {
    LIST.innerHTML = "";
    LIST.setAttribute("data-faq-state", "hidden");
    SECTION.setAttribute("hidden", "");
  }

  // Lets a future service-page JSON-LD layer (FAQPage schema) consume the
  // same list without a second fetch, mirroring game-faq.js.
  function broadcastFaqs(gameSlug, list) {
    window.dispatchEvent(
      new CustomEvent("nb:faqs-loaded", {
        detail: { slug: gameSlug, faqs: Array.isArray(list) ? list : [] },
      }),
    );
  }

  let loaded = false;
  async function loadFor(gameSlug) {
    if (loaded) return;
    loaded = true;
    try {
      const faqs = await window.NB_API.fetchGameFaqs(gameSlug);
      if (Array.isArray(faqs) && faqs.length > 0) {
        showFaqs(faqs);
        broadcastFaqs(gameSlug, faqs);
      } else {
        hideSection();
        broadcastFaqs(gameSlug, []);
      }
    } catch (_err) {
      hideSection();
      broadcastFaqs(gameSlug, []);
    }
  }

  // 1) Synchronous fast path — service config may already be seeded
  //    (cache hit, repeat nav, popstate) when this script runs.
  const initialSlug = getRequestedSlug();
  const earlyGameSlug = readGameSlugFromConfig(initialSlug);
  if (earlyGameSlug) {
    loadFor(earlyGameSlug);
    return;
  }

  // 2) Otherwise wait for service-page.js to finish its fetch and emit
  //    nb:service-loaded. detail.cfg.gameSlug is the source of truth.
  window.addEventListener("nb:service-loaded", function (e) {
    const cfg = (e && e.detail && e.detail.cfg) || null;
    const gameSlug =
      (cfg && typeof cfg.gameSlug === "string" && cfg.gameSlug) ||
      readGameSlugFromConfig(e && e.detail && e.detail.slug);
    if (gameSlug) {
      loadFor(gameSlug);
    } else {
      hideSection();
    }
  });
})();
