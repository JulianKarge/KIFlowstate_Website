(function () {
  "use strict";

  const NUDGE_DISMISSED_KEY = "kif_invoice_demo_nudge_dismissed_until_v1";
  const DEFAULT_SHOWCASE_DURATION = 26000;
  const showcaseControllers = [];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindShowcases();
    bindCapabilityCarousel();
    bindDemoNudge();

    document.addEventListener("kif:languagechange", () => {
      showcaseControllers.forEach((controller) => controller.updateLabel());
    });
  }

  function bindShowcases() {
    document.querySelectorAll("[data-showcase]").forEach((root) => {
      if (root.dataset.showcaseBound) return;
      root.dataset.showcaseBound = "1";
      showcaseControllers.push(createShowcaseController(root));
    });
  }

  // The four story chapters on the shared clock. `start` marks where a
  // chapter begins (drives the highlight), `jump` is the moment a chapter
  // button seeks to: slightly past the start so the scene is already built.
  const SHOWCASE_CHAPTERS = [
    { key: "email", start: 0, jump: 0.035 },
    { key: "ai", start: 0.17, jump: 0.28 },
    { key: "review", start: 0.49, jump: 0.57 },
    { key: "send", start: 0.78, jump: 0.84 }
  ];

  const CHAPTER_NAME_FALLBACKS = {
    email: { de: "Kunden-E-Mail", en: "Customer email" },
    ai: { de: "KI-Entwurf", en: "AI draft" },
    review: { de: "Prüfung", en: "Review" },
    send: { de: "Gmail-Versand", en: "Gmail delivery" }
  };

  function createShowcaseController(root) {
    const durationFromMarkup = Number(root.dataset.durationMs);
    const duration = Number.isFinite(durationFromMarkup) && durationFromMarkup > 0
      ? durationFromMarkup
      : DEFAULT_SHOWCASE_DURATION;
    const toggle = findShowcaseToggle(root);
    const label = toggle && toggle.querySelector("[data-showcase-control-label]");
    const icon = toggle && toggle.querySelector(".invoice-showcase-toggle-icon i");
    const scrubber = root.querySelector("[data-showcase-scrubber]");
    const phaseLabel = root.querySelector("[data-showcase-phase-label]");
    const chapterButtons = Array.from(root.querySelectorAll("[data-showcase-chapter]"));
    const timeline = root.querySelector(".invoice-showcase-timeline");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hasIntersectionObserver = typeof window.IntersectionObserver === "function";
    // Scrubbing uses the Web Animations API, but only takes manual control
    // of currentTime while seeking. During autoplay the CSS animations run
    // natively so the compositor keeps doing the heavy lifting; the rAF
    // loop merely reads the time back for the UI.
    const supportsScrubbing = typeof root.getAnimations === "function" &&
      typeof window.CSSAnimation === "function";

    let userPaused = false;
    let offscreenPaused = hasIntersectionObserver;
    let documentPaused = document.hidden;
    let reducedMotion = motionQuery.matches;
    let hasStarted = false;
    let scrubbing = false;
    let holdUntil = 0;
    let resumeTimer = null;
    let elapsed = 0;
    let cycle = 0;
    let frame = null;
    let previousFrameTime = null;
    let animations = [];
    let animationsRunning = false;
    let announcedSecond = -1;
    let announcedPhase = "";
    let lastProgressStep = -1;

    root.style.setProperty("--showcase-duration", `${duration}ms`);
    root.style.setProperty("--showcase-progress", "0");
    root.dataset.showcaseReady = "false";
    root.dataset.showcaseCycle = "0";
    root.dataset.showcasePhase = reducedMotion ? "static" : "email";

    const isPaused = () => (
      !hasStarted || reducedMotion || userPaused || offscreenPaused ||
      documentPaused || scrubbing || performance.now() < holdUntil
    );

    const progressNow = () => (elapsed % duration) / duration;

    const chapterIndexForProgress = (progress) => {
      let index = 0;
      SHOWCASE_CHAPTERS.forEach((chapter, i) => {
        if (progress >= chapter.start) index = i;
      });
      return index;
    };

    const phaseForProgress = (progress) => {
      if (progress >= 0.965) return "closing";
      return SHOWCASE_CHAPTERS[chapterIndexForProgress(progress)].key;
    };

    const setAnimationsTime = () => {
      if (!supportsScrubbing) return;
      const time = elapsed % duration;
      animations.forEach((animation) => {
        try {
          animation.currentTime = time;
        } catch (err) {}
      });
    };

    // The animations share one clock, so any of them can report the time.
    const referenceTime = () => {
      for (const animation of animations) {
        try {
          const time = animation.currentTime;
          if (typeof time === "number") return time;
        } catch (err) {}
      }
      return null;
    };

    const playAnimations = () => {
      if (!supportsScrubbing) return;
      setAnimationsTime();
      animations.forEach((animation) => {
        try {
          animation.play();
        } catch (err) {}
      });
      animationsRunning = true;
    };

    const pauseAnimations = () => {
      if (!supportsScrubbing) return;
      if (animationsRunning) {
        const time = referenceTime();
        if (time != null) elapsed = time % duration;
      }
      animations.forEach((animation) => {
        try {
          animation.pause();
        } catch (err) {}
      });
      setAnimationsTime();
      animationsRunning = false;
    };

    const collectAnimations = () => {
      if (!supportsScrubbing) return;
      const wasRunning = animationsRunning;
      animations = root.getAnimations({ subtree: true }).filter(
        (animation) => animation instanceof window.CSSAnimation
      );
      animationsRunning = false;
      if (wasRunning) playAnimations();
      else pauseAnimations();
    };

    const chapterName = (key) => {
      const fallback = CHAPTER_NAME_FALLBACKS[key] || CHAPTER_NAME_FALLBACKS.email;
      return translatedShowcaseLabel(`invoice_showcase_phase_${key}`, fallback);
    };

    const updateTimelineUi = (force) => {
      const progress = progressNow();
      const chapterIndex = chapterIndexForProgress(progress);
      const chapterKey = SHOWCASE_CHAPTERS[chapterIndex].key;
      const second = Math.min(Math.round(duration / 1000), Math.floor((elapsed % duration) / 1000) + 1);
      const totalSeconds = Math.round(duration / 1000);

      // Only touch the DOM when the scrubber would visibly move: writing
      // the progress var and range value every frame forces needless
      // style recalculation.
      const progressStep = Math.round(progress * 1000);
      if (force || progressStep !== lastProgressStep) {
        lastProgressStep = progressStep;
        (timeline || root).style.setProperty("--showcase-progress", progress.toFixed(4));
        if (scrubber && !scrubbing) {
          scrubber.value = String(progressStep);
        }
      }

      if (!force && second === announcedSecond && chapterKey === announcedPhase) return;
      announcedSecond = second;
      announcedPhase = chapterKey;

      if (scrubber) {
        const template = translatedShowcaseLabel("invoice_showcase_position", {
          de: "Sekunde {s} von {t}: {phase}",
          en: "Second {s} of {t}: {phase}"
        });
        scrubber.setAttribute(
          "aria-valuetext",
          template
            .replace("{s}", String(second))
            .replace("{t}", String(totalSeconds))
            .replace("{phase}", chapterName(chapterKey))
        );
      }

      chapterButtons.forEach((button) => {
        const isActive = button.dataset.showcaseChapter === chapterKey && !reducedMotion;
        button.classList.toggle("is-active", isActive);
        if (isActive) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });

      if (phaseLabel) {
        if (reducedMotion) {
          phaseLabel.textContent = translatedShowcaseLabel("invoice_showcase_static_scene", {
            de: "Statische Ansicht",
            en: "Static view"
          });
        } else {
          const stepTemplate = translatedShowcaseLabel("invoice_showcase_step", {
            de: "Schritt {n} von 4",
            en: "Step {n} of 4"
          });
          phaseLabel.textContent =
            `${stepTemplate.replace("{n}", String(chapterIndex + 1))} · ${chapterName(chapterKey)}`;
        }
      }
    };

    const updateTimelineHooks = () => {
      const phase = reducedMotion ? "static" : phaseForProgress(progressNow());
      const cycleValue = String(cycle);
      if (root.dataset.showcasePhase !== phase) root.dataset.showcasePhase = phase;
      if (root.dataset.showcaseCycle !== cycleValue) root.dataset.showcaseCycle = cycleValue;
    };

    const tick = (time) => {
      frame = null;
      if (isPaused()) {
        previousFrameTime = null;
        return;
      }

      if (supportsScrubbing && animationsRunning) {
        // The animations advance themselves; read the shared clock back.
        const referenced = referenceTime();
        if (referenced != null) {
          const next = referenced % duration;
          if (next < elapsed) cycle += 1;
          elapsed = next;
          updateTimelineHooks();
          updateTimelineUi(false);
        }
      } else if (previousFrameTime == null) {
        previousFrameTime = time;
      } else {
        elapsed += Math.max(0, time - previousFrameTime);
        previousFrameTime = time;
        if (elapsed >= duration) {
          elapsed = elapsed % duration;
          cycle += 1;
        }
        updateTimelineHooks();
        updateTimelineUi(false);
      }

      frame = window.requestAnimationFrame(tick);
    };

    const stopClock = () => {
      if (frame != null) window.cancelAnimationFrame(frame);
      frame = null;
      previousFrameTime = null;
    };

    const startClock = () => {
      if (frame != null || !hasStarted || isPaused()) return;
      previousFrameTime = null;
      frame = window.requestAnimationFrame(tick);
    };

    const seekToProgress = (progress) => {
      elapsed = Math.max(0, Math.min(0.999, progress)) * duration;
      setAnimationsTime();
      updateTimelineHooks();
      updateTimelineUi(true);
    };

    // After a scrub interaction, hold the frame briefly, then let autoplay
    // continue on its own so the loop keeps its promise of running itself.
    const holdThenResume = (delay) => {
      holdUntil = performance.now() + delay;
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        resumeTimer = null;
        syncState();
      }, delay + 40);
      // During a pointer drag the state is already paused; re-running the
      // full sync for every input event would just churn the DOM.
      if (!scrubbing) syncState();
    };

    const updateLabel = () => {
      if (!toggle) return;

      let action = "pause";
      let text = translatedShowcaseLabel("invoice_showcase_pause", {
        de: "Animation pausieren",
        en: "Pause animation"
      });

      if (reducedMotion) {
        action = "static";
        text = translatedShowcaseLabel("invoice_showcase_static", {
          de: "Reduzierte Bewegung: statische Ansicht",
          en: "Reduced motion: static view"
        });
      } else if (userPaused) {
        action = "play";
        text = translatedShowcaseLabel("invoice_showcase_play", {
          de: "Animation fortsetzen",
          en: "Resume animation"
        });
      }

      toggle.disabled = reducedMotion;
      toggle.dataset.showcaseAction = action;
      toggle.removeAttribute("aria-pressed");
      toggle.setAttribute("aria-label", text);
      if (label) label.textContent = text;

      if (icon) {
        icon.classList.remove("fa-pause", "fa-play", "fa-image");
        icon.classList.add(action === "play" ? "fa-play" : action === "static" ? "fa-image" : "fa-pause");
      }
    };

    function syncState() {
      const pauseReasons = [];
      if (userPaused) pauseReasons.push("user");
      if (offscreenPaused) pauseReasons.push("offscreen");
      if (documentPaused) pauseReasons.push("document");
      if (reducedMotion) pauseReasons.push("reduced-motion");
      if (scrubbing || performance.now() < holdUntil) pauseReasons.push("scrubbing");
      if (!hasStarted) pauseReasons.push("not-started");

      // With scrub support the animations are always WAAPI-paused and the
      // stage renders from frame zero; without it, fall back to free-running
      // CSS animations gated on the first viewport contact.
      const running = supportsScrubbing
        ? !reducedMotion
        : hasStarted && !reducedMotion;
      root.classList.toggle("is-running", running);
      root.classList.toggle("is-user-paused", userPaused);
      root.classList.toggle("is-viewport-paused", offscreenPaused);
      root.classList.toggle("is-document-paused", documentPaused);
      root.classList.toggle("is-reduced-motion", reducedMotion);
      root.dataset.showcasePaused = String(isPaused());
      root.dataset.showcasePauseReasons = pauseReasons.length ? pauseReasons.join(",") : "none";
      root.dataset.showcaseMotion = reducedMotion ? "reduced" : "full";
      root.dataset.showcaseStarted = String(hasStarted);

      if (supportsScrubbing && running && !animations.length) {
        collectAnimations();
      }

      if (supportsScrubbing && running) {
        const shouldAnimate = !isPaused();
        if (shouldAnimate && !animationsRunning) playAnimations();
        else if (!shouldAnimate && animationsRunning) pauseAnimations();
      } else if (supportsScrubbing && animationsRunning) {
        pauseAnimations();
      }

      updateTimelineHooks();
      updateTimelineUi(true);
      updateLabel();
      if (isPaused()) stopClock();
      else startClock();
    }

    const resetTimeline = () => {
      elapsed = 0;
      cycle = 0;
      root.dataset.showcaseCycle = "0";
      root.dataset.showcasePhase = reducedMotion ? "static" : "email";
    };

    if (toggle) {
      toggle.removeAttribute("aria-pressed");
      toggle.addEventListener("click", () => {
        if (reducedMotion) return;
        userPaused = !userPaused;
        hasStarted = true;
        syncState();
      });
    }

    if (scrubber) {
      scrubber.max = "1000";
      scrubber.addEventListener("input", () => {
        hasStarted = true;
        seekToProgress(Number(scrubber.value) / 1000);
        holdThenResume(1200);
      });
      // The native 1/1000 step is perfect for dragging but far too fine for
      // keys, so keyboard seeking is handled explicitly: arrows move one
      // second, Home/End hit the ends, PageUp/PageDown jump chapters.
      scrubber.addEventListener("keydown", (event) => {
        const progress = progressNow();
        const secondStep = 1000 / duration;
        let next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowUp") {
          next = progress + secondStep;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
          next = progress - secondStep;
        } else if (event.key === "Home") {
          next = 0;
        } else if (event.key === "End") {
          next = 0.999;
        } else if (event.key === "PageUp" || event.key === "PageDown") {
          const forward = event.key === "PageUp";
          const index = chapterIndexForProgress(progress);
          const target = SHOWCASE_CHAPTERS[
            Math.max(0, Math.min(SHOWCASE_CHAPTERS.length - 1, index + (forward ? 1 : -1)))
          ];
          next = target.jump;
        }
        if (next == null) return;
        event.preventDefault();
        hasStarted = true;
        seekToProgress(next);
        holdThenResume(1200);
      });
      scrubber.addEventListener("pointerdown", () => {
        scrubbing = true;
        syncState();
      });
      const releaseScrub = () => {
        if (!scrubbing) return;
        scrubbing = false;
        holdThenResume(650);
      };
      scrubber.addEventListener("pointerup", releaseScrub);
      scrubber.addEventListener("pointercancel", releaseScrub);
      scrubber.addEventListener("blur", releaseScrub);
    }

    chapterButtons.forEach((button) => {
      button.disabled = !supportsScrubbing;
      button.addEventListener("click", () => {
        if (reducedMotion || !supportsScrubbing) return;
        const chapter = SHOWCASE_CHAPTERS.find(
          (entry) => entry.key === button.dataset.showcaseChapter
        );
        if (!chapter) return;
        hasStarted = true;
        seekToProgress(chapter.jump);
        holdThenResume(250);
      });
    });

    document.addEventListener("visibilitychange", () => {
      documentPaused = document.hidden;
      syncState();
    });

    // Responsive breakpoints swap some animation names, which creates new
    // CSSAnimation objects; re-collect so the shared clock keeps control.
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      if (!supportsScrubbing) return;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeTimer = null;
        collectAnimations();
      }, 220);
    });

    const handleMotionChange = (event) => {
      reducedMotion = event.matches;
      resetTimeline();
      if (!reducedMotion && !offscreenPaused) hasStarted = true;
      if (!reducedMotion) animations = [];
      syncState();
    };

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", handleMotionChange);
    } else if (motionQuery.addListener) {
      motionQuery.addListener(handleMotionChange);
    }

    if (hasIntersectionObserver) {
      const observer = new window.IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.target !== root) return;
            offscreenPaused = !(entry.isIntersecting && entry.intersectionRatio > 0.02);
            if (!offscreenPaused && !reducedMotion) hasStarted = true;
            syncState();
          });
        },
        { threshold: [0, 0.02, 0.15, 0.35] }
      );
      observer.observe(root);
    } else {
      offscreenPaused = false;
      if (!reducedMotion) hasStarted = true;
    }

    root.classList.add("is-enhanced");
    root.classList.toggle("is-scrub-enabled", supportsScrubbing);
    syncState();
    root.dataset.showcaseReady = "true";

    return {
      updateLabel: () => {
        updateLabel();
        updateTimelineUi(true);
      }
    };
  }

  function findShowcaseToggle(root) {
    const scope = root.closest(".invoice-showcase-section") || document;
    const candidates = Array.from(scope.querySelectorAll("[data-showcase-toggle]"));
    if (!candidates.length) return null;
    if (!root.id) return candidates[0];
    return candidates.find((button) => button.getAttribute("aria-controls") === root.id) || candidates[0];
  }

  function translatedShowcaseLabel(key, fallbacks) {
    const lang = document.documentElement.lang === "en" ? "en" : "de";
    const fallback = fallbacks[lang] || fallbacks.de;
    const translated = typeof translations !== "undefined" &&
      translations[lang] &&
      translations[lang][key]
      ? translations[lang][key]
      : fallback;
    const decoder = document.createElement("textarea");
    decoder.innerHTML = translated;
    return decoder.value;
  }

  function bindCapabilityCarousel() {
    const rail = document.getElementById("invoice-capability-rail");
    const wrap = document.querySelector("[data-invoice-carousel]");
    if (
      rail &&
      wrap &&
      window.KIMobileCardSwipers &&
      window.KIMobileCardSwipers.shouldUse()
    ) {
      window.KIMobileCardSwipers.mountInvoice();
      return;
    }
    if (!rail || !wrap || rail.dataset.carouselBound) return;

    rail.dataset.carouselBound = "1";

    const cards = Array.from(rail.querySelectorAll(".invoice-capability-card"));
    const dots = Array.from(document.querySelectorAll("[data-invoice-capability-dot]"));
    const prev = document.querySelector("[data-invoice-capability-prev]");
    const next = document.querySelector("[data-invoice-capability-next]");
    const EDGE = 12;
    let activeIndex = 0;
    let ticking = false;
    let dragDelta = 0;
    let mobileSnapTimer = null;
    let mobileSnapping = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartIndex = 0;

    const isStageMode = () => window.matchMedia("(min-width: 901px)").matches;
    const isCoarsePointer = () => window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const isMobileRail = () => !isStageMode() && isCoarsePointer();

    const normalizeIndex = (index) => {
      if (!cards.length) return 0;
      return ((index % cards.length) + cards.length) % cards.length;
    };

    const cardDistanceFromActive = (index) => {
      if (!isStageMode()) return index - activeIndex;
      const forward = (index - activeIndex + cards.length) % cards.length;
      const backward = (activeIndex - index + cards.length) % cards.length;
      if (forward === 0) return 0;
      return forward <= backward ? forward : -backward;
    };

    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const x = rail.scrollLeft;
      const looping = cards.length > 1;
      wrap.classList.toggle("is-looping", looping);
      wrap.classList.toggle("can-scroll-left", isStageMode() ? looping : x > EDGE);
      wrap.classList.toggle("can-scroll-right", isStageMode() ? looping : x < max - EDGE);
      if (prev) prev.disabled = !looping && x <= EDGE;
      if (next) next.disabled = !looping && x >= max - EDGE;

      if (!isStageMode()) {
        if (x <= EDGE) {
          activeIndex = 0;
        } else if (x >= max - EDGE) {
          activeIndex = cards.length - 1;
        } else {
        const center = x + rail.clientWidth / 2;
        activeIndex = cards.reduce((closest, card, index) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          const currentCenter = cards[closest].offsetLeft + cards[closest].offsetWidth / 2;
          return Math.abs(cardCenter - center) < Math.abs(currentCenter - center)
            ? index
            : closest;
        }, 0);
        }
      }

      dots.forEach((dot, index) => {
        const isActive = index === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });

      cards.forEach((card, index) => {
        const distance = cardDistanceFromActive(index);
        card.classList.toggle("is-carousel-active", distance === 0);
        card.classList.toggle("is-carousel-prev", distance === -1);
        card.classList.toggle("is-carousel-next", distance === 1);
        card.classList.toggle("is-carousel-far", Math.abs(distance) > 1);
      });
    };

    const scheduleUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    };

    const targetLeftForCard = (card) => {
      const max = rail.scrollWidth - rail.clientWidth;
      const left = card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2;
      return Math.max(0, Math.min(max, left));
    };

    const nearestIndex = () => {
      if (isStageMode()) return activeIndex;
      const x = rail.scrollLeft;
      return cards.reduce((closest, card, index) => {
        const cardDistance = Math.abs(targetLeftForCard(card) - x);
        const closestDistance = Math.abs(targetLeftForCard(cards[closest]) - x);
        return cardDistance < closestDistance ? index : closest;
      }, 0);
    };

    const scrollToIndex = (index) => {
      const safeIndex = normalizeIndex(index);
      const target = cards[isStageMode() ? safeIndex : Math.max(0, Math.min(cards.length - 1, index))];
      if (!target) return;
      if (isStageMode()) {
        activeIndex = safeIndex;
        update();
        return;
      }
      rail.scrollTo({ left: targetLeftForCard(target), behavior: "smooth" });
    };

    const snapToNearest = () => {
      if (isStageMode()) {
        update();
        return;
      }
      scrollToIndex(nearestIndex());
    };

    const snapMobileRail = () => {
      if (!isMobileRail() || mobileSnapping) return;
      const target = cards[nearestIndex()];
      if (!target) return;
      const left = targetLeftForCard(target);
      if (Math.abs(rail.scrollLeft - left) < 3) return;
      mobileSnapping = true;
      rail.scrollTo({ left, behavior: "smooth" });
      window.setTimeout(() => { mobileSnapping = false; }, 420);
    };

    const scheduleMobileSnap = () => {
      if (!isMobileRail() || down) return;
      if (mobileSnapTimer) window.clearTimeout(mobileSnapTimer);
      mobileSnapTimer = window.setTimeout(snapMobileRail, 120);
    };

    if (prev) {
      prev.addEventListener("click", () => scrollToIndex(activeIndex - 1));
    }
    if (next) {
      next.addEventListener("click", () => scrollToIndex(activeIndex + 1));
    }
    dots.forEach((dot) => {
      dot.addEventListener("click", () => scrollToIndex(Number(dot.dataset.invoiceCapabilityDot)));
    });

    rail.addEventListener("scroll", () => {
      scheduleUpdate();
      scheduleMobileSnap();
    }, { passive: true });

    rail.addEventListener("touchstart", (event) => {
      if (!isMobileRail() || !event.touches || !event.touches.length) return;
      if (mobileSnapTimer) window.clearTimeout(mobileSnapTimer);
      mobileSnapping = true;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchStartIndex = nearestIndex();
    }, { passive: true });

    rail.addEventListener("touchend", (event) => {
      if (!isMobileRail()) return;
      const touch = event.changedTouches && event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      const isHorizontalSwipe = Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.15;
      const dir = isHorizontalSwipe ? (dx < 0 ? 1 : -1) : 0;
      window.setTimeout(() => {
        scrollToIndex(touchStartIndex + dir);
        window.setTimeout(() => { mobileSnapping = false; }, 460);
      }, 40);
    }, { passive: true });

    rail.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollToIndex(activeIndex + 1);
      }
    });

    let down = false;
    let dragging = false;
    let moved = false;
    let pointerId = null;
    let startX = 0;
    let startLeft = 0;
    let startIndex = 0;
    let startT = 0;

    // Stage-mode drag: cards follow the pointer continuously. The transform
    // formula below interpolates the same values the is-carousel-* classes
    // use (78% / -76px / 15deg / 0.88 / opacity 0.72), so drag and rest
    // states agree and the release settle has nothing to jump to.
    const stageSpan = () => {
      const active = cards[activeIndex] || cards[0];
      return active ? Math.max(active.offsetWidth * 0.9, 1) : 1;
    };

    const stageProgress = () =>
      Math.max(-1.15, Math.min(1.15, dragDelta / stageSpan()));

    const applyStageDrag = (p) => {
      cards.forEach((card, index) => {
        const d = cardDistanceFromActive(index) + p;
        const sign = d < 0 ? -1 : 1;
        const within = Math.min(Math.abs(d), 1);
        const beyond = Math.max(Math.abs(d) - 1, 0);
        const tx = sign * (within * 78 + beyond * 26);
        const ty = -5 * (1 - within);
        const tz = -(within * 76 + Math.min(beyond, 1) * 64);
        const rotY = -15 * sign * within;
        const scale = 1 - 0.12 * within - 0.14 * Math.min(beyond, 1);
        const opacity = Math.max(0, 1 - 0.28 * within - 1.2 * beyond);
        card.style.transform =
          `translateX(${tx}%) translateY(${ty}px) translateZ(${tz}px) ` +
          `rotateY(${rotY}deg) scale(${scale})`;
        card.style.opacity = String(opacity);
        card.style.zIndex = String(Math.max(1, Math.round(5 - 2 * Math.min(Math.abs(d), 2))));
      });
    };

    const clearStageDrag = () => {
      cards.forEach((card) => {
        card.style.transform = "";
        card.style.opacity = "";
        card.style.zIndex = "";
      });
    };

    rail.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch" || isCoarsePointer()) return;
      if (event.button != null && event.button !== 0) return;
      down = true;
      dragging = false;
      moved = false;
      dragDelta = 0;
      pointerId = event.pointerId;
      startX = event.clientX;
      startLeft = rail.scrollLeft;
      startIndex = nearestIndex();
      startT = performance.now();
    });

    rail.addEventListener("pointermove", (event) => {
      if (!down) return;
      const dx = event.clientX - startX;
      dragDelta = dx;
      if (!dragging) {
        if (Math.abs(dx) <= 6) return;
        dragging = true;
        moved = true;
        rail.classList.add("is-dragging");
        try {
          rail.setPointerCapture(pointerId);
        } catch (err) {}
      }
      if (isStageMode()) {
        applyStageDrag(stageProgress());
        return;
      }
      rail.scrollLeft = startLeft - dx;
    });

    const release = () => {
      const wasDragging = dragging;
      down = false;
      dragging = false;
      if (pointerId != null) {
        try {
          rail.releasePointerCapture(pointerId);
        } catch (err) {}
      }
      pointerId = null;
      rail.classList.remove("is-dragging");
      if (!moved) return;
      if (isStageMode()) {
        if (!wasDragging) return;
        // Flip when the drag passed a quarter card or was a quick flick;
        // otherwise settle back onto the card we started from.
        const p = stageProgress();
        const dt = Math.max(1, performance.now() - startT);
        const velocity = dragDelta / dt;
        let dir = 0;
        if (Math.abs(p) > 0.22 || (Math.abs(velocity) > 0.45 && Math.abs(dragDelta) > 24)) {
          dir = dragDelta < 0 ? 1 : -1;
        }
        activeIndex = normalizeIndex(startIndex + dir);
        update();
        // Classes now describe the target; drop the inline drag styles on
        // the next frame so the 0.62s spring transition carries the cards
        // from the dragged position into place.
        requestAnimationFrame(() => {
          void rail.offsetWidth;
          clearStageDrag();
        });
        return;
      }
      const dir = rail.scrollLeft >= startLeft ? 1 : -1;
      setTimeout(() => scrollToIndex(startIndex + dir), 60);
    };

    rail.addEventListener("pointerup", release);
    rail.addEventListener("pointercancel", release);
    if ("onscrollend" in window) {
      rail.addEventListener("scrollend", () => {
        if (isCoarsePointer() || !isStageMode()) return;
        if (!down) snapToNearest();
      });
    }
    rail.addEventListener(
      "click",
      (event) => {
        if (!moved) return;
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      },
      true
    );

    window.addEventListener("resize", scheduleUpdate);
    requestAnimationFrame(update);
    setTimeout(update, 300);
  }

  function bindDemoNudge() {
    const nudge = document.getElementById("invoice-demo-nudge");
    if (!nudge || nudge.dataset.nudgeBound) return;
    nudge.dataset.nudgeBound = "1";

    const closeButton = document.getElementById("invoice-demo-nudge-close");
    const links = Array.from(nudge.querySelectorAll("a"));
    const dismissForWeek = 7 * 24 * 60 * 60 * 1000;
    const dismissAfterClick = 14 * 24 * 60 * 60 * 1000;
    const timeDelay = 120000;
    const scrollArmDelay = 9000;
    const scrollRatio = 0.32;
    const startedAt = Date.now();
    let timer = null;
    let visible = false;
    let dismissed = false;

    const getDismissedUntil = () => {
      try {
        return Number(localStorage.getItem(NUDGE_DISMISSED_KEY)) || 0;
      } catch (err) {
        return 0;
      }
    };

    const rememberDismissal = (duration) => {
      try {
        localStorage.setItem(NUDGE_DISMISSED_KEY, String(Date.now() + duration));
      } catch (err) {
        // If storage is blocked, the nudge simply behaves like a session-only prompt.
      }
    };

    const stopListening = () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };

    const show = () => {
      if (visible || dismissed || getDismissedUntil() > Date.now()) return;

      visible = true;
      stopListening();
      nudge.hidden = false;
      window.requestAnimationFrame(() => {
        nudge.classList.add("is-visible");
      });
    };

    function handleScroll() {
      if (visible || dismissed || Date.now() - startedAt < scrollArmDelay) return;
      const root = document.documentElement;
      const scrollable = root.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = window.scrollY / scrollable;
      if (progress >= scrollRatio) show();
    }

    const dismiss = (duration) => {
      dismissed = true;
      visible = false;
      stopListening();
      rememberDismissal(duration);
      nudge.classList.remove("is-visible");
      window.setTimeout(() => {
        if (!nudge.classList.contains("is-visible")) nudge.hidden = true;
      }, 260);
    };

    if (getDismissedUntil() > Date.now()) return;

    if (closeButton) {
      closeButton.addEventListener("click", () => dismiss(dismissForWeek));
    }

    links.forEach((link) => {
      link.addEventListener("click", () => rememberDismissal(dismissAfterClick));
    });

    timer = window.setTimeout(show, timeDelay);
    window.addEventListener("scroll", handleScroll, { passive: true });
  }
})();
