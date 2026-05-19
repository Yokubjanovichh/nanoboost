!(function () {
  const e = document.querySelector("#contact-form"),
    t = document.querySelector("#contact-form-hint"),
    o = document.querySelector("#contact-dropdown"),
    a = document.querySelector("#contact-social-input"),
    n = document.querySelector("#contact-email"),
    msg = document.querySelector("#contact-comment"),
    msgCounter = document.querySelector("#contact-comment-counter");
  if (!e || !o) return;
  // Mirrors the backend's Pydantic constraint (Field(..., min_length=10))
  // so the user sees the rule inline before the wire request fires —
  // otherwise a too-short message comes back as a generic 422 and the
  // catch-all "Something went wrong" banner, with no clue what's wrong.
  const MSG_MIN = 10;
  const r = o.querySelector(".contact-dropdown__trigger"),
    c = o.querySelector(".contact-dropdown__value"),
    s = o.querySelector(".contact-dropdown__menu"),
    l = o.querySelectorAll(".contact-dropdown__option"),
    i = {
      discord: {
        label: "Discord",
        type: "text",
        autocomplete: "off",
        placeholder: "DiscordName#0000 or username",
      },
      telegram: {
        label: "Telegram",
        type: "text",
        autocomplete: "off",
        placeholder: "@username",
      },
      whatsapp: {
        label: "WhatsApp",
        type: "tel",
        autocomplete: "tel",
        placeholder: "Enter your WhatsApp number",
      },
    };
  let d = "discord";
  const u = (e) => String(e || "").trim(),
    m = /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    p = (e, t, o) => {
      const a = document.querySelector("#" + t);
      (e && e.classList.add("is-invalid"),
        a && ((a.textContent = o), a.classList.add("is-visible")));
    },
    v = (e, t) => {
      const o = document.querySelector("#" + t);
      (e && e.classList.remove("is-invalid"),
        o && ((o.textContent = ""), o.classList.remove("is-visible")));
    },
    y = () =>
      u(a?.value)
        ? (v(a, "contact-social-error"), !0)
        : (p(a, "contact-social-error", `Please enter your ${i[d].label}`), !1),
    f = () => {
      const e = u(n?.value);
      return e
        ? m.test(e)
          ? (v(n, "contact-email-error"), !0)
          : (p(n, "contact-email-error", "Please enter a valid email address"),
            !1)
        : (p(n, "contact-email-error", "Please enter your email address"), !1);
    },
    g = () => {
      const val = u(msg?.value);
      if (!val) {
        p(msg, "contact-comment-error", "Please write your message");
        return false;
      }
      if (val.length < MSG_MIN) {
        p(
          msg,
          "contact-comment-error",
          "Message must be at least " + MSG_MIN + " characters",
        );
        return false;
      }
      v(msg, "contact-comment-error");
      return true;
    },
    updateCounter = () => {
      if (!msg || !msgCounter) return;
      const len = u(msg.value).length;
      msgCounter.textContent =
        len >= MSG_MIN ? len + " characters" : len + " / " + MSG_MIN + " min";
      msgCounter.classList.toggle("is-met", len >= MSG_MIN);
    };
  (a &&
    (a.addEventListener("blur", () => {
      a.value && y();
    }),
    a.addEventListener("input", () => {
      a.classList.contains("is-invalid") && y();
    })),
    n &&
      (n.addEventListener("blur", () => {
        n.value && f();
      }),
      n.addEventListener("input", () => {
        n.classList.contains("is-invalid") && f();
      })),
    msg &&
      (updateCounter(),
      msg.addEventListener("blur", () => {
        msg.value && g();
      }),
      msg.addEventListener("input", () => {
        updateCounter();
        msg.classList.contains("is-invalid") && g();
      })));
  const b = () => {
      (o.classList.remove("is-open"), r.setAttribute("aria-expanded", "false"));
    },
    h = (e) => {
      d = i[e] ? e : "discord";
      const t = i[d];
      ((c.textContent = t.label),
        l.forEach((e) => {
          e.setAttribute(
            "aria-selected",
            e.dataset.value === d ? "true" : "false",
          );
        }),
        a &&
          ((a.type = t.type),
          (a.autocomplete = t.autocomplete),
          (a.placeholder = t.placeholder),
          a.classList.contains("is-invalid") && y()),
        b());
    };
  (r.addEventListener("click", () => {
    o.classList.contains("is-open")
      ? b()
      : (o.classList.add("is-open"), r.setAttribute("aria-expanded", "true"));
  }),
    s.addEventListener("click", (e) => {
      const t = e.target.closest(".contact-dropdown__option");
      t && (h(t.dataset.value), r.focus());
    }),
    o.addEventListener("keydown", (e) => {
      "Escape" === e.key && (b(), r.focus());
    }),
    document.addEventListener("click", (e) => {
      o.contains(e.target) || b();
    }),
    e.addEventListener("submit", (o) => {
      o.preventDefault();
      // Run all three validators (don't short-circuit) so every invalid
      // field surfaces its error in one pass — otherwise a user fixes
      // one, submits, gets the next, etc.
      const r = y(),
        c = f(),
        msgOk = g();
      if (!r || !c || !msgOk) {
        const t = e.querySelector(".is-invalid");
        return void (t && t.focus());
      }
      const s = u(a?.value),
        l = u(n?.value),
        m = u(e.querySelector("#contact-comment")?.value),
        v = e.querySelector(".contact-form__btn"),
        b = e.querySelectorAll("input, textarea, button");
      const restoreForm = () => {
        b.forEach((e) => (e.disabled = !1));
        if (v) {
          v.classList.remove("is-loading");
          v.textContent = "SEND";
        }
      };
      const showSuccess = () => {
        if (typeof gtag === "function") {
          gtag("event", "conversion", {
            send_to: "AW-18061608347/SR8uCNm5wZUcEJuLuaRD",
            value: 1.0,
            currency: "USD",
          });
        }
        // Reset the form so a returning user can submit again, then swap
        // the form out for the inline success card. No redirect — the
        // previous flow bounced people to /pages/game.html which felt
        // disorienting (was the form even submitted?).
        e.reset();
        h("discord");
        updateCounter();
        restoreForm();
        const heading = document.querySelector("#contact-form-heading");
        const success = document.querySelector("#contact-success");
        if (heading) heading.hidden = true;
        e.hidden = true;
        if (success) {
          success.hidden = false;
          success.focus?.();
        }
      };
      const showFailure = (err) => {
        restoreForm();
        if (!t) return;
        t.style.color = "#ff6b6b";
        // Always give the user a working escape hatch — even if the
        // backend endpoint is down they can still reach support.
        t.innerHTML =
          'Something went wrong. Please try again or email us at ' +
          '<a href="mailto:support@nanoboost.io" style="color:#ff6b6b;text-decoration:underline">support@nanoboost.io</a>.';
        if (err && console && typeof console.warn === "function") {
          console.warn("[NB] contact submit failed:", err);
        }
      };

      b.forEach((e) => (e.disabled = !0));
      v && ((v.textContent = "SENDING..."), v.classList.add("is-loading"));
      t && (t.textContent = "");

      if (!window.NB_API || typeof window.NB_API.submitContact !== "function") {
        showFailure(new Error("NB_API.submitContact not loaded"));
        return;
      }

      // Wire format: backend enum is lowercase ('discord'|'telegram'|'whatsapp').
      // `d` already holds the lowercase dropdown key — never derive it from
      // the display label, which is capitalized ("Discord") and would 422.
      const apiPayload = {
        preferred_contact: d,
        handle: s,
        email: l,
        message: m,
      };

      window.NB_API.submitContact(apiPayload)
        .then(showSuccess)
        .catch(showFailure);
    }));
})();
