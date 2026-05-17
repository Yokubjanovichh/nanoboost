// Polls /public/orders/:order_number/status until the order is paid,
// cancelled, or the timeout elapses. Clears the cart on `paid`.

(function () {
  "use strict";

  const POLL_INTERVAL_MS = 5000;
  const MAX_ATTEMPTS = 12; // 12 * 5s = 60s total
  const CART_KEY = "nb_cart";

  const orderNumber =
    new URLSearchParams(window.location.search).get("order") || "";

  const cardEl = document.querySelector("#payment-status");
  const titleEl = document.querySelector("#payment-status-title");
  const textEl = document.querySelector("#payment-status-text");
  const orderLineEl = document.querySelector("#payment-status-order");
  const actionsEl = document.querySelector("#payment-status-actions");
  const iconEl = document.querySelector(".payment-status__icon");

  if (cardEl && orderNumber) {
    cardEl.setAttribute("data-order-number", orderNumber);
    if (orderLineEl) orderLineEl.textContent = "Заказ: " + orderNumber;
  }

  let attempts = 0;
  let stopped = false;

  function setIcon(variant, svg) {
    if (!iconEl) return;
    iconEl.classList.remove(
      "payment-status__icon--pending",
      "payment-status__icon--success",
      "payment-status__icon--failure",
    );
    iconEl.classList.add("payment-status__icon--" + variant);
    iconEl.innerHTML = svg;
  }

  function clearCart() {
    try {
      localStorage.removeItem(CART_KEY);
    } catch {
      /* ignore */
    }
    document
      .querySelectorAll(".cart__badge, .cart-float__badge")
      .forEach((el) => (el.textContent = "0"));
  }

  function trackPurchase(status) {
    if (typeof window.nbTrack !== "function" || !status) return;
    const total = Number(status.final_total_usd || status.value || 0);
    const items = Array.isArray(status.items)
      ? status.items.map(function (it) {
          const unit =
            Number(it.unit_price_usd || it.price_usd || it.price || 0) || 0;
          const qty = Number(it.quantity || it.qty || 1) || 1;
          const snap = it.service_snapshot || {};
          return {
            item_id: it.service_slug || snap.slug || "",
            item_name: it.service_title || snap.title || "",
            item_variant: it.option_label || it.option || "",
            price: unit,
            quantity: qty,
          };
        })
      : [];
    window.nbTrack("purchase", {
      transaction_id: status.order_number || orderNumber || "",
      value: total,
      currency: "USD",
      items: items,
    });
  }

  function showSuccess(status) {
    stopped = true;
    clearCart();
    trackPurchase(status);
    setIcon(
      "success",
      '<svg viewBox="0 0 52 52" width="52" height="52" fill="none">' +
        '<circle cx="26" cy="26" r="25" stroke="#2de1fe" stroke-width="2" />' +
        '<path d="M15 27l7 7 15-15" stroke="#2de1fe" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />' +
        "</svg>",
    );
    if (titleEl) titleEl.textContent = "Оплата подтверждена";
    if (textEl) {
      textEl.textContent =
        "Спасибо! Заказ принят в работу. Мы свяжемся с вами в течение нескольких минут.";
    }
    if (actionsEl) actionsEl.hidden = false;
  }

  function showFailure(status) {
    stopped = true;
    setIcon(
      "failure",
      '<svg viewBox="0 0 52 52" width="52" height="52" fill="none">' +
        '<circle cx="26" cy="26" r="25" stroke="#ff6b6b" stroke-width="2" />' +
        '<path d="M18 18 L34 34 M34 18 L18 34" stroke="#ff6b6b" stroke-width="2.5" stroke-linecap="round" />' +
        "</svg>",
    );
    if (titleEl) {
      titleEl.textContent =
        status === "cancelled" ? "Оплата отменена" : "Платёж не прошёл";
    }
    if (textEl) {
      textEl.textContent =
        "Платёж не был завершён. Если деньги списались — свяжитесь с поддержкой, мы поможем.";
    }
    if (actionsEl) actionsEl.hidden = false;
  }

  function showPending() {
    stopped = true;
    if (titleEl) titleEl.textContent = "Платёж в обработке";
    if (textEl) {
      textEl.textContent =
        "Подтверждение занимает дольше обычного. Мы свяжемся с вами по email, как только оплата подтвердится.";
    }
    if (actionsEl) actionsEl.hidden = false;
  }

  function showError(err) {
    stopped = true;
    setIcon(
      "failure",
      '<svg viewBox="0 0 52 52" width="52" height="52" fill="none">' +
        '<circle cx="26" cy="26" r="25" stroke="#ff6b6b" stroke-width="2" />' +
        '<path d="M26 14 v18 M26 38 v.5" stroke="#ff6b6b" stroke-width="2.5" stroke-linecap="round" />' +
        "</svg>",
    );
    if (titleEl) titleEl.textContent = "Ошибка проверки";
    if (textEl) {
      textEl.textContent =
        "Не удалось проверить статус оплаты. Обновите страницу или свяжитесь с поддержкой.";
    }
    if (actionsEl) actionsEl.hidden = false;
    if (err && console && typeof console.warn === "function") {
      console.warn("[NB] payment status poll error:", err);
    }
  }

  async function poll() {
    if (stopped) return;
    attempts += 1;
    try {
      if (!window.NB_API || typeof window.NB_API.getOrderStatus !== "function") {
        showError(new Error("NB_API not loaded"));
        return;
      }
      const status = await window.NB_API.getOrderStatus(orderNumber);
      const state = String(status && status.status ? status.status : "").toLowerCase();
      if (state === "paid") {
        showSuccess(status);
        return;
      }
      if (state === "cancelled" || state === "failed") {
        showFailure(state);
        return;
      }
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, POLL_INTERVAL_MS);
      } else {
        showPending();
      }
    } catch (err) {
      // Transient network error: retry until the budget is spent.
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, POLL_INTERVAL_MS);
      } else {
        showError(err);
      }
    }
  }

  if (!orderNumber) {
    showError(new Error("Order number missing"));
    return;
  }
  poll();
})();
