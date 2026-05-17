const burger = document.getElementById("burger"),
  nav = document.querySelector(".nav"),
  isMobileNav = () => window.matchMedia("(max-width: 980px)").matches;
// Trust the browser's native scroll restoration. The previous code
// forced scrollTo(0, 0) inside a pageshow → requestAnimationFrame,
// which raced any scroll the user did during the bootstrap skeleton
// phase and yanked them back to the top once async content arrived.
(burger &&
    nav &&
    (burger.addEventListener("click", () => {
      (burger.classList.toggle("is-open"),
        nav.classList.toggle("is-open"),
        isMobileNav() &&
          (nav.classList.contains("is-open")
            ? (dropdownItem?.classList.add("is-open"), resetDropdownSteps())
            : (dropdownItem?.classList.remove("is-open"),
              resetDropdownSteps())));
    }),
    document.addEventListener("click", (e) => {
      burger.contains(e.target) ||
        nav.contains(e.target) ||
        (burger.classList.remove("is-open"),
        nav.classList.remove("is-open"),
        isMobileNav() &&
          (dropdownItem?.classList.remove("is-open"), resetDropdownSteps()));
    })));
const dropdownItem = document.querySelector(".nav__item--dropdown"),
  dropdownLink = dropdownItem?.querySelector(".nav__link"),
  dropdownRoot = dropdownItem?.querySelector(".dropdown"),
  breadcrumb = dropdownRoot?.querySelector(".dropdown__breadcrumb"),
  breadcrumbText = breadcrumb?.querySelector(".dropdown__breadcrumb-text"),
  breadcrumbBack = breadcrumb?.querySelector(".dropdown__breadcrumb-back");
let currentStep = "games",
  activeGameLabel = "",
  activePlatformLabel = "";
const updateBreadcrumb = () => {
    breadcrumb &&
      breadcrumbText &&
      ("games" === currentStep
        ? (breadcrumb.classList.remove("is-visible"),
          (breadcrumbText.textContent = ""))
        : "platforms" === currentStep
          ? (breadcrumb.classList.add("is-visible"),
            (breadcrumbText.textContent = activeGameLabel))
          : "services" === currentStep &&
            (breadcrumb.classList.add("is-visible"),
            (breadcrumbText.textContent =
              activeGameLabel + " › " + activePlatformLabel)));
  },
  goBack = () => {
    dropdownRoot &&
      ("services" === currentStep
        ? (dropdownRoot.classList.remove("has-platform"),
          dropdownRoot
            .querySelectorAll(".dropdown__item[data-platform]")
            .forEach((e) => e.classList.remove("is-active")),
          dropdownRoot
            .querySelectorAll(".dropdown__sublist[data-for]")
            .forEach((e) => e.classList.remove("is-active")),
          (currentStep = "platforms"))
        : "platforms" === currentStep &&
          (dropdownRoot.classList.remove("has-game", "has-platform"),
          dropdownRoot
            .querySelectorAll(".dropdown__item[data-game]")
            .forEach((e) => e.classList.remove("is-active")),
          dropdownRoot
            .querySelectorAll(".dropdown__platform-list[data-for-game]")
            .forEach((e) => e.classList.remove("is-active")),
          (currentStep = "games")),
      updateBreadcrumb());
  };
breadcrumbBack &&
  breadcrumbBack.addEventListener("click", (e) => {
    (e.stopPropagation(), goBack());
  });
const resetDropdownSteps = () => {
  dropdownRoot &&
    (dropdownRoot.classList.remove("has-game", "has-platform"),
    dropdownRoot
      .querySelectorAll(".dropdown__item[data-game]")
      .forEach((e) => e.classList.remove("is-active")),
    dropdownRoot
      .querySelectorAll(".dropdown__item[data-platform]")
      .forEach((e) => e.classList.remove("is-active")),
    dropdownRoot
      .querySelectorAll(".dropdown__platform-list[data-for-game]")
      .forEach((e) => e.classList.remove("is-active")),
    dropdownRoot
      .querySelectorAll(".dropdown__sublist[data-for]")
      .forEach((e) => e.classList.remove("is-active")),
    (currentStep = "games"),
    updateBreadcrumb());
};
dropdownLink &&
  (dropdownLink.addEventListener("click", (e) => {
    (e.preventDefault(),
      dropdownItem.classList.toggle("is-open"),
      dropdownItem.classList.contains("is-open") && resetDropdownSteps());
  }),
  document.addEventListener("click", (e) => {
    dropdownItem.contains(e.target) ||
      (dropdownItem.classList.remove("is-open"), resetDropdownSteps());
  }));
// ---- Dynamic nav dropdown ------------------------------------------
// Game / platform / service columns are populated from
// NB_SERVICES_BY_GAME (services-bootstrap.js) so any game the admin
// publishes shows up automatically. Event delegation on dropdownRoot
// means we don't have to rebind after the bootstrap rewrites the DOM.

const NB_PLATFORM_LABEL = {
  ps: "PlayStation 4 / 5",
  xbox: "Xbox One / Series",
  pc: "PC",
};
const NB_PLATFORM_ORDER = ["ps", "xbox", "pc"];
const NB_DROPDOWN_CHEVRON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" ' +
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<polyline points="9 18 15 12 9 6"/></svg>';

function nbEscDropdown(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nbGetServicesPagePath() {
  return window.location.pathname.includes("/pages/")
    ? "./services.html"
    : "./pages/services.html";
}

function nbBuildDropdownData() {
  if (!dropdownRoot) return;
  const byGame = window.NB_SERVICES_BY_GAME || {};
  const svcPath = nbGetServicesPagePath();

  // 1) Platforms — one <ul> per game, only the platforms with at
  //    least one service make the cut.
  const platformsContainer = dropdownRoot.querySelector(".dropdown__platforms");
  if (platformsContainer) {
    platformsContainer.innerHTML = Object.keys(byGame)
      .map(function (slug) {
        const buckets = byGame[slug] || {};
        const platforms = NB_PLATFORM_ORDER.filter(function (p) {
          return Array.isArray(buckets[p]) && buckets[p].length > 0;
        });
        if (platforms.length === 0) return "";
        const items = platforms
          .map(function (p) {
            return (
              '<li class="dropdown__item" data-platform="' +
              nbEscDropdown(p) +
              '" tabindex="0"><span>' +
              nbEscDropdown(NB_PLATFORM_LABEL[p] || p) +
              "</span>" +
              NB_DROPDOWN_CHEVRON +
              "</li>"
            );
          })
          .join("");
        return (
          '<ul class="dropdown__list dropdown__platform-list" data-for-game="' +
          nbEscDropdown(slug) +
          '">' +
          items +
          "</ul>"
        );
      })
      .join("");
  }

  // 2) Services — one <ul> per (game, platform). When user hovers a
  //    platform the matching list is toggled with .is-active.
  const subContainer = dropdownRoot.querySelector(".dropdown__sub");
  if (subContainer) {
    let html = "";
    Object.keys(byGame).forEach(function (slug) {
      const buckets = byGame[slug] || {};
      NB_PLATFORM_ORDER.forEach(function (platform) {
        const list = buckets[platform] || [];
        if (list.length === 0) return;
        const items = list
          .map(function (svc) {
            return (
              '<li class="dropdown__subitem"><a href="' +
              svcPath +
              "?service=" +
              encodeURIComponent(svc.serviceParam || "") +
              '">' +
              nbEscDropdown(svc.title || "") +
              "</a></li>"
            );
          })
          .join("");
        html +=
          '<ul class="dropdown__sublist" data-for="' +
          nbEscDropdown(slug) +
          '" data-platform="' +
          nbEscDropdown(platform) +
          '">' +
          items +
          "</ul>";
      });
    });
    subContainer.innerHTML = html;
  }
}

function nbSetActiveGame(slug) {
  if (!dropdownRoot) return;
  dropdownRoot.classList.add("has-game");
  dropdownRoot.classList.remove("has-platform");

  dropdownRoot
    .querySelectorAll(".dropdown__item[data-game]")
    .forEach(function (el) {
      el.classList.toggle("is-active", el.dataset.game === slug);
    });
  dropdownRoot
    .querySelectorAll(".dropdown__platform-list[data-for-game]")
    .forEach(function (el) {
      el.classList.toggle("is-active", el.dataset.forGame === slug);
    });
  dropdownRoot
    .querySelectorAll(".dropdown__sublist")
    .forEach(function (el) {
      el.classList.remove("is-active");
    });

  const tile = dropdownRoot.querySelector(
    ".dropdown__item[data-game].is-active",
  );
  activeGameLabel = (tile && tile.textContent.trim()) || slug;
  currentStep = "platforms";
  if (isMobileNav()) updateBreadcrumb();
}

function nbSetActivePlatform(platform) {
  if (!dropdownRoot) return;
  const activeGameEl = dropdownRoot.querySelector(
    ".dropdown__item[data-game].is-active",
  );
  if (!activeGameEl) return;
  const slug = activeGameEl.dataset.game;

  dropdownRoot.classList.add("has-platform");

  const activeList = dropdownRoot.querySelector(
    '.dropdown__platform-list[data-for-game="' + slug + '"]',
  );
  if (activeList) {
    activeList
      .querySelectorAll(".dropdown__item[data-platform]")
      .forEach(function (el) {
        el.classList.toggle("is-active", el.dataset.platform === platform);
      });
  }

  dropdownRoot
    .querySelectorAll(".dropdown__sublist")
    .forEach(function (el) {
      const matches =
        el.dataset.for === slug && el.dataset.platform === platform;
      el.classList.toggle("is-active", matches);
    });

  activePlatformLabel = NB_PLATFORM_LABEL[platform] || platform;
  currentStep = "services";
  if (isMobileNav()) updateBreadcrumb();
}

if (dropdownRoot) {
  // Capture mouseenter via mouseover delegation (mouseenter doesn't bubble).
  dropdownRoot.addEventListener("mouseover", function (e) {
    if (isMobileNav()) return;
    const gameItem = e.target.closest(".dropdown__item[data-game]");
    if (gameItem && dropdownRoot.contains(gameItem)) {
      nbSetActiveGame(gameItem.dataset.game);
      return;
    }
    const platformItem = e.target.closest(".dropdown__item[data-platform]");
    if (
      platformItem &&
      platformItem
        .closest(".dropdown__platform-list")
        ?.classList.contains("is-active")
    ) {
      nbSetActivePlatform(platformItem.dataset.platform);
    }
  });

  dropdownRoot.addEventListener("click", function (e) {
    const gameItem = e.target.closest(".dropdown__item[data-game]");
    if (gameItem) {
      nbSetActiveGame(gameItem.dataset.game);
      return;
    }
    const platformItem = e.target.closest(".dropdown__item[data-platform]");
    if (
      platformItem &&
      platformItem
        .closest(".dropdown__platform-list")
        ?.classList.contains("is-active")
    ) {
      nbSetActivePlatform(platformItem.dataset.platform);
      return;
    }
    const subLink = e.target.closest(".dropdown__subitem a[href]");
    if (subLink && subLink.href && !subLink.href.endsWith("#")) {
      dropdownItem?.classList.remove("is-open");
      if (isMobileNav()) {
        burger?.classList.remove("is-open");
        nav?.classList.remove("is-open");
        resetDropdownSteps();
      }
    }
  });

  dropdownRoot.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const gameItem = e.target.closest(".dropdown__item[data-game]");
    if (gameItem) {
      e.preventDefault();
      nbSetActiveGame(gameItem.dataset.game);
      return;
    }
    const platformItem = e.target.closest(".dropdown__item[data-platform]");
    if (
      platformItem &&
      platformItem
        .closest(".dropdown__platform-list")
        ?.classList.contains("is-active")
    ) {
      e.preventDefault();
      nbSetActivePlatform(platformItem.dataset.platform);
    }
  });

  // Rebuild whenever services finish loading. The dropdown__games
  // column is populated separately by games-bootstrap.js.
  window.addEventListener("nb:services-loaded", function () {
    nbBuildDropdownData();
    resetDropdownSteps();
  });

  // First paint: if NB_SERVICES_BY_GAME is already there (cache hit)
  // build immediately; otherwise wait for the event above.
  if (window.NB_SERVICES_BY_GAME) nbBuildDropdownData();
  resetDropdownSteps();
}
const faqItems = document.querySelectorAll(".faq-item");
if (faqItems.length) {
  const e = Array.from(faqItems).find((e) => e.classList.contains("is-open"));
  faqItems.forEach((t) => {
    const o = t.querySelector(".faq-item__trigger");
    o &&
      (e && t !== e && t.classList.remove("is-open"),
      o.setAttribute(
        "aria-expanded",
        t.classList.contains("is-open") ? "true" : "false",
      ),
      o.addEventListener("click", () => {
        const e = t.classList.contains("is-open");
        (faqItems.forEach((e) => {
          e.classList.remove("is-open");
          const t = e.querySelector(".faq-item__trigger");
          t && t.setAttribute("aria-expanded", "false");
        }),
          e ||
            (t.classList.add("is-open"),
            o.setAttribute("aria-expanded", "true")));
      }));
  });
}
const NB_CURRENCIES = {
    USD: { symbol: "$", rate: 1, label: "USA" },
    EUR: { symbol: "€", rate: 0.92, label: "EU" },
  },
  NB_CURRENCY_KEY = "nb_currency",
  nbGetCurrency = () => {
    const c = localStorage.getItem(NB_CURRENCY_KEY);
    return NB_CURRENCIES[c] ? c : "USD";
  },
  nbSetCurrency = (code) => {
    if (!NB_CURRENCIES[code]) return;
    localStorage.setItem(NB_CURRENCY_KEY, code);
    document.dispatchEvent(new CustomEvent("nb:currency-change", { detail: { currency: code } }));
  },
  nbConvertPrice = (usdAmt) => {
    const c = nbGetCurrency();
    return (Number(usdAmt) || 0) * NB_CURRENCIES[c].rate;
  },
  nbFormatPrice = (usdAmt) => {
    const c = nbGetCurrency(),
      cfg = NB_CURRENCIES[c],
      raw = (Number(usdAmt) || 0) * cfg.rate,
      val = c === "USD" ? raw.toFixed(2) : (Math.floor(raw) + 0.99).toFixed(2);
    return cfg.symbol + val;
  },
  nbCurrencySymbol = () => NB_CURRENCIES[nbGetCurrency()].symbol;
window.nbFormatPrice = nbFormatPrice;
window.nbConvertPrice = nbConvertPrice;
window.nbGetCurrency = nbGetCurrency;
window.nbSetCurrency = nbSetCurrency;
window.nbCurrencySymbol = nbCurrencySymbol;
window.NB_CURRENCIES = NB_CURRENCIES;
const NB_CART_KEY = "nb_cart",
  nbGetCart = () => {
    try {
      return JSON.parse(localStorage.getItem("nb_cart") || "[]");
    } catch {
      return [];
    }
  },
  nbSaveCart = (e) => {
    localStorage.setItem("nb_cart", JSON.stringify(e));
  };
window.NB_addToCart = (e) => {
  const t = nbGetCart(),
    o = (e.id || "") + "|" + (e.option || ""),
    r = t.find((e) => (e.id || "") + "|" + (e.option || "") === o);
  (r ? (r.qty = (r.qty || 1) + 1) : t.push({ ...e, qty: 1 }),
    nbSaveCart(t),
    nbUpdateCartBadges(),
    nbRenderCartWidget(),
    nbOpenCartWidget());
};
const nbIsInPages = () =>
    window.location.pathname.replace(/\\/g, "/").includes("/pages/"),
  nbCheckoutUrl = () =>
    nbIsInPages() ? "./checkout.html" : "./pages/checkout.html",
  nbImageUrl = (e) =>
    e ? (nbIsInPages() ? e : e.replace(/^\.\.\//g, "./")) : "",
  nbEscapeHtml = (e) => {
    const t = document.createElement("div");
    return ((t.textContent = e), t.innerHTML);
  },
  nbSanitizeBr = (e) =>
    e
      ? e
          .split(/(<br\s*\/?>)/gi)
          .map((t) => (/<br\s*\/?>/i.test(t) ? "<br>" : nbEscapeHtml(t)))
          .join("")
      : "",
  nbCartTotalQty= () => nbGetCart().reduce((e, t) => e + (t.qty || 1), 0),
  nbUpdateCartBadges = () => {
    const e = nbCartTotalQty(),
      t = e > 0,
      o = t ? "flex" : "none",
      r = t ? "" : "none";
    requestAnimationFrame(() => {
      (document
        .querySelectorAll(".cart__badge, .cart-float__badge")
        .forEach((t) => {
          ((t.textContent = e), (t.style.display = o));
        }),
        document.querySelectorAll(".cart-float").forEach((e) => {
          e.style.display = r;
        }));
    });
  },
  nbRenderCartWidget = () => {
    const e = document.getElementById("cart-widget-items"),
      t = document.getElementById("cart-widget-subtotal"),
      o = document.getElementById("cart-widget-count");
    if (!e) return;
    const r = nbGetCart(),
      s = nbCheckoutUrl();
    document
      .querySelectorAll(
        ".cart-widget__checkout-btn, .cart-widget__display-link",
      )
      .forEach((e) => {
        e.href = s;
      });
    const a = document.querySelectorAll(
      ".cart-widget__checkout-btn, .cart-widget__display-link",
    );
    if (!r.length)
      return (
        (e.innerHTML = '<p class="cart-widget__empty">Your cart is empty</p>'),
        t && (t.textContent = nbFormatPrice(0)),
        o && (o.textContent = "0 items"),
        void a.forEach((e) => {
          (e.removeAttribute("href"),
            (e.style.opacity = "0.4"),
            (e.style.pointerEvents = "none"));
        })
      );
    a.forEach((e) => {
      ((e.href = s), (e.style.opacity = ""), (e.style.pointerEvents = ""));
    });
    let n = 0,
      i = 0;
    const c = document.createDocumentFragment();
    (r.forEach((e, t) => {
      const o = Number(e.price) || 0,
        r = e.qty || 1;
      ((n += o * r), (i += r));
      const s = document.createElement("div");
      s.className = "cart-widget__item";
      const a = document.createElement("img");
      ((a.className = "cart-widget__item-img"),
        (a.src = nbImageUrl(e.image)),
        (a.alt = e.name || ""));
      const d = document.createElement("div");
      d.className = "cart-widget__item-info";
      const l = document.createElement("p");
      if (
        ((l.className = "cart-widget__item-name"),
        (l.textContent = e.name || ""),
        r > 1)
      ) {
        const e = document.createElement("span");
        ((e.className = "cart-widget__item-qty"),
          (e.textContent = "x" + r),
          d.appendChild(l),
          d.appendChild(e));
      } else d.appendChild(l);
      const m = document.createElement("span");
      ((m.className = "cart-widget__item-price"),
        (m.textContent = nbFormatPrice(o * r)),
        d.appendChild(m));
      const p = document.createElement("button");
      ((p.className = "cart-widget__item-remove"),
        p.setAttribute("aria-label", "Remove"),
        (p.textContent = "✕"),
        p.addEventListener("click", () => {
          const e = nbGetCart();
          (e[t] && e[t].qty > 1 ? (e[t].qty -= 1) : e.splice(t, 1),
            nbSaveCart(e),
            nbUpdateCartBadges(),
            nbRenderCartWidget());
        }),
        s.appendChild(a),
        s.appendChild(d),
        s.appendChild(p),
        c.appendChild(s));
    }),
      (e.innerHTML = ""),
      e.appendChild(c),
      t && (t.textContent = nbFormatPrice(n)),
      o && (o.textContent = i + " item" + (1 !== i ? "s" : "")));
  },
  nbGetScrollbarWidth = () =>
    window.innerWidth - document.documentElement.clientWidth,
  nbOpenCartWidget = () => {
    const e = document.getElementById("cart-widget");
    if (!e) return;
    nbRenderCartWidget();
    const t = nbGetScrollbarWidth();
    (document.documentElement.style.setProperty("--nb-scrollbar-w", t + "px"),
      document.documentElement.classList.add("nb-no-scroll"),
      e.classList.add("is-open"));
  },
  nbCloseCartWidget = () => {
    const e = document.getElementById("cart-widget");
    e &&
      (e.classList.remove("is-open"),
      document.documentElement.classList.remove("nb-no-scroll"));
  };
(document.querySelectorAll("[data-open-cart]").forEach((e) => {
  e.addEventListener("click", (e) => {
    (e.preventDefault(), nbOpenCartWidget());
  });
}),
  document
    .querySelector(".cart-widget__header")
    ?.addEventListener("click", nbCloseCartWidget),
  document
    .querySelector(".cart-widget__overlay")
    ?.addEventListener("click", nbCloseCartWidget),
  document.addEventListener("keydown", (e) => {
    "Escape" === e.key && nbCloseCartWidget();
  }),
  nbUpdateCartBadges(),
  nbRenderCartWidget(),
  document.addEventListener("click", (e) => {
    e.target.closest(
      '.footer__link[aria-disabled="true"], .footer__contact[aria-disabled="true"]',
    ) && e.preventDefault();
  }));
// Testimonials carousel uses native CSS scroll-snap for touch / trackpad
// (see styles/shared.css). Desktop users with only a mouse get a
// click-and-drag affordance on top of that — touch event handlers are
// deliberately untouched so mobile swipe keeps working unchanged.
{
  const DRAG_THRESHOLD_PX = 5;
  document.querySelectorAll(".testimonials__viewport").forEach((viewport) => {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let walked = 0;

    viewport.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDown = true;
      walked = 0;
      viewport.classList.add("is-grabbing");
      startX = e.pageX - viewport.offsetLeft;
      scrollLeft = viewport.scrollLeft;
    });

    viewport.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      const walk = e.pageX - viewport.offsetLeft - startX;
      walked = Math.abs(walk);
      if (walked > DRAG_THRESHOLD_PX) {
        e.preventDefault();
        viewport.scrollLeft = scrollLeft - walk;
      }
    });

    const stop = () => {
      if (!isDown) return;
      isDown = false;
      viewport.classList.remove("is-grabbing");
    };
    viewport.addEventListener("mouseup", stop);
    viewport.addEventListener("mouseleave", stop);

    // Swallow the click that fires at the end of a real drag so a drag
    // landing on an anchor/avatar doesn't navigate. Capture phase wins
    // against link handlers.
    viewport.addEventListener(
      "click",
      (e) => {
        if (walked > DRAG_THRESHOLD_PX) {
          e.preventDefault();
          e.stopPropagation();
          walked = 0;
        }
      },
      true,
    );
  });
}
{
  const e = document.querySelectorAll(".animated-border");
  if (e.length) {
    const t = new IntersectionObserver(
      (e) => {
        e.forEach((e) => {
          e.target.style.animationPlayState = e.isIntersecting
            ? "running"
            : "paused";
        });
      },
      { rootMargin: "100px" },
    );
    e.forEach((e) => t.observe(e));
  }
}
document.querySelectorAll('a[href^="mailto:"]').forEach((e) => {
  e.addEventListener("click", (t) => {
    const o = e.href.replace("mailto:", "").split("?")[0];
    navigator.clipboard?.writeText(o).then(() => {
      const e = document.createElement("div");
      ((e.textContent = "Email copied!"),
        (e.style.cssText =
          "position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#2de1fe,#6849fe);color:#fff;padding:1rem 2.4rem;border-radius:5rem;font-family:Poppins,sans-serif;font-size:1.4rem;font-weight:500;z-index:99999;opacity:0;transition:opacity .3s"),
        document.body.appendChild(e),
        requestAnimationFrame(() => (e.style.opacity = "1")),
        setTimeout(() => {
          ((e.style.opacity = "0"), setTimeout(() => e.remove(), 300));
        }, 2e3));
    });
  });
});
{
  const e = document.querySelector(".search"),
    t = document.querySelector(".search__input"),
    o = window.NB_SERVICE_CONFIG || {};
  if (e && t && Object.keys(o).length) {
    const r = window.location.pathname.includes("/pages/")
        ? "./services.html"
        : "./pages/services.html",
      s = Object.entries(o).map(([e, t]) => {
        const o = (t.titleHtml || "").replace(/<br\s*\/?>/g, " "),
          s = t.platform || "",
          a = [o, s, e, "gta", "gta5", "gta 5", "gta online"]
            .join(" ")
            .toLowerCase(),
          n = ((t.options || [])[0] || "").match(/\$([\d.]+)/),
          i = n ? `$${n[1]}` : "";
        return {
          id: e,
          title: o,
          platform: s,
          image: t.imageSrc || "",
          fromPrice: i,
          keywords: a,
          href: `${r}?service=${e}`,
        };
      }),
      a = document.createElement("div");
    ((a.className = "search__results"),
      a.setAttribute("role", "listbox"),
      e.appendChild(a));
    let n = -1,
      i = [];
    const c = (e) => {
        const t = e.trim().toLowerCase();
        if (((n = -1), !t))
          return (
            a.classList.remove("is-open"),
            (a.innerHTML = ""),
            void (i = [])
          );
        const o = t.split(/\s+/).filter(Boolean),
          r = s.filter((e) => o.every((t) => e.keywords.includes(t)));
        if (((i = r), !r.length))
          return (
            (a.innerHTML =
              '<div class="search__no-results">No services found</div>'),
            void a.classList.add("is-open")
          );
        const c = {};
        r.forEach((e) => {
          const t = e.platform || "Other";
          (c[t] || (c[t] = []), c[t].push(e));
        });
        let l = "",
          m = 0;
        for (const [e, t] of Object.entries(c))
          ((l += '<div class="search__result-group">'),
            (l += `<div class="search__result-label">${e}</div>`),
            t.forEach((e) => {
              ((l += `\n            <a class="search__result-item" href="${e.href}"\n               data-index="${m}" role="option">\n              <span class="search__result-name">${d(e.title, o)}</span>\n            </a>`),
                m++);
            }),
            (l += "</div>"));
        ((a.innerHTML = l), a.classList.add("is-open"));
      },
      d = (e, t) => {
        let o = e;
        return (
          t.forEach((e) => {
            const t = new RegExp(
              `(${e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
              "gi",
            );
            o = o.replace(t, "<strong>$1</strong>");
          }),
          o
        );
      },
      l = (e) => {
        const t = a.querySelectorAll(".search__result-item");
        (t.forEach((e) => e.classList.remove("is-focused")),
          e >= 0 && e < t.length
            ? ((n = e),
              t[e].classList.add("is-focused"),
              t[e].scrollIntoView({ block: "nearest" }))
            : (n = -1));
      };
    let m;
    (t.addEventListener("input", () => {
      (clearTimeout(m),
        (m = setTimeout(() => {
          c(t.value);
        }, 150)));
    }),
      t.addEventListener("keydown", (e) => {
        const o = i.length;
        if (o || "Escape" === e.key)
          if ("ArrowDown" === e.key)
            (e.preventDefault(), l(n < o - 1 ? n + 1 : 0));
          else if ("ArrowUp" === e.key)
            (e.preventDefault(), l(n > 0 ? n - 1 : o - 1));
          else if ("Enter" === e.key)
            if ((e.preventDefault(), n >= 0)) {
              const e = a.querySelectorAll(".search__result-item");
              e[n] && (window.location.href = e[n].href);
            } else 1 === i.length && (window.location.href = i[0].href);
          else "Escape" === e.key && (a.classList.remove("is-open"), t.blur());
      }),
      document.addEventListener("click", (t) => {
        e.contains(t.target) || a.classList.remove("is-open");
      }),
      t.addEventListener("focus", () => {
        t.value.trim() && c(t.value);
      }));
    const p = [
      "Cash Boost from $9.99",
      "Unlock All for PC",
      "Level Boost PS4/PS5",
      "Modded Account Xbox",
      "Cash + Cars Boost",
      "1 Billion GTA Cash",
    ];
    let u = 0,
      v = 0,
      f = !1,
      g = null;
    const b = () => {
        if (document.activeElement === t || t.value)
          return void (g = setTimeout(b, 1e3));
        const e = p[u];
        if (f) {
          if ((v--, v <= 0))
            return (
              (f = !1),
              (u = (u + 1) % p.length),
              void (g = setTimeout(b, 400))
            );
        } else if ((v++, v > e.length))
          return ((f = !0), void (g = setTimeout(b, 1800)));
        (t.setAttribute("placeholder", e.slice(0, v)),
          (g = setTimeout(b, f ? 35 : 75)));
      },
      h = () => {
        (clearTimeout(g), t.setAttribute("placeholder", ""));
      },
      w = () => {
        t.value || (g = setTimeout(b, 600));
      };
    (t.addEventListener("focus", h),
      t.addEventListener("blur", w),
      (g = setTimeout(b, 1e3)));
  }
}
document.querySelectorAll("img.skeleton").forEach((e) => {
  const t = () => e.classList.remove("skeleton");
  e.complete
    ? t()
    : (e.addEventListener("load", t, { once: !0 }),
      e.addEventListener("error", t, { once: !0 }));
});
{
  const e = document.querySelector(".hero__track"),
    t = document.querySelectorAll(".hero__dot");
  if (e && t.length > 1) {
    const o = e.querySelectorAll(".hero__slide").length;
    let r,
      s = 0,
      a = 0,
      n = !1;
    const i = (r) => {
        ((s = ((r % o) + o) % o),
          (e.style.transform = "translateX(-" + 100 * s + "%)"),
          t.forEach((e, t) => e.classList.toggle("is-active", t === s)));
      },
      c = () => {
        (clearInterval(r), (r = setInterval(() => i(s + 1), 5e3)));
      },
      d = () => clearInterval(r);
    t.forEach((e, t) =>
      e.addEventListener("click", () => {
        (i(t), c());
      }),
    );
    const l = e.closest(".hero__top");
    (l &&
      (l.addEventListener("mouseenter", d),
      l.addEventListener("mouseleave", c),
      l.addEventListener(
        "touchstart",
        (e) => {
          ((a = e.touches[0].clientX), (n = !0), d());
        },
        { passive: !0 },
      ),
      l.addEventListener(
        "touchend",
        (e) => {
          n &&
            ((n = !1),
            Math.abs(a - e.changedTouches[0].clientX) > 50 &&
              i(s + (a - e.changedTouches[0].clientX > 0 ? 1 : -1)),
            c());
        },
        { passive: !0 },
      )),
      c());
  }
}
(() => {
  function initSwitcher(id) {
    const sw = document.getElementById(id);
    if (!sw) return;
    const btn = sw.querySelector(".currency-switch__btn"),
      opts = sw.querySelectorAll(".currency-switch__option"),
      symEl = sw.querySelector(".currency-switch__active-symbol"),
      codeEl = sw.querySelector(".currency-switch__active-code");
    const row = sw.closest(".nav__currency-switch");
    const iconEl = row ? row.querySelector(".nav__currency-switch-icon") : null;
    const sync = () => {
      const cur = nbGetCurrency();
      symEl && (symEl.textContent = NB_CURRENCIES[cur].symbol);
      codeEl && (codeEl.textContent = cur);
      iconEl && (iconEl.textContent = NB_CURRENCIES[cur].symbol);
      opts.forEach((o) => {
        o.setAttribute("aria-selected", o.dataset.currency === cur ? "true" : "false");
      });
      btn && btn.setAttribute("aria-expanded", "false");
      sw.classList.remove("is-open");
    };
    btn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = sw.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
    opts.forEach((o) => {
      o.addEventListener("click", () => {
        nbSetCurrency(o.dataset.currency);
      });
    });
    document.addEventListener("click", (e) => {
      sw.contains(e.target) || (sw.classList.remove("is-open"), btn?.setAttribute("aria-expanded", "false"));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sw.classList.contains("is-open")) {
        sw.classList.remove("is-open");
        btn?.setAttribute("aria-expanded", "false");
        btn?.focus();
      }
    });
    document.addEventListener("nb:currency-change", sync);
    sync();
  }
  initSwitcher("currency-switch");
  initSwitcher("currency-switch-mobile");
})();
(() => {
  const els = document.querySelectorAll(".service-card__amount[data-usd]");
  if (!els.length) return;
  const update = () => els.forEach((el) => {
    const isEur = nbGetCurrency() === "EUR";
    el.textContent = (isEur && el.dataset.eur) ? ("€" + parseFloat(el.dataset.eur).toFixed(2)) : nbFormatPrice(el.dataset.usd);
  });
  update();
  document.addEventListener("nb:currency-change", update);
})();
document.addEventListener("nb:currency-change", () => {
  nbRenderCartWidget();
});
document.addEventListener("click", (e) => {
  if (e.target.closest("a, button")) return;
  const card = e.target.closest(".game-card, .service-card");
  if (!card) return;
  const link = card.querySelector("a[href]");
  if (!link || link.hasAttribute("disabled") || !link.href) return;
  const btn = card.querySelector("button[disabled]");
  if (btn) return;
  window.location.href = link.href;
});
