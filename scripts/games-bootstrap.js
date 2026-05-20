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
  const FOOTER_LISTS_SELECTOR = "[data-dynamic-games]";

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
      '" width="810" height="1464" loading="lazy">' +
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
    const slug = escape(game.slug || "");
    const name = escape(game.name || "");
    // Game name → <a> so a direct click navigates to the game page
    // (e-commerce convention: hover/chevron drills into platforms,
    // primary click sends you to the game). Chevron is a separate
    // <button> for touch users who can't hover to reveal the submenu.
    return (
      '<li class="dropdown__item" data-game="' +
      slug +
      '">' +
      '<a class="dropdown__item-link" href="/pages/game.html?game=' +
      slug +
      '"><span>' +
      name +
      "</span></a>" +
      '<button class="dropdown__item-chevron" type="button" aria-label="Show platforms for ' +
      name +
      '">' +
      CHEVRON_SVG +
      "</button>" +
      "</li>"
    );
  }

  // Footer Games column item — mirrors the homepage grid's status rules:
  //   active + has services → clickable link to /pages/game.html?game=<slug>
  //   active + no services → disabled "(coming soon)" tag
  //   coming_soon            → disabled "(soon)" tag
  //   hidden                 → filtered out upstream, never reaches here
  function buildFooterGameItem(game) {
    const status = effectiveStatus(game);
    const slug = escape(game.slug || "");
    const name = escape(game.name || "");
    const serviceCount = Number(game.service_count || 0);
    const isClickable = status === "active" && serviceCount > 0;
    if (isClickable) {
      return (
        '<li><a class="footer__link" href="/pages/game.html?game=' +
        slug +
        '">' +
        name +
        "</a></li>"
      );
    }
    const suffix = status === "coming_soon" ? " (soon)" : " (coming soon)";
    return (
      '<li><span class="footer__link footer__link--disabled" aria-disabled="true">' +
      name +
      "<em>" +
      suffix +
      "</em></span></li>"
    );
  }

  function populateFooterGames(visibleGames) {
    const lists = document.querySelectorAll(FOOTER_LISTS_SELECTOR);
    if (!lists.length) return;
    const html = visibleGames.length
      ? visibleGames.map(buildFooterGameItem).join("")
      : "";
    lists.forEach(function (list) {
      list.innerHTML = html;
    });
  }

  function clearFooterGames() {
    document.querySelectorAll(FOOTER_LISTS_SELECTOR).forEach(function (list) {
      list.innerHTML = "";
    });
  }

  // Mobile mega-drawer Games section. Same status rules as the
  // homepage grid / nav dropdown / footer column — active+services →
  // clickable card, coming_soon / no services → disabled tag, hidden
  // → filtered out upstream.
  const MEGA_DRAWER_GAMES_SELECTOR = "#mega-drawer-games";
  const MEGA_ARROW_SVG =
    '<svg class="mega-drawer__game-arrow" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="5" y1="12" x2="19" y2="12"/>' +
    '<polyline points="12 5 19 12 12 19"/>' +
    "</svg>";

  function buildMegaDrawerGameItem(game) {
    const status = effectiveStatus(game);
    const slug = escape(game.slug || "");
    const name = escape(game.name || "");
    const serviceCount = Number(game.service_count || 0);
    const isClickable = status === "active" && serviceCount > 0;
    if (isClickable) {
      const meta =
        serviceCount === 1
          ? "1 service available"
          : serviceCount + " services available";
      return (
        '<li><a class="mega-drawer__game" href="/pages/game.html?game=' +
        slug +
        '">' +
        '<span class="mega-drawer__game-info">' +
        '<span class="mega-drawer__game-name">' +
        name +
        "</span>" +
        '<span class="mega-drawer__game-meta">' +
        meta +
        "</span>" +
        "</span>" +
        MEGA_ARROW_SVG +
        "</a></li>"
      );
    }
    const meta =
      status === "coming_soon" ? "Coming soon" : "Services coming soon";
    return (
      '<li><div class="mega-drawer__game mega-drawer__game--disabled" ' +
      'aria-disabled="true">' +
      '<span class="mega-drawer__game-info">' +
      '<span class="mega-drawer__game-name">' +
      name +
      "</span>" +
      '<span class="mega-drawer__game-meta">' +
      meta +
      "</span>" +
      "</span>" +
      "</div></li>"
    );
  }

  function populateMegaDrawerGames(visibleGames) {
    const list = document.querySelector(MEGA_DRAWER_GAMES_SELECTOR);
    if (!list) return;
    list.innerHTML = visibleGames.length
      ? visibleGames.map(buildMegaDrawerGameItem).join("")
      : "";
  }

  function clearMegaDrawerGames() {
    const list = document.querySelector(MEGA_DRAWER_GAMES_SELECTOR);
    if (list) list.innerHTML = "";
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
      if (!Array.isArray(games) || games.length === 0) {
        clearFooterGames();
        clearMegaDrawerGames();
        return;
      }

      // Hide what the backend marks hidden; admins may still want to
      // surface "coming_soon" on the homepage with a disabled CTA.
      const visible = games.filter(function (g) {
        return effectiveStatus(g) !== "hidden";
      });
      if (visible.length === 0) {
        clearFooterGames();
        clearMegaDrawerGames();
        return;
      }

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

      // 3) Footer Games column — every visible game (active + coming_soon),
      //    status-aware rendering handled by buildFooterGameItem.
      populateFooterGames(visible);

      // 4) Mobile mega-drawer Games section — same status-aware list.
      populateMegaDrawerGames(visible);

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
      // Footer Games column has no hardcoded fallback (skeletons only),
      // so drop the skeletons to a clean empty column instead of
      // letting them spin forever.
      clearFooterGames();
      clearMegaDrawerGames();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
