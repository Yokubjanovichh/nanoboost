// Per-game FAQ on pages/game.html. Renders the accordion list dynamically
// from /public/games/{slug}/faqs via window.NB_API.fetchGameFaqs. Falls back
// to a static mock list when the backend is not yet live (404), so the
// section stays useful during the BE rollout. Hides the whole section on
// 5xx, network errors, or an empty list.

(function () {
  "use strict";

  const SECTION = document.querySelector("[data-faq-section]");
  const LIST = document.getElementById("game-faq-list");
  if (!SECTION || !LIST || !window.NB_API) return;

  const DEFAULT_GAME = "gta5";
  const slug = (function () {
    const s = new URL(window.location.href).searchParams.get("game");
    return s ? String(s).toLowerCase() : DEFAULT_GAME;
  })();

  const MOCK_FAQS = [
    {
      id: "mock-1",
      question: "Is your boosting service safe?",
      answer:
        "Yes. We use professional boosters, secure connections, and proven methods that minimise risk and protect your account across every game we support.",
    },
    {
      id: "mock-2",
      question: "How fast is delivery?",
      answer:
        "Most orders start within minutes of payment. Estimated completion times are shown on each service page and depend on the specific service and game you choose.",
    },
    {
      id: "mock-3",
      question: "Which platforms do you support?",
      answer:
        "PlayStation 4 / 5, Xbox One / Series, and PC. Each service page lists the platforms it covers — pick the one that matches your setup.",
    },
    {
      id: "mock-4",
      question: "Can I refund my order?",
      answer:
        "Refunds are available before a booster starts your order. See our [refund policy](/pages/refund-policy.html) for the full breakdown of timing and eligible cases.",
    },
    {
      id: "mock-5",
      question: "Do you support multiple games?",
      answer:
        "Yes — GTA Online, Forza Horizon 6, and more titles are added regularly. Browse the [games grid](/#games) for the full lineup or contact us for a custom request.",
    },
  ];

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
    const qId = "game-faq-q" + (index + 1);
    const aId = "game-faq-a" + (index + 1);
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

  // FAQs may arrive unordered — sort by order_index when present so the
  // admin's ordering survives the API hop.
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

  // Lets game-page.js feed the same list into FAQPage JSON-LD without
  // re-fetching. Mock fallback rides the same channel so the schema still
  // renders during the BE rollout window.
  function broadcastFaqs(list) {
    window.dispatchEvent(
      new CustomEvent("nb:faqs-loaded", {
        detail: { slug: slug, faqs: Array.isArray(list) ? list : [] },
      }),
    );
  }

  (async function load() {
    try {
      const faqs = await window.NB_API.fetchGameFaqs(slug);
      if (Array.isArray(faqs) && faqs.length > 0) {
        showFaqs(faqs);
        broadcastFaqs(faqs);
      } else {
        hideSection();
        broadcastFaqs([]);
      }
    } catch (err) {
      if (err && err.status === 404) {
        // BE endpoint not deployed yet — keep the section useful with mock
        // copy. Once the endpoint goes live this branch goes silent.
        showFaqs(MOCK_FAQS);
        broadcastFaqs(MOCK_FAQS);
      } else {
        hideSection();
        broadcastFaqs([]);
      }
    }
  })();
})();
