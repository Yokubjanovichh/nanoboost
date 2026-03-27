(function () {
  const form = document.querySelector("#checkout-form");
  const hint = document.querySelector("#checkout-form-hint");
  const subtotalEl = document.querySelector("#order-subtotal");
  const orderList = document.querySelector("#order-list");

  const paymentInput = document.querySelector("#checkout-payment");
  const paymentBtn = document.querySelector("#checkout-payment-btn");
  const paymentMenu = document.querySelector("#checkout-payment-menu");
  const paymentWrap = paymentBtn
    ? paymentBtn.closest(".checkout-form__select-wrap")
    : null;

  const safeValue = (value) => String(value || "").trim();
  const toNumber = (value) => {
    const num = Number(String(value || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  // =============================================
  // Cart dan order ni render qilish
  // =============================================
  const NB_CART_KEY = "nb_cart";

  const getCart = () => {
    try {
      return JSON.parse(localStorage.getItem(NB_CART_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const cart = getCart();

  const renderOrderItems = () => {
    if (!orderList) return;
    orderList.innerHTML = "";

    if (!cart.length) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "order-item";
      emptyLi.style.cssText =
        "text-align:center;color:rgba(255,255,255,0.5);padding:2rem 0;display:block;";
      emptyLi.textContent = "Your cart is empty";
      orderList.appendChild(emptyLi);
      if (subtotalEl) subtotalEl.textContent = "$0.00";
      return;
    }

    let subtotal = 0;

    cart.forEach((item) => {
      const price = Number(item.price) || 0;
      const qty = item.qty || 1;
      subtotal += price * qty;

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

      const nameEl = document.createElement("p");
      nameEl.className = "order-item__name";
      nameEl.textContent = item.name || "";

      const metaEl = document.createElement("p");
      metaEl.className = "order-item__meta";
      metaEl.textContent = item.option || "";

      const qtyEl = document.createElement("p");
      qtyEl.className = "order-item__qty";
      qtyEl.textContent = "x" + qty;

      info.appendChild(nameEl);
      if (item.option) info.appendChild(metaEl);
      info.appendChild(qtyEl);

      const priceEl = document.createElement("p");
      priceEl.className = "order-item__price";
      priceEl.textContent = "$" + (price * qty).toFixed(2);

      li.appendChild(img);
      li.appendChild(info);
      li.appendChild(priceEl);
      orderList.appendChild(li);
    });

    if (subtotalEl) subtotalEl.textContent = "$" + subtotal.toFixed(2);
  };

  renderOrderItems();

  // =============================================
  // Custom payment select
  // =============================================
  const setupCustomPaymentSelect = () => {
    if (!paymentInput || !paymentBtn || !paymentMenu || !paymentWrap) return;

    const options = Array.from(
      paymentMenu.querySelectorAll(".checkout-form__select-option[data-value]"),
    );

    const setValue = (value) => {
      const nextValue = safeValue(value);
      paymentInput.value = nextValue;

      const textEl = paymentBtn.querySelector(".checkout-form__select-text");
      if (textEl) {
        textEl.textContent = nextValue || "Choose your payment method";
      }

      paymentBtn.classList.toggle("has-value", Boolean(nextValue));

      options.forEach((opt) => {
        const isSelected =
          safeValue(opt.getAttribute("data-value")) === nextValue;
        opt.setAttribute("aria-selected", String(isSelected));
        opt.tabIndex = isSelected ? 0 : -1;
      });
    };

    const getSelectedIndex = () =>
      Math.max(
        0,
        options.findIndex(
          (opt) => opt.getAttribute("aria-selected") === "true",
        ),
      );

    const openMenu = (focusSelected = true) => {
      paymentWrap.classList.add("is-open");
      paymentBtn.setAttribute("aria-expanded", "true");

      const idx = focusSelected ? getSelectedIndex() : 0;
      const target = options[idx];
      if (target) target.focus();
    };

    const closeMenu = (returnFocus = true) => {
      paymentWrap.classList.remove("is-open");
      paymentBtn.setAttribute("aria-expanded", "false");
      if (returnFocus) paymentBtn.focus();
    };

    const isOpen = () => paymentWrap.classList.contains("is-open");

    const focusByIndex = (idx) => {
      const clamped = Math.max(0, Math.min(options.length - 1, idx));
      const opt = options[clamped];
      if (opt) opt.focus();
    };

    paymentBtn.addEventListener("click", () => {
      if (isOpen()) {
        closeMenu(false);
      } else {
        openMenu(true);
      }
    });

    paymentBtn.addEventListener("keydown", (event) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openMenu(true);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(false);
      }
    });

    options.forEach((opt, idx) => {
      opt.addEventListener("click", () => {
        setValue(opt.getAttribute("data-value"));
        closeMenu(true);
      });

      opt.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          focusByIndex(idx + 1);
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          focusByIndex(idx - 1);
        }

        if (event.key === "Home") {
          event.preventDefault();
          focusByIndex(0);
        }

        if (event.key === "End") {
          event.preventDefault();
          focusByIndex(options.length - 1);
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setValue(opt.getAttribute("data-value"));
          closeMenu(true);
        }

        if (event.key === "Escape") {
          event.preventDefault();
          closeMenu(true);
        }
      });
    });

    document.addEventListener("click", (event) => {
      if (!isOpen()) return;

      const target = event.target;
      if (!(target instanceof Node)) return;

      if (!paymentWrap.contains(target)) {
        closeMenu(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!isOpen()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    });

    setValue(paymentInput.value);
  };

  setupCustomPaymentSelect();

  // =============================================
  // Validation
  // =============================================
  if (!form) return;

  const emailInput = document.querySelector("#checkout-email");
  const discordInput = document.querySelector("#checkout-discord");
  const agreeLabel = form.querySelector(".checkout-form__agree");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const showError = (el, errorId, message) => {
    if (el) el.classList.add("is-invalid");
    const errorEl = document.querySelector("#" + errorId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add("is-visible");
    }
  };

  const clearError = (el, errorId) => {
    if (el) el.classList.remove("is-invalid");
    const errorEl = document.querySelector("#" + errorId);
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.remove("is-visible");
    }
  };

  const validateEmail = () => {
    const val = safeValue(emailInput?.value);
    if (!val) {
      showError(emailInput, "checkout-email-error", "Please enter your email address");
      return false;
    }
    if (!emailRegex.test(val)) {
      showError(emailInput, "checkout-email-error", "Please enter a valid email address");
      return false;
    }
    clearError(emailInput, "checkout-email-error");
    return true;
  };

  const validateDiscord = () => {
    const val = safeValue(discordInput?.value);
    if (!val) {
      showError(discordInput, "checkout-discord-error", "Please enter your Discord username");
      return false;
    }
    clearError(discordInput, "checkout-discord-error");
    return true;
  };

  const validatePayment = () => {
    const val = safeValue(paymentInput?.value);
    if (!val) {
      showError(paymentWrap, "checkout-payment-error", "Please select a payment method");
      return false;
    }
    clearError(paymentWrap, "checkout-payment-error");
    return true;
  };

  const validateAgree = () => {
    const checked = form.querySelector('.checkout-form__checkbox')?.checked;
    if (!checked) {
      if (agreeLabel) agreeLabel.classList.add("is-invalid");
      return false;
    }
    if (agreeLabel) agreeLabel.classList.remove("is-invalid");
    return true;
  };

  // Real-time validation on blur
  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      if (emailInput.value) validateEmail();
    });
    emailInput.addEventListener("input", () => {
      if (emailInput.classList.contains("is-invalid")) validateEmail();
    });
  }

  if (discordInput) {
    discordInput.addEventListener("blur", () => {
      if (discordInput.value) validateDiscord();
    });
    discordInput.addEventListener("input", () => {
      if (discordInput.classList.contains("is-invalid")) validateDiscord();
    });
  }

  // Clear payment error on selection
  if (paymentWrap) {
    const observer = new MutationObserver(() => {
      if (paymentInput?.value && paymentWrap.classList.contains("is-invalid")) {
        clearError(paymentWrap, "checkout-payment-error");
      }
    });
    observer.observe(paymentInput, { attributes: true, attributeFilter: ["value"] });

    paymentMenu?.addEventListener("click", () => {
      setTimeout(() => {
        if (paymentInput?.value) clearError(paymentWrap, "checkout-payment-error");
      }, 50);
    });
  }

  if (agreeLabel) {
    const checkbox = form.querySelector('.checkout-form__checkbox');
    if (checkbox) {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) agreeLabel.classList.remove("is-invalid");
      });
    }
  }

  // =============================================
  // Form submit
  // =============================================
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const emailValid = validateEmail();
    const discordValid = validateDiscord();
    const paymentValid = validatePayment();
    const agreeValid = validateAgree();

    if (!emailValid || !discordValid || !paymentValid || !agreeValid) {
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) {
        const focusable = firstInvalid.querySelector("input, button") || firstInvalid;
        focusable.focus();
      }
      return;
    }

    if (!cart.length) {
      if (hint) hint.textContent = "Your cart is empty.";
      return;
    }

    const formData = new FormData(form);
    const email = safeValue(formData.get("email"));
    const discord = safeValue(formData.get("discord"));
    const telegram = safeValue(formData.get("telegram"));
    const payment = safeValue(formData.get("payment"));
    const comment = safeValue(formData.get("comment"));

    let subtotal = 0;
    const items = cart.map((item) => {
      const price = Number(item.price) || 0;
      const qty = item.qty || 1;
      subtotal += price * qty;
      return {
        name: item.name || "Service",
        option: item.option || "",
        qty,
        price: (price * qty).toFixed(2),
      };
    });

    const payload = {
      type: "checkout",
      email,
      discord,
      telegram,
      payment,
      items,
      subtotal: subtotal.toFixed(2),
      comment,
    };

    const submitBtn = form.querySelector(".checkout-form__btn");
    const formFields = form.querySelectorAll("input, textarea, button, select");

    // ── Loading state ──
    formFields.forEach((f) => (f.disabled = true));
    if (submitBtn) {
      submitBtn.textContent = "SENDING...";
      submitBtn.classList.add("is-loading");
    }
    if (hint) hint.textContent = "";

    fetch(window.NB_API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.status === "ok") {
          // ── Clean up ──
          form.reset();
          localStorage.removeItem(NB_CART_KEY);
          renderOrderItems();
          document.querySelectorAll(".cart-badge").forEach((b) => (b.textContent = "0"));

          if (submitBtn) {
            submitBtn.classList.remove("is-loading");
            submitBtn.textContent = "SUBMIT ORDER";
            submitBtn.disabled = false;
          }
          formFields.forEach((f) => (f.disabled = false));

          // ── Show success modal ──
          const modal = document.querySelector("#order-modal");
          const modalId = document.querySelector("#order-modal-id");
          const modalBtn = document.querySelector("#order-modal-btn");

          if (modal) {
            if (modalId) modalId.textContent = result.orderNumber || "";
            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";

            const closeModal = () => {
              modal.classList.remove("is-open");
              modal.setAttribute("aria-hidden", "true");
              document.body.style.overflow = "";
              const isSubpage = window.location.pathname.includes("/pages/");
              window.location.href = isSubpage
                ? "./gta5.html"
                : "./pages/gta5.html";
            };

            if (modalBtn) modalBtn.addEventListener("click", closeModal, { once: true });
          }
          return;
        }
        throw new Error(result.message || "Server error");
      })
      .catch(() => {
        // ── Error state ──
        formFields.forEach((f) => (f.disabled = false));
        if (submitBtn) {
          submitBtn.classList.remove("is-loading");
          submitBtn.textContent = "SUBMIT ORDER";
        }
        if (hint) {
          hint.style.color = "#ff6b6b";
          hint.textContent = "Something went wrong. Please try again or contact us via Discord.";
        }
      });
  });
})();
