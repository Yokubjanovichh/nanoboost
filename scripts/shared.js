const burger = document.getElementById("burger");
const nav = document.querySelector(".nav");

const isMobileNav = () => window.matchMedia("(max-width: 980px)").matches;

// =============================================
// Always start from top on page navigation
// (but respect deep-links that include a hash)
// =============================================
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("pageshow", () => {
  if (window.location.hash) return;
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
  });
});

// Burger — navigatsiyani ochish/yopish
if (burger && nav) {
  burger.addEventListener("click", () => {
    burger.classList.toggle("is-open");
    nav.classList.toggle("is-open");

    if (isMobileNav()) {
      const isOpen = nav.classList.contains("is-open");
      if (isOpen) {
        dropdownItem?.classList.add("is-open");
        resetDropdownSteps();
      } else {
        dropdownItem?.classList.remove("is-open");
        resetDropdownSteps();
      }
    }
  });

  // Tashqariga bosilsa — yopiladi
  document.addEventListener("click", (e) => {
    if (!burger.contains(e.target) && !nav.contains(e.target)) {
      burger.classList.remove("is-open");
      nav.classList.remove("is-open");

      if (isMobileNav()) {
        dropdownItem?.classList.remove("is-open");
        resetDropdownSteps();
      }
    }
  });
}

// =============================================
// Dropdown — bosib ochish/yopish
// =============================================
const dropdownItem = document.querySelector(".nav__item--dropdown");
const dropdownLink = dropdownItem?.querySelector(".nav__link");

const dropdownRoot = dropdownItem?.querySelector(".dropdown");

const resetDropdownSteps = () => {
  if (!dropdownRoot) return;
  dropdownRoot.classList.remove("has-game", "has-platform");

  dropdownRoot
    .querySelectorAll(".dropdown__item[data-game]")
    .forEach((el) => el.classList.remove("is-active"));

  dropdownRoot
    .querySelectorAll(".dropdown__item[data-platform]")
    .forEach((el) => el.classList.remove("is-active"));

  dropdownRoot
    .querySelectorAll(".dropdown__platform-list[data-for-game]")
    .forEach((list) => list.classList.remove("is-active"));

  dropdownRoot
    .querySelectorAll(".dropdown__sublist[data-for]")
    .forEach((list) => list.classList.remove("is-active"));
};

if (dropdownLink) {
  dropdownLink.addEventListener("click", (e) => {
    e.preventDefault();
    dropdownItem.classList.toggle("is-open");
    if (dropdownItem.classList.contains("is-open")) {
      resetDropdownSteps();
    }
  });

  // Tashqariga bosish — dropdown yopiladi
  document.addEventListener("click", (e) => {
    if (!dropdownItem.contains(e.target)) {
      dropdownItem.classList.remove("is-open");
      resetDropdownSteps();
    }
  });
}

// =============================================
// Dropdown — Games → Platforms → Services
// =============================================
const gameItems = dropdownRoot?.querySelectorAll(
  ".dropdown__item[data-game]",
);
const platformLists = dropdownRoot?.querySelectorAll(
  ".dropdown__platform-list[data-for-game]",
);
const subLists = dropdownRoot?.querySelectorAll(".dropdown__sublist[data-for]");
const subItems = dropdownRoot?.querySelectorAll(".dropdown__subitem a");

const setActiveSublist = (gameId) => {
  if (!subLists?.length) return;
  subLists.forEach((list) => list.classList.remove("is-active"));
  if (!gameId) return;
  const target = dropdownRoot?.querySelector(
    `.dropdown__sublist[data-for="${gameId}"]`,
  );
  if (target) target.classList.add("is-active");
};

// Step 1: User picks a game → show platforms for that game
const setActiveGame = (gameId) => {
  if (!dropdownRoot || !platformLists?.length) return;

  dropdownRoot.classList.add("has-game");
  dropdownRoot.classList.remove("has-platform");

  // Highlight active game
  gameItems?.forEach((el) => el.classList.remove("is-active"));
  const activeGame = dropdownRoot.querySelector(
    `.dropdown__item[data-game="${gameId}"]`,
  );
  if (activeGame) activeGame.classList.add("is-active");

  // Show platform list for this game
  platformLists.forEach((list) => list.classList.remove("is-active"));
  const targetPlatformList = dropdownRoot.querySelector(
    `.dropdown__platform-list[data-for-game="${gameId}"]`,
  );
  if (targetPlatformList) targetPlatformList.classList.add("is-active");

  // Don't auto-select a platform. User picks a platform, then services appear.
  targetPlatformList
    ?.querySelectorAll(".dropdown__item[data-platform]")
    .forEach((el) => el.classList.remove("is-active"));
  setActiveSublist(null);
};

// Step 2: User picks a platform → show services for the selected game
const setActivePlatform = (platformId) => {
  if (!dropdownRoot) return;

  const activePlatformList = dropdownRoot.querySelector(
    ".dropdown__platform-list.is-active",
  );
  if (!activePlatformList) return;

  // Highlight active platform
  const platformItems = activePlatformList.querySelectorAll(
    ".dropdown__item[data-platform]",
  );
  platformItems.forEach((el) => el.classList.remove("is-active"));
  const activeItem = activePlatformList.querySelector(
    `.dropdown__item[data-platform="${platformId}"]`,
  );
  if (activeItem) activeItem.classList.add("is-active");

  dropdownRoot.classList.add("has-platform");

  // Show sublist for the currently active game
  const activeGame = dropdownRoot.querySelector(
    ".dropdown__item[data-game].is-active",
  );
  if (activeGame) setActiveSublist(activeGame.dataset.game);
};

// Game interactions (hover + click + keyboard) — Step 1
gameItems?.forEach((item) => {
  const gameId = item.dataset.game;
  if (!gameId) return;

  item.addEventListener("mouseenter", () => {
    if (isMobileNav()) return;
    setActiveGame(gameId);
  });

  item.addEventListener("click", () => {
    setActiveGame(gameId);
  });

  item.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    setActiveGame(gameId);
  });
});

// Platform interactions — Step 2
dropdownRoot
  ?.querySelectorAll(".dropdown__item[data-platform]")
  .forEach((item) => {
    const platformId = item.dataset.platform;
    if (!platformId) return;

    const shouldHandle = () => {
      const parentList = item.closest(".dropdown__platform-list");
      return parentList?.classList.contains("is-active");
    };

    item.addEventListener("mouseenter", () => {
      if (!shouldHandle()) return;
      if (isMobileNav()) return;
      setActivePlatform(platformId);
    });

    item.addEventListener("click", () => {
      if (!shouldHandle()) return;
      setActivePlatform(platformId);
    });

    item.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (!shouldHandle()) return;
      e.preventDefault();
      setActivePlatform(platformId);
    });
  });

// Sub-item click: active state + close dropdown
subItems?.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const parentList = link.closest(".dropdown__sublist");
    parentList
      ?.querySelectorAll(".dropdown__subitem")
      .forEach((li) => li.classList.remove("dropdown__subitem--active"));
    link
      .closest(".dropdown__subitem")
      ?.classList.add("dropdown__subitem--active");

    if (!isMobileNav()) {
      dropdownItem?.classList.remove("is-open");
    }
  });
});

// Ensure initial state is consistent
if (dropdownRoot && gameItems?.length) {
  resetDropdownSteps();
}

// =============================================
// FAQ accordion
// =============================================
const faqItems = document.querySelectorAll(".faq-item");

if (faqItems.length) {
  const firstOpenItem = Array.from(faqItems).find((item) =>
    item.classList.contains("is-open"),
  );

  faqItems.forEach((item) => {
    const trigger = item.querySelector(".faq-item__trigger");
    if (!trigger) return;

    if (firstOpenItem && item !== firstOpenItem) {
      item.classList.remove("is-open");
    }
    trigger.setAttribute(
      "aria-expanded",
      item.classList.contains("is-open") ? "true" : "false",
    );

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      faqItems.forEach((faqItem) => {
        faqItem.classList.remove("is-open");
        const faqTrigger = faqItem.querySelector(".faq-item__trigger");
        if (faqTrigger) faqTrigger.setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
}

// =============================================
// Cart Widget
// =============================================
const NB_CART_KEY = "nb_cart";

const nbGetCart = () => {
  try {
    return JSON.parse(localStorage.getItem(NB_CART_KEY) || "[]");
  } catch {
    return [];
  }
};

const nbSaveCart = (cart) => {
  localStorage.setItem(NB_CART_KEY, JSON.stringify(cart));
};

/** Add item to cart: { id, name, price, image, option } */
window.NB_addToCart = (item) => {
  const cart = nbGetCart();
  // Xuddi shu id + option bo'lsa qty ni oshirish
  const key = (item.id || "") + "|" + (item.option || "");
  const existing = cart.find(
    (c) => (c.id || "") + "|" + (c.option || "") === key,
  );
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  nbSaveCart(cart);
  nbUpdateCartBadges();
  nbRenderCartWidget();
  nbOpenCartWidget();
};

const nbIsInPages = () =>
  window.location.pathname.replace(/\\/g, "/").includes("/pages/");

const nbCheckoutUrl = () =>
  nbIsInPages() ? "./checkout.html" : "./pages/checkout.html";

const nbImageUrl = (storedPath) => {
  if (!storedPath) return "";
  if (nbIsInPages()) return storedPath;
  // storedPath is relative to pages/ (e.g. "../assets/images/services1.webp")
  // from root we need "./assets/images/..."
  return storedPath.replace(/^\.\.\//g, "./");
};

const nbEscapeHtml = (str) => {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
};

const nbCartTotalQty = () =>
  nbGetCart().reduce((sum, item) => sum + (item.qty || 1), 0);

const nbUpdateCartBadges = () => {
  const totalQty = nbCartTotalQty();
  document.querySelectorAll(".cart__badge, .cart-float__badge").forEach((b) => {
    b.textContent = totalQty;
    b.style.display = totalQty > 0 ? "flex" : "none";
  });

  // cart-float faqat cart bo'sh bo'lmaganda ko'rinadi
  document.querySelectorAll(".cart-float").forEach((btn) => {
    btn.style.display = totalQty > 0 ? "" : "none";
  });
};

const nbRenderCartWidget = () => {
  const itemsEl = document.getElementById("cart-widget-items");
  const subtotalEl = document.getElementById("cart-widget-subtotal");
  const countEl = document.getElementById("cart-widget-count");
  if (!itemsEl) return;

  const cart = nbGetCart();
  const checkoutHref = nbCheckoutUrl();

  // Update checkout links
  document
    .querySelectorAll(
      ".cart-widget__checkout-btn, .cart-widget__display-link",
    )
    .forEach((a) => {
      a.href = checkoutHref;
    });

  // Checkout linklar — cart bo'sh bo'lsa o'tkazmasin
  const checkoutLinks = document.querySelectorAll(
    ".cart-widget__checkout-btn, .cart-widget__display-link",
  );

  if (!cart.length) {
    itemsEl.innerHTML =
      '<p class="cart-widget__empty">Your cart is empty</p>';
    if (subtotalEl) subtotalEl.textContent = "$0.00";
    if (countEl) countEl.textContent = "0 items";
    checkoutLinks.forEach((a) => {
      a.removeAttribute("href");
      a.style.opacity = "0.4";
      a.style.pointerEvents = "none";
    });
    return;
  }

  // Cart to'la — linklar faol
  checkoutLinks.forEach((a) => {
    a.href = checkoutHref;
    a.style.opacity = "";
    a.style.pointerEvents = "";
  });

  let subtotal = 0;
  let totalQty = 0;
  itemsEl.innerHTML = "";

  cart.forEach((item, i) => {
    const price = Number(item.price) || 0;
    const qty = item.qty || 1;
    subtotal += price * qty;
    totalQty += qty;

    const row = document.createElement("div");
    row.className = "cart-widget__item";

    const img = document.createElement("img");
    img.className = "cart-widget__item-img";
    img.src = nbImageUrl(item.image);
    img.alt = item.name || "";

    const info = document.createElement("div");
    info.className = "cart-widget__item-info";

    const name = document.createElement("p");
    name.className = "cart-widget__item-name";
    name.textContent = item.name || "";

    if (qty > 1) {
      const qtyEl = document.createElement("span");
      qtyEl.className = "cart-widget__item-qty";
      qtyEl.textContent = "x" + qty;
      info.appendChild(name);
      info.appendChild(qtyEl);
    } else {
      info.appendChild(name);
    }

    const priceEl = document.createElement("span");
    priceEl.className = "cart-widget__item-price";
    priceEl.textContent = "$" + (price * qty).toFixed(2);
    info.appendChild(priceEl);

    const removeBtn = document.createElement("button");
    removeBtn.className = "cart-widget__item-remove";
    removeBtn.setAttribute("aria-label", "Remove");
    removeBtn.textContent = "\u2715";
    removeBtn.addEventListener("click", () => {
      const c = nbGetCart();
      if (c[i] && c[i].qty > 1) {
        c[i].qty -= 1;
      } else {
        c.splice(i, 1);
      }
      nbSaveCart(c);
      nbUpdateCartBadges();
      nbRenderCartWidget();
    });

    row.appendChild(img);
    row.appendChild(info);
    row.appendChild(removeBtn);
    itemsEl.appendChild(row);
  });

  if (subtotalEl) subtotalEl.textContent = "$" + subtotal.toFixed(2);
  if (countEl)
    countEl.textContent =
      totalQty + " item" + (totalQty !== 1 ? "s" : "");
};

const nbGetScrollbarWidth = () =>
  window.innerWidth - document.documentElement.clientWidth;

const nbOpenCartWidget = () => {
  const widget = document.getElementById("cart-widget");
  if (!widget) return;
  nbRenderCartWidget();

  // Scrollbar yo'qolganda layout shift oldini olish
  const scrollbarW = nbGetScrollbarWidth();
  const headerEl = document.querySelector(".header");
  document.body.style.paddingRight = scrollbarW + "px";
  if (headerEl) headerEl.style.width = "calc(100% - " + scrollbarW + "px)";
  document.body.style.overflow = "hidden";

  widget.classList.add("is-open");
};

const nbCloseCartWidget = () => {
  const widget = document.getElementById("cart-widget");
  if (!widget) return;
  widget.classList.remove("is-open");
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  const headerEl = document.querySelector(".header");
  if (headerEl) headerEl.style.width = "";
};

// Open cart: header cart + floating cart
document.querySelectorAll("[data-open-cart]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    nbOpenCartWidget();
  });
});

// Close cart
document
  .querySelector(".cart-widget__header")
  ?.addEventListener("click", nbCloseCartWidget);
document
  .querySelector(".cart-widget__overlay")
  ?.addEventListener("click", nbCloseCartWidget);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") nbCloseCartWidget();
});

// Initialize badges and widget
nbUpdateCartBadges();
nbRenderCartWidget();

// =============================================
// Disabled footer placeholder links
// =============================================
document.addEventListener("click", (e) => {
  const disabledFooterLink = e.target.closest(
    '.footer__link[aria-disabled="true"], .footer__contact[aria-disabled="true"]',
  );
  if (!disabledFooterLink) return;
  e.preventDefault();
});

// =============================================
// Testimonials (carousel)
// =============================================
const testimonialsSection = document.querySelector(".testimonials");
const testimonialsSlider = document.querySelector(".testimonials__slider");
const testimonialsTrack = document.querySelector(".testimonials__grid");

if (testimonialsSection && testimonialsSlider && testimonialsTrack) {
  const cards = Array.from(testimonialsTrack.querySelectorAll(".testimonial"));

  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;

  // --- Carousel behavior (no scrollbar)
  testimonialsSlider.tabIndex = 0;

  let currentIndex = 0;
  let stepPx = 0;
  let maxIndex = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const getVisibleCount = () => {
    const w = window.innerWidth;
    if (w >= 1600) return 4;
    if (w <= 430) return 1.5;
    if (w <= 980) return 2;
    return 3;
  };

  const syncMetrics = () => {
    if (!cards.length) return;

    const first = cards[0];
    const second = cards[1];
    if (second) {
      stepPx = second.offsetLeft - first.offsetLeft;
    } else {
      stepPx = first.getBoundingClientRect().width;
    }

    const visible = getVisibleCount();
    maxIndex = Math.max(0, cards.length - Math.ceil(visible));
    currentIndex = clamp(currentIndex, 0, maxIndex);
  };

  const applyTranslate = ({ animate = true } = {}) => {
    if (!cards.length) return;
    if (!animate) testimonialsTrack.style.transition = "none";
    const x = -currentIndex * stepPx;
    testimonialsTrack.style.transform = `translate3d(${x}px, 0, 0)`;
    if (!animate) {
      // Force reflow so next animated change actually animates
      void testimonialsTrack.offsetHeight;
      testimonialsTrack.style.transition = "";
    }
  };

  const goTo = (nextIndex, { animate = true } = {}) => {
    currentIndex = clamp(nextIndex, 0, maxIndex);
    applyTranslate({ animate });
  };

  // Initial layout sync
  syncMetrics();
  applyTranslate({ animate: false });

  // Resize handling
  let resizeRaf = 0;
  window.addEventListener("resize", () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      syncMetrics();
      applyTranslate({ animate: false });
    });
  });

  window.addEventListener("load", () => {
    syncMetrics();
    applyTranslate({ animate: false });
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      syncMetrics();
      applyTranslate({ animate: false });
    });
  }

  // Drag / swipe
  let isDown = false;
  let startX = 0;
  let startTranslateX = 0;
  let draggedX = 0;
  let lastClientX = 0;
  let moveRaf = 0;

  const getCurrentTranslateX = () => -currentIndex * stepPx;

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!cards.length) return;

    isDown = true;
    testimonialsSlider.classList.add("is-dragging");
    testimonialsTrack.classList.add("is-dragging");

    startX = e.clientX;
    lastClientX = e.clientX;
    startTranslateX = getCurrentTranslateX();
    draggedX = 0;

    testimonialsSlider.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDown) return;
    lastClientX = e.clientX;
    if (moveRaf) return;

    moveRaf = requestAnimationFrame(() => {
      moveRaf = 0;
      const dx = lastClientX - startX;
      draggedX = dx;
      testimonialsTrack.style.transform = `translate3d(${startTranslateX + dx}px, 0, 0)`;
    });
  };

  const endDrag = () => {
    if (!isDown) return;
    isDown = false;
    testimonialsSlider.classList.remove("is-dragging");
    testimonialsTrack.classList.remove("is-dragging");

    if (moveRaf) {
      cancelAnimationFrame(moveRaf);
      moveRaf = 0;
    }

    if (!stepPx) {
      syncMetrics();
    }

    const currentTranslateX = startTranslateX + draggedX;
    const rawIndex = stepPx
      ? Math.round(-currentTranslateX / stepPx)
      : currentIndex;
    goTo(rawIndex, { animate: !prefersReducedMotion });
  };

  testimonialsSlider.addEventListener("pointerdown", onPointerDown);
  testimonialsSlider.addEventListener("pointermove", onPointerMove);
  testimonialsSlider.addEventListener("pointerup", endDrag);
  testimonialsSlider.addEventListener("pointercancel", endDrag);
  testimonialsSlider.addEventListener("lostpointercapture", endDrag);

  // Keyboard
  testimonialsSlider.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(currentIndex + 1, { animate: !prefersReducedMotion });
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(currentIndex - 1, { animate: !prefersReducedMotion });
    }
  });

  // --- Star gradient localization (Safari reliability)
  const defsSvg = testimonialsTrack.querySelector('svg[width="0"][height="0"]');
  const gradientTemplate = defsSvg?.querySelector("#testimonialStarGradient");
  if (gradientTemplate) {
    const starSvgs = testimonialsTrack.querySelectorAll(
      ".testimonial__stars svg",
    );
    let starGradientSerial = 0;

    starSvgs.forEach((svg) => {
      svg
        .querySelectorAll('defs[data-nb-local="testimonialStarGradient"]')
        .forEach((defs) => defs.remove());

      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs",
      );
      defs.setAttribute("data-nb-local", "testimonialStarGradient");

      const gradient = gradientTemplate.cloneNode(true);
      const localId = `testimonialStarGradient-local-${starGradientSerial++}`;
      gradient.id = localId;
      defs.appendChild(gradient);

      svg.insertBefore(defs, svg.firstChild);
      svg.style.stroke = `url(#${localId})`;
      svg.style.fill = "none";
    });
  }
}
