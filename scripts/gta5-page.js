const GTA5_SERVICES = window.NB_GTA5_SERVICES || { ps: [], pc: [], xbox: [] },
  getInitialPlatform = () => {
    const e = new URL(window.location.href).searchParams.get("platform");
    return "ps" === e || "pc" === e || "xbox" === e ? e : "ps";
  },
  setUrlPlatform = (e) => {
    const t = new URL(window.location.href);
    (t.searchParams.set("platform", e),
      window.history.replaceState({ platform: e }, "", t));
  },
  renderCards = (e) => {
    const t = document.querySelector("#gta5-services-grid");
    if (!t) return;
    const a = GTA5_SERVICES[e] || [];
    ((t.innerHTML = ""),
      a.forEach((e) => {
        const a = document.createElement("article");
        a.className = "service-card";
        const r = document.createElement("img");
        ((r.className = "service-card__img"),
          (r.src = e.imageSrc),
          (r.alt = e.imageAlt),
          (r.loading = "lazy"));
        const c = document.createElement("div");
        c.className = "service-card__content";
        const n = document.createElement("h3");
        ((n.className = "service-card__name"), (n.textContent = e.title));
        const s = document.createElement("p");
        s.className = "service-card__price";
        const isEur = window.nbGetCurrency && window.nbGetCurrency() === "EUR";
        const o = document.createElement("span");
        const rawUsd = parseFloat((e.priceNow || "").replace(/[^0-9.]/g, "")) || 0;
        ((o.className = "service-card__amount"),
          (o.textContent = (isEur && e.eurPriceNow) ? e.eurPriceNow : (window.nbFormatPrice ? window.nbFormatPrice(rawUsd) : e.priceNow)),
          s.appendChild(o));
        const i = document.createElement("a");
        ((i.className = "service-card__btn"),
          (i.href = `./services.html?service=${encodeURIComponent(e.serviceParam)}`),
          (i.dataset.service = e.serviceParam),
          (i.textContent = "BUY NOW"),
          c.appendChild(n),
          c.appendChild(s),
          c.appendChild(i),
          a.appendChild(r),
          a.appendChild(c),
          t.appendChild(a));
      }));
  },
  setActiveTab = (e) => {
    Array.from(document.querySelectorAll(".gta5-intro__tab")).forEach((t) => {
      const a = t.dataset.platform === e;
      (t.classList.toggle("is-active", a),
        t.setAttribute("aria-selected", a ? "true" : "false"));
    });
  },
  initGta5Tabs = () => {
    const e = Array.from(document.querySelectorAll(".gta5-intro__tab"));
    if (!e.length) return;
    const t = (e, { updateUrl: t = !0 } = {}) => {
      (setActiveTab(e), renderCards(e), t && setUrlPlatform(e));
    };
    e.forEach((e) => {
      e.addEventListener("click", () => {
        const a = e.dataset.platform;
        a && t(a);
      });
    });
    const a = getInitialPlatform();
    (t(a, { updateUrl: !1 }),
      window.addEventListener("popstate", () => {
        const e = getInitialPlatform();
        t(e, { updateUrl: !1 });
      }));
  };
initGta5Tabs();
document.addEventListener("nb:currency-change", () => {
  const p = new URL(window.location.href).searchParams.get("platform");
  renderCards(p === "pc" || p === "xbox" ? p : "ps");
});
