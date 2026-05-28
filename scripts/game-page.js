// Generic game listing page — pages/game.html?game=<slug>&platform=<ps|xbox|pc>.
// Renders the platform tabs + services grid for any game the admin has
// published, and falls back to "Services coming soon" when the game has
// none yet. SEO meta is filled in from the matching /public/games entry
// so each game URL has its own title/description in the document.

(function () {
  "use strict";

  const SUPPORTED_PLATFORMS = ["ps", "xbox", "pc"];
  const PLATFORM_LABEL = {
    ps: "Playstation 4/5",
    pc: "PC",
    xbox: "XBOX One/Series",
  };
  const PLATFORM_SHORT = {
    ps: "PS4/PS5",
    xbox: "Xbox One/Series",
    pc: "PC",
  };
  const DEFAULT_GAME = "gta5";

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
  function getRequestedPlatform() {
    const p = new URL(window.location.href).searchParams.get("platform");
    return SUPPORTED_PLATFORMS.indexOf(p) >= 0 ? p : null;
  }
  function setUrlState(game, platform, opts) {
    const u = new URL(window.location.href);
    u.searchParams.set("game", game);
    if (platform) {
      u.searchParams.set("platform", platform);
    } else {
      u.searchParams.delete("platform");
    }
    // Search param is no longer supported here — strip it if a legacy
    // URL leaks through so it doesn't reappear after a navigation.
    u.searchParams.delete("search");
    const state = { game: game, platform: platform };
    if (opts && opts.replace) {
      window.history.replaceState(state, "", u);
    } else {
      window.history.pushState(state, "", u);
    }
  }

  // ---- Render helpers -----------------------------------------------

  const grid = document.querySelector("#game-services-grid");
  const tabsContainer = document.querySelector(".gta5-intro__tabs");

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

  function listIdFor(platform) {
    return "game_" + currentGame + "_" + platform;
  }
  function listNameFor(platform) {
    return (currentGameName || currentGame) + " — " + (PLATFORM_SHORT[platform] || platform);
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

  // ---- Available platforms for the current game ---------------------

  function getAvailablePlatforms() {
    const buckets =
      (window.NB_SERVICES_BY_GAME && window.NB_SERVICES_BY_GAME[currentGame]) ||
      null;
    if (!buckets) return null; // not loaded yet
    return SUPPORTED_PLATFORMS.filter(function (p) {
      return Array.isArray(buckets[p]) && buckets[p].length > 0;
    });
  }

  function renderTabs(platforms, activePlatform) {
    if (!tabsContainer) return;
    // Clear the skeleton chips the HTML ships with so the swap to the
    // real list (or to the empty state) happens in one paint, with no
    // stale pre-data row flashing through.
    tabsContainer.removeAttribute("data-tabs-pending");
    if (!platforms || platforms.length === 0) {
      tabsContainer.hidden = true;
      tabsContainer.innerHTML = "";
      return;
    }
    tabsContainer.hidden = false;
    tabsContainer.innerHTML = platforms
      .map(function (p) {
        const active = p === activePlatform;
        return (
          '<button type="button" class="gta5-intro__tab' +
          (active ? " is-active" : "") +
          '" role="tab" aria-selected="' +
          (active ? "true" : "false") +
          '" data-platform="' +
          nbEscape(p) +
          '">' +
          nbEscape(PLATFORM_LABEL[p] || p) +
          "</button>"
        );
      })
      .join("");
  }

  // ---- Cards render -------------------------------------------------

  function renderCards(platform) {
    if (!grid) return;
    const buckets =
      (window.NB_SERVICES_BY_GAME && window.NB_SERVICES_BY_GAME[currentGame]) ||
      null;

    if (!buckets || !window.NB_SERVICES_BY_GAME) {
      renderSkeletons(4);
      return;
    }

    const list = (buckets[platform] || []).slice();
    if (list.length === 0) {
      renderEmpty(currentGameName);
      return;
    }

    grid.innerHTML = "";
    trackPlatformListView(platform, list);
    grid.__nbLastList = list;
    grid.__nbLastPlatform = platform;
    list.forEach(function (svc) {
      // Whole card is the link — mirrors services-bootstrap.js so the
      // .service-card--link mobile rules (square image, gap, scale-
      // on-tap, full-width BUY NOW) apply uniformly across game-page
      // cards and Hot Right Now cards.
      const card = document.createElement("a");
      const salePct = Number(svc.salePercent) || 0;
      card.className =
        "service-card service-card--link" + (salePct > 0 ? " has-sale" : "");
      card.href =
        "./services.html?service=" + encodeURIComponent(svc.serviceParam);
      card.dataset.service = svc.serviceParam;
      card.setAttribute("aria-label", "View " + (svc.title || "") + " service");

      if (salePct > 0) {
        const sale = document.createElement("span");
        sale.className = "service-card__sale-badge";
        sale.setAttribute("aria-label", "On sale");
        sale.textContent = "-" + salePct + "%";
        card.appendChild(sale);
      }

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
      const fromLabel = document.createElement("span");
      fromLabel.className = "service-card__from";
      fromLabel.textContent = "From";
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
      price.appendChild(fromLabel);
      price.appendChild(amount);

      // BUY NOW degrades to a <span> — nested <a> inside the card link
      // would be invalid HTML. Parent <a> handles navigation; CSS for
      // .service-card__btn renders it visually as the button.
      const btn = document.createElement("span");
      btn.className = "service-card__btn";
      btn.textContent = "BUY NOW";

      content.appendChild(name);
      content.appendChild(price);
      content.appendChild(btn);

      card.appendChild(pic);
      card.appendChild(content);
      grid.appendChild(card);
    });
  }

  // ---- Tab + platform management ------------------------------------

  let currentPlatform = "ps";

  function pickPlatform(available, requested) {
    if (!available || available.length === 0) return null;
    if (requested && available.indexOf(requested) >= 0) return requested;
    return available[0];
  }

  function switchPlatform(platform, opts) {
    if (!platform) return;
    currentPlatform = platform;
    const available = getAvailablePlatforms();
    if (available) renderTabs(available, platform);
    renderCards(platform);
    if (!(opts && opts.skipUrlUpdate)) {
      setUrlState(currentGame, platform, opts || {});
    }
  }

  function syncFromData(opts) {
    const available = getAvailablePlatforms();
    if (!available) {
      // Data not loaded yet — keep showing skeletons + static fallback tabs.
      return;
    }
    if (available.length === 0) {
      renderTabs([], null);
      renderEmpty(currentGameName);
      return;
    }
    const target = pickPlatform(available, getRequestedPlatform());
    currentPlatform = target;
    renderTabs(available, target);
    renderCards(target);
    if (!(opts && opts.skipUrlUpdate)) {
      // URL may need to be cleaned (e.g. requested PS but only Xbox exists).
      setUrlState(currentGame, target, { replace: true });
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

  // Cached game metadata + FAQ list keep applyGameSEO re-runnable when
  // either signal arrives (game.name first, FAQs later via game-faq.js).
  let cachedGame = null;
  let cachedFaqs = null;

  function runGameSeo() {
    if (!window.NB_SEO || !cachedGame) return;
    const available = getAvailablePlatforms();
    window.NB_SEO.applyGameSEO(
      {
        slug: currentGame,
        name: cachedGame.name,
        description: cachedGame.description,
        platforms: available && available.length ? available : null,
        heroImage: cachedGame.image_url || cachedGame.hero_image_url || null,
      },
      cachedFaqs,
    );
  }

  window.addEventListener("nb:faqs-loaded", function (e) {
    if (!e || !e.detail || e.detail.slug !== currentGame) return;
    cachedFaqs = Array.isArray(e.detail.faqs) ? e.detail.faqs : null;
    runGameSeo();
  });

  function applyGameMeta(game) {
    if (!game) return;
    currentGameName = game.name || currentGameName;
    applyGameDescription(game);

    const titleEl = document.querySelector("[data-game-title]");
    if (titleEl) titleEl.textContent = (game.name || "").toUpperCase();

    const h1 = document.getElementById("gta5-title");
    if (h1 && game.name) h1.setAttribute("aria-label", game.name);

    cachedGame = game;
    runGameSeo();

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

  renderSkeletons(4);
  resolveGameMeta();

  // Tab clicks (delegated so dynamically-rendered tabs work without rebind).
  if (tabsContainer) {
    tabsContainer.addEventListener("click", function (e) {
      const tab = e.target.closest(".gta5-intro__tab[data-platform]");
      if (!tab) return;
      switchPlatform(tab.dataset.platform);
    });
  }

  // Back/forward navigation — pick the URL's platform if still available.
  window.addEventListener("popstate", function () {
    const requested = getRequestedPlatform();
    const available = getAvailablePlatforms();
    if (!available || available.length === 0) {
      renderTabs([], null);
      renderEmpty(currentGameName);
      return;
    }
    switchPlatform(pickPlatform(available, requested), { skipUrlUpdate: true });
  });

  // Currency switch — re-render to update prices, keep current platform.
  document.addEventListener("nb:currency-change", function () {
    if (currentPlatform) renderCards(currentPlatform);
  });

  // services-bootstrap.js fires this after /public/services resolves —
  // first chance to know which platforms actually have content.
  window.addEventListener("nb:services-loaded", function () {
    syncFromData();
    // Available platforms only resolve after services load — refresh
    // SEO once the platform array is real so VideoGame.gamePlatform
    // reflects the admin's actual lineup instead of the fallback.
    runGameSeo();
  });

  // If services-bootstrap finished before we wired the listener (cache
  // hit), sync immediately.
  if (window.NB_SERVICES_BY_GAME) syncFromData();

  // Delegated click handler — fires GA4 select_item before the browser
  // follows the card link to services.html. The card is now a full
  // <a class="service-card service-card--link" data-service="…">, so
  // catch the whole tile not just the BUY NOW button.
  if (grid) {
    grid.addEventListener("click", function (e) {
      const link = e.target.closest("a.service-card--link[data-service]");
      if (!link) return;
      const slug = link.dataset.service;
      const list = grid.__nbLastList || [];
      const svc = list.find(function (s) {
        return s.serviceParam === slug;
      });
      if (svc) trackSelectItem(currentPlatform, svc);
    });
  }
})();
