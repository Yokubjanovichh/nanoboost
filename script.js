const burger = document.getElementById("burger");
const nav = document.querySelector(".nav");

// Burger — navigatsiyani ochish/yopish
if (burger && nav) {
  burger.addEventListener("click", () => {
    burger.classList.toggle("is-open");
    nav.classList.toggle("is-open");
  });

  // Tashqariga bosilsa — yopiladi
  document.addEventListener("click", (e) => {
    if (!burger.contains(e.target) && !nav.contains(e.target)) {
      burger.classList.remove("is-open");
      nav.classList.remove("is-open");
    }
  });
}

// =============================================
// Dropdown — bosib ochish/yopish
// =============================================
const dropdownItem = document.querySelector(".nav__item--dropdown");
const dropdownLink = dropdownItem?.querySelector(".nav__link");

if (dropdownLink) {
  dropdownLink.addEventListener("click", (e) => {
    e.preventDefault();
    dropdownItem.classList.toggle("is-open");
  });

  // Tashqariga bosish — dropdown yopiladi
  document.addEventListener("click", (e) => {
    if (!dropdownItem.contains(e.target)) {
      dropdownItem.classList.remove("is-open");
    }
  });
}

// =============================================
// Dropdown — o'yin hover → sub-list almashish
// =============================================
const gameItems = document.querySelectorAll(".dropdown__item[data-game]");
const subLists = document.querySelectorAll(".dropdown__sublist[data-for]");
const subItems = document.querySelectorAll(".dropdown__subitem a");

gameItems.forEach((item) => {
  item.addEventListener("mouseenter", () => {
    const game = item.dataset.game;

    // Barcha game itemlardan is-active olib tashlash
    gameItems.forEach((el) => el.classList.remove("is-active"));
    item.classList.add("is-active");

    // Barcha sub-listlarni yashirib, mos listni ko'rsatish
    subLists.forEach((list) => list.classList.remove("is-active"));
    const target = document.querySelector(
      `.dropdown__sublist[data-for="${game}"]`,
    );
    if (target) target.classList.add("is-active");
  });
});

// Sub-item bosishda active holat
subItems.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const parentList = link.closest(".dropdown__sublist");
    parentList
      .querySelectorAll(".dropdown__subitem")
      .forEach((li) => li.classList.remove("dropdown__subitem--active"));
    link
      .closest(".dropdown__subitem")
      .classList.add("dropdown__subitem--active");
  });
});

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
// Testimonials carousel (infinite loop)
// =============================================
const testimonialsSection = document.querySelector(".testimonials");
const testimonialsTrack = document.querySelector(".testimonials__grid");
const testimonialsSlider = document.querySelector(".testimonials__slider");

if (testimonialsSection && testimonialsTrack) {
  const dotsContainer = testimonialsSection.querySelector(
    ".testimonials__dots",
  );
  let testimonialDots = [];

  const defsSvg = testimonialsTrack.querySelector('svg[width="0"][height="0"]');
  const originalCards = Array.from(
    testimonialsTrack.querySelectorAll(".testimonial"),
  );

  let visibleCount = 1;
  let cloneCount = 0;
  let position = 0; // index inside (clones + originals + clones)
  let stepPx = 0;

  const getVisibleCount = () => {
    if (window.innerWidth <= 430) return 1;
    if (window.innerWidth <= 768) return 2;
    return 3;
  };

  const setTransformForPosition = (animate = true) => {
    if (!stepPx) return;
    testimonialsTrack.style.transition = animate ? "" : "none";
    testimonialsTrack.style.transform = `translateX(-${position * stepPx}px)`;
  };

  const getActiveRealIndex = () => {
    const n = originalCards.length;
    if (!n) return 0;
    const raw = position - cloneCount;
    return ((raw % n) + n) % n;
  };

  const updateDots = () => {
    const n = originalCards.length;
    if (!testimonialDots.length || !n) return;
    const activeReal = getActiveRealIndex();

    testimonialDots.forEach((dot, index) => {
      const isActive = index === activeReal;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-selected", isActive ? "true" : "false");
      dot.setAttribute("tabindex", isActive ? "0" : "-1");
      dot.style.display = "inline-block";
      dot.style.opacity = "1";
      dot.style.pointerEvents = "auto";
    });
  };

  const rebuildDots = () => {
    const n = originalCards.length;
    if (!dotsContainer || !n) return;

    dotsContainer.innerHTML = "";

    for (let i = 0; i < n; i += 1) {
      const dot = document.createElement("span");
      dot.className = `testimonials__dot${i === 0 ? " is-active" : ""}`;
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
      dot.setAttribute("aria-label", `Testimonial ${i + 1}`);
      dot.setAttribute("tabindex", i === 0 ? "0" : "-1");

      dot.addEventListener("click", () => {
        position = cloneCount + i;
        setTransformForPosition(true);
        updateDots();
      });
      dot.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          position = cloneCount + i;
          setTransformForPosition(true);
          updateDots();
        }
      });

      dotsContainer.appendChild(dot);
    }

    testimonialDots = Array.from(
      testimonialsSection.querySelectorAll(".testimonials__dot"),
    );
  };

  const rebuildCarousel = () => {
    const n = originalCards.length;
    if (!n) return;

    visibleCount = getVisibleCount();
    cloneCount = Math.min(n, Math.max(1, visibleCount));

    // Clear track and rebuild: [defs] + [tail clones] + [originals] + [head clones]
    while (testimonialsTrack.firstChild) {
      testimonialsTrack.removeChild(testimonialsTrack.firstChild);
    }
    if (defsSvg) testimonialsTrack.appendChild(defsSvg);

    for (let i = n - cloneCount; i < n; i += 1) {
      const clone = originalCards[i].cloneNode(true);
      clone.dataset.clone = "true";
      clone.setAttribute("aria-hidden", "true");
      testimonialsTrack.appendChild(clone);
    }

    originalCards.forEach((card) => {
      card.removeAttribute("aria-hidden");
      testimonialsTrack.appendChild(card);
    });

    for (let i = 0; i < cloneCount; i += 1) {
      const clone = originalCards[i].cloneNode(true);
      clone.dataset.clone = "true";
      clone.setAttribute("aria-hidden", "true");
      testimonialsTrack.appendChild(clone);
    }

    // Start at first real item
    position = cloneCount;

    const cards = Array.from(
      testimonialsTrack.querySelectorAll(".testimonial"),
    );
    if (!cards.length) return;

    if (cards.length >= 2) {
      const a = cards[0].getBoundingClientRect();
      const b = cards[1].getBoundingClientRect();
      stepPx = b.left - a.left;
    }

    if (!stepPx || stepPx <= 0) {
      const firstCard = cards[0];
      const cardRect = firstCard.getBoundingClientRect();
      const trackStyle = window.getComputedStyle(testimonialsTrack);
      const gap =
        parseFloat(
          trackStyle.columnGap ||
            trackStyle.gap ||
            trackStyle.getPropertyValue("gap") ||
            "0",
        ) || 0;
      stepPx = cardRect.width + gap;
    }

    setTransformForPosition(false);
    // Restore transition after the "jump"
    requestAnimationFrame(() => setTransformForPosition(true));
    rebuildDots();
    updateDots();
  };

  const moveBy = (delta) => {
    const n = originalCards.length;
    if (!n || !stepPx) return;
    position += delta;
    setTransformForPosition(true);
    updateDots();
  };

  // Seamless wrap after animation finishes
  testimonialsTrack.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "transform") return;
    const n = originalCards.length;
    if (!n) return;

    const afterLastReal = cloneCount + n;
    const beforeFirstReal = cloneCount - 1;

    if (position >= afterLastReal) {
      position = cloneCount;
      setTransformForPosition(false);
      requestAnimationFrame(() => setTransformForPosition(true));
      updateDots();
    } else if (position <= beforeFirstReal) {
      position = cloneCount + n - 1;
      setTransformForPosition(false);
      requestAnimationFrame(() => setTransformForPosition(true));
      updateDots();
    }
  });

  // Keyboard: arrow left/right for carousel
  if (testimonialsSlider) {
    testimonialsSlider.setAttribute("tabindex", "0");
    testimonialsSlider.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveBy(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveBy(1);
      }
    });
  }

  // Swipe (Pointer Events: works on touch + mouse)
  if (testimonialsSlider) {
    let isDown = false;
    let isHorizontal = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;

    const minSwipe = 50;
    const intentThreshold = 8;

    testimonialsSlider.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDown = true;
      isHorizontal = false;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      try {
        testimonialsSlider.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    });

    testimonialsSlider.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      lastX = e.clientX;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!isHorizontal) {
        if (Math.abs(dx) > intentThreshold && Math.abs(dx) > Math.abs(dy)) {
          isHorizontal = true;
        } else if (
          Math.abs(dy) > intentThreshold &&
          Math.abs(dy) > Math.abs(dx)
        ) {
          // user is scrolling vertically
          isDown = false;
        }
      }

      if (isHorizontal) {
        e.preventDefault();
      }
    });

    const finishSwipe = () => {
      if (!isHorizontal) return;
      const dx = lastX - startX;
      if (dx <= -minSwipe) moveBy(1);
      else if (dx >= minSwipe) moveBy(-1);
    };

    testimonialsSlider.addEventListener("pointerup", () => {
      if (!isDown) return;
      isDown = false;
      finishSwipe();
    });

    testimonialsSlider.addEventListener("pointercancel", () => {
      isDown = false;
      isHorizontal = false;
    });
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuildCarousel, 120);
  });

  rebuildCarousel();
}
