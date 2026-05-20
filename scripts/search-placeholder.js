// Animated rotating placeholder for the header search input.
// Cycles through a curated multi-game prompt list with type → hold →
// delete → pause loop driven by requestAnimationFrame. Pauses while
// the input is focused or the user has typed something, and an
// IntersectionObserver pauses the loop when the input scrolls
// off-screen so we're not burning frames the user can't see.
// prefers-reduced-motion → static first prompt.

(function () {
  "use strict";

  const PROMPTS = [
    "GTA Online cash drop",
    "Forza Horizon 6 credits",
    "Rank boosting",
    "Heist completion",
    "Modded account",
    "Try: 'GTA money'",
  ];
  const FALLBACK = "Search services";
  const TYPE_SPEED = 60;
  const DELETE_SPEED = 30;
  const HOLD_TIME = 2200;
  const PAUSE_BETWEEN = 400;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function startRotator(input) {
    if (!input) return;
    if (reducedMotion) {
      input.placeholder = PROMPTS[0];
      return;
    }

    let idx = 0;
    let charIdx = 0;
    // typing | holding | deleting | pausing
    let mode = "typing";
    let raf = null;
    // Seed `last` with the current high-res timestamp so the first
    // step() tick sees a real delta against `now` — defaulting to 0
    // left the first frame thinking 16ms+ had passed since the epoch
    // and skipped straight past TYPE_SPEED.
    let last = performance.now();
    let paused = false;

    function step(now) {
      if (paused) return;
      if (document.activeElement === input || input.value) {
        // Don't fight the user — fall back to the neutral prompt but
        // keep the loop alive so we resume when they blur an empty
        // field.
        input.placeholder = FALLBACK;
        raf = requestAnimationFrame(step);
        return;
      }
      const word = PROMPTS[idx];
      const delta = now - last;
      if (mode === "typing" && delta >= TYPE_SPEED) {
        charIdx += 1;
        input.placeholder = word.slice(0, charIdx);
        last = now;
        if (charIdx >= word.length) mode = "holding";
      } else if (mode === "holding" && delta >= HOLD_TIME) {
        mode = "deleting";
        last = now;
      } else if (mode === "deleting" && delta >= DELETE_SPEED) {
        charIdx -= 1;
        input.placeholder = word.slice(0, Math.max(charIdx, 0));
        last = now;
        if (charIdx <= 0) {
          mode = "pausing";
          last = now;
        }
      } else if (mode === "pausing" && delta >= PAUSE_BETWEEN) {
        idx = (idx + 1) % PROMPTS.length;
        charIdx = 0;
        mode = "typing";
        last = now;
      }
      raf = requestAnimationFrame(step);
    }

    function play() {
      if (!paused && raf !== null) return;
      paused = false;
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
    function pause() {
      paused = true;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      input.placeholder = FALLBACK;
    }

    // Kick off immediately — the IntersectionObserver below will pause
    // us if the input happens to start off-screen (it'd fire a
    // not-intersecting callback on its first tick in that case).
    play();

    input.addEventListener("focus", pause);
    input.addEventListener("blur", function () {
      if (!input.value) play();
    });

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (document.activeElement !== input && !input.value) play();
          } else {
            pause();
          }
        });
      });
      io.observe(input);
    }
  }

  function init() {
    document.querySelectorAll(".search__input").forEach(startRotator);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
