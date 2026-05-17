// Generic game listing page — pages/game.html?game=<slug>&platform=<ps|xbox|pc>.
// Renders the platform tabs + services grid for any game the admin has
// published, and falls back to "Services coming soon" when the game has
// none yet. SEO meta is filled in from the matching /public/games entry
// so each game URL has its own title/description in the document.

(function () {
  "use strict";

  const SUPPORTED_PLATFORMS = ["ps", "xbox", "pc"];
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
      '" loading="lazy">' +
      "</picture>"
    );
  }

  function getInitialGame() {
    const slug = new URL(window.location.href).searchParams.get("game");
    return slug ? String(slug).toLowerCase() : DEFAULT_GAME;
  }
  function getInitialPlatform() {
    const p = new URL(window.location.href).searchParams.get("platform");
    return SUPPORTED_PLATFORMS.indexOf(p) >= 0 ? p : "ps";
  }
  function setUrlParams(game, platform) {
    const u = new URL(window.location.href);
    u.searchParams.set("game", game);
    u.searchParams.set("platform", platform);
    window.history.replaceState({ game: game, platform: platform }, "", u);
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
      "<p>Services for " +
      safeName +
      " are coming soon. Check back later or contact support.</p>" +
      "</div>";
  }

  function renderCards(platform) {
    if (!grid) return;
    const buckets =
      (window.NB_SERVICES_BY_GAME && window.NB_SERVICES_BY_GAME[currentGame]) ||
      null;
    const list = (buckets && buckets[platform]) || [];

    if (!buckets || !window.NB_SERVICES_BY_GAME) {
      renderSkeletons(4);
      return;
    }
    if (list.length === 0) {
      renderEmpty(currentGameName);
      return;
    }

    grid.innerHTML = "";
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

  // ---- Tab management -----------------------------------------------

  function setActiveTab(platform) {
    Array.from(document.querySelectorAll(".gta5-intro__tab")).forEach(function (
      tab,
    ) {
      const active = tab.dataset.platform === platform;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function switchPlatform(platform, opts) {
    const updateUrl = !(opts && opts.updateUrl === false);
    setActiveTab(platform);
    renderCards(platform);
    if (updateUrl) setUrlParams(currentGame, platform);
  }

  // ---- Game meta (title, hero text, breadcrumb, og tags) ------------

  function applyGameMeta(game) {
    if (!game) return;
    currentGameName = game.name || currentGameName;

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
  const initialPlatform = getInitialPlatform();

  renderSkeletons(4);
  setActiveTab(initialPlatform);
  setUrlParams(currentGame, initialPlatform);
  resolveGameMeta();

  // Tab clicks
  Array.from(document.querySelectorAll(".gta5-intro__tab")).forEach(function (
    tab,
  ) {
    tab.addEventListener("click", function () {
      const p = tab.dataset.platform;
      if (p) switchPlatform(p);
    });
  });

  // Back/forward navigation
  window.addEventListener("popstate", function () {
    switchPlatform(getInitialPlatform(), { updateUrl: false });
  });

  // Currency switch — re-render to update prices.
  document.addEventListener("nb:currency-change", function () {
    const u = new URL(window.location.href);
    const p = u.searchParams.get("platform");
    renderCards(SUPPORTED_PLATFORMS.indexOf(p) >= 0 ? p : "ps");
  });

  // services-bootstrap.js fires this after /public/services resolves.
  window.addEventListener("nb:services-loaded", function () {
    const u = new URL(window.location.href);
    const p = u.searchParams.get("platform");
    renderCards(SUPPORTED_PLATFORMS.indexOf(p) >= 0 ? p : "ps");
  });
})();
