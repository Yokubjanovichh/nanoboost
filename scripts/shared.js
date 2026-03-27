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

// Breadcrumb element (mobile only)
const breadcrumb = dropdownRoot?.querySelector(".dropdown__breadcrumb");
const breadcrumbText = breadcrumb?.querySelector(".dropdown__breadcrumb-text");
const breadcrumbBack = breadcrumb?.querySelector(".dropdown__breadcrumb-back");

let currentStep = "games"; // "games" | "platforms" | "services"
let activeGameLabel = "";
let activePlatformLabel = "";

const updateBreadcrumb = () => {
  if (!breadcrumb || !breadcrumbText) return;
  if (currentStep === "games") {
    breadcrumb.classList.remove("is-visible");
    breadcrumbText.textContent = "";
  } else if (currentStep === "platforms") {
    breadcrumb.classList.add("is-visible");
    breadcrumbText.textContent = activeGameLabel;
  } else if (currentStep === "services") {
    breadcrumb.classList.add("is-visible");
    breadcrumbText.textContent = activeGameLabel + " \u203A " + activePlatformLabel;
  }
};

const goBack = () => {
  if (!dropdownRoot) return;
  if (currentStep === "services") {
    dropdownRoot.classList.remove("has-platform");
    dropdownRoot
      .querySelectorAll(".dropdown__item[data-platform]")
      .forEach((el) => el.classList.remove("is-active"));
    dropdownRoot
      .querySelectorAll(".dropdown__sublist[data-for]")
      .forEach((list) => list.classList.remove("is-active"));
    currentStep = "platforms";
  } else if (currentStep === "platforms") {
    dropdownRoot.classList.remove("has-game", "has-platform");
    dropdownRoot
      .querySelectorAll(".dropdown__item[data-game]")
      .forEach((el) => el.classList.remove("is-active"));
    dropdownRoot
      .querySelectorAll(".dropdown__platform-list[data-for-game]")
      .forEach((list) => list.classList.remove("is-active"));
    currentStep = "games";
  }
  updateBreadcrumb();
};

if (breadcrumbBack) {
  breadcrumbBack.addEventListener("click", (e) => {
    e.stopPropagation();
    goBack();
  });
}

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

  currentStep = "games";
  updateBreadcrumb();
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

  activeGameLabel = activeGame?.textContent?.trim() || gameId;
  currentStep = "platforms";
  if (isMobileNav()) updateBreadcrumb();
};

// Map: service-type + platform → service ID
const serviceTypeMap = {
  "cash-cars": { ps: "gta-cash-cars-ps", xbox: "gta-cash-cars-xbox" },
  cash: { ps: "gta-cash-ps", xbox: "gta-cash-xbox", pc: "gta-cash-pc" },
  level: { ps: "gta-level-ps", xbox: "gta-level-xbox", pc: "gta-level-pc" },
  modded: { ps: "gta-modded-ps", xbox: "gta-modded-xbox" },
  unlock: { pc: "gta-unlock-pc" },
};

// Determine the correct services page path based on current page location
const getServicesPagePath = () => {
  const path = window.location.pathname;
  if (path.includes("/pages/")) return "./services.html";
  return "./pages/services.html";
};

// Update sublist links with correct service URLs for the selected platform
const updateSublistLinks = (platformId) => {
  const subLinks = dropdownRoot?.querySelectorAll(
    ".dropdown__sublist.is-active a[data-service-type]",
  );
  if (!subLinks) return;

  const basePath = getServicesPagePath();
  subLinks.forEach((link) => {
    const type = link.dataset.serviceType;
    const serviceId = serviceTypeMap[type]?.[platformId];
    if (serviceId) {
      link.href = `${basePath}?service=${serviceId}`;
      link.closest(".dropdown__subitem")?.classList.remove("dropdown__subitem--unavailable");
    } else {
      link.href = "#";
      link.closest(".dropdown__subitem")?.classList.add("dropdown__subitem--unavailable");
    }
  });
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

  // Update service links with correct URLs for this platform
  updateSublistLinks(platformId);

  activePlatformLabel = activeItem?.textContent?.trim() || platformId;
  currentStep = "services";
  if (isMobileNav()) updateBreadcrumb();
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

// Sub-item click: navigate to service page or mark active
subItems?.forEach((link) => {
  link.addEventListener("click", (e) => {
    // If link has a real URL, let browser navigate
    if (link.href && !link.href.endsWith("#")) {
      dropdownItem?.classList.remove("is-open");
      if (isMobileNav()) {
        burger?.classList.remove("is-open");
        nav?.classList.remove("is-open");
        resetDropdownSteps();
      }
      return;
    }
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
  const show = totalQty > 0;
  const badgeDisplay = show ? "flex" : "none";
  const floatDisplay = show ? "" : "none";

  // Bitta requestAnimationFrame ichida barcha DOM o'zgarishlarni batch qilish
  requestAnimationFrame(() => {
    document.querySelectorAll(".cart__badge, .cart-float__badge").forEach((b) => {
      b.textContent = totalQty;
      b.style.display = badgeDisplay;
    });
    document.querySelectorAll(".cart-float").forEach((btn) => {
      btn.style.display = floatDisplay;
    });
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

  // DocumentFragment — DOM ga faqat 1 marta yoziladi, reflow 1 ta
  const frag = document.createDocumentFragment();

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
    frag.appendChild(row);
  });

  itemsEl.innerHTML = "";
  itemsEl.appendChild(frag);

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

  const scrollbarW = nbGetScrollbarWidth();
  document.documentElement.style.setProperty("--nb-scrollbar-w", scrollbarW + "px");
  document.documentElement.classList.add("nb-no-scroll");
  widget.classList.add("is-open");
};

const nbCloseCartWidget = () => {
  const widget = document.getElementById("cart-widget");
  if (!widget) return;
  widget.classList.remove("is-open");
  document.documentElement.classList.remove("nb-no-scroll");
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
    const h = window.innerHeight;
    const isPhoneLandscape = h <= 500 && w > h;
    if (w >= 1600 && !isPhoneLandscape) return 4;
    if (w <= 480 || isPhoneLandscape) return 1.5;
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
    maxIndex = Math.max(0, cards.length - Math.floor(visible));
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
  let lastMoveTime = 0;
  let velocity = 0;

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
    velocity = 0;
    lastMoveTime = Date.now();

    testimonialsSlider.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDown) return;
    const now = Date.now();
    const dt = now - lastMoveTime;
    const prevX = lastClientX;
    lastClientX = e.clientX;
    lastMoveTime = now;

    if (dt > 0) {
      const instantV = (lastClientX - prevX) / dt;
      velocity = velocity * 0.4 + instantV * 0.6;
    }

    if (moveRaf) return;

    moveRaf = requestAnimationFrame(() => {
      moveRaf = 0;
      const dx = lastClientX - startX;
      draggedX = dx;
      let tx = startTranslateX + dx;
      // Rubber-band at edges
      const minTx = -maxIndex * stepPx;
      if (tx > 0) tx = tx * 0.3;
      else if (tx < minTx) tx = minTx + (tx - minTx) * 0.3;
      testimonialsTrack.style.transform = `translate3d(${tx}px, 0, 0)`;
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
    // velocity: px/ms, threshold ~0.3 px/ms ≈ flick
    const flick = Math.abs(velocity) > 0.3;
    let rawIndex;
    if (flick) {
      rawIndex = velocity < 0
        ? Math.ceil(-currentTranslateX / stepPx)
        : Math.floor(-currentTranslateX / stepPx);
    } else {
      rawIndex = Math.round(-currentTranslateX / stepPx);
    }
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

// =============================================
// Performance: pause offscreen animations
// =============================================
{
  const animEls = document.querySelectorAll(".animated-border");
  if (animEls.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          e.target.style.animationPlayState = e.isIntersecting
            ? "running"
            : "paused";
        });
      },
      { rootMargin: "100px" },
    );
    animEls.forEach((el) => obs.observe(el));
  }
}

// =============================================
// Email copy fallback for mailto: links
// =============================================
document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const email = link.href.replace("mailto:", "").split("?")[0];
    navigator.clipboard?.writeText(email).then(() => {
      const toast = document.createElement("div");
      toast.textContent = "Email copied!";
      toast.style.cssText =
        "position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);" +
        "background:linear-gradient(135deg,#2de1fe,#6849fe);color:#fff;" +
        "padding:1rem 2.4rem;border-radius:5rem;font-family:Poppins,sans-serif;" +
        "font-size:1.4rem;font-weight:500;z-index:99999;opacity:0;transition:opacity .3s";
      document.body.appendChild(toast);
      requestAnimationFrame(() => (toast.style.opacity = "1"));
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    });
  });
});

// =============================================
// Universal Search
// =============================================
{
  const searchContainer = document.querySelector(".search");
  const searchInput = document.querySelector(".search__input");
  const SERVICE_CFG = window.NB_SERVICE_CONFIG || {};

  if (searchContainer && searchInput && Object.keys(SERVICE_CFG).length) {
    // Determine services page path
    const isSubpage = window.location.pathname.includes("/pages/");
    const servicesPath = isSubpage
      ? "./services.html"
      : "./pages/services.html";

    // Build searchable index from service config
    const searchIndex = Object.entries(SERVICE_CFG).map(([id, cfg]) => {
      const plainTitle = (cfg.titleHtml || "").replace(/<br\s*\/?>/g, " ");
      const platform = cfg.platform || "";
      // Build keywords: title words + platform + common aliases
      const keywords = [
        plainTitle,
        platform,
        id,
        "gta",
        "gta5",
        "gta 5",
        "gta online",
      ]
        .join(" ")
        .toLowerCase();

      // Extract "From" price
      const firstOption = (cfg.options || [])[0] || "";
      const priceMatch = firstOption.match(/\$([\d.]+)/);
      const fromPrice = priceMatch ? `$${priceMatch[1]}` : "";

      return {
        id,
        title: plainTitle,
        platform,
        image: cfg.imageSrc || "",
        fromPrice,
        keywords,
        href: `${servicesPath}?service=${id}`,
      };
    });

    // Create dropdown element
    const resultsEl = document.createElement("div");
    resultsEl.className = "search__results";
    resultsEl.setAttribute("role", "listbox");
    searchContainer.appendChild(resultsEl);

    let focusedIndex = -1;
    let currentItems = [];

    const renderResults = (query) => {
      const q = query.trim().toLowerCase();
      focusedIndex = -1;

      if (!q) {
        resultsEl.classList.remove("is-open");
        resultsEl.innerHTML = "";
        currentItems = [];
        return;
      }

      // Split query into words for multi-word matching
      const words = q.split(/\s+/).filter(Boolean);

      // Filter: ALL words must match somewhere in keywords
      const matches = searchIndex.filter((item) =>
        words.every((w) => item.keywords.includes(w)),
      );

      currentItems = matches;

      if (!matches.length) {
        resultsEl.innerHTML =
          '<div class="search__no-results">No services found</div>';
        resultsEl.classList.add("is-open");
        return;
      }

      // Group by platform
      const groups = {};
      matches.forEach((m) => {
        const key = m.platform || "Other";
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
      });

      let html = "";
      let idx = 0;
      for (const [platform, items] of Object.entries(groups)) {
        html += `<div class="search__result-group">`;
        html += `<div class="search__result-label">${platform}</div>`;
        items.forEach((item) => {
          html += `
            <a class="search__result-item" href="${item.href}"
               data-index="${idx}" role="option">
              <span class="search__result-name">${highlightMatch(item.title, words)}</span>
            </a>`;
          idx++;
        });
        html += `</div>`;
      }

      resultsEl.innerHTML = html;
      resultsEl.classList.add("is-open");
    };

    // Highlight matching text
    const highlightMatch = (text, words) => {
      let result = text;
      words.forEach((w) => {
        const regex = new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        result = result.replace(regex, "<strong>$1</strong>");
      });
      return result;
    };

    // Keyboard navigation
    const setFocus = (index) => {
      const items = resultsEl.querySelectorAll(".search__result-item");
      items.forEach((el) => el.classList.remove("is-focused"));
      if (index >= 0 && index < items.length) {
        focusedIndex = index;
        items[index].classList.add("is-focused");
        items[index].scrollIntoView({ block: "nearest" });
      } else {
        focusedIndex = -1;
      }
    };

    // Debounce input
    let debounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderResults(searchInput.value);
      }, 150);
    });

    searchInput.addEventListener("keydown", (e) => {
      const total = currentItems.length;
      if (!total && e.key !== "Escape") return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocus(focusedIndex < total - 1 ? focusedIndex + 1 : 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocus(focusedIndex > 0 ? focusedIndex - 1 : total - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (focusedIndex >= 0) {
          const items = resultsEl.querySelectorAll(".search__result-item");
          if (items[focusedIndex]) {
            window.location.href = items[focusedIndex].href;
          }
        } else if (currentItems.length === 1) {
          window.location.href = currentItems[0].href;
        }
      } else if (e.key === "Escape") {
        resultsEl.classList.remove("is-open");
        searchInput.blur();
      }
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!searchContainer.contains(e.target)) {
        resultsEl.classList.remove("is-open");
      }
    });

    // Focus opens results if there's a query
    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim()) {
        renderResults(searchInput.value);
      }
    });

    // ── Typing placeholder animation ──
    const typingPhrases = [
      "Cash Boost from $9.99",
      "Unlock All for PC",
      "Level Boost PS4/PS5",
      "Modded Account Xbox",
      "Cash + Cars Boost",
      "1 Billion GTA Cash",
    ];

    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typingTimer = null;

    const typeStep = () => {
      if (document.activeElement === searchInput || searchInput.value) {
        typingTimer = setTimeout(typeStep, 1000);
        return;
      }

      const phrase = typingPhrases[phraseIdx];

      if (!isDeleting) {
        charIdx++;
        if (charIdx > phrase.length) {
          isDeleting = true;
          typingTimer = setTimeout(typeStep, 1800);
          return;
        }
      } else {
        charIdx--;
        if (charIdx <= 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % typingPhrases.length;
          typingTimer = setTimeout(typeStep, 400);
          return;
        }
      }

      searchInput.setAttribute("placeholder", phrase.slice(0, charIdx));
      typingTimer = setTimeout(typeStep, isDeleting ? 35 : 75);
    };

    const stopTyping = () => {
      clearTimeout(typingTimer);
      searchInput.setAttribute("placeholder", "");
    };

    const resumeTyping = () => {
      if (!searchInput.value) {
        typingTimer = setTimeout(typeStep, 600);
      }
    };

    searchInput.addEventListener("focus", stopTyping);
    searchInput.addEventListener("blur", resumeTyping);

    typingTimer = setTimeout(typeStep, 1000);
  }
}

// =============================================
// Skeleton: rasm yuklangach skeleton olib tashlash
// =============================================
document.querySelectorAll("img.skeleton").forEach((img) => {
  const remove = () => img.classList.remove("skeleton");
  if (img.complete) {
    remove();
  } else {
    img.addEventListener("load", remove, { once: true });
    img.addEventListener("error", remove, { once: true });
  }
});
