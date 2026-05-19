// Checkout page logic — POSTs orders to /public/orders, handles three
// payment flows: PayPal & USDT show a success modal, card (EcomTrade24)
// redirects to a hosted checkout page. Backend computes discounts and
// the final total — the frontend only shows a USDT preview.

(function () {
  "use strict";

  const CART_KEY = "nb_cart";
  const USDT_VALUE = "usdt_trc20";
  const CARD_VALUE = "card_ecomtrade24";
  const PAYPAL_VALUE = "paypal";
  const DISCOUNT_RATE = 0.05;

  const trim = (v) => String(v == null ? "" : v).trim();
  const fmtMoney = (v) => {
    if (typeof window.nbFormatPrice === "function") {
      return window.nbFormatPrice(Number(v) || 0);
    }
    return "$" + (Number(v) || 0).toFixed(2);
  };

  const form = document.querySelector("#checkout-form");
  const formHint = document.querySelector("#checkout-form-hint");
  const subtotalEl = document.querySelector("#order-subtotal");
  const listEl = document.querySelector("#order-list");
  const paymentInput = document.querySelector("#checkout-payment");
  const paymentBtn = document.querySelector("#checkout-payment-btn");
  const paymentMenu = document.querySelector("#checkout-payment-menu");
  const paymentWrap = paymentBtn
    ? paymentBtn.closest(".checkout-form__select-wrap")
    : null;
  const discountRow = document.querySelector("#order-discount");
  const discountValueEl = document.querySelector("#order-discount-value");

  let cart = (() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      return [];
    }
  })();

  // --- Render order list / subtotal -----------------------------------

  function renderOrder() {
    if (!listEl) return;
    listEl.innerHTML = "";
    if (!cart.length) {
      const li = document.createElement("li");
      li.className = "order-item";
      li.style.cssText =
        "text-align:center;color:rgba(255,255,255,0.5);padding:2rem 0;display:block;";
      li.textContent = "Your cart is empty";
      listEl.appendChild(li);
      if (subtotalEl) subtotalEl.textContent = fmtMoney(0);
      return;
    }

    const isUsdt = trim(paymentInput?.value) === USDT_VALUE;
    let subtotal = 0;

    cart.forEach((item) => {
      const price = Number(item.price) || 0;
      const qty = item.qty || 1;
      const itemTotal = price * qty;
      subtotal += itemTotal;

      const li = document.createElement("li");
      li.className = "order-item";
      li.setAttribute("data-name", item.name || "");
      li.setAttribute("data-price", price.toFixed(2));
      li.setAttribute("data-qty", qty);
      if (item.option) li.setAttribute("data-option", item.option);

      const img = document.createElement("img");
      img.className = "order-item__img";
      img.src = item.image || "";
      img.alt = item.name || "";
      img.loading = "lazy";

      const info = document.createElement("div");
      info.className = "order-item__info";
      const name = document.createElement("p");
      name.className = "order-item__name";
      name.textContent = item.name || "";
      const opt = document.createElement("p");
      opt.className = "order-item__meta";
      opt.textContent = item.option || "";
      const qtyEl = document.createElement("p");
      qtyEl.className = "order-item__qty";
      qtyEl.textContent = "x" + qty;
      info.appendChild(name);
      if (item.option) info.appendChild(opt);
      info.appendChild(qtyEl);

      const priceWrap = document.createElement("div");
      priceWrap.className = "order-item__price-wrap";
      const oldPrice = document.createElement("p");
      oldPrice.className =
        "order-item__price-old" + (isUsdt ? " is-visible" : "");
      oldPrice.textContent = fmtMoney(itemTotal);
      const cur = document.createElement("p");
      cur.className = "order-item__price";
      cur.textContent = fmtMoney(
        isUsdt ? itemTotal * (1 - DISCOUNT_RATE) : itemTotal,
      );
      priceWrap.appendChild(oldPrice);
      priceWrap.appendChild(cur);

      li.appendChild(img);
      li.appendChild(info);
      li.appendChild(priceWrap);
      listEl.appendChild(li);
    });

    const discountAmt = subtotal * DISCOUNT_RATE;
    const finalTotal = subtotal - discountAmt;
    if (isUsdt) {
      discountRow && discountRow.classList.add("is-visible");
      if (discountValueEl) {
        discountValueEl.textContent = "-" + fmtMoney(discountAmt);
      }
      if (subtotalEl) {
        subtotalEl.innerHTML =
          '<span class="order__subtotal-value--original">' +
          fmtMoney(subtotal) +
          "</span>" +
          fmtMoney(finalTotal);
      }
    } else {
      discountRow && discountRow.classList.remove("is-visible");
      if (subtotalEl) subtotalEl.textContent = fmtMoney(subtotal);
    }
  }

  renderOrder();

  // --- Custom payment dropdown ----------------------------------------

  (function initPaymentDropdown() {
    if (!paymentInput || !paymentBtn || !paymentMenu || !paymentWrap) return;

    const options = Array.from(
      paymentMenu.querySelectorAll(".checkout-form__select-option[data-value]"),
    );

    function setValue(value) {
      const v = trim(value);
      paymentInput.value = v;
      const textEl = paymentBtn.querySelector(".checkout-form__select-text");
      const matched = options.find(
        (o) => trim(o.getAttribute("data-value")) === v,
      );
      const label = matched
        ? matched.getAttribute("data-label") || trim(matched.textContent)
        : "";
      if (textEl) textEl.textContent = label || "Choose your payment method";
      paymentBtn.classList.toggle("has-value", Boolean(v));
      options.forEach((o) => {
        const sel = trim(o.getAttribute("data-value")) === v;
        o.setAttribute("aria-selected", String(sel));
        o.tabIndex = sel ? 0 : -1;
      });
      renderOrder();
    }

    function open(focusActive = true) {
      paymentWrap.classList.add("is-open");
      paymentBtn.setAttribute("aria-expanded", "true");
      const idx = focusActive
        ? Math.max(
            0,
            options.findIndex(
              (o) => o.getAttribute("aria-selected") === "true",
            ),
          )
        : 0;
      options[idx] && options[idx].focus();
    }

    function close(returnFocus = true) {
      paymentWrap.classList.remove("is-open");
      paymentBtn.setAttribute("aria-expanded", "false");
      if (returnFocus) paymentBtn.focus();
    }

    const isOpen = () => paymentWrap.classList.contains("is-open");
    const focusAt = (i) => {
      const idx = Math.max(0, Math.min(options.length - 1, i));
      options[idx] && options[idx].focus();
    };

    paymentBtn.addEventListener("click", () =>
      isOpen() ? close(false) : open(true),
    );
    paymentBtn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      }
    });

    options.forEach((opt, i) => {
      opt.addEventListener("click", () => {
        setValue(opt.getAttribute("data-value"));
        close(true);
      });
      opt.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          focusAt(i + 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          focusAt(i - 1);
        } else if (e.key === "Home") {
          e.preventDefault();
          focusAt(0);
        } else if (e.key === "End") {
          e.preventDefault();
          focusAt(options.length - 1);
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setValue(opt.getAttribute("data-value"));
          close(true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          close(true);
        }
      });
    });

    document.addEventListener("click", (e) => {
      if (!isOpen()) return;
      if (e.target instanceof Node && !paymentWrap.contains(e.target)) {
        close(false);
      }
    });
    document.addEventListener("keydown", (e) => {
      if (isOpen() && e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    });

    setValue(paymentInput.value);
  })();

  if (!form) return;

  // --- Validation -----------------------------------------------------

  const emailEl = document.querySelector("#checkout-email");
  const discordEl = document.querySelector("#checkout-discord");
  const agreeEl = form.querySelector(".checkout-form__agree");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setError = (el, errId, msg) => {
    if (el) el.classList.add("is-invalid");
    const node = document.querySelector("#" + errId);
    if (node) {
      node.textContent = msg;
      node.classList.add("is-visible");
    }
  };
  const clearError = (el, errId) => {
    if (el) el.classList.remove("is-invalid");
    const node = document.querySelector("#" + errId);
    if (node) {
      node.textContent = "";
      node.classList.remove("is-visible");
    }
  };

  const validateEmail = () => {
    const v = trim(emailEl?.value);
    if (!v) {
      setError(emailEl, "checkout-email-error", "Please enter your email address");
      return false;
    }
    if (!emailRe.test(v)) {
      setError(emailEl, "checkout-email-error", "Please enter a valid email address");
      return false;
    }
    clearError(emailEl, "checkout-email-error");
    return true;
  };
  const validateDiscord = () => {
    if (!trim(discordEl?.value)) {
      setError(discordEl, "checkout-discord-error", "Please enter your Discord username");
      return false;
    }
    clearError(discordEl, "checkout-discord-error");
    return true;
  };

  if (emailEl) {
    emailEl.addEventListener("blur", () => {
      if (emailEl.value) validateEmail();
    });
    emailEl.addEventListener("input", () => {
      if (emailEl.classList.contains("is-invalid")) validateEmail();
    });
  }
  if (discordEl) {
    discordEl.addEventListener("blur", () => {
      if (discordEl.value) validateDiscord();
    });
    discordEl.addEventListener("input", () => {
      if (discordEl.classList.contains("is-invalid")) validateDiscord();
    });
  }
  if (paymentWrap) {
    new MutationObserver(() => {
      if (paymentInput?.value && paymentWrap.classList.contains("is-invalid")) {
        clearError(paymentWrap, "checkout-payment-error");
      }
    }).observe(paymentInput, {
      attributes: true,
      attributeFilter: ["value"],
    });
    paymentMenu?.addEventListener("click", () => {
      setTimeout(() => {
        if (paymentInput?.value) clearError(paymentWrap, "checkout-payment-error");
      }, 50);
    });
  }
  if (agreeEl) {
    const cb = form.querySelector(".checkout-form__checkbox");
    cb &&
      cb.addEventListener("change", () => {
        if (cb.checked) agreeEl.classList.remove("is-invalid");
      });
  }

  // --- Build payload --------------------------------------------------

  function resolveOptionId(serviceSlug, optionLabelOrString) {
    const cfg = window.NB_SERVICE_CONFIG && window.NB_SERVICE_CONFIG[serviceSlug];
    if (!cfg || !Array.isArray(cfg.optionsRaw)) return null;
    // Cart stores option as "Label - $price" — strip price tail.
    const raw = String(optionLabelOrString || "").trim();
    const labelPart = raw.split(" - ")[0].trim();
    if (!labelPart) return cfg.optionsRaw[0]?.id || null;
    const match = cfg.optionsRaw.find((o) => (o.label || "").trim() === labelPart);
    return match ? match.id : null;
  }

  function buildPayload({ email, discord, telegram, payment, comment }) {
    const items = cart.map((item) => ({
      service_slug: item.serviceSlug || item.id || "",
      option_id: item.optionId || resolveOptionId(item.id, item.option),
      qty: item.qty || 1,
    }));
    return {
      email: email,
      discord: discord || null,
      telegram: telegram || null,
      whatsapp: null,
      payment_method: payment,
      display_currency: window.nbGetCurrency ? window.nbGetCurrency() : "USD",
      comment: comment || null,
      items: items,
    };
  }

  function showOrderModal(orderNumber) {
    const modal = document.querySelector("#order-modal");
    const idEl = document.querySelector("#order-modal-id");
    const btn = document.querySelector("#order-modal-btn");
    if (!modal) return;
    if (idEl) idEl.textContent = orderNumber || "";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const close = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      const inPages = window.location.pathname.includes("/pages/");
      window.location.href = inPages ? "./gta5.html" : "./pages/gta5.html";
    };
    btn && btn.addEventListener("click", close, { once: true });
  }

  function setHint(msg, isError) {
    if (!formHint) return;
    formHint.textContent = msg || "";
    formHint.style.color = isError ? "#ff6b6b" : "";
  }

  // --- Submit ---------------------------------------------------------

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const okEmail = validateEmail();
    const okDiscord = validateDiscord();
    const okPayment = trim(paymentInput?.value)
      ? (clearError(paymentWrap, "checkout-payment-error"), true)
      : (setError(paymentWrap, "checkout-payment-error", "Please select a payment method"),
        false);
    const okAgree = (() => {
      const checked = form.querySelector(".checkout-form__checkbox")?.checked;
      if (!checked) {
        agreeEl && agreeEl.classList.add("is-invalid");
        return false;
      }
      agreeEl && agreeEl.classList.remove("is-invalid");
      return true;
    })();

    if (!(okEmail && okDiscord && okPayment && okAgree)) {
      const firstBad = form.querySelector(".is-invalid");
      if (firstBad) {
        (firstBad.querySelector("input, button") || firstBad).focus();
      }
      return;
    }
    if (!cart.length) {
      setHint("Your cart is empty.", true);
      return;
    }

    const fd = new FormData(form);
    const payload = buildPayload({
      email: trim(fd.get("email")),
      discord: trim(fd.get("discord")),
      telegram: trim(fd.get("telegram")),
      payment: trim(fd.get("payment")),
      comment: trim(fd.get("comment")),
    });

    // Sanity check: every item must have an option_id.
    const badItem = payload.items.find((it) => !it.option_id || !it.service_slug);
    if (badItem) {
      setHint(
        "Failed to process an item in your cart. Please clear the cart and add the service again.",
        true,
      );
      return;
    }

    const submitBtn = form.querySelector(".checkout-form__btn");
    const formControls = form.querySelectorAll("input, textarea, button, select");
    formControls.forEach((el) => (el.disabled = true));
    if (submitBtn) {
      submitBtn.textContent = "SENDING...";
      submitBtn.classList.add("is-loading");
    }
    setHint("");

    const restoreForm = () => {
      formControls.forEach((el) => (el.disabled = false));
      if (submitBtn) {
        submitBtn.classList.remove("is-loading");
        submitBtn.textContent = "SUBMIT ORDER";
      }
    };

    if (!window.NB_API || typeof window.NB_API.createOrder !== "function") {
      restoreForm();
      setHint("Error: API client not loaded. Please refresh the page.", true);
      return;
    }

    if (typeof window.nbTrack === "function") {
      const cartSubtotal = cart.reduce(function (sum, item) {
        return sum + (Number(item.price) || 0) * (item.qty || 1);
      }, 0);
      window.nbTrack("begin_checkout", {
        currency: "USD",
        value: cartSubtotal,
        items: cart.map(function (item) {
          const optionLabel = String(item.option || "").split(" - ")[0].trim();
          return {
            item_id: item.serviceSlug || item.id || "",
            item_name: item.name || "",
            item_variant: optionLabel,
            price: Number(item.price) || 0,
            quantity: item.qty || 1,
          };
        }),
        coupon: payload.payment_method,
      });
    }

    window.NB_API.createOrder(payload)
      .then((res) => {
        if (typeof gtag === "function") {
          gtag("event", "conversion", {
            send_to: "AW-18061608347/SR8uCNm5wZUcEJuLuaRD",
            value: Number(res.final_total_usd) || 1.0,
            currency: "USD",
          });
        }
        // Card → redirect to provider checkout. Cart is cleared on
        // payment-success page so the user can return on cancel.
        if (res.checkout_url) {
          window.location.assign(res.checkout_url);
          return;
        }
        // PayPal / USDT → success modal + clear cart.
        localStorage.removeItem(CART_KEY);
        cart = [];
        renderOrder();
        document
          .querySelectorAll(".cart__badge, .cart-float__badge")
          .forEach((el) => (el.textContent = "0"));
        restoreForm();
        form.reset();
        showOrderModal(res.order_number);
      })
      .catch((err) => {
        restoreForm();
        let msg = err && err.message ? err.message : "Something went wrong. Please try again.";
        if (err && err.status === 503) {
          msg = "This payment method is currently unavailable. Please choose another one.";
        }
        setHint(msg, true);
      });
  });

  document.addEventListener("nb:currency-change", renderOrder);

  // If services-data loaded after the page (slow API), the order list
  // may already be rendered without option_id resolution support. Re-
  // render isn't needed since resolution happens at submit time.
})();
