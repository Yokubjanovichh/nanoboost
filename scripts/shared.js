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
  dropdownRoot.classList.remove("has-platform", "has-game");

  dropdownRoot
    .querySelectorAll(".dropdown__item[data-game]")
    .forEach((el) => el.classList.remove("is-active"));

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
// Dropdown — Platform → Games → Services
// =============================================
const platformItems = dropdownRoot?.querySelectorAll(
  ".dropdown__item[data-platform]",
);
const gameLists = dropdownRoot?.querySelectorAll(
  ".dropdown__game-list[data-for-platform]",
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

const setActiveGame = (gameId) => {
  if (!dropdownRoot) return;
  const activeGameList = dropdownRoot.querySelector(
    ".dropdown__game-list.is-active",
  );
  if (!activeGameList) return;

  const gameItems = activeGameList.querySelectorAll(
    ".dropdown__item[data-game]",
  );
  gameItems.forEach((el) => el.classList.remove("is-active"));
  const activeItem = activeGameList.querySelector(
    `.dropdown__item[data-game="${gameId}"]`,
  );
  if (activeItem) activeItem.classList.add("is-active");

  dropdownRoot.classList.add("has-game");
  setActiveSublist(gameId);
};

const setActivePlatform = (platformId) => {
  if (!dropdownRoot || !platformItems?.length || !gameLists?.length) return;

  dropdownRoot.classList.add("has-platform");
  dropdownRoot.classList.remove("has-game");

  platformItems.forEach((el) => el.classList.remove("is-active"));
  const activePlatform = dropdownRoot.querySelector(
    `.dropdown__item[data-platform="${platformId}"]`,
  );
  if (activePlatform) activePlatform.classList.add("is-active");

  gameLists.forEach((list) => list.classList.remove("is-active"));
  const targetGameList = dropdownRoot.querySelector(
    `.dropdown__game-list[data-for-platform="${platformId}"]`,
  );
  if (targetGameList) targetGameList.classList.add("is-active");

  // Step flow: don't auto-select a game. User picks a game, then services appear.
  targetGameList
    ?.querySelectorAll(".dropdown__item[data-game]")
    .forEach((el) => el.classList.remove("is-active"));
  setActiveSublist(null);
};

// Platform interactions (hover + click + keyboard)
platformItems?.forEach((item) => {
  const platformId = item.dataset.platform;
  if (!platformId) return;

  item.addEventListener("mouseenter", () => {
    if (isMobileNav()) return;
    setActivePlatform(platformId);
  });

  item.addEventListener("click", () => {
    setActivePlatform(platformId);
  });

  item.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();

    if (isMobileNav()) {
      setActivePlatform(platformId);
      return;
    }

    setActivePlatform(platformId);
  });
});

// Game interactions
dropdownRoot?.querySelectorAll(".dropdown__item[data-game]").forEach((item) => {
  const gameId = item.dataset.game;
  if (!gameId) return;

  const shouldHandle = () => {
    const parentList = item.closest(".dropdown__game-list");
    return parentList?.classList.contains("is-active");
  };

  item.addEventListener("mouseenter", () => {
    if (!shouldHandle()) return;
    if (isMobileNav()) return;
    setActiveGame(gameId);
  });

  item.addEventListener("click", () => {
    if (!shouldHandle()) return;
    setActiveGame(gameId);
  });

  item.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (!shouldHandle()) return;
    e.preventDefault();
    setActiveGame(gameId);
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
if (dropdownRoot && platformItems?.length) {
  resetDropdownSteps();
}

// =============================================
// FAQ accordion
// =============================================
const faqItems = document.querySelectorAll(".faq-item");

if (faqItems.length) {
  faqItems.forEach((item) => {
    const trigger = item.querySelector(".faq-item__trigger");
    if (!trigger) return;

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
