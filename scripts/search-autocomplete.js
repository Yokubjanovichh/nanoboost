// Premium search autocomplete — multi-game aware, ARIA combobox.
//
// Hooks both the header (.search > .search__input) and the mobile
// mega-drawer (.mega-drawer__search > .mega-drawer__search-input).
// Data comes from window.NB_SERVICE_CONFIG (populated by services-
// bootstrap.js) and window.NB_GAMES (populated by games-bootstrap.js,
// see below). Rebuilds the result corpus when either bootstrap fires
// nb:services-loaded / nb:games-loaded.
//
// Per-keystroke pipeline:
//   input → 150ms debounce → fuzzy match → render top 6
//
// Fuzzy weights (per matched token): title × 3, gameName × 2, platform × 1.

(function () {
  "use strict";

  const DEBOUNCE_MS = 150;
  const RESULT_LIMIT = 6;
  const POPULAR_LIMIT = 5;
  let corpus = [];
  let gameDirectory = [];

  function tokens(s) {
    return String(s || "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }

  function buildCorpus() {
    const cfg = window.NB_SERVICE_CONFIG || {};
    corpus = Object.entries(cfg).map(function (entry) {
      const slug = entry[0];
      const svc = entry[1] || {};
      const title = String(svc.titleHtml || "").replace(/<br\s*\/?>/g, " ");
      const platform = svc.platform || "";
      const gameName = svc.gameName || "";
      const gameSlug = svc.gameSlug || "";
      const opt0 = (svc.options || [])[0] || "";
      const m = String(opt0).match(/\$([\d.]+)/);
      const price = m ? Number(m[1]) : 0;
      return {
        slug: slug,
        title: title,
        gameName: gameName,
        gameSlug: gameSlug,
        platform: platform,
        priceUsd: price,
        image: svc.imageSrcDesktop || svc.imageSrc || svc.imageSrcMobile || "",
        href: "/pages/services.html?service=" + encodeURIComponent(slug),
        haystack: (
          title +
          " " +
          gameName +
          " " +
          gameSlug +
          " " +
          platform +
          " " +
          slug
        ).toLowerCase(),
      };
    });
  }

  function buildGameDirectory(games) {
    if (!Array.isArray(games)) return;
    gameDirectory = games
      .filter(function (g) {
        const s = (g && g.status ? String(g.status) : "").toLowerCase();
        return s !== "hidden";
      })
      .map(function (g) {
        const slug = String(g.slug || "");
        const name = String(g.name || "");
        return {
          slug: slug,
          name: name,
          haystack: (name + " " + slug).toLowerCase(),
          serviceCount: Number(g.service_count || 0),
          href: "/pages/game.html?game=" + encodeURIComponent(slug),
        };
      });
  }

  function score(item, qTokens) {
    let s = 0;
    for (let i = 0; i < qTokens.length; i++) {
      const t = qTokens[i];
      if (item.haystack.indexOf(t) === -1) return 0;
      if (item.title && item.title.toLowerCase().indexOf(t) !== -1) s += 3;
      if (item.gameName && item.gameName.toLowerCase().indexOf(t) !== -1)
        s += 2;
      if (item.platform && item.platform.toLowerCase().indexOf(t) !== -1)
        s += 1;
      if (s === 0) s += 1;
    }
    return s;
  }

  function rankServices(query) {
    const qTokens = tokens(query);
    if (qTokens.length === 0) {
      // Empty query → "popular" = first POPULAR_LIMIT items in corpus
      // order (services-bootstrap sorts by sort_order, so this is
      // already admin-controlled).
      return corpus.slice(0, POPULAR_LIMIT);
    }
    const scored = corpus
      .map(function (item) {
        return { item: item, s: score(item, qTokens) };
      })
      .filter(function (r) {
        return r.s > 0;
      })
      .sort(function (a, b) {
        return b.s - a.s;
      })
      .slice(0, RESULT_LIMIT);
    return scored.map(function (r) {
      return r.item;
    });
  }

  function rankGames(query) {
    const qTokens = tokens(query);
    if (qTokens.length === 0) return [];
    return gameDirectory
      .filter(function (g) {
        return qTokens.every(function (t) {
          return g.haystack.indexOf(t) !== -1;
        });
      })
      .slice(0, 2);
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatPrice(usd) {
    if (typeof window.nbFormatPrice === "function") {
      return window.nbFormatPrice(usd);
    }
    return "$" + (Number(usd) || 0).toFixed(2);
  }

  function renderServiceItem(item, index) {
    const img = item.image
      ? '<img class="search-autocomplete__thumb" src="' +
        escapeHtml(item.image) +
        '" alt="" loading="lazy" width="40" height="40">'
      : '<div class="search-autocomplete__thumb search-autocomplete__thumb--placeholder" aria-hidden="true"></div>';
    return (
      '<a class="search-autocomplete__item" role="option" id="sa-opt-' +
      index +
      '" data-index="' +
      index +
      '" href="' +
      escapeHtml(item.href) +
      '" aria-selected="false">' +
      img +
      '<span class="search-autocomplete__main">' +
      '<span class="search-autocomplete__title">' +
      escapeHtml(item.title) +
      "</span>" +
      '<span class="search-autocomplete__meta">' +
      (item.gameName
        ? '<span class="search-autocomplete__game">' +
          escapeHtml(item.gameName) +
          "</span>"
        : "") +
      (item.platform
        ? '<span class="search-autocomplete__platform">' +
          escapeHtml(item.platform) +
          "</span>"
        : "") +
      "</span>" +
      "</span>" +
      (item.priceUsd > 0
        ? '<span class="search-autocomplete__price">' +
          escapeHtml(formatPrice(item.priceUsd)) +
          "</span>"
        : "") +
      "</a>"
    );
  }

  function renderGameItem(game, index) {
    const meta =
      game.serviceCount > 0
        ? game.serviceCount +
          " service" +
          (game.serviceCount === 1 ? "" : "s")
        : "Coming soon";
    return (
      '<a class="search-autocomplete__item search-autocomplete__item--game" role="option" id="sa-opt-' +
      index +
      '" data-index="' +
      index +
      '" href="' +
      escapeHtml(game.href) +
      '" aria-selected="false">' +
      '<div class="search-autocomplete__thumb search-autocomplete__thumb--game" aria-hidden="true">' +
      escapeHtml(game.name.charAt(0).toUpperCase()) +
      "</div>" +
      '<span class="search-autocomplete__main">' +
      '<span class="search-autocomplete__title">' +
      escapeHtml(game.name) +
      "</span>" +
      '<span class="search-autocomplete__meta">' +
      '<span class="search-autocomplete__game">Browse game</span>' +
      '<span class="search-autocomplete__platform">' +
      escapeHtml(meta) +
      "</span>" +
      "</span>" +
      "</span>" +
      "</a>"
    );
  }

  function buildHtml(query) {
    const services = rankServices(query);
    const games = rankGames(query);
    const empty = services.length === 0 && games.length === 0;
    if (empty) {
      return (
        '<div class="search-autocomplete__empty">' +
        '<p class="search-autocomplete__empty-title">No matches for &ldquo;' +
        escapeHtml(query) +
        "&rdquo;</p>" +
        '<a class="search-autocomplete__empty-cta" href="/#games">Browse all games</a>' +
        "</div>"
      );
    }
    let html = "";
    let cursor = 0;
    if (services.length) {
      html +=
        '<div class="search-autocomplete__section">' +
        '<div class="search-autocomplete__section-label">' +
        (query.trim() ? "Services" : "Popular services") +
        "</div>";
      services.forEach(function (item) {
        html += renderServiceItem(item, cursor);
        cursor += 1;
      });
      html += "</div>";
    }
    if (games.length) {
      html +=
        '<div class="search-autocomplete__section">' +
        '<div class="search-autocomplete__section-label">Games</div>';
      games.forEach(function (g) {
        html += renderGameItem(g, cursor);
        cursor += 1;
      });
      html += "</div>";
    }
    return html;
  }

  function wireInput(input, panel, wrapper) {
    let debounceId = null;
    let activeIndex = -1;

    function items() {
      return panel.querySelectorAll(".search-autocomplete__item");
    }

    function open() {
      panel.classList.add("is-open");
      wrapper.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-expanded", "true");
    }
    function close() {
      panel.classList.remove("is-open");
      wrapper.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-expanded", "false");
      setActive(-1);
    }

    function setActive(i) {
      const list = items();
      activeIndex = i;
      list.forEach(function (el, idx) {
        const on = idx === i;
        el.setAttribute("aria-selected", on ? "true" : "false");
        if (on) {
          input.setAttribute("aria-activedescendant", el.id);
          el.scrollIntoView({ block: "nearest" });
        }
      });
      if (i < 0) input.removeAttribute("aria-activedescendant");
    }

    function render(query) {
      panel.innerHTML = buildHtml(query);
      open();
      activeIndex = -1;
    }

    input.addEventListener("input", function () {
      clearTimeout(debounceId);
      const v = input.value;
      debounceId = setTimeout(function () {
        render(v);
      }, DEBOUNCE_MS);
    });

    input.addEventListener("focus", function () {
      render(input.value);
    });

    input.addEventListener("keydown", function (e) {
      const list = items();
      const n = list.length;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!panel.classList.contains("is-open")) render(input.value);
        setActive(activeIndex < n - 1 ? activeIndex + 1 : 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(activeIndex > 0 ? activeIndex - 1 : n - 1);
      } else if (e.key === "Enter") {
        if (activeIndex >= 0 && list[activeIndex]) {
          e.preventDefault();
          window.location.href = list[activeIndex].href;
        } else if (n === 1) {
          e.preventDefault();
          window.location.href = list[0].href;
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
        input.blur();
      }
    });

    panel.addEventListener("mousemove", function (e) {
      const item = e.target.closest(".search-autocomplete__item");
      if (!item) return;
      const list = items();
      setActive(Array.prototype.indexOf.call(list, item));
    });

    document.addEventListener("click", function (e) {
      if (!wrapper.contains(e.target)) close();
    });

    return { render: render, close: close };
  }

  function attachPanel(wrapper, input) {
    let panel = wrapper.querySelector(".search-autocomplete");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "search-autocomplete";
      panel.id = wrapper.dataset.acId || "search-autocomplete-list";
      panel.setAttribute("role", "listbox");
      panel.setAttribute("aria-label", "Search suggestions");
      wrapper.appendChild(panel);
    }
    wrapper.setAttribute("role", "combobox");
    wrapper.setAttribute("aria-haspopup", "listbox");
    wrapper.setAttribute("aria-expanded", "false");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", panel.id);
    input.setAttribute("aria-expanded", "false");
    return wireInput(input, panel, wrapper);
  }

  const controllers = [];

  function wireSearchButton(wrapper, input, controller) {
    const btn = wrapper.querySelector(".search__btn");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) {
        input.focus();
        return;
      }
      controller.render(q);
      const first = wrapper.querySelector(".search-autocomplete__item");
      if (first && first.href) window.location.href = first.href;
    });
  }

  function init() {
    document.querySelectorAll(".search").forEach(function (wrapper) {
      const input = wrapper.querySelector(".search__input");
      if (!input) return;
      const controller = attachPanel(wrapper, input);
      wireSearchButton(wrapper, input, controller);
      controllers.push(controller);
    });
  }

  function rebuild() {
    buildCorpus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
  buildCorpus();
  // If the games bootstrap fired before this script attached, pick up
  // the cached list right away so the empty-query game suggestions
  // aren't a no-op on a hot cache.
  if (Array.isArray(window.NB_GAMES)) buildGameDirectory(window.NB_GAMES);
  window.addEventListener("nb:services-loaded", rebuild);
  window.addEventListener("nb:games-loaded", function (e) {
    buildGameDirectory((e && e.detail && e.detail.games) || []);
  });
})();
