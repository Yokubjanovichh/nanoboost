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
        setOptions: (e, t) => {
          if (!s) return;
          const r = Array.isArray(e) ? e.filter(Boolean) : [];
          if (!r.length) return;
          const n = t && r.includes(t) ? t : r[0];
          ((s.innerHTML = ""),
            r.forEach((e) => {
              const t = document.createElement("button");
              ((t.type = "button"),
                (t.className = "service-dropdown__option"),
                t.setAttribute("role", "option"),
                (t.dataset.value = e));
              const r = e.lastIndexOf(" - ");
              if (-1 !== r) {
                const n = e.slice(0, r),
                  s = e.slice(r + 3);
                t.innerHTML = `<span class="service-dropdown__label">${nbEscapeHtml(n)}</span><span class="service-dropdown__price">${nbEscapeHtml(nbConvertPriceStr(s))}</span>`;
              } else t.textContent = e;
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
      s = document.querySelector(".service-details__title-bg text");
    if (n && e.titleHtml) {
      const t = e.titleHtml.replace(/<br\s*\/?>/g, " ");
      ((n.textContent = t), s && (s.textContent = "GTA Online"));
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
  renderRelatedServices = (e) => {
    const t = document.querySelector("#related-services-grid");
    if (!t) return;
    const r = SERVICE_CONFIG[e];
    if (!r) return;
    const n = r.platform || "",
      s = (e) => e.replace(/^gta-/, "").replace(/-(ps|xbox|pc)$/, ""),
      c = s(e),
      i = Object.entries(SERVICE_CONFIG)
        .filter(([t]) => t !== e)
        .map(([e, t]) => {
          let r = 0;
          const i = s(e);
          return (
            t.platform === n && (r += 10),
            i === c && (r += 5),
            (r += 1),
            { id: e, cfg: t, score: r }
          );
        })
        .sort((e, t) => t.score - e.score)
        .slice(0, 4);
    let o = i
      .map(
        ({ id: e, cfg: t }) => {
          const pic = buildPicture(
            t.imageSrcDesktop || t.imageSrc || "",
            t.imageSrcMobile || "",
            t.imageAlt || "",
            { className: "service-card__img", loading: "lazy" },
          );
          const amount = ((cfg) => {
            const m = ((cfg.options || [])[0] || "").match(/\$([\d.]+)/);
            return m
              ? window.nbFormatPrice
                ? window.nbFormatPrice(parseFloat(m[1]))
                : `$${m[1]}`
              : "";
          })(t);
          return `\n    <article class="service-card">\n      ${pic}\n      <div class="service-card__content">\n        <h3 class="service-card__name">${nbEscapeHtml((t.titleHtml || "").replace(/<br\s*\/?>/g, " "))}</h3>\n        <p class="service-card__price">\n          <span class="service-card__from">From</span>\n          <span class="service-card__amount">${amount}</span>\n        </p>\n        <a href="?service=${e}" class="service-card__btn" data-service="${e}">\n          BUY NOW\n        </a>\n      </div>\n    </article>`;
        },
      )
      .join("");
    ((o +=
      '\n    <article class="service-card service-card--custom">\n      <div class="service-card__content service-card__content--custom">\n        <h3 class="service-card__name service-card__name--custom">\n          NEED A CUSTOM SERVICE?\n        </h3>\n        <p class="service-card__text">\n          Tell our support team exactly what you want - we\'ll build a\n          personalized order around your goals.\n        </p>\n        <a href="./contact.html" class="service-card__btn service-card__btn--custom">\n          CONTACT SUPPORT\n        </a>\n      </div>\n    </article>'),
      (t.innerHTML = o));
  },
  applyServiceToHero = (e, { updateUrl: t = !1 } = {}) => {
    const r = SERVICE_CONFIG[e];
    if (!r) return !1;
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
          dropdownApi.setOptions(activeOptions, defaultOpt);
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
    if ((renderServiceContent(r), renderRelatedServices(e), t)) {
      const t = new URL(window.location.href);
      (t.searchParams.set("service", e),
        window.history.pushState({ service: e }, "", t));
    }
    return !0;
  },
  getServiceFromUrl = () => {
    const e = new URLSearchParams(window.location.search).get("service");
    return e && SERVICE_CONFIG[e] ? e : null;
  },
  initialService = getServiceFromUrl() || "gta-cash-cars-ps";
(applyServiceToHero(initialService),
  window.addEventListener("popstate", () => {
    const e = getServiceFromUrl() || "gta-cash-cars-ps";
    applyServiceToHero(e);
  }),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("a.service-card__btn");
    if (!t) return;
    if (t.classList.contains("service-card__btn--custom")) return;
    const r = t.dataset.service,
      n = r && SERVICE_CONFIG[r] ? r : null;
    n &&
      (e.preventDefault(),
      applyServiceToHero(n, { updateUrl: !0 }) &&
        document
          .querySelector(".service-hero")
          ?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }));
const purchaseForm = document.querySelector(".service-hero__purchase");
purchaseForm &&
  purchaseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = getServiceFromUrl() || "gta-cash-cars-ps",
      r = SERVICE_CONFIG[t];
    if (!r) return;
    const n = purchaseForm.querySelector('input[name="option"]'),
      s = n?.value || r.defaultOption || "",
      c = s.match(/\$([\d.]+)/),
      i = c ? parseFloat(c[1]) : 0,
      o = document.createElement("div");
    o.innerHTML = nbSanitizeBr(r.titleHtml || "");
    const a = o.textContent.trim();
    "function" == typeof window.NB_addToCart &&
      window.NB_addToCart({
        id: t,
        name: a,
        price: i,
        image: r.imageSrcDesktop || r.imageSrc || "",
        option: s,
      });
  });
document.addEventListener("nb:currency-change", () => {
  const svc = getServiceFromUrl();
  if (!svc) return;
  const cfg = SERVICE_CONFIG[svc];
  if (cfg && dropdownApi) {
    const isEur = window.nbGetCurrency && window.nbGetCurrency() === "EUR";
    const sel = purchaseForm?.querySelector('input[name="option"]')?.value;
    const activeOptions = (isEur && cfg.eurOptions?.length) ? cfg.eurOptions : cfg.options;
    dropdownApi.setOptions(activeOptions, sel && activeOptions.includes(sel) ? sel : activeOptions[0]);
  }
  renderRelatedServices(svc);
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
