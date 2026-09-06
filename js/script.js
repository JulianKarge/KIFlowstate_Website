document.addEventListener("DOMContentLoaded", () => {
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ▸ Theme toggle (light / dark) — pre-DOM script in <head> already
     applied the saved theme to <html> to avoid FOUC. Here we wire the
     toggle button via event delegation so it works regardless of when
     the button mounts. */
  const THEME_KEY = "kif_theme";
  const currentTheme = () =>
    document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const themeText = (key, fallbackDe, fallbackEn) => {
    const lang = document.documentElement.lang === "en" ? "en" : "de";
    return (
      (typeof translations !== "undefined" && translations[lang] && translations[lang][key]) ||
      (lang === "en" ? fallbackEn : fallbackDe)
    );
  };
  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      const isDark = theme === "dark";
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute(
        "aria-label",
        isDark
          ? themeText("theme_enable_light", "Helles Design aktivieren", "Enable light theme")
          : themeText("theme_enable_dark", "Dunkles Design aktivieren", "Enable dark theme")
      );
      btn.setAttribute("title", themeText("theme_toggle_title", "Design wechseln", "Switch theme"));
    });
  };

  applyTheme(currentTheme());

  document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".theme-toggle");
    if (!btn) return;
    const next = currentTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch (err) {}
    applyTheme(next);
  });
  document.addEventListener("kif:languagechange", () => applyTheme(currentTheme()));

  /* ▸ Dynamic copyright year */
  const setYear = () => {
    const yearElement = document.getElementById("year");
    if (yearElement) yearElement.textContent = new Date().getFullYear();
  };
  setYear();

  /* ▸ Mobile-nav toggle */
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");

  const closeNav = (restoreFocus = false) => {
    if (!hamburger || !navLinks) return;
    const wasOpen = navLinks.classList.contains("open");
    navLinks.classList.remove("open");
    hamburger.classList.remove("is-active");
    hamburger.setAttribute("aria-expanded", "false");
    if (restoreFocus && wasOpen) hamburger.focus();
  };

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      hamburger.classList.toggle("is-active", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        window.requestAnimationFrame(() => navLinks.querySelector("a")?.focus());
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav(true);
    });
  }

  /* ▸ Smooth-scroll for internal links */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (href === "#" || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: reducedMotionQuery.matches ? "auto" : "smooth",
      });
      closeNav();
    });
  });

  /* ▸ Navbar shrink/elevate on scroll */
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    const navSentinel = document.createElement("span");
    navSentinel.className = "nav-scroll-sentinel";
    navSentinel.setAttribute("aria-hidden", "true");
    document.body.prepend(navSentinel);

    if ("IntersectionObserver" in window) {
      const navObserver = new IntersectionObserver(
        ([entry]) => navbar.classList.toggle("scrolled", !entry.isIntersecting),
        { threshold: 0 }
      );
      navObserver.observe(navSentinel);
    }
  }

  /* ▸ Reveal-on-scroll via IntersectionObserver */
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ▸ Animated counters for stats strip */
  const counters = document.querySelectorAll("[data-count-to]");
  const animateCount = (el) => {
    const target = Number(el.dataset.countTo) || 0;
    if (reducedMotionQuery.matches) {
      el.textContent = target.toLocaleString();
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length && "IntersectionObserver" in window) {
    const counterIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            counterIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterIo.observe(el));
  } else {
    counters.forEach(animateCount);
  }

  /* ▸ Website showcase: tabs + arrows switch the iframe demo */
  const showcaseIframe = document.getElementById("showcase-iframe");
  const showcaseTabs = Array.from(document.querySelectorAll(".showcase-tab"));
  const arrowPrev = document.querySelector(".showcase-arrow-prev");
  const arrowNext = document.querySelector(".showcase-arrow-next");

  if (showcaseIframe && showcaseTabs.length) {
    let activeIdx = showcaseTabs.findIndex((t) => t.classList.contains("is-active"));
    if (activeIdx < 0) activeIdx = 0;

    const showDemo = (idx) => {
      const total = showcaseTabs.length;
      activeIdx = ((idx % total) + total) % total;
      const tab = showcaseTabs[activeIdx];
      const src = tab.dataset.demo;

      showcaseTabs.forEach((t, i) => {
        const isActive = i === activeIdx;
        t.classList.toggle("is-active", isActive);
        t.setAttribute("aria-selected", String(isActive));
      });

      if (showcaseIframe.getAttribute("src") !== src) {
        showcaseIframe.classList.add("is-loading");
        showcaseIframe.addEventListener(
          "load",
          () => showcaseIframe.classList.remove("is-loading"),
          { once: true }
        );
        showcaseIframe.setAttribute("src", src);
      }
    };

    showcaseTabs.forEach((tab, i) => {
      tab.addEventListener("click", () => showDemo(i));
    });

    if (arrowPrev) arrowPrev.addEventListener("click", () => showDemo(activeIdx - 1));
    if (arrowNext) arrowNext.addEventListener("click", () => showDemo(activeIdx + 1));
  }

  /* ▸ Beleg-flow story: scroll-linked wave draw + 3D card choreography */
  const flowStory = document.querySelector(".flow-story");
  if (flowStory) {
    const scene = flowStory.querySelector(".story-scene");
    const cards = Array.from(flowStory.querySelectorAll(".story-piece"));
    const hub = flowStory.querySelector(".story-hub");
    const hubPanels = Array.from(flowStory.querySelectorAll(".hub-panel"));
    const waveFillPaths = Array.from(flowStory.querySelectorAll(".story-wave-fill-path"));
    const waveTrackPaths = Array.from(flowStory.querySelectorAll(".story-wave-track path"));
    const waveMeter = flowStory.querySelector(".story-meter");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scenarioKeys = ["invoice", "reminder", "cancellation", "confirmation"];
    const scenarioEls = {
      label: flowStory.querySelector("[data-flow-scenario-label]"),
      docTitle: flowStory.querySelector("[data-flow-scenario-doc-title]"),
      docText: flowStory.querySelector("[data-flow-scenario-doc-text]")
    };
    let storyRaf = 0;
    let storyCtaVisible = false;
    let storyCtaHasShown = false;
    let flowStoryVisible = false;
    let scenarioIndex = 0;
    let scenarioTimer = 0;
    let scenarioAnimating = false;
    let scenarioTransitionTimers = [];
    let storyLoopActive = false;
    let scenePointerTargetX = 0;
    let scenePointerTargetY = 0;
    let scenePointerX = 0;
    let scenePointerY = 0;
    let renderedProgress = null;
    let previousFrame = 0;
    let waveTime = 0;
    let previousWaveFrame = 0;

    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const ease = (value) => {
      const t = clamp(value);
      return t * t * (3 - 2 * t);
    };
    const mix = (from, to, amount) => from + (to - from) * amount;
    const dataNumber = (el, name) => Number(el.dataset[name] || 0);
    const ctaShowProgress = 0.82;
    const ctaHideProgress = 0.46;

    const storyLang = () => document.documentElement.lang === "en" ? "en" : "de";
    const decodeScenarioText = (value) => {
      const textarea = document.createElement("textarea");
      textarea.innerHTML = value;
      return textarea.value;
    };
    const scenarioCopy = (scenario, field) => {
      const key = field ? `flow_scenario_${scenario}_${field}` : `flow_scenario_${scenario}`;
      const value = typeof translations !== "undefined" ? translations[storyLang()]?.[key] || "" : "";
      return decodeScenarioText(value);
    };
    const scenarioTargets = (scenario) => [
      { el: scenarioEls.label, key: `flow_scenario_${scenario}`, text: scenarioCopy(scenario, "") },
      { el: scenarioEls.docTitle, key: `flow_scenario_${scenario}_doc_title`, text: scenarioCopy(scenario, "doc_title") },
      { el: scenarioEls.docText, key: `flow_scenario_${scenario}_doc_text`, text: scenarioCopy(scenario, "doc_text") }
    ].filter((target) => target.el);
    const clearScenarioTimers = () => {
      scenarioTransitionTimers.forEach((timer) => window.clearTimeout(timer));
      scenarioTransitionTimers = [];
    };
    const scheduleScenarioTransition = (callback, delay) => {
      const timer = window.setTimeout(() => {
        scenarioTransitionTimers = scenarioTransitionTimers.filter((item) => item !== timer);
        callback();
      }, delay);
      scenarioTransitionTimers.push(timer);
    };
    const writeScenario = (scenario) => {
      flowStory.dataset.flowScenario = scenario;
      scenarioTargets(scenario).forEach(({ el, key, text }) => {
        el.setAttribute("data-translate", key);
        el.textContent = text;
      });
    };
    const transitionScenario = (scenario) => {
      if (!hub) return;
      clearScenarioTimers();
      scenarioAnimating = true;
      hub.classList.add("is-switching");
      scheduleScenarioTransition(() => {
        writeScenario(scenario);
        hub.classList.remove("is-switching");
        scenarioAnimating = false;
      }, 220);
    };
    const setScenario = (index, animate = false) => {
      scenarioIndex = (index + scenarioKeys.length) % scenarioKeys.length;
      const scenario = scenarioKeys[scenarioIndex];
      if (!animate || reduceMotion.matches || !hub || scenarioAnimating) {
        writeScenario(scenario);
        return;
      }
      transitionScenario(scenario);
    };
    const startScenarioLoop = () => {
      if (scenarioTimer || reduceMotion.matches) return;
      scenarioTimer = window.setInterval(() => {
        if (!document.hidden) setScenario(scenarioIndex + 1, true);
      }, 6200);
    };
    const stopScenarioLoop = () => {
      if (!scenarioTimer && !scenarioAnimating) return;
      window.clearInterval(scenarioTimer);
      scenarioTimer = 0;
      clearScenarioTimers();
      if (scenarioAnimating) writeScenario(scenarioKeys[scenarioIndex]);
      scenarioAnimating = false;
      hub?.classList.remove("is-switching");
    };

    // Three continuous currents become a single, evenly spaced rhythm.
    // Normalized path lengths keep the reveal stable as the geometry changes.
    const updateWaveDraw = (progress, timestamp) => {
      if (!waveMeter?.clientWidth) return;
      if (!reduceMotion.matches && timestamp - previousWaveFrame < 32) return;
      previousWaveFrame = timestamp;
      const order = ease(progress);
      waveFillPaths.forEach((path, index) => {
        const points = [];
        for (let x = -12; x <= 272; x += 4) {
          const phase = x / 260 * Math.PI * 2 - waveTime * 0.55;
          const irregularity = Math.sin(phase * 1.65 + index * 1.7) * 7 * (1 - order);
          const y = 49 + index * 31 + Math.sin(phase + index * 0.32 * (1 - order)) * (18 - order * 5) + irregularity;
          points.push(`${x},${y.toFixed(2)}`);
        }
        const geometry = `M${points.join(" L")}`;
        path.setAttribute("d", geometry);
        waveTrackPaths[index]?.setAttribute("d", geometry);
        path.setAttribute("pathLength", "1");
        path.style.setProperty("--wave-length", "1");
        path.style.setProperty("--wave-offset", (1 - clamp(0.12 + progress * 0.96 - index * 0.025)).toFixed(4));
      });
    };

    const updateStory = (timestamp = performance.now()) => {
      if (!scene || !hub) return;

      const total = Math.max(1, flowStory.offsetHeight - window.innerHeight);
      const targetProgress = reduceMotion.matches
        ? 1
        : clamp(-flowStory.getBoundingClientRect().top / total);
      const delta = Math.min(64, previousFrame ? timestamp - previousFrame : 16.67);
      previousFrame = timestamp;
      const damping = 1 - Math.exp(-delta / 105);
      renderedProgress = renderedProgress === null || reduceMotion.matches || !storyLoopActive
        ? targetProgress
        : mix(renderedProgress, targetProgress, damping);
      if (Math.abs(renderedProgress - targetProgress) < 0.0001) renderedProgress = targetProgress;
      const rawProgress = renderedProgress;
      if (!reduceMotion.matches && flowStoryVisible) waveTime += delta / 1000;
      const waveProgress = reduceMotion.matches ? 1 : clamp(rawProgress / 0.9);
      const flowReveal = ease((rawProgress - 0.47) / 0.22);
      const ctaReveal = ease((rawProgress - ctaShowProgress) / 0.08);
      const gather = ease((rawProgress - 0.12) / 0.36);
      const organize = ease((rawProgress - 0.47) / 0.3);
      const ctaShouldShow = rawProgress >= ctaShowProgress || (storyCtaVisible && rawProgress > ctaHideProgress);
      const flowPhase = rawProgress < 0.34 ? "chaos" : rawProgress < 0.68 ? "routing" : "ready";

      if (ctaShouldShow !== storyCtaVisible) {
        storyCtaVisible = ctaShouldShow;
        if (storyCtaVisible) storyCtaHasShown = true;
      }

      flowStory.dataset.flowPhase = flowPhase;
      flowStory.style.setProperty("--story-progress", rawProgress.toFixed(4));
      flowStory.style.setProperty("--story-pct", `${(rawProgress * 100).toFixed(2)}%`);
      flowStory.style.setProperty("--flow-reveal", flowReveal.toFixed(4));
      flowStory.style.setProperty("--story-cta-reveal", ctaReveal.toFixed(4));
      // The two copy blocks share one box, so they hand over in sequence: the
      // chaos block is fully gone before the flow block starts to appear.
      // Overlapping the fades printed both headlines on top of each other.
      flowStory.style.setProperty("--copy-out", (1 - ease((rawProgress - 0.42) / 0.08)).toFixed(4));
      flowStory.style.setProperty("--copy-in", ease((rawProgress - 0.5) / 0.08).toFixed(4));
      const ingestIn = ease((rawProgress - 0.2) / 0.18);
      const ingestOut = ease((rawProgress - 0.58) / 0.18);
      flowStory.style.setProperty("--ingest-opacity", (ingestIn * (1 - ingestOut)).toFixed(3));
      flowStory.style.setProperty("--ingest-scale", mix(0.72, 1.18, gather).toFixed(3));
      flowStory.classList.toggle("is-story-cta-ready", storyCtaVisible && ctaReveal > 0);
      flowStory.classList.toggle("is-story-cta-exiting", !storyCtaVisible && storyCtaHasShown);
      updateWaveDraw(waveProgress, timestamp);

      const sceneWidth = Math.max(1, scene.clientWidth);
      const sceneHeight = Math.max(1, scene.clientHeight);

      cards.forEach((card, index) => {
        // Keep the scattered documents inside the portal at the start.
        // Their original coordinates still define the composition, while the
        // factor prevents the "chaos" chapter from opening on an empty stage.
        const fromX = sceneWidth * dataNumber(card, "fromX") * 0.36 / 100;
        const fromY = sceneHeight * dataNumber(card, "fromY") * 0.36 / 100 + 14;
        // The gathered pile keeps its shape but stays readable: without the
        // spread the six cards stacked almost on one point.
        const midX = sceneWidth * dataNumber(card, "midX") * 1.35 / 100;
        const midY = sceneHeight * dataNumber(card, "midY") * 1.35 / 100;
        const toX = sceneWidth * dataNumber(card, "toX") / 100;
        const toY = sceneHeight * dataNumber(card, "toY") / 100;
        const fromRot = dataNumber(card, "fromRot");
        const midRot = dataNumber(card, "midRot");
        const toRot = dataNumber(card, "toRot");
        const depth = dataNumber(card, "depth");
        const ripple = Math.sin(rawProgress * 20 + index * 1.7) * (1 - organize);

        const cardGather = ease((rawProgress - 0.1 - index * 0.012) / 0.36);
        const cardOrganize = ease((rawProgress - 0.45 - index * 0.009) / 0.28);
        const stagedX = mix(fromX, midX, cardGather);
        const stagedY = mix(fromY, midY, cardGather);
        const stagedRot = mix(fromRot * 0.7, midRot * 0.55, cardGather);
        const float = reduceMotion.matches ? 0 : Math.sin(waveTime * 0.65 + index * 1.3) * 3 * (1 - organize);
        const x = mix(stagedX, toX, cardOrganize) + ripple * 3;
        const y = mix(stagedY, toY, cardOrganize) + float;
        const rotation = mix(stagedRot, toRot, cardOrganize) + ripple * 0.5;
        const z = mix(depth, 18, gather);
        const finalZ = mix(z, -150 + index * 10, organize);
        const scale = mix(mix(0.88, 1, gather), 0.48, organize);
        // The documents dissolve completely into the flow. Leaving a residual
        // opacity left washed-out ghost cards sitting behind the finished hub.
        const dissolve = ease((rawProgress - 0.48 - index * 0.012) / 0.16);
        const opacity = clamp(mix(0.94, 1, gather) * (1 - dissolve), 0, 1);
        const tiltX = mix(16 - index * 1.6, -3, gather);
        const tiltY = mix(index % 2 ? -16 : 16, 0, gather);
        const transform = [
          "translate3d(-50%, -50%, 0)",
          `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${finalZ.toFixed(1)}px)`,
          `rotateX(${tiltX.toFixed(2)}deg)`,
          `rotateY(${tiltY.toFixed(2)}deg)`,
          `rotateZ(${rotation.toFixed(2)}deg)`,
          `scale(${scale.toFixed(3)})`
        ].join(" ");
        card.style.setProperty("--card-opacity", opacity.toFixed(3));
        card.style.setProperty("--card-transform", transform);
      });

      const hubIn = ease((rawProgress - 0.6) / 0.18);
      const hubY = mix(32, 0, hubIn);
      const hubZ = mix(-20, 45, hubIn);
      const hubScale = mix(0.94, 1, hubIn);
      const hubTilt = mix(5, 0, hubIn);
      const hubTransform = [
        `translate3d(-50%, -50%, ${hubZ.toFixed(1)}px)`,
        `translateY(${hubY.toFixed(1)}px)`,
        `rotateX(${hubTilt.toFixed(2)}deg)`,
        `scale(${hubScale.toFixed(3)})`
      ].join(" ");
      hub.style.setProperty("--hub-opacity", hubIn.toFixed(3));
      hub.style.setProperty("--hub-transform", hubTransform);

      const hubStage = rawProgress < 0.72 ? 0 : rawProgress < 0.86 ? 1 : 2;
      hubPanels.forEach((panel, index) => {
        panel.classList.remove("active");
        panel.classList.toggle("is-current", index === hubStage);
      });

      scenePointerX += (scenePointerTargetX - scenePointerX) * 0.075;
      scenePointerY += (scenePointerTargetY - scenePointerY) * 0.075;
      scene.style.transform = `rotateX(${scenePointerY.toFixed(2)}deg) rotateY(${scenePointerX.toFixed(2)}deg)`;

      if (flowStoryVisible && rawProgress > 0.72) startScenarioLoop();
      else stopScenarioLoop();
    };

    const runStoryLoop = (timestamp) => {
      if (!storyLoopActive) return;
      updateStory(timestamp);
      storyRaf = window.requestAnimationFrame(runStoryLoop);
    };

    const startStoryRender = () => {
      if (storyLoopActive || reduceMotion.matches || document.hidden) return;
      previousFrame = 0;
      storyLoopActive = true;
      storyRaf = window.requestAnimationFrame(runStoryLoop);
    };

    const stopStoryRender = () => {
      storyLoopActive = false;
      if (storyRaf) window.cancelAnimationFrame(storyRaf);
      storyRaf = 0;
    };

    const requestStoryUpdate = () => {
      if (!storyLoopActive) updateStory();
    };

    if (scene) {
      scene.addEventListener("pointermove", (event) => {
        if (reduceMotion.matches || event.pointerType === "touch") return;
        const rect = scene.getBoundingClientRect();
        const normalizedX = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1) * 2 - 1;
        const normalizedY = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1) * 2 - 1;
        scenePointerTargetX = normalizedX * 1.5;
        scenePointerTargetY = normalizedY * -1;
      });
      scene.addEventListener("pointerleave", () => {
        scenePointerTargetX = 0;
        scenePointerTargetY = 0;
      });
    }

    window.addEventListener("resize", () => requestStoryUpdate());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopStoryRender();
        stopScenarioLoop();
      } else if (flowStoryVisible) startStoryRender();
    });
    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener("change", () => {
        if (reduceMotion.matches) {
          stopScenarioLoop();
          stopStoryRender();
        } else if (flowStoryVisible) {
          startStoryRender();
        }
        requestStoryUpdate();
      });
    } else if (reduceMotion.addListener) {
      reduceMotion.addListener(() => {
        if (reduceMotion.matches) {
          stopScenarioLoop();
          stopStoryRender();
        } else if (flowStoryVisible) {
          startStoryRender();
        }
        requestStoryUpdate();
      });
    }
    document.addEventListener("kif:languagechange", () => {
      clearScenarioTimers();
      scenarioAnimating = false;
      hub?.classList.remove("is-switching");
      writeScenario(scenarioKeys[scenarioIndex]);
    });
    writeScenario(scenarioKeys[scenarioIndex]);
    updateStory();

    if (!("IntersectionObserver" in window)) {
      flowStory.classList.add("is-assembled");
      updateStory();
    } else {
      const storyObserver = new IntersectionObserver(
        ([entry]) => {
          flowStoryVisible = entry.isIntersecting;
          if (flowStoryVisible) {
            flowStory.classList.add("is-assembled");
            startStoryRender();
          } else {
            stopStoryRender();
            stopScenarioLoop();
          }
        },
        { threshold: 0.01, rootMargin: "15% 0px 15% 0px" }
      );
      storyObserver.observe(flowStory);
    }
  }

  /* ▸ Services liquid wave: short scroll-linked flow reveal */
  const servicesFlow = document.querySelector(".services-liquid");
  if (servicesFlow) {
    const servicesClip = servicesFlow.querySelector(".services-liquid-progress-clip");
    const servicesReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let servicesRaf = 0;

    const clampServices = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const easeServices = (value) => {
      const t = clampServices(value);
      return t * t * (3 - 2 * t);
    };

    const setServicesProgress = (progress, rawProgress = progress) => {
      const eased = easeServices(progress);
      const phase = progress < 0.34 ? "need" : progress < 0.68 ? "build" : "live";

      servicesFlow.dataset.servicesPhase = phase;
      servicesFlow.style.setProperty("--services-raw-progress", rawProgress.toFixed(4));
      servicesFlow.style.setProperty("--services-progress", eased.toFixed(4));
      servicesFlow.style.setProperty("--services-progress-pct", `${(eased * 100).toFixed(2)}%`);
      servicesFlow.style.setProperty("--services-wave-x", `${(-8 - eased * 92).toFixed(1)}px`);

      if (servicesClip) {
        servicesClip.setAttribute("width", (1180 * Math.max(0.025, eased)).toFixed(1));
      }
    };

    const updateServicesFlow = () => {
      servicesRaf = 0;
      setServicesProgress(1, 1);
    };

    const requestServicesUpdate = () => {
      if (!servicesRaf) servicesRaf = window.requestAnimationFrame(updateServicesFlow);
    };

    window.addEventListener("resize", requestServicesUpdate);
    if (servicesReduceMotion.addEventListener) {
      servicesReduceMotion.addEventListener("change", requestServicesUpdate);
    } else if (servicesReduceMotion.addListener) {
      servicesReduceMotion.addListener(requestServicesUpdate);
    }
    updateServicesFlow();
  }

  /* ▸ Cookie consent + Google Calendar gating */
  const CONSENT_KEY = "kif_cookie_consent";
  const cookieBanner = document.getElementById("cookie-banner");
  const acceptBtn = document.getElementById("cookie-accept");
  const rejectBtn = document.getElementById("cookie-reject");
  const calendarPlaceholder = document.getElementById("calendar-placeholder");
  const calendarTemplate = document.getElementById("calendar-template");
  const calendarWrapper = document.getElementById("calendar-wrapper");
  const calendarAllowBtn = document.getElementById("calendar-allow");
  let cookieBannerTimer = 0;

  const loadCalendar = () => {
    if (!calendarTemplate || !calendarWrapper) return;
    if (calendarWrapper.querySelector("iframe")) return;
    const frag = calendarTemplate.content.cloneNode(true);
    if (calendarPlaceholder) calendarPlaceholder.remove();
    calendarWrapper.appendChild(frag);
  };

  const showBanner = () => {
    if (!cookieBanner) return;
    cookieBanner.hidden = false;
    requestAnimationFrame(() => cookieBanner.classList.add("is-shown"));
  };

  const hideBanner = () => {
    if (!cookieBanner) return;
    cookieBanner.classList.remove("is-shown");
    setTimeout(() => { cookieBanner.hidden = true; }, 450);
  };

  const setConsent = (value) => {
    if (cookieBannerTimer) {
      window.clearTimeout(cookieBannerTimer);
      cookieBannerTimer = 0;
    }
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ value, at: new Date().toISOString() })
      );
    } catch (e) { /* storage may be blocked; choice still applies for this session */ }
    if (value === "accepted") loadCalendar();
    hideBanner();
  };

  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null"); } catch (e) {}

  const storedConsentIsValid =
    stored && (stored.value === "accepted" || stored.value === "essential");

  if (!storedConsentIsValid) {
    // Defer the banner so it doesn't fight the hero animation
    cookieBannerTimer = window.setTimeout(() => {
      cookieBannerTimer = 0;
      showBanner();
    }, 800);
  } else if (stored.value === "accepted") {
    loadCalendar();
  }

  if (acceptBtn) acceptBtn.addEventListener("click", () => setConsent("accepted"));
  if (rejectBtn) rejectBtn.addEventListener("click", () => setConsent("essential"));
  if (calendarAllowBtn) calendarAllowBtn.addEventListener("click", () => setConsent("accepted"));

  /* ▸ Contact form: AJAX submit to Formspree, inline status messages */
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");

  if (contactForm && formStatus) {
    const submitBtn = contactForm.querySelector(".form-submit");

    const t = (key, fallback) => {
      const lang = document.documentElement.lang || "de";
      return (
        (typeof translations !== "undefined" &&
          translations[lang] &&
          translations[lang][key]) ||
        fallback
      );
    };

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      formStatus.textContent = "";
      formStatus.classList.remove("is-success", "is-error");

      // Native validation first
      if (!contactForm.checkValidity()) {
        formStatus.textContent = t(
          "contact_invalid",
          "Bitte füllen Sie alle Pflichtfelder korrekt aus."
        );
        formStatus.classList.add("is-error");
        contactForm.reportValidity();
        return;
      }

      // If the form action still has the placeholder, stop and warn locally.
      const action = contactForm.getAttribute("action") || "";
      if (action.includes("YOUR_FORM_ID")) {
        formStatus.textContent = t(
          "contact_not_configured",
          "Formular noch nicht konfiguriert — bitte später erneut versuchen."
        );
        formStatus.classList.add("is-error");
        return;
      }

      const data = new FormData(contactForm);
      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = t("contact_sending", "Wird gesendet…");

      try {
        const res = await fetch(action, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          formStatus.textContent = t(
            "contact_success",
            "Danke! Wir melden uns innerhalb von 24 Stunden."
          );
          formStatus.classList.add("is-success");
          contactForm.reset();
        } else {
          const json = await res.json().catch(() => ({}));
          const msg = (json.errors && json.errors.map((x) => x.message).join(", ")) || "";
          formStatus.textContent =
            msg ||
            t("contact_error", "Etwas ist schiefgelaufen. Bitte erneut versuchen.");
          formStatus.classList.add("is-error");
        }
      } catch (err) {
        formStatus.textContent = t(
          "contact_error",
          "Etwas ist schiefgelaufen. Bitte erneut versuchen."
        );
        formStatus.classList.add("is-error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    });
  }

  /* ▸▸ LANGUAGE SWITCHER ------------------------------------------------ */
  const langDeBtn = document.getElementById("lang-de");
  const langEnBtn = document.getElementById("lang-en");

  if (langDeBtn && langEnBtn && typeof translations !== "undefined") {
    const decodeTranslatedAttr = (value) => {
      const textarea = document.createElement("textarea");
      textarea.innerHTML = value;
      return textarea.value;
    };

    const setLanguage = (lang) => {
      langDeBtn.classList.toggle("active", lang === "de");
      langEnBtn.classList.toggle("active", lang === "en");
      langDeBtn.setAttribute("aria-pressed", String(lang === "de"));
      langEnBtn.setAttribute("aria-pressed", String(lang === "en"));
      document.documentElement.lang = lang;

      document.querySelectorAll("[data-translate]").forEach((element) => {
        const key = element.getAttribute("data-translate");
        if (translations[lang] && translations[lang][key]) {
          if (element.tagName === "META") {
            element.setAttribute("content", decodeTranslatedAttr(translations[lang][key]));
          } else {
            element.innerHTML = translations[lang][key];
          }
        }
      });

      document.querySelectorAll("[data-translate-placeholder]").forEach((element) => {
        const key = element.getAttribute("data-translate-placeholder");
        if (translations[lang] && translations[lang][key]) {
          element.setAttribute("placeholder", decodeTranslatedAttr(translations[lang][key]));
        }
      });

      document.querySelectorAll("[data-translate-aria-label]").forEach((element) => {
        const key = element.getAttribute("data-translate-aria-label");
        if (translations[lang] && translations[lang][key]) {
          element.setAttribute("aria-label", decodeTranslatedAttr(translations[lang][key]));
        }
      });

      // Re-insert dynamic year after translation (footer uses innerHTML)
      setYear();
      document.dispatchEvent(new CustomEvent("kif:languagechange", { detail: { lang } }));

      // Counters lose their textContent if their label parent is re-rendered;
      // they aren't, but reset only if not yet animated.
    };

    langDeBtn.addEventListener("click", () => setLanguage("de"));
    langEnBtn.addEventListener("click", () => setLanguage("en"));

    setLanguage("de");
  }
});
