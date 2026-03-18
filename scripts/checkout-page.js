(function () {
  const form = document.querySelector("#checkout-form");
  const hint = document.querySelector("#checkout-form-hint");
  const subtotalEl = document.querySelector("#order-subtotal");

  const paymentInput = document.querySelector("#checkout-payment");
  const paymentBtn = document.querySelector("#checkout-payment-btn");
  const paymentMenu = document.querySelector("#checkout-payment-menu");
  const paymentWrap = paymentBtn
    ? paymentBtn.closest(".checkout-form__select-wrap")
    : null;

  const items = Array.from(document.querySelectorAll(".order-item"));

  const safeValue = (value) => String(value || "").trim();
  const toNumber = (value) => {
    const num = Number(String(value || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  const getQty = (itemEl) => {
    const qtyEl = itemEl.querySelector(".order-item__qty");
    const text = safeValue(qtyEl ? qtyEl.textContent : "");
    const match = text.match(/x\s*(\d+)/i);
    const qty = match ? Number(match[1]) : 1;
    return Number.isFinite(qty) && qty > 0 ? qty : 1;
  };

  const updateSubtotal = () => {
    const subtotal = items.reduce((sum, itemEl) => {
      const price = toNumber(itemEl.getAttribute("data-price"));
      const qty = getQty(itemEl);
      return sum + price * qty;
    }, 0);

    if (subtotalEl) {
      subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    }

    return subtotal;
  };

  const subtotal = updateSubtotal();

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

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const email = safeValue(formData.get("email"));
    const discord = safeValue(formData.get("discord"));
    const payment = safeValue(formData.get("payment"));
    const comment = safeValue(formData.get("comment"));
    const agree = formData.get("agree") === "on";

    if (!agree) {
      if (hint) hint.textContent = "Please accept the terms and conditions.";
      return;
    }

    if (!email || !discord || !payment) {
      if (hint) hint.textContent = "Please fill required fields.";
      return;
    }

    const subject = "Nanoboost Checkout Order";

    const itemLines = items.map((itemEl) => {
      const name = safeValue(itemEl.getAttribute("data-name"));
      const platform = safeValue(itemEl.getAttribute("data-platform"));
      const qty = getQty(itemEl);
      const price = toNumber(itemEl.getAttribute("data-price"));
      const label = [name, platform].filter(Boolean).join(" ");
      return `- ${label} x${qty}: $${price.toFixed(2)}`;
    });

    const bodyLines = [
      "New checkout request:",
      "",
      `Email: ${email}`,
      `Discord: ${discord}`,
      `Payment: ${payment}`,
      "",
      "Items:",
      ...itemLines,
      "",
      `Subtotal: $${subtotal.toFixed(2)}`,
      "",
      "Comment:",
      comment || "-",
      "",
      "---",
      "Sent from nanoboost website",
    ];

    const mailto = `mailto:support@nanoboost.com?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    if (hint) {
      hint.textContent = "Opening your email app…";
    }

    window.location.href = mailto;
  });
})();
