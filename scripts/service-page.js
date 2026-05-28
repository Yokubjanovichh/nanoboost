function buildPicture(desktop, mobile, alt, opts) {
  const o = opts || {};
  const cls = o.className ? ` class="${o.className}"` : "";
  const w = o.width ? ` width="${o.width}"` : "";
  const h = o.height ? ` height="${o.height}"` : "";
  const fp = o.fetchpriority ? ` fetchpriority="${o.fetchpriority}"` : "";
  const ld = o.loading ? ` loading="${o.loading}"` : "";
  const dec = o.decoding ? ` decoding="${o.decoding}"` : "";
  const desk = nbEscapeHtml(desktop || "");
  const mob = nbEscapeHtml(mobile || desktop || "");
  const altSafe = nbEscapeHtml(alt || "");
  return `<picture><source media="(max-width: 768px)" srcset="${mob}"><img src="${desk}" alt="${altSafe}"${cls}${w}${h}${fp}${ld}${dec}></picture>`;
}
const SERVICE_CONFIG = window.NB_SERVICE_CONFIG || {},
  initServiceDropdown = (e) => {
    if (!e) return null;
    const nbConvertPriceStr = (str) => {
      if (!window.nbFormatPrice) return str;
      const m = str.match(/\$([\d.]+)/);
      return m ? window.nbFormatPrice(parseFloat(m[1])) : str;
    };
    const t = e.querySelector('input[name="option"]'),
      r = e.querySelector(".service-dropdown__trigger"),
      n = e.querySelector(".service-dropdown__value"),
      s = e.querySelector(".service-dropdown__menu"),
      c = () => Array.from(e.querySelectorAll(".service-dropdown__option")),
      i = () => {
        (e.classList.remove("is-open"),
          r?.setAttribute("aria-expanded", "false"));
      },
      o = () => {
        (e.classList.add("is-open"), r?.setAttribute("aria-expanded", "true"));
      },
      a = (e) => {
        if (
          (c().forEach((t) => {
            const r = t.dataset.value || t.textContent.trim();
            t.setAttribute("aria-selected", r === e ? "true" : "false");
          }),
          t && (t.value = e),
          n)
        ) {
          const t = e.lastIndexOf(" - ");
          if (-1 !== t) {
            const r = e.slice(0, t),
              s = e.slice(t + 3);
            n.innerHTML = `<span class="service-dropdown__label">${nbEscapeHtml(r)}</span><span class="service-dropdown__price">${nbEscapeHtml(nbConvertPriceStr(s))}</span>`;
          } else n.textContent = e;
        }
      };
    return (
      r?.addEventListener("click", () => {
        e.classList.contains("is-open") ? i() : o();
      }),
      s?.addEventListener("click", (e) => {
        const t = e.target.closest(".service-dropdown__option");
        if (!t) return;
        const n = t.dataset.value || t.textContent.trim();
        (a(n), i(), r?.focus());
      }),
      e.addEventListener("keydown", (t) => {
        if ("Escape" === t.key) return (i(), void r?.focus());
        if ("ArrowDown" !== t.key && "ArrowUp" !== t.key) return;
        const n = c();
        if (!n.length) return;
        t.preventDefault();
        const s = n.findIndex(
            (e) => "true" === e.getAttribute("aria-selected"),
          ),
          l = "ArrowDown" === t.key ? 1 : -1,
          d = s < 0 ? 0 : (s + l + n.length) % n.length,
          p = n[d].dataset.value || n[d].textContent.trim();
        (a(p),
          e.classList.contains("is-open") || o(),
          n[d].scrollIntoView({ block: "nearest" }));
      }),
      document.addEventListener("click", (t) => {
        e.contains(t.target) || i();
      }),
      {
        close: i,
        open: o,
        // setOptions(stringOptions, selectedStr, optionsRich?)
        // stringOptions: array of "Label - $X.XX" or "Label - €X.XX" — used
        // for dataset.value (cart-submission contract) and as the default
        // visible price token.
        // optionsRich: optional structured array (NB_API.adaptService output)
        // with discount metadata. When an entry has hasDiscount=true, the
        // row renders Label · -N% · <strikethrough original> · final.
        setOptions: (e, t, richArr) => {
          if (!s) return;
          const r = Array.isArray(e) ? e.filter(Boolean) : [];
          if (!r.length) return;
          const n = t && r.includes(t) ? t : r[0];
          const isEur =
            typeof window.nbGetCurrency === "function" &&
            window.nbGetCurrency() === "EUR";
          ((s.innerHTML = ""),
            r.forEach((e, idx) => {
              const t = document.createElement("button");
              ((t.type = "button"),
                t.setAttribute("role", "option"),
                (t.dataset.value = e));
              const rich = Array.isArray(richArr) ? richArr[idx] : null;
              const dashIdx = e.lastIndexOf(" - ");
              const labelText = dashIdx !== -1 ? e.slice(0, dashIdx) : e;
              const priceText =
                dashIdx !== -1 ? e.slice(dashIdx + 3) : "";
              if (rich && rich.hasDiscount) {
                t.className =
                  "service-dropdown__option service-dropdown__option--has-discount";
                const origRaw = isEur
                  ? Number(rich.priceEur).toFixed(2)
                  : Number(rich.priceUsd).toFixed(2);
                const origSym = isEur ? "€" : "$";
                const finalShown = nbConvertPriceStr(priceText);
                t.innerHTML =
                  '<span class="option-label service-dropdown__label">' +
                  nbEscapeHtml(labelText) +
                  "</span>" +
                  '<span class="option-discount-badge">-' +
                  Number(rich.discountPercent) +
                  "%</span>" +
                  '<span class="option-price-original">' +
                  origSym +
                  origRaw +
                  "</span>" +
                  '<span class="option-price-final service-dropdown__price">' +
                  nbEscapeHtml(finalShown) +
                  "</span>";
              } else {
                t.className = "service-dropdown__option";
                if (dashIdx !== -1) {
                  t.innerHTML =
                    '<span class="service-dropdown__label">' +
                    nbEscapeHtml(labelText) +
                    '</span><span class="service-dropdown__price">' +
                    nbEscapeHtml(nbConvertPriceStr(priceText)) +
                    "</span>";
                } else {
                  t.textContent = e;
                }
              }
              (t.setAttribute("aria-selected", e === n ? "true" : "false"),
                s.appendChild(t));
            }),
            a(n),
            i());
        },
        setSelectedValue: a,
      }
    );
  },
  dropdownApi = initServiceDropdown(
    document.querySelector(".service-dropdown"),
  ),
  renderServiceContent = (e, t) => {
    if (!e) return;
    const r = document.querySelector(".service-details__body");
    r &&
      e.description &&
      (r.innerHTML = e.description
        .map((e) => `<p class="service-details__text">${nbEscapeHtml(e)}</p>`)
        .join(""));
    const n = document.querySelector(".service-details__title-fg"),
      s = document.querySelector(".service-details__title-bg text"),
      titleBgSvg = document.querySelector(".service-details__title-bg");
    if (n && e.titleHtml) {
      const t = e.titleHtml.replace(/<br\s*\/?>/g, " ");
      n.textContent = t;
      if (s && titleBgSvg) {
        // SVG ships with visibility: hidden in the HTML so the page
        // never flashes a stale game label. Reveal it only once we
        // know which game's name to paint.
        const bgLabel = String(e.gameName || "").trim();
        if (bgLabel) {
          s.textContent = bgLabel.toUpperCase();
          titleBgSvg.style.visibility = "visible";
        } else {
          s.textContent = "";
          titleBgSvg.style.visibility = "hidden";
        }
      }
    }
    const c = document.querySelector(".service-what__grid");
    c &&
      e.whatYouGet &&
      (c.innerHTML = e.whatYouGet
        .map(
          (e) =>
            `\n      <article class="service-what__card" role="listitem">\n        <h3 class="service-what__card-title">${nbEscapeHtml(e.title)}</h3>\n        <p class="service-what__card-lead">${nbEscapeHtml(e.lead)}</p>\n        <ul class="service-what__list">\n          ${e.items.map((e) => `<li class="service-what__item">${nbEscapeHtml(e)}</li>`).join("")}\n        </ul>\n      </article>\n    `,
        )
        .join(""));
    const i = document.querySelector(".service-what__sections");
    i &&
      e.sections &&
      (i.innerHTML = e.sections
        .map(
          (e) =>
            `\n      <article class="service-what__section">\n        <h3 class="service-what__section-title">${nbEscapeHtml(e.title)}</h3>\n        ${e.texts.map((e) => `<p class="service-what__section-text">${nbEscapeHtml(e)}</p>`).join("")}\n      </article>\n    `,
        )
        .join(""));
  },
  // "Hot right now" on the service page is rendered by services-bootstrap
  // from /public/services?featured=true so the homepage and this page
  // always show the same admin-curated set. The legacy per-service
  // "related" picker (score by platform + family + base) lived here and
  // produced a different list every navigation — it's gone now.
  // Reveals the "< GameName" pill above the hero once the service config
  // resolves. Hidden by default so it never sits empty during the initial
  // skeleton frame; updated again on every dropdown switch (cross-game
  // services would otherwise keep the stale game name).
  updateBackToGameButton = (cfg) => {
    const btn = document.getElementById("service-back-to-game");
    if (!btn) return;
    const slug = (cfg && cfg.gameSlug) || "";
    const name = (cfg && cfg.gameName) || "";
    if (!slug || !name) {
      btn.hidden = true;
      return;
    }
    btn.href = "./game.html?game=" + encodeURIComponent(slug);
    btn.dataset.gameSlug = slug;
    btn.setAttribute("aria-label", "Back to " + name);
    const label = btn.querySelector(".service-back__label");
    if (label) label.textContent = name;
    btn.hidden = false;
  },
  applyServiceToHero = (e, { updateUrl: t = !1 } = {}) => {
    const r = SERVICE_CONFIG[e];
    if (!r) return !1;
    updateBackToGameButton(r);
    if (window.NB_SEO) window.NB_SEO.applyServiceSEO(Object.assign({}, r, { slug: e }));
    const n = document.querySelector("#service-hero-title"),
      frame = document.querySelector(".service-hero__image-frame");
    if (n && r.titleHtml) n.innerHTML = nbSanitizeBr(r.titleHtml);
    const heroDesktop = r.imageSrcDesktop || r.imageSrc || "";
    const heroMobile = r.imageSrcMobile || "";
    if (frame && heroDesktop) {
      // Preload the new hero image before swapping it in so the user
      // doesn't see the previous service's image flash through the smooth
      // scroll. If the network is slow we still cap the wait at 1.5s so the
      // page never feels stuck.
      const swap = () => {
        frame.innerHTML = buildPicture(heroDesktop, heroMobile, r.imageAlt || "", {
          className: "service-hero__image",
          width: 1536,
          height: 1024,
          fetchpriority: "high",
          loading: "eager",
          decoding: "async",
        });
      };
      const preload = new Image();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        swap();
      };
      preload.onload = finish;
      preload.onerror = finish;
      preload.src = heroDesktop;
      setTimeout(finish, 1500);
    }
    if (
      (dropdownApi &&
        r.options?.length &&
        (() => {
          const isEur = window.nbGetCurrency && window.nbGetCurrency() === "EUR";
          const activeOptions = (isEur && r.eurOptions?.length) ? r.eurOptions : r.options;
          const defaultOpt = (isEur && r.eurOptions?.length) ? r.eurOptions[0] : r.defaultOption;
          dropdownApi.setOptions(activeOptions, defaultOpt, r.optionsRich);
        })(),
      r.seoTitle)
    ) {
      document.title = r.seoTitle;
      const e = document.querySelector('meta[property="og:title"]');
      e && e.setAttribute("content", r.seoTitle);
    }
    if (r.seoDescription) {
      const e = document.querySelector('meta[name="description"]');
      e && e.setAttribute("content", r.seoDescription);
      const t = document.querySelector('meta[property="og:description"]');
      t && t.setAttribute("content", r.seoDescription);
    }
    if ((renderServiceContent(r), t)) {
      const t = new URL(window.location.href);
      (t.searchParams.set("service", e),
        window.history.pushState({ service: e }, "", t));
    }
    if (typeof window.nbTrack === "function") {
      const defaultStr = r.defaultOption || (r.options || [])[0] || "";
      const m = defaultStr.match(/\$([\d.]+)/);
      const priceUsd = m ? parseFloat(m[1]) : 0;
      const titleTxt = (r.titleHtml || "")
        .replace(/<br\s*\/?>/g, " ")
        .replace(/<[^>]+>/g, "")
        .trim();
      window.nbTrack("view_item", {
        currency: "USD",
        value: priceUsd,
        items: [
          {
            item_id: e,
            item_name: titleTxt,
            item_category: r.platform || "",
            price: priceUsd,
            quantity: 1,
          },
        ],
      });
    }
    return !0;
  },
  getServiceFromUrl = () => {
    const e = new URLSearchParams(window.location.search).get("service");
    return e && SERVICE_CONFIG[e] ? e : null;
  },
  getRequestedSlug = () =>
    new URLSearchParams(window.location.search).get("service") ||
    "gta-cash-cars-ps",
  initialService = getServiceFromUrl() || "gta-cash-cars-ps";

// Render a friendly empty state inside the hero when the requested
// service can't be loaded (404, network down, malformed payload, …).
// Two variants: "not-found" (slug doesn't exist) and "error" (transient
// network/server issue with a retry CTA).
function renderServiceErrorState(variant, slug) {
  const main = document.querySelector("#main-content");
  if (!main) return;
  const isNotFound = variant === "not-found";
  const heading = isNotFound ? "Service not found" : "Failed to load service";
  const message = isNotFound
    ? "We couldn't find the service you're looking for. It may have been removed or the link is incorrect."
    : "Something went wrong while loading this service. Please check your connection and try again.";
  const actions = isNotFound
    ? '<a class="service-error__btn" href="/#games">Choose a game</a>'
    : '<button class="service-error__btn" type="button" data-action="retry-service">Try again</button>' +
      '<a class="service-error__btn service-error__btn--ghost" href="./contact.html">Contact support</a>';
  main.innerHTML =
    '<section class="service-error container" role="alert" aria-live="polite">' +
    '<div class="service-error__inner">' +
    '<div class="service-error__icon" aria-hidden="true">' +
    (isNotFound ? "🔍" : "⚠️") +
    "</div>" +
    '<h1 class="service-error__title">' +
    nbEscapeHtml(heading) +
    "</h1>" +
    '<p class="service-error__text">' +
    nbEscapeHtml(message) +
    "</p>" +
    (slug
      ? '<p class="service-error__hint">Requested: <code>' +
        nbEscapeHtml(slug) +
        "</code></p>"
      : "") +
    '<div class="service-error__actions">' +
    actions +
    "</div>" +
    "</div>" +
    "</section>";
  const retryBtn = main.querySelector('[data-action="retry-service"]');
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      window.location.reload();
    });
  }
}

// Cache-first then network. Returns the adapted config or null on failure.
// On 404 / network error we render an inline empty state so the user has
// a path forward instead of a blank/stuck hero.
async function loadService(slug) {
  if (!slug) return null;
  if (window.NB_SERVICE_CONFIG && window.NB_SERVICE_CONFIG[slug]) {
    return window.NB_SERVICE_CONFIG[slug];
  }
  if (!window.NB_API || typeof window.NB_API.fetchService !== "function") {
    renderServiceErrorState("error", slug);
    return null;
  }
  try {
    const raw = await window.NB_API.fetchService(slug);
    const adapted = window.NB_API.adaptService(raw);
    if (!adapted) {
      renderServiceErrorState("not-found", slug);
      return null;
    }
    window.NB_SERVICE_CONFIG = window.NB_SERVICE_CONFIG || {};
    window.NB_SERVICE_CONFIG[slug] = adapted;
    SERVICE_CONFIG[slug] = adapted;
    return adapted;
  } catch (err) {
    if (err && err.status === 404) {
      renderServiceErrorState("not-found", slug);
    } else {
      renderServiceErrorState("error", slug);
      if (console && typeof console.error === "function") {
        console.error("[NB] loadService failed:", err);
      }
    }
    return null;
  }
}

// Hero + related-services skeletons: drop in placeholders so the page
// isn't blank (or showing the wrong hardcoded service) while the API
// resolves. applyServiceToHero swaps both in once the data arrives.
(() => {
  const frame = document.querySelector(".service-hero__image-frame");
  if (frame) {
    frame.innerHTML =
      '<div class="service-hero__image service-hero__image--skeleton skeleton" aria-hidden="true"></div>';
  }
  // The "Hot right now" grid at the bottom of the page is painted with
  // skeletons + filled by services-bootstrap.js (same code path as the
  // homepage), so we no longer need to seed anything here.
})();
// Kick off a single-service fetch right away (don't wait for the bulk
// /public/services bootstrap to finish). 20× smaller payload, sub-second
// TTFB on cached Redis HIT. Bootstrap still runs in parallel for cart /
// header / related-services hydration.
(async () => {
  const slug = getRequestedSlug();
  const cfg = await loadService(slug);
  if (cfg) {
    applyServiceToHero(slug);
    window.dispatchEvent(
      new CustomEvent("nb:service-loaded", { detail: { slug, cfg } }),
    );
  }
})();
window.addEventListener("popstate", async () => {
  const slug = getRequestedSlug();
  const cfg = await loadService(slug);
  if (cfg) {
    applyServiceToHero(slug);
    window.dispatchEvent(
      new CustomEvent("nb:service-loaded", { detail: { slug, cfg } }),
    );
  }
});
document.addEventListener("click", async (e) => {
  const t = e.target.closest("a.service-card__btn");
  if (!t) return;
  if (t.classList.contains("service-card__btn--custom")) return;
  const slug = t.dataset.service;
  if (!slug) return;
  e.preventDefault();
  const cfg = await loadService(slug);
  if (cfg && applyServiceToHero(slug, { updateUrl: true })) {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }
});
const purchaseForm = document.querySelector(".service-hero__purchase");
purchaseForm &&
  purchaseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = getServiceFromUrl() || "gta-cash-cars-ps",
      r = SERVICE_CONFIG[t];
    if (!r) return;
    const n = purchaseForm.querySelector('input[name="option"]'),
      s = n?.value || r.defaultOption || "",
      // Cart stores both currencies straight from the backend so the
      // widget can display admin-controlled charm pricing in either
      // mode without a client-side conversion (which used to silently
      // turn $0.00 into €0.99 because of a Math.floor + .99 trick).
      variantLabel = s.split(" - ")[0].trim(),
      rawOpt =
        (r.optionsRaw || []).find((o) => o && o.label === variantLabel) ||
        (r.optionsRaw || [])[0],
      // priceUsd/priceEur are the POST-discount prices customer actually
      // pays — these drive subtotal in cart + checkout. originalPrice*
      // ride alongside so the checkout renderer can show a strikethrough
      // when the admin set a per-option discount.
      computed =
        window.NB_API && typeof window.NB_API.computeOptionFinal === "function"
          ? window.NB_API.computeOptionFinal(rawOpt || {})
          : {
              finalUsd: Number(rawOpt && rawOpt.price_usd) || 0,
              finalEur: Number(rawOpt && rawOpt.price_eur) || 0,
              originalUsd: Number(rawOpt && rawOpt.price_usd) || 0,
              originalEur: Number(rawOpt && rawOpt.price_eur) || 0,
              discountPercent: 0,
              hasDiscount: false,
            },
      priceUsd = computed.finalUsd,
      priceEur = computed.finalEur,
      o = document.createElement("div");
    o.innerHTML = nbSanitizeBr(r.titleHtml || "");
    const a = o.textContent.trim();
    "function" == typeof window.NB_addToCart &&
      window.NB_addToCart({
        id: t,
        name: a,
        priceUsd: priceUsd,
        priceEur: priceEur,
        originalPriceUsd: computed.originalUsd,
        originalPriceEur: computed.originalEur,
        discountPercent: computed.discountPercent,
        hasDiscount: Boolean(computed.hasDiscount),
        image: r.imageSrcDesktop || r.imageSrc || "",
        option: s,
      });
    if (typeof window.nbTrack === "function") {
      window.nbTrack("add_to_cart", {
        currency: "USD",
        value: priceUsd,
        items: [
          {
            item_id: t,
            item_name: a,
            item_category: r.platform || "",
            item_variant: variantLabel,
            price: priceUsd,
            quantity: 1,
          },
        ],
      });
    }
  });
document.addEventListener("nb:currency-change", () => {
  const svc = getServiceFromUrl();
  if (!svc) return;
  const cfg = SERVICE_CONFIG[svc];
  if (cfg && dropdownApi) {
    const isEur = window.nbGetCurrency && window.nbGetCurrency() === "EUR";
    const sel = purchaseForm?.querySelector('input[name="option"]')?.value;
    const activeOptions = (isEur && cfg.eurOptions?.length) ? cfg.eurOptions : cfg.options;
    dropdownApi.setOptions(
      activeOptions,
      sel && activeOptions.includes(sel) ? sel : activeOptions[0],
      cfg.optionsRich,
    );
  }
});

// services-bootstrap.js fires this after /public/services resolves.
window.addEventListener("nb:services-loaded", () => {
  Object.keys(SERVICE_CONFIG).forEach((k) => delete SERVICE_CONFIG[k]);
  Object.assign(SERVICE_CONFIG, window.NB_SERVICE_CONFIG || {});
  const svc = getServiceFromUrl() || initialService;
  if (svc && SERVICE_CONFIG[svc]) {
    applyServiceToHero(svc);
  }
});

// Fire GA4 once when the user uses the back pill — navigation itself is
// handled by the native <a href>, this listener just records intent.
(() => {
  const btn = document.getElementById("service-back-to-game");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (typeof window.nbTrack !== "function") return;
    const slug = getRequestedSlug();
    const cfg = SERVICE_CONFIG[slug];
    window.nbTrack("nav_back_to_game", {
      from_service: slug,
      to_game: btn.dataset.gameSlug || (cfg && cfg.gameSlug) || "",
    });
  });
})();
