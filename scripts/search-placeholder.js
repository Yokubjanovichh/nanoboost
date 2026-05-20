// Animated rotating placeholder for the header / drawer search inputs.
// Cycles through a curated multi-game prompt list with type → hold →
// delete → pause loop driven by requestAnimationFrame. Pauses while
// the input is focused so the user isn't fighting with typing
// suggestions, and respects prefers-reduced-motion (drops to the
// first prompt as a static placeholder).
//
// Multi-game prompts — extend PROMPTS as new games launch.

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
    let last = 0;
    // Start in the "stopped" state so the IntersectionObserver's first
    // callback (input is visible at load time) flips us into start().
    // The previous default `false` short-circuited the resume guard
    // and the animation never kicked off on first paint.
    let stopped = true;

    function step(now) {
      if (stopped) return;
      if (document.activeElement === input || input.value) {
        // Don't fight the user — fall back to the neutral prompt and
        // re-check shortly so we resume when they blur an empty field.
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

    function start() {
      stopped = false;
      idx = 0;
      charIdx = 0;
      mode = "typing";
      last = 0;
      raf = requestAnimationFrame(step);
    }
    function stop() {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      input.placeholder = FALLBACK;
    }

    input.addEventListener("focus", stop);
    input.addEventListener("blur", function () {
      if (!input.value) start();
    });
    // Pause the rotator while the input is off-screen (e.g. mobile
    // drawer closed) to keep the requestAnimationFrame loop from
    // doing layout work the user can't see.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (stopped && document.activeElement !== input && !input.value) {
              start();
            }
          } else {
            stop();
          }
        });
      });
      io.observe(input);
    } else {
      start();
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
