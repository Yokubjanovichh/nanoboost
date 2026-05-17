// Populates the homepage "Choose Your Game" grid and the navigation
// dropdown from /public/games. Falls back silently to the hardcoded
// markup when the API is unreachable, returns empty, or the response
// shape isn't what we expect.
//
// Backend Phase 5 will add a `status` field; until then we treat every
// game as "active" so the page keeps working through the deploy lag.

(function () {
  "use strict";

  const GRID_SELECTOR = ".games__grid";
  const DROPDOWN_LIST_SELECTOR = ".dropdown__games .dropdown__list";

  // API origin so /uploads/... paths resolve against the backend host
  // rather than nanoboost.io (which doesn't serve those files).
  const API_ORIGIN = (function () {
    try {
      const base = window.NB_PUBLIC_API_URL || "";
      return base ? new URL(base).origin : "";
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

  // Mirror of the chevron SVG used by the existing dropdown items.
  const CHEVRON_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="9 18 15 12 9 6"/></svg>';

  function escape(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Defensive: tolerate the missing `status` field while BE Phase 5
  // hasn't rolled out yet. Anything we don't recognise is treated as
  // "active" so the user can still click through.
  function effectiveStatus(game) {
    const raw = (game && game.status ? String(game.status) : "").toLowerCase();
    if (raw === "coming_soon" || raw === "hidden") return raw;
    return "active";
  }

  function buildGameCard(game) {
    const status = effectiveStatus(game);
    const desk = escape(absolutizeBackendUrl(game.image_desktop_url || ""));
    const mob = escape(
      absolutizeBackendUrl(game.image_mobile_url || game.image_desktop_url || ""),
    );
    const name = escape(game.name || "");
    const slug = escape(game.slug || "");
    const alt = escape(
      (game.description || game.name || "").toString().slice(0, 200),
    );

    // A game is clickable only when it's marked active AND has at least
    // one published service; otherwise we degrade the CTA so we never
    // ship an admin to an empty grid.
    const serviceCount = Number(game.service_count || 0);
    const hasServices = serviceCount > 0;
    const isClickable = status === "active" && hasServices;
    const dimmed = !isClickable;

    let cta;
    if (isClickable) {
      cta =
        '<a class="game-card__cta" href="./pages/game.html?game=' +
        slug +
        '">CHOOSE A SERVICE</a>';
    } else if (status === "coming_soon") {
      cta =
        '<button type="button" class="game-card__cta" disabled>Coming Soon</button>';
    } else {
      cta =
        '<button type="button" class="game-card__cta" disabled>Services Coming Soon</button>';
    }

    return (
      '<article class="game-card' +
      (dimmed ? " game-card--coming-soon" : "") +
      '">' +
      "<picture>" +
      '<source media="(max-width: 480px), (orientation: landscape) and (max-height: 500px)" srcset="' +
      mob +
      '">' +
      '<img class="game-card__img" src="' +
      desk +
      '" alt="' +
      alt +
      '" loading="lazy">' +
      "</picture>" +
      '<div class="game-card__content">' +
      '<h3 class="game-card__title">' +
      name +
      "</h3>" +
      cta +
      "</div>" +
      "</article>"
    );
  }

  function buildNavDropdownItem(game) {
    return (
      '<li class="dropdown__item" data-game="' +
      escape(game.slug || "") +
      '">' +
      "<span>" +
      escape(game.name || "") +
      "</span>" +
      CHEVRON_SVG +
      "</li>"
    );
  }

  // 4 skeleton cards keep layout stable until the API resolves.
  const SKELETON_CARD =
    '<article class="game-card game-card--skeleton" aria-hidden="true">' +
    '<div class="game-card__img game-card__img--skeleton skeleton"></div>' +
    '<div class="game-card__content">' +
    '<div class="game-card__title game-card__title--skeleton skeleton"></div>' +
    '<div class="game-card__cta game-card__cta--skeleton skeleton"></div>' +
    "</div>" +
    "</article>";
  const SKELETON_DROPDOWN_ITEM =
    '<li class="dropdown__item dropdown__item--skeleton" aria-hidden="true">' +
    '<span class="dropdown__skeleton-text skeleton"></span>' +
    "</li>";

  // Replace the hardcoded fallback markup with skeletons immediately so
  // the user never sees stale "Coming Soon" cards or the duplicate GTA5
  // dropdown row from the SSR HTML before the API resolves.
  function paintSkeletons() {
    const grid = document.querySelector(GRID_SELECTOR);
    if (grid) {
      const customCard = grid.querySelector(".game-card--custom");
      grid.innerHTML =
        SKELETON_CARD.repeat(4) + (customCard ? customCard.outerHTML : "");
    }
    const dropdownList = document.querySelector(DROPDOWN_LIST_SELECTOR);
    if (dropdownList) {
      dropdownList.innerHTML = SKELETON_DROPDOWN_ITEM.repeat(3);
    }
  }

  async function bootstrap() {
    if (!window.NB_API || typeof window.NB_API.fetchGames !== "function") {
      return;
    }
    paintSkeletons();

    try {
      const games = await window.NB_API.fetchGames();
      if (!Array.isArray(games) || games.length === 0) return;

      // Hide what the backend marks hidden; admins may still want to
      // surface "coming_soon" on the homepage with a disabled CTA.
      const visible = games.filter(function (g) {
        return effectiveStatus(g) !== "hidden";
      });
      if (visible.length === 0) return;

      // 1) Homepage grid — preserve the trailing "custom" CTA card.
      const grid = document.querySelector(GRID_SELECTOR);
      if (grid) {
        const customCard = grid.querySelector(".game-card--custom");
        const cardsHtml = visible.map(buildGameCard).join("");
        grid.innerHTML = cardsHtml + (customCard ? customCard.outerHTML : "");
      }

      // 2) Navigation dropdown — only active games are clickable.
      const dropdownList = document.querySelector(DROPDOWN_LIST_SELECTOR);
      if (dropdownList) {
        const activeGames = visible.filter(function (g) {
          return effectiveStatus(g) === "active";
        });
        if (activeGames.length > 0) {
          dropdownList.innerHTML = activeGames.map(buildNavDropdownItem).join("");
        }
      }

      window.dispatchEvent(
        new CustomEvent("nb:games-loaded", {
          detail: { count: visible.length, source: "api" },
        }),
      );

      if (typeof window.nbTrack === "function") {
        window.nbTrack("view_item_list", {
          item_list_id: "choose_your_game",
          item_list_name: "Choose Your Game",
          items: visible.map(function (g, i) {
            return {
              item_id: g.slug || "",
              item_name: g.name || "",
              index: i,
            };
          }),
        });
      }
    } catch (e) {
      if (console && typeof console.warn === "function") {
        console.warn("[NB] games bootstrap failed:", e);
      }
      // Hardcoded markup stays in place — graceful fallback.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
