(function () {
  "use strict";

  const DEFAULT_SHOWCASE_DURATION = 26000;
  const STATIC_FRAME_PROGRESS = 0.84;
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

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (new URLSearchParams(window.location.search).has("render-showcase")) return;

    document.querySelectorAll("[data-showcase]").forEach(root => {
      if (!root.querySelector("[data-showcase-video-stack]")) return;
      if (root.dataset.showcaseVideoBound) return;
      root.dataset.showcaseVideoBound = "1";
      root.dataset.showcaseBound = "1";
      createVideoShowcaseController(root);
    });
  }

  function createVideoShowcaseController(root) {
    const durationFromMarkup = Number(root.dataset.durationMs);
    const duration = Number.isFinite(durationFromMarkup) && durationFromMarkup > 0
      ? durationFromMarkup
      : DEFAULT_SHOWCASE_DURATION;
    const durationSeconds = duration / 1000;
    const videos = {
      de: root.querySelector('[data-showcase-video="de"]'),
      en: root.querySelector('[data-showcase-video="en"]')
    };
    if (!videos.de || !videos.en) return;

    const section = root.closest(".invoice-showcase-section") || document;
    const toggle = section.querySelector("[data-showcase-toggle]");
    const label = toggle && toggle.querySelector("[data-showcase-control-label]");
    const icon = toggle && toggle.querySelector(".invoice-showcase-toggle-icon i");
    const scrubber = root.querySelector("[data-showcase-scrubber]");
    const phaseLabel = root.querySelector("[data-showcase-phase-label]");
    const chapterButtons = Array.from(root.querySelectorAll("[data-showcase-chapter]"));
    const timeline = root.querySelector(".invoice-showcase-timeline");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hasIntersectionObserver = typeof window.IntersectionObserver === "function";

    let activeLanguage = document.documentElement.lang === "en" ? "en" : "de";
    let activeVideo = videos[activeLanguage];
    let activeLayout = "";
    let fallbackTime = 0;
    let previousMediaTime = 0;
    let cycle = 0;
    let userPaused = false;
    let offscreenPaused = hasIntersectionObserver;
    let documentPaused = document.hidden;
    let reducedMotion = motionQuery.matches;
    let hasStarted = false;
    let scrubbing = false;
    let holdUntil = 0;
    let resumeTimer = null;
    let resizeTimer = null;
    let announcedSecond = -1;
    let announcedPhase = "";
    let lastProgressStep = -1;

    const currentLayout = () => {
      if (window.innerWidth > 1180) return "desktop";
      if (window.innerWidth > 900) return "laptop";
      if (window.innerWidth > 680) return "tablet";
      return "mobile";
    };

    const isPaused = () => (
      !hasStarted || reducedMotion || userPaused || offscreenPaused ||
      documentPaused || scrubbing || performance.now() < holdUntil
    );

    const currentTime = () => {
      if (activeVideo.readyState >= 1 && Number.isFinite(activeVideo.currentTime)) {
        return Math.max(0, Math.min(durationSeconds, activeVideo.currentTime));
      }
      return fallbackTime;
    };

    const progressNow = () => (currentTime() % durationSeconds) / durationSeconds;

    const chapterIndexForProgress = progress => {
      let index = 0;
      SHOWCASE_CHAPTERS.forEach((chapter, chapterIndex) => {
        if (progress >= chapter.start) index = chapterIndex;
      });
      return index;
    };

    const phaseForProgress = progress => {
      if (progress >= 0.965) return "closing";
      return SHOWCASE_CHAPTERS[chapterIndexForProgress(progress)].key;
    };

    const setVideoTime = (video, seconds) => {
      const safeTime = Math.max(0, Math.min(durationSeconds - 0.025, seconds));
      video.dataset.pendingShowcaseTime = String(safeTime);
      if (video.readyState < 1) return;
      try {
        if (Math.abs(video.currentTime - safeTime) > 0.02) {
          video.currentTime = safeTime;
        }
        delete video.dataset.pendingShowcaseTime;
      } catch (error) {}
    };

    const seekAll = seconds => {
      fallbackTime = Math.max(0, Math.min(durationSeconds - 0.025, seconds));
      previousMediaTime = fallbackTime;
      setVideoTime(videos.de, fallbackTime);
      setVideoTime(videos.en, fallbackTime);
    };

    const pauseAll = () => {
      videos.de.pause();
      videos.en.pause();
    };

    const playActive = () => {
      const playback = activeVideo.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(() => {});
      }
    };

    const chapterName = key => {
      const fallback = CHAPTER_NAME_FALLBACKS[key] || CHAPTER_NAME_FALLBACKS.email;
      return translatedShowcaseLabel(`invoice_showcase_phase_${key}`, fallback);
    };

    const updateTimelineUi = force => {
      const progress = progressNow();
      const chapterIndex = chapterIndexForProgress(progress);
      const chapterKey = SHOWCASE_CHAPTERS[chapterIndex].key;
      const second = Math.min(
        Math.round(durationSeconds),
        Math.floor(currentTime()) + 1
      );
      const progressStep = Math.round(progress * 1000);

      if (force || progressStep !== lastProgressStep) {
        lastProgressStep = progressStep;
        (timeline || root).style.setProperty("--showcase-progress", progress.toFixed(4));
        if (scrubber && !scrubbing) scrubber.value = String(progressStep);
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
            .replace("{t}", String(Math.round(durationSeconds)))
            .replace("{phase}", chapterName(chapterKey))
        );
      }

      chapterButtons.forEach(button => {
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

    const updateControlLabel = () => {
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
      toggle.setAttribute("aria-label", text);
      if (label) label.textContent = text;
      if (icon) {
        icon.classList.remove("fa-pause", "fa-play", "fa-image");
        icon.classList.add(
          action === "play" ? "fa-play" : action === "static" ? "fa-image" : "fa-pause"
        );
      }
    };

    const syncState = () => {
      const pauseReasons = [];
      if (userPaused) pauseReasons.push("user");
      if (offscreenPaused) pauseReasons.push("offscreen");
      if (documentPaused) pauseReasons.push("document");
      if (reducedMotion) pauseReasons.push("reduced-motion");
      if (scrubbing || performance.now() < holdUntil) pauseReasons.push("scrubbing");
      if (!hasStarted) pauseReasons.push("not-started");

      if (reducedMotion) {
        seekAll(durationSeconds * STATIC_FRAME_PROGRESS);
      }

      const paused = isPaused();
      root.dataset.showcasePaused = String(paused);
      root.dataset.showcasePauseReasons = pauseReasons.length ? pauseReasons.join(",") : "none";
      root.dataset.showcaseMotion = reducedMotion ? "reduced" : "full";
      root.dataset.showcaseStarted = String(hasStarted);
      root.classList.toggle("is-user-paused", userPaused);
      root.classList.toggle("is-viewport-paused", offscreenPaused);
      root.classList.toggle("is-document-paused", documentPaused);
      root.classList.toggle("is-reduced-motion", reducedMotion);

      if (paused) pauseAll();
      else playActive();

      updateTimelineHooks();
      updateTimelineUi(true);
      updateControlLabel();
    };

    const applyPendingTime = video => {
      const pending = Number(video.dataset.pendingShowcaseTime);
      if (Number.isFinite(pending)) setVideoTime(video, pending);
    };

    const configureSources = (layout, preserveTime) => {
      activeLayout = layout;
      fallbackTime = preserveTime;
      pauseAll();

      Object.values(videos).forEach(video => {
        const source = video.dataset[`${layout}Src`];
        if (!source || video.dataset.showcaseLayout === layout) {
          setVideoTime(video, preserveTime);
          return;
        }
        video.dataset.showcaseLayout = layout;
        video.dataset.pendingShowcaseTime = String(preserveTime);
        video.setAttribute("src", source);
        video.load();
      });

      root.dataset.showcaseVideoLayout = layout;
      root.dataset.showcaseVideoReady = String(activeVideo.readyState >= 2);
    };

    const switchLanguage = language => {
      const nextLanguage = language === "en" ? "en" : "de";
      if (nextLanguage === activeLanguage) {
        updateControlLabel();
        updateTimelineUi(true);
        return;
      }

      const outgoing = activeVideo;
      const time = currentTime();
      outgoing.pause();
      outgoing.classList.remove("is-active");

      activeLanguage = nextLanguage;
      activeVideo = videos[activeLanguage];
      fallbackTime = time;
      previousMediaTime = time;
      setVideoTime(activeVideo, time);
      activeVideo.classList.add("is-active");
      root.dataset.showcaseVideoLanguage = activeLanguage;
      root.dataset.showcaseVideoReady = String(activeVideo.readyState >= 2);

      syncState();
    };

    const holdThenResume = delay => {
      holdUntil = performance.now() + delay;
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        resumeTimer = null;
        syncState();
      }, delay + 40);
      syncState();
    };

    const markActiveVideoReady = video => {
      if (video !== activeVideo || video.readyState < 2) return;
      root.dataset.showcaseVideoReady = "true";
    };

    Object.entries(videos).forEach(([language, video]) => {
      video.addEventListener("loadedmetadata", () => {
        applyPendingTime(video);
      });
      video.addEventListener("loadeddata", () => {
        applyPendingTime(video);
        if (video === activeVideo) {
          markActiveVideoReady(video);
          syncState();
        }
      });
      ["canplay", "seeked", "playing"].forEach(eventName => {
        video.addEventListener(eventName, () => {
          markActiveVideoReady(video);
        });
      });
      video.addEventListener("timeupdate", () => {
        if (video !== activeVideo) return;
        fallbackTime = video.currentTime;
        if (video.currentTime + 0.5 < previousMediaTime) cycle += 1;
        previousMediaTime = video.currentTime;
        updateTimelineHooks();
        updateTimelineUi(false);
      });
      video.addEventListener("error", () => {
        if (video !== activeVideo) return;
        root.dataset.showcaseVideoReady = "false";
        root.dataset.showcaseVideoError = language;
      });
    });

    if (toggle) {
      toggle.addEventListener("click", () => {
        if (reducedMotion) return;
        userPaused = !userPaused;
        hasStarted = true;
        fallbackTime = currentTime();
        syncState();
      });
    }

    if (scrubber) {
      scrubber.max = "1000";
      scrubber.addEventListener("input", () => {
        hasStarted = true;
        seekAll((Number(scrubber.value) / 1000) * durationSeconds);
        updateTimelineHooks();
        updateTimelineUi(true);
        holdThenResume(900);
      });
      scrubber.addEventListener("keydown", event => {
        const progress = progressNow();
        const secondStep = 1 / durationSeconds;
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
        seekAll(Math.max(0, Math.min(0.999, next)) * durationSeconds);
        holdThenResume(900);
      });
      scrubber.addEventListener("pointerdown", () => {
        scrubbing = true;
        syncState();
      });
      const releaseScrub = () => {
        if (!scrubbing) return;
        scrubbing = false;
        holdThenResume(500);
      };
      scrubber.addEventListener("pointerup", releaseScrub);
      scrubber.addEventListener("pointercancel", releaseScrub);
      scrubber.addEventListener("blur", releaseScrub);
    }

    chapterButtons.forEach(button => {
      button.disabled = false;
      button.addEventListener("click", () => {
        if (reducedMotion) return;
        const chapter = SHOWCASE_CHAPTERS.find(
          entry => entry.key === button.dataset.showcaseChapter
        );
        if (!chapter) return;
        hasStarted = true;
        seekAll(chapter.jump * durationSeconds);
        holdThenResume(250);
      });
    });

    document.addEventListener("visibilitychange", () => {
      documentPaused = document.hidden;
      fallbackTime = currentTime();
      syncState();
    });

    document.addEventListener("kif:languagechange", event => {
      switchLanguage(event.detail && event.detail.lang);
    });

    const handleMotionChange = event => {
      reducedMotion = event.matches;
      if (!reducedMotion) {
        seekAll(0);
        cycle = 0;
        if (!offscreenPaused) hasStarted = true;
      }
      syncState();
    };
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", handleMotionChange);
    } else {
      motionQuery.addListener(handleMotionChange);
    }

    if (hasIntersectionObserver) {
      const observer = new window.IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.target !== root) return;
          offscreenPaused = !(entry.isIntersecting && entry.intersectionRatio > 0.02);
          if (!offscreenPaused && !reducedMotion) hasStarted = true;
          fallbackTime = currentTime();
          syncState();
        });
      }, { threshold: [0, 0.02, 0.15, 0.35] });
      observer.observe(root);
    } else {
      offscreenPaused = false;
      if (!reducedMotion) hasStarted = true;
    }

    window.addEventListener("resize", () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeTimer = null;
        const nextLayout = currentLayout();
        if (nextLayout === activeLayout) return;
        const time = currentTime();
        configureSources(nextLayout, time);
        syncState();
      }, 220);
    });

    root.classList.remove("is-running");
    root.classList.add("is-enhanced", "is-scrub-enabled", "is-video-showcase");
    root.dataset.showcaseReady = "false";
    root.dataset.showcaseCycle = "0";
    root.dataset.showcasePhase = reducedMotion ? "static" : "email";
    root.dataset.showcaseVideoLanguage = activeLanguage;
    videos.de.classList.toggle("is-active", activeLanguage === "de");
    videos.en.classList.toggle("is-active", activeLanguage === "en");
    configureSources(currentLayout(), reducedMotion ? durationSeconds * STATIC_FRAME_PROGRESS : 0);
    syncState();
    root.dataset.showcaseReady = "true";
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
})();
