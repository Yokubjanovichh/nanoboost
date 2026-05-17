// Generic game listing page — pages/game.html?game=<slug>&platform=<ps|xbox|pc>.
// Renders the platform tabs + services grid for any game the admin has
// published, and falls back to "Services coming soon" when the game has
// none yet. SEO meta is filled in from the matching /public/games entry
// so each game URL has its own title/description in the document.

(function () {
  "use strict";

  const SUPPORTED_PLATFORMS = ["ps", "xbox", "pc"];
  const FILTER_PLATFORMS = ["all", "ps", "xbox", "pc"];
  const DEFAULT_GAME = "gta5";
  const NB_PLATFORM_NAME = {
    all: "All platforms",
    ps: "PS4/PS5",
    xbox: "Xbox One/Series",
    pc: "PC",
  };
  const SEARCH_MIN_LEN = 2;
  const SEARCH_DEBOUNCE_MS = 300;

  function nbEscape(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildPicture(desktop, mobile, alt, className) {
    const desk = nbEscape(desktop || "");
    const mob = nbEscape(mobile || desktop || "");
    // width/height attrs let the browser reserve the right slot
    // before the image bytes arrive — without them, the card grows
    // when the network resolves and the page jumps under the user.
    return (
      "<picture>" +
      '<source media="(max-width: 768px)" srcset="' +
      mob +
      '">' +
      '<img src="' +
      desk +
      '" alt="' +
      nbEscape(alt || "") +
      '" class="' +
      className +
      '" width="1600" height="1300" loading="lazy">' +
      "</picture>"
    );
  }

  function getInitialGame() {
    const slug = new URL(window.location.href).searchParams.get("game");
    return slug ? String(slug).toLowerCase() : DEFAULT_GAME;
  }
  function getInitialPlatform() {
    const p = new URL(window.location.href).searchParams.get("platform");
    return FILTER_PLATFORMS.indexOf(p) >= 0 ? p : "all";
  }
  function getInitialSearch() {
    return String(
      new URL(window.location.href).searchParams.get("search") || "",
    );
  }
  function readFiltersFromUrl() {
    return { platform: getInitialPlatform(), search: getInitialSearch() };
  }
  function setUrlState(game, filters, opts) {
    const u = new URL(window.location.href);
    u.searchParams.set("game", game);
    if (filters.platform && filters.platform !== "all") {
      u.searchParams.set("platform", filters.platform);
    } else {
      u.searchParams.delete("platform");
    }
    if (filters.search && filters.search.length >= SEARCH_MIN_LEN) {
      u.searchParams.set("search", filters.search);
    } else {
      u.searchParams.delete("search");
    }
    const state = { game: game, platform: filters.platform, search: filters.search };
    if (opts && opts.replace) {
      window.history.replaceState(state, "", u);
    } else {
      window.history.pushState(state, "", u);
    }
  }

  // ---- Render helpers -----------------------------------------------

  const grid = document.querySelector("#game-services-grid");

  const SKELETON_CARD =
    '<article class="service-card service-card--skeleton" aria-hidden="true">' +
    '<div class="service-card__img service-card__img--skeleton skeleton"></div>' +
    '<div class="service-card__content">' +
    '<div class="service-card__name service-card__name--skeleton skeleton"></div>' +
    '<div class="service-card__price service-card__price--skeleton skeleton"></div>' +
    '<div class="service-card__btn service-card__btn--skeleton skeleton"></div>' +
    "</div>" +
    "</article>";

  function renderSkeletons(count) {
    if (!grid) return;
    grid.innerHTML = SKELETON_CARD.repeat(count || 4);
  }

  function renderEmpty(gameName) {
    if (!grid) return;
    const safeName = nbEscape(gameName || "this game");
    grid.innerHTML =
      '<div class="services__empty" role="status">' +
      '<span class="services__empty-icon" aria-hidden="true">🛠️</span>' +
      '<p class="services__empty-title">Services coming soon</p>' +
      '<p class="services__empty-text">Services for ' +
      safeName +
      " aren't published yet. Check back later or contact support.</p>" +
      "</div>";
  }

  function renderNoResults() {
    if (!grid) return;
    grid.innerHTML =
      '<div class="services__empty" role="status">' +
      '<span class="services__empty-icon" aria-hidden="true">🔍</span>' +
      '<p class="services__empty-title">No services found</p>' +
      '<p class="services__empty-text">Try a different search or platform filter.</p>' +
      '<button type="button" class="services__empty-action" data-clear-filters>Clear filters</button>' +
      "</div>";
  }

  function listIdFor(platform) {
    return "game_" + currentGame + "_" + platform;
  }
  function listNameFor(platform) {
    return (currentGameName || currentGame) + " — " + (NB_PLATFORM_NAME[platform] || platform);
  }
  function priceFromSvc(svc) {
    const raw = (svc && svc.priceNow) || "";
    return parseFloat(String(raw).replace(/[^0-9.]/g, "")) || 0;
  }

  function trackPlatformListView(platform, list) {
    if (typeof window.nbTrack !== "function") return;
    window.nbTrack("view_item_list", {
      item_list_id: listIdFor(platform),
      item_list_name: listNameFor(platform),
      items: list.map(function (svc, i) {
        return {
          item_id: svc.serviceParam || "",
          item_name: svc.title || "",
          item_category: platform,
          index: i,
          price: priceFromSvc(svc),
        };
      }),
    });
  }

  let lastSearchTracked = "";
  function trackSearchEvent(filters, resultsCount) {
    if (typeof window.nbTrack !== "function") return;
    const q = String(filters.search || "").trim();
    if (q.length < SEARCH_MIN_LEN) return;
    // De-duplicate identical queries (e.g. same input replayed on
    // currency/popstate refresh) so we don't spam GA.
    const key = filters.platform + "|" + q;
    if (key === lastSearchTracked) return;
    lastSearchTracked = key;
    window.nbTrack("search", {
      search_term: q,
      game: currentGame,
      platform: filters.platform || "all",
      results_count: resultsCount,
    });
  }

  function trackSelectItem(platform, svc) {
    if (typeof window.nbTrack !== "function") return;
    window.nbTrack("select_item", {
      item_list_id: listIdFor(platform),
      item_list_name: listNameFor(platform),
      items: [
        {
          item_id: svc.serviceParam || "",
          item_name: svc.title || "",
          item_category: platform,
          price: priceFromSvc(svc),
        },
      ],
    });
  }

  function collectByPlatform(buckets, platform) {
    if (!buckets) return [];
    if (platform === "all") {
      // Merge ps + xbox + pc into one list, preserving the platform on
      // each item so click tracking + responsive labels still work.
      const out = [];
      SUPPORTED_PLATFORMS.forEach(function (p) {
        (buckets[p] || []).forEach(function (svc) {
          out.push(Object.assign({}, svc, { _platform: p }));
        });
      });
      return out;
    }
    return (buckets[platform] || []).map(function (svc) {
      return Object.assign({}, svc, { _platform: platform });
    });
  }

  function applySearch(list, query) {
    const q = String(query || "").trim().toLowerCase();
    if (q.length < SEARCH_MIN_LEN) return list;
    return list.filter(function (svc) {
      const title = String(svc.title || "").toLowerCase();
      const slug = String(svc.serviceParam || "").toLowerCase();
      return title.indexOf(q) >= 0 || slug.indexOf(q) >= 0;
    });
  }

  function renderCards(filters) {
    if (!grid) return;
    const buckets =
      (window.NB_SERVICES_BY_GAME && window.NB_SERVICES_BY_GAME[currentGame]) ||
      null;

    if (!buckets || !window.NB_SERVICES_BY_GAME) {
      renderSkeletons(4);
      return;
    }

    const collected = collectByPlatform(buckets, filters.platform);
    if (collected.length === 0) {
      renderEmpty(currentGameName);
      return;
    }

    const list = applySearch(collected, filters.search);
    trackSearchEvent(filters, list.length);

    if (list.length === 0) {
      renderNoResults();
      grid.__nbLastList = [];
      grid.__nbLastPlatform = filters.platform;
      return;
    }

    grid.innerHTML = "";
    trackPlatformListView(filters.platform, list);
    // Cache the rendered list so the delegated click handler can match
    // the clicked card's slug back to the service object for the event.
    grid.__nbLastList = list;
    grid.__nbLastPlatform = filters.platform;
    list.forEach(function (svc) {
      const article = document.createElement("article");
      article.className = "service-card";
      const tpl = document.createElement("template");
      tpl.innerHTML = buildPicture(
        svc.imageSrcDesktop || svc.imageSrc || "",
        svc.imageSrcMobile || "",
        svc.imageAlt || "",
        "service-card__img",
      );
      const pic = tpl.content.firstChild;

      const content = document.createElement("div");
      content.className = "service-card__content";

      const name = document.createElement("h3");
      name.className = "service-card__name";
      name.textContent = svc.title;

      const price = document.createElement("p");
      price.className = "service-card__price";
      const amount = document.createElement("span");
      amount.className = "service-card__amount";
      const isEur =
        window.nbGetCurrency && window.nbGetCurrency() === "EUR";
      const rawUsd =
        parseFloat((svc.priceNow || "").replace(/[^0-9.]/g, "")) || 0;
      amount.textContent =
        isEur && svc.eurPriceNow
          ? svc.eurPriceNow
          : window.nbFormatPrice
            ? window.nbFormatPrice(rawUsd)
            : svc.priceNow;
      price.appendChild(amount);

      const btn = document.createElement("a");
      btn.className = "service-card__btn";
      btn.href =
        "./services.html?service=" + encodeURIComponent(svc.serviceParam);
      btn.dataset.service = svc.serviceParam;
      btn.textContent = "BUY NOW";

      content.appendChild(name);
      content.appendChild(price);
      content.appendChild(btn);

      article.appendChild(pic);
      article.appendChild(content);
      grid.appendChild(article);
    });
  }

  // ---- Filter UI management -----------------------------------------

  let currentFilters = { platform: "all", search: "" };
  let searchDebounceId = 0;
  let loaderTimeoutId = 0;

  function setActivePill(platform) {
    Array.from(document.querySelectorAll(".services-filter__pill")).forEach(
      function (pill) {
        const active = pill.dataset.platform === platform;
        pill.classList.toggle("services-filter__pill--active", active);
        pill.setAttribute("aria-selected", active ? "true" : "false");
      },
    );
  }

  function showLoader(show) {
    const spinner = document.querySelector(".services-filter__spinner");
    if (spinner) spinner.hidden = !show;
    if (grid) grid.classList.toggle("is-loading", Boolean(show));
  }

  function applyFilters(filters, opts) {
    currentFilters = {
      platform: FILTER_PLATFORMS.indexOf(filters.platform) >= 0 ? filters.platform : "all",
      search: String(filters.search || ""),
    };
    setActivePill(currentFilters.platform);
    const input = document.getElementById("services-search");
    if (input && opts && opts.syncInput) input.value = currentFilters.search;

    renderCards(currentFilters);
    showLoader(false);

    if (!(opts && opts.skipUrlUpdate)) {
      setUrlState(currentGame, currentFilters, opts || {});
    }
  }

  // ---- Game meta (title, hero text, breadcrumb, og tags) ------------

  function applyGameDescription(game) {
    const section = document.querySelector("[data-game-description]");
    const body = document.querySelector("[data-game-description-body]");
    if (!section || !body) return;
    const text = String((game && game.description) || "").trim();
    if (!text) {
      section.hidden = true;
      body.innerHTML = "";
      return;
    }
    // Split into paragraphs (blank line OR newline) so admins can paste
    // multi-paragraph copy from the panel.
    const paragraphs = text
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map(function (p) {
        return p.replace(/\s+/g, " ").trim();
      })
      .filter(Boolean);
    body.innerHTML = paragraphs
      .map(function (p) {
        return '<p class="gta5-article__text">' + nbEscape(p) + "</p>";
      })
      .join("");
    section.hidden = false;
  }

  function applyGameMeta(game) {
    if (!game) return;
    currentGameName = game.name || currentGameName;
    applyGameDescription(game);

    const titleEl = document.querySelector("[data-game-title]");
    if (titleEl) titleEl.textContent = (game.name || "").toUpperCase();

    const h1 = document.getElementById("gta5-title");
    if (h1 && game.name) h1.setAttribute("aria-label", game.name);

    const docTitle = (game.name || "Game") + " Boosting Services | Nanoboost";
    document.title = docTitle;

    const description =
      game.description ||
      "Browse " +
        (game.name || "this game") +
        " boosting services by platform. Fast delivery and professional players.";

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", docTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", description);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute(
        "content",
        "https://nanoboost.io/pages/game.html?game=" + encodeURIComponent(currentGame),
      );
    }
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", docTitle);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", description);

    // Breadcrumb JSON-LD
    const ld = document.getElementById("game-breadcrumb-jsonld");
    if (ld && game.name) {
      try {
        ld.textContent = JSON.stringify(
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://nanoboost.io/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: game.name,
                item:
                  "https://nanoboost.io/pages/game.html?game=" +
                  encodeURIComponent(currentGame),
              },
            ],
          },
          null,
          2,
        );
      } catch (_) {
        /* ignore */
      }
    }
  }

  async function resolveGameMeta() {
    if (!window.NB_API || typeof window.NB_API.fetchGames !== "function") return;
    try {
      const games = await window.NB_API.fetchGames();
      if (!Array.isArray(games)) return;
      const match = games.find(function (g) {
        return g && String(g.slug || "").toLowerCase() === currentGame;
      });
      if (match) applyGameMeta(match);
    } catch (_) {
      /* graceful */
    }
  }

  // ---- Init ---------------------------------------------------------

  const currentGame = getInitialGame();
  let currentGameName = currentGame;
  const initialFilters = readFiltersFromUrl();

  renderSkeletons(4);
  // Sync input + pill on first paint without polluting history.
  applyFilters(initialFilters, { syncInput: true, replace: true });
  resolveGameMeta();

  // Pill clicks — immediate filter, no debounce.
  Array.from(document.querySelectorAll(".services-filter__pill")).forEach(
    function (pill) {
      pill.addEventListener("click", function () {
        const p = pill.dataset.platform;
        if (!p) return;
        applyFilters({ platform: p, search: currentFilters.search });
      });
    },
  );

  // Search input — debounced 300ms; <2 chars clears the filter silently.
  const searchInput = document.getElementById("services-search");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const raw = String(searchInput.value || "");
      const trimmed = raw.trim();
      if (searchDebounceId) clearTimeout(searchDebounceId);
      if (loaderTimeoutId) clearTimeout(loaderTimeoutId);

      // Empty input clears the filter immediately (matches "instant
      // back-to-all" expectation) without a 300ms wait.
      if (trimmed.length === 0) {
        showLoader(false);
        applyFilters({ platform: currentFilters.platform, search: "" });
        return;
      }
      // 1-char input: leave the prior result in place silently.
      if (trimmed.length < SEARCH_MIN_LEN) {
        showLoader(false);
        return;
      }

      // Show the loader only if the debounce window actually elapses
      // (skips the flicker for fast typists who keep pressing keys).
      loaderTimeoutId = setTimeout(function () {
        showLoader(true);
      }, 80);

      searchDebounceId = setTimeout(function () {
        if (loaderTimeoutId) clearTimeout(loaderTimeoutId);
        applyFilters({ platform: currentFilters.platform, search: trimmed });
      }, SEARCH_DEBOUNCE_MS);
    });
  }

  // Back/forward navigation — replay URL filters without pushing more.
  window.addEventListener("popstate", function () {
    applyFilters(readFiltersFromUrl(), { syncInput: true, skipUrlUpdate: true });
  });

  // Currency switch — re-render to update prices, keep current filters.
  document.addEventListener("nb:currency-change", function () {
    renderCards(currentFilters);
  });

  // services-bootstrap.js fires this after /public/services resolves.
  window.addEventListener("nb:services-loaded", function () {
    renderCards(currentFilters);
  });

  // Delegated click handler — fires GA4 select_item before the browser
  // follows the BUY NOW link to services.html, and handles the
  // "Clear filters" button in the no-results state.
  if (grid) {
    grid.addEventListener("click", function (e) {
      const clearBtn = e.target.closest("[data-clear-filters]");
      if (clearBtn) {
        const input = document.getElementById("services-search");
        if (input) input.value = "";
        applyFilters({ platform: "all", search: "" });
        return;
      }
      const link = e.target.closest("a.service-card__btn[data-service]");
      if (!link) return;
      const slug = link.dataset.service;
      const list = grid.__nbLastList || [];
      const svc = list.find(function (s) {
        return s.serviceParam === slug;
      });
      if (svc) trackSelectItem(svc._platform || currentFilters.platform, svc);
    });
  }
})();
