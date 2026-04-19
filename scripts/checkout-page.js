!(function () {
  const e = document.querySelector("#checkout-form"),
    t = document.querySelector("#checkout-form-hint"),
    o = document.querySelector("#order-subtotal"),
    r = document.querySelector("#order-list"),
    n = document.querySelector("#checkout-payment"),
    a = document.querySelector("#checkout-payment-btn"),
    c = document.querySelector("#checkout-payment-menu"),
    s = a ? a.closest(".checkout-form__select-wrap") : null,
    i = (e) => String(e || "").trim(),
    DISCOUNT_RATE = 0.05,
    USDT_VALUE = "USDT (TRC20)",
    discountRow = document.querySelector("#order-discount"),
    discountValueEl = document.querySelector("#order-discount-value");
    d = "nb_cart",
    l = (() => {
      try {
        return JSON.parse(localStorage.getItem(d) || "[]");
      } catch {
        return [];
      }
    })(),
    u = () => {
      if (!r) return;
      if (((r.innerHTML = ""), !l.length)) {
        const e = document.createElement("li");
        return (
          (e.className = "order-item"),
          (e.style.cssText =
            "text-align:center;color:rgba(255,255,255,0.5);padding:2rem 0;display:block;"),
          (e.textContent = "Your cart is empty"),
          r.appendChild(e),
          void (o && (o.textContent = "$0.00"))
        );
      }
      const isUsdt = i(n?.value) === USDT_VALUE;
      let e = 0;
      (l.forEach((t) => {
        const o = Number(t.price) || 0,
          n = t.qty || 1,
          itemTotal = o * n;
        e += itemTotal;
        const a = document.createElement("li");
        ((a.className = "order-item"),
          a.setAttribute("data-name", t.name || ""),
          a.setAttribute("data-price", o.toFixed(2)),
          a.setAttribute("data-qty", n),
          t.option && a.setAttribute("data-option", t.option));
        const c = document.createElement("img");
        ((c.className = "order-item__img"),
          (c.src = t.image || ""),
          (c.alt = t.name || ""),
          (c.loading = "lazy"));
        const s = document.createElement("div");
        s.className = "order-item__info";
        const i = document.createElement("p");
        ((i.className = "order-item__name"), (i.textContent = t.name || ""));
        const d = document.createElement("p");
        ((d.className = "order-item__meta"), (d.textContent = t.option || ""));
        const l = document.createElement("p");
        ((l.className = "order-item__qty"),
          (l.textContent = "x" + n),
          s.appendChild(i),
          t.option && s.appendChild(d),
          s.appendChild(l));
        const priceWrap = document.createElement("div");
        priceWrap.className = "order-item__price-wrap";
        const oldPrice = document.createElement("p");
        oldPrice.className = "order-item__price-old" + (isUsdt ? " is-visible" : "");
        oldPrice.textContent = "$" + itemTotal.toFixed(2);
        const u = document.createElement("p");
        ((u.className = "order-item__price"),
          (u.textContent = "$" + (isUsdt ? (itemTotal * (1 - DISCOUNT_RATE)).toFixed(2) : itemTotal.toFixed(2))),
          priceWrap.appendChild(oldPrice),
          priceWrap.appendChild(u),
          a.appendChild(c),
          a.appendChild(s),
          a.appendChild(priceWrap),
          r.appendChild(a));
      }),
        (() => {
          const discountAmt = e * DISCOUNT_RATE;
          const finalTotal = e - discountAmt;
          if (isUsdt) {
            discountRow && discountRow.classList.add("is-visible");
            discountValueEl && (discountValueEl.textContent = "-$" + discountAmt.toFixed(2));
            if (o) {
              o.innerHTML = '<span class="order__subtotal-value--original">$' + e.toFixed(2) + '</span>$' + finalTotal.toFixed(2);
            }
          } else {
            discountRow && discountRow.classList.remove("is-visible");
            o && (o.textContent = "$" + e.toFixed(2));
          }
        })());
    };
  if (
    (u(),
    (() => {
      if (!(n && a && c && s)) return;
      const e = Array.from(
          c.querySelectorAll(".checkout-form__select-option[data-value]"),
        ),
        t = (t) => {
          const o = i(t);
          n.value = o;
          const r = a.querySelector(".checkout-form__select-text");
          (r && (r.textContent = o || "Choose your payment method"),
            a.classList.toggle("has-value", Boolean(o)),
            e.forEach((e) => {
              const t = i(e.getAttribute("data-value")) === o;
              (e.setAttribute("aria-selected", String(t)),
                (e.tabIndex = t ? 0 : -1));
            }));
          u();
        },
        o = (t = !0) => {
          (s.classList.add("is-open"), a.setAttribute("aria-expanded", "true"));
          const o = t
              ? Math.max(
                  0,
                  e.findIndex(
                    (e) => "true" === e.getAttribute("aria-selected"),
                  ),
                )
              : 0,
            r = e[o];
          r && r.focus();
        },
        r = (e = !0) => {
          (s.classList.remove("is-open"),
            a.setAttribute("aria-expanded", "false"),
            e && a.focus());
        },
        d = () => s.classList.contains("is-open"),
        l = (t) => {
          const o = Math.max(0, Math.min(e.length - 1, t)),
            r = e[o];
          r && r.focus();
        };
      (a.addEventListener("click", () => {
        d() ? r(!1) : o(!0);
      }),
        a.addEventListener("keydown", (e) => {
          (("ArrowDown" !== e.key && "Enter" !== e.key && " " !== e.key) ||
            (e.preventDefault(), o(!0)),
            "Escape" === e.key && (e.preventDefault(), r(!1)));
        }),
        e.forEach((o, n) => {
          (o.addEventListener("click", () => {
            (t(o.getAttribute("data-value")), r(!0));
          }),
            o.addEventListener("keydown", (a) => {
              ("ArrowDown" === a.key && (a.preventDefault(), l(n + 1)),
                "ArrowUp" === a.key && (a.preventDefault(), l(n - 1)),
                "Home" === a.key && (a.preventDefault(), l(0)),
                "End" === a.key && (a.preventDefault(), l(e.length - 1)),
                ("Enter" !== a.key && " " !== a.key) ||
                  (a.preventDefault(), t(o.getAttribute("data-value")), r(!0)),
                "Escape" === a.key && (a.preventDefault(), r(!0)));
            }));
        }),
        document.addEventListener("click", (e) => {
          if (!d()) return;
          const t = e.target;
          t instanceof Node && (s.contains(t) || r(!1));
        }),
        document.addEventListener("keydown", (e) => {
          d() && "Escape" === e.key && (e.preventDefault(), r(!0));
        }),
        t(n.value));
    })(),
    !e)
  )
    return;
  const m = document.querySelector("#checkout-email"),
    p = document.querySelector("#checkout-discord"),
    y = e.querySelector(".checkout-form__agree"),
    h = /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    v = (e, t, o) => {
      e && e.classList.add("is-invalid");
      const r = document.querySelector("#" + t);
      r && ((r.textContent = o), r.classList.add("is-visible"));
    },
    f = (e, t) => {
      e && e.classList.remove("is-invalid");
      const o = document.querySelector("#" + t);
      o && ((o.textContent = ""), o.classList.remove("is-visible"));
    },
    k = () => {
      const e = i(m?.value);
      return e
        ? h.test(e)
          ? (f(m, "checkout-email-error"), !0)
          : (v(m, "checkout-email-error", "Please enter a valid email address"),
            !1)
        : (v(m, "checkout-email-error", "Please enter your email address"), !1);
    },
    b = () =>
      i(p?.value)
        ? (f(p, "checkout-discord-error"), !0)
        : (v(p, "checkout-discord-error", "Please enter your Discord username"),
          !1);
  if (
    (m &&
      (m.addEventListener("blur", () => {
        m.value && k();
      }),
      m.addEventListener("input", () => {
        m.classList.contains("is-invalid") && k();
      })),
    p &&
      (p.addEventListener("blur", () => {
        p.value && b();
      }),
      p.addEventListener("input", () => {
        p.classList.contains("is-invalid") && b();
      })),
    s &&
      (new MutationObserver(() => {
        n?.value &&
          s.classList.contains("is-invalid") &&
          f(s, "checkout-payment-error");
      }).observe(n, { attributes: !0, attributeFilter: ["value"] }),
      c?.addEventListener("click", () => {
        setTimeout(() => {
          n?.value && f(s, "checkout-payment-error");
        }, 50);
      })),
    y)
  ) {
    const t = e.querySelector(".checkout-form__checkbox");
    t &&
      t.addEventListener("change", () => {
        t.checked && y.classList.remove("is-invalid");
      });
  }
  e.addEventListener("submit", (o) => {
    o.preventDefault();
    const r = k(),
      a = b(),
      c = i(n?.value)
        ? (f(s, "checkout-payment-error"), !0)
        : (v(s, "checkout-payment-error", "Please select a payment method"),
          !1),
      m = (() => {
        const t = e.querySelector(".checkout-form__checkbox")?.checked;
        return t
          ? (y && y.classList.remove("is-invalid"), !0)
          : (y && y.classList.add("is-invalid"), !1);
      })();
    if (!(r && a && c && m)) {
      const t = e.querySelector(".is-invalid");
      return void (t && (t.querySelector("input, button") || t).focus());
    }
    if (!l.length) return void (t && (t.textContent = "Your cart is empty."));
    const p = new FormData(e),
      h = i(p.get("email")),
      g = i(p.get("discord")),
      E = i(p.get("telegram")),
      S = i(p.get("payment")),
      x = i(p.get("comment"));
    let L = 0;
    const isUsdtPayment = S === USDT_VALUE,
      q = {
        type: "checkout",
        email: h,
        discord: g,
        telegram: E,
        payment: S,
        items: l.map((e) => {
          const t = Number(e.price) || 0,
            o = e.qty || 1;
          return (
            (L += t * o),
            {
              name: e.name || "Service",
              option: e.option || "",
              qty: o,
              price: (t * o).toFixed(2),
            }
          );
        }),
        subtotal: L.toFixed(2),
        discount: isUsdtPayment ? (L * DISCOUNT_RATE).toFixed(2) : "0.00",
        discountPercent: isUsdtPayment ? 5 : 0,
        finalTotal: isUsdtPayment ? (L * (1 - DISCOUNT_RATE)).toFixed(2) : L.toFixed(2),
        comment: x,
      },
      _ = e.querySelector(".checkout-form__btn"),
      C = e.querySelectorAll("input, textarea, button, select");
    (C.forEach((e) => (e.disabled = !0)),
      _ && ((_.textContent = "SENDING..."), _.classList.add("is-loading")),
      t && (t.textContent = ""),
      fetch(window.NB_API_URL, { method: "POST", body: JSON.stringify(q) })
        .then((e) => e.json())
        .then((t) => {
          if ("ok" === t.status) {
            if (typeof gtag === "function") {
              gtag("event", "conversion", {
                send_to: "AW-18061608347/SR8uCNm5wZUcEJuLuaRD",
                value: parseFloat(q.finalTotal) || 1.0,
                currency: "USD",
              });
            }
            (e.reset(),
              localStorage.removeItem(d),
              u(),
              document
                .querySelectorAll(".cart-badge")
                .forEach((e) => (e.textContent = "0")),
              _ &&
                (_.classList.remove("is-loading"),
                (_.textContent = "SUBMIT ORDER"),
                (_.disabled = !1)),
              C.forEach((e) => (e.disabled = !1)));
            const o = document.querySelector("#order-modal"),
              r = document.querySelector("#order-modal-id"),
              n = document.querySelector("#order-modal-btn");
            if (o) {
              (r && (r.textContent = t.orderNumber || ""),
                o.classList.add("is-open"),
                o.setAttribute("aria-hidden", "false"),
                (document.body.style.overflow = "hidden"));
              const e = () => {
                (o.classList.remove("is-open"),
                  o.setAttribute("aria-hidden", "true"),
                  (document.body.style.overflow = ""));
                const e = window.location.pathname.includes("/pages/");
                window.location.href = e ? "./gta5.html" : "./pages/gta5.html";
              };
              n && n.addEventListener("click", e, { once: !0 });
            }
            return;
          }
          throw new Error(t.message || "Server error");
        })
        .catch(() => {
          (C.forEach((e) => (e.disabled = !1)),
            _ &&
              (_.classList.remove("is-loading"),
              (_.textContent = "SUBMIT ORDER")),
            t &&
              ((t.style.color = "#ff6b6b"),
              (t.textContent =
                "Something went wrong. Please try again or contact us via Discord.")));
        }));
  });
})();
