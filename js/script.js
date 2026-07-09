document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ▸ Theme toggle (light / dark) — pre-DOM script in <head> already
     applied the saved theme to <html> to avoid FOUC. Here we wire the
     toggle button via event delegation so it works regardless of when
     the button mounts. */
  const THEME_KEY = "kif_theme";
  const currentTheme = () =>
    document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      const isDark = theme === "dark";
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute(
        "aria-label",
        isDark ? "Helles Design aktivieren" : "Dunkles Design aktivieren"
      );
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

  /* ▸ Dynamic copyright year */
  const setYear = () => {
    const yearElement = document.getElementById("year");
    if (yearElement) yearElement.textContent = new Date().getFullYear();
  };
  setYear();

  /* ▸ Mobile-nav toggle */
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");

  const closeNav = () => {
    if (!hamburger || !navLinks) return;
    navLinks.classList.remove("open");
    hamburger.classList.remove("is-active");
    hamburger.setAttribute("aria-expanded", "false");
  };

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      hamburger.classList.toggle("is-active", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
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
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      closeNav();
    });
  });

  /* ▸ Navbar shrink/elevate on scroll */
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ▸ Reveal-on-scroll via IntersectionObserver */
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
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
    if (prefersReducedMotion) {
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

  /* ▸ Integrations marquee — duplicate items so the scroll loops seamlessly */
  const marqueeTrack = document.getElementById("integrations-track");
  if (marqueeTrack) {
    const items = Array.from(marqueeTrack.children);
    items.forEach((node) => {
      const clone = node.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      marqueeTrack.appendChild(clone);
    });
  }

  /* ▸ Beleg-flow story: scroll-linked wave draw + 3D card choreography */
  const flowStory = document.querySelector(".flow-story");
  if (flowStory) {
    const scene = flowStory.querySelector(".story-scene");
    const cards = Array.from(flowStory.querySelectorAll(".story-piece"));
    const hub = flowStory.querySelector(".story-hub");
    const waveFillPaths = Array.from(flowStory.querySelectorAll(".story-wave-fill-path"));
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
    let scenarioIndex = 0;
    let scenarioTimer = 0;
    let scenarioAnimating = false;
    let scenarioTypingTimers = [];

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
      scenarioTypingTimers.forEach((timer) => window.clearTimeout(timer));
      scenarioTypingTimers = [];
    };
    const typeDelay = (callback, delay) => {
      const timer = window.setTimeout(() => {
        scenarioTypingTimers = scenarioTypingTimers.filter((item) => item !== timer);
        callback();
      }, delay);
      scenarioTypingTimers.push(timer);
    };
    const writeScenario = (scenario) => {
      flowStory.dataset.flowScenario = scenario;
      scenarioTargets(scenario).forEach(({ el, key, text }) => {
        el.setAttribute("data-translate", key);
        el.textContent = text;
      });
    };
    const typeScenario = (scenario) => {
      if (!hub) return;
      clearScenarioTimers();
      scenarioAnimating = true;
      hub.classList.add("is-typewriting");

      const targets = scenarioTargets(scenario).map((target) => ({
        ...target,
        from: target.el.textContent || ""
      }));
      const longestFrom = Math.max(...targets.map((target) => target.from.length), 0);
      const longestTo = Math.max(...targets.map((target) => target.text.length), 0);
      const eraseStepMs = 9;
      const typeStepMs = 18;

      for (let step = longestFrom; step >= 0; step -= 1) {
        typeDelay(() => {
          targets.forEach(({ el, from }) => {
            el.textContent = from.slice(0, Math.min(step, from.length));
          });
        }, (longestFrom - step) * eraseStepMs);
      }

      const typeStart = longestFrom * eraseStepMs + 80;
      typeDelay(() => {
        flowStory.dataset.flowScenario = scenario;
        targets.forEach(({ el, key }) => el.setAttribute("data-translate", key));
      }, typeStart - 8);

      for (let step = 0; step <= longestTo; step += 1) {
        typeDelay(() => {
          targets.forEach(({ el, text }) => {
            el.textContent = text.slice(0, Math.min(step, text.length));
          });
        }, typeStart + step * typeStepMs);
      }

      typeDelay(() => {
        writeScenario(scenario);
        hub.classList.remove("is-typewriting");
        scenarioAnimating = false;
      }, typeStart + longestTo * typeStepMs + 120);
    };
    const setScenario = (index, animate = false) => {
      scenarioIndex = (index + scenarioKeys.length) % scenarioKeys.length;
      const scenario = scenarioKeys[scenarioIndex];
      if (!animate || reduceMotion.matches || !hub || scenarioAnimating) {
        writeScenario(scenario);
        return;
      }
      typeScenario(scenario);
    };
    const startScenarioLoop = () => {
      if (scenarioTimer || reduceMotion.matches) return;
      scenarioTimer = window.setInterval(() => {
        if (!document.hidden) setScenario(scenarioIndex + 1, true);
      }, 4100);
    };
    const stopScenarioLoop = () => {
      if (!scenarioTimer) return;
      window.clearInterval(scenarioTimer);
      scenarioTimer = 0;
    };

    const updateWaveDraw = (progress) => {
      waveFillPaths.forEach((path) => {
        const length = path.getTotalLength();
        path.style.setProperty("--wave-length", length.toFixed(2));
        path.style.setProperty("--wave-offset", (length * (1 - clamp(progress))).toFixed(2));
      });
    };

    const updateStory = () => {
      storyRaf = 0;
      if (!scene || !hub) return;

      const staticScene = reduceMotion.matches || window.innerWidth <= 720;
      const total = Math.max(1, flowStory.offsetHeight - window.innerHeight);
      const rawProgress = staticScene ? 1 : clamp(-flowStory.getBoundingClientRect().top / total);
      const waveProgress = staticScene ? 1 : clamp(rawProgress / 0.9);
      const flowReveal = ease((rawProgress - 0.36) / 0.26);
      const ctaReveal = ease((rawProgress - ctaShowProgress) / 0.05);
      const flyIn = ease(rawProgress / 0.34);
      const organize = ease((rawProgress - 0.38) / 0.30);
      const ctaShouldShow = staticScene || rawProgress >= ctaShowProgress || (storyCtaVisible && rawProgress > ctaHideProgress);

      if (ctaShouldShow !== storyCtaVisible) {
        storyCtaVisible = ctaShouldShow;
        if (storyCtaVisible) storyCtaHasShown = true;
      }

      flowStory.style.setProperty("--story-progress", rawProgress.toFixed(4));
      flowStory.style.setProperty("--story-pct", `${(rawProgress * 100).toFixed(2)}%`);
      flowStory.style.setProperty("--flow-reveal", flowReveal.toFixed(4));
      flowStory.style.setProperty("--story-cta-reveal", ctaReveal.toFixed(4));
      flowStory.classList.toggle("is-story-cta-ready", storyCtaVisible);
      flowStory.classList.toggle("is-story-cta-exiting", !storyCtaVisible && storyCtaHasShown);
      updateWaveDraw(waveProgress);

      const sceneWidth = Math.max(320, scene.clientWidth);
      const sceneHeight = Math.max(420, scene.clientHeight);

      cards.forEach((card, index) => {
        const fromX = sceneWidth * dataNumber(card, "fromX") / 100;
        const fromY = sceneHeight * dataNumber(card, "fromY") / 100;
        const midX = sceneWidth * dataNumber(card, "midX") / 100;
        const midY = sceneHeight * dataNumber(card, "midY") / 100;
        const toX = sceneWidth * dataNumber(card, "toX") / 100;
        const toY = sceneHeight * dataNumber(card, "toY") / 100;
        const fromRot = dataNumber(card, "fromRot");
        const midRot = dataNumber(card, "midRot");
        const toRot = dataNumber(card, "toRot");
        const depth = dataNumber(card, "depth");
        const ripple = Math.sin(rawProgress * 18 + index * 1.7) * (1 - organize);

        const stagedX = mix(fromX, midX, flyIn);
        const stagedY = mix(fromY, midY, flyIn);
        const stagedRot = mix(fromRot, midRot, flyIn);
        const x = mix(stagedX, toX, organize) + ripple * 9;
        const y = mix(stagedY, toY, organize) + ripple * 5;
        const rotation = mix(stagedRot, toRot, organize) + ripple * 1.4;
        const z = mix(depth, 10, flyIn);
        const finalZ = mix(z, -80 + index * 8, organize);
        const scale = mix(mix(0.78, 1, flyIn), 0.76, organize);
        const opacity = clamp(mix(0, 1, flyIn) * mix(1, 0.28, organize), 0, 1);
        const tiltX = mix(18 - index * 1.8, -4, flyIn);
        const tiltY = mix(index % 2 ? -18 : 18, 0, flyIn);

        card.style.opacity = opacity.toFixed(3);
        card.style.transform = [
          "translate3d(-50%, -50%, 0)",
          `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${finalZ.toFixed(1)}px)`,
          `rotateX(${tiltX.toFixed(2)}deg)`,
          `rotateY(${tiltY.toFixed(2)}deg)`,
          `rotateZ(${rotation.toFixed(2)}deg)`,
          `scale(${scale.toFixed(3)})`
        ].join(" ");
      });

      const hubIn = ease((rawProgress - 0.48) / 0.18);
      const hubY = mix(54, 0, hubIn);
      const hubZ = mix(80, 190, hubIn);
      const hubScale = mix(0.84, 1, hubIn);
      const hubTilt = mix(9, 0, hubIn);

      hub.style.opacity = hubIn.toFixed(3);
      hub.style.transform = [
        `translate3d(-50%, -50%, ${hubZ.toFixed(1)}px)`,
        `translateY(${hubY.toFixed(1)}px)`,
        `rotateX(${hubTilt.toFixed(2)}deg)`,
        `scale(${hubScale.toFixed(3)})`
      ].join(" ");
    };

    const requestStoryUpdate = () => {
      if (!storyRaf) storyRaf = window.requestAnimationFrame(updateStory);
    };

    window.addEventListener("scroll", requestStoryUpdate, { passive: true });
    window.addEventListener("resize", requestStoryUpdate);
    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener("change", () => {
        if (reduceMotion.matches) stopScenarioLoop();
        else startScenarioLoop();
        requestStoryUpdate();
      });
    } else if (reduceMotion.addListener) {
      reduceMotion.addListener(() => {
        if (reduceMotion.matches) stopScenarioLoop();
        else startScenarioLoop();
        requestStoryUpdate();
      });
    }
    document.addEventListener("kif:languagechange", () => {
      clearScenarioTimers();
      scenarioAnimating = false;
      hub?.classList.remove("is-typewriting");
      writeScenario(scenarioKeys[scenarioIndex]);
    });
    writeScenario(scenarioKeys[scenarioIndex]);
    startScenarioLoop();
    updateStory();
  }

  /* ▸ Method story: scroll-linked AI jungle to flow transformation */
  const methodStory = document.querySelector(".method-scrolly");
  if (methodStory) {
    const methodSteps = Array.from(methodStory.querySelectorAll("[data-method-step]"));
    const methodPaths = Array.from(
      methodStory.querySelectorAll(".method-flow-wave path:not(.method-flow-current)")
    );
    const methodReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let methodRaf = 0;

    const clampMethod = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const easeMethod = (value) => {
      const t = clampMethod(value);
      return t * t * (3 - 2 * t);
    };

    const updateMethodPaths = (progress) => {
      methodPaths.forEach((path) => {
        const length = path.getTotalLength();
        const draw = easeMethod((progress - 0.12) / 0.74);
        path.style.setProperty("--method-path-length", length.toFixed(2));
        path.style.setProperty("--method-path-offset", (length * (1 - draw)).toFixed(2));
      });
    };

    /* Pin the waypoint stations onto the rendered wave. The SVG stretches
       with preserveAspectRatio="none", so we project path points through
       the actual viewBox-to-pixel scale instead of hardcoding positions. */
    const methodMap = methodStory.querySelector(".method-map");
    const methodMainPath = methodStory.querySelector(".method-flow-main");
    const methodWaypoints = [
      { el: methodStory.querySelector(".method-waypoint-1"), t: 0.32 },
      { el: methodStory.querySelector(".method-waypoint-2"), t: 0.54 },
      { el: methodStory.querySelector(".method-waypoint-3"), t: 0.72 },
    ].filter((wp) => wp.el);

    const positionMethodWaypoints = () => {
      if (!methodMap || !methodMainPath) return;
      const svg = methodMainPath.ownerSVGElement;
      const svgRect = svg.getBoundingClientRect();
      const mapRect = methodMap.getBoundingClientRect();
      if (!svgRect.width || !mapRect.width) return;
      const viewBox = svg.viewBox.baseVal;
      const total = methodMainPath.getTotalLength();

      methodWaypoints.forEach(({ el, t }) => {
        const point = methodMainPath.getPointAtLength(total * t);
        const x = svgRect.left - mapRect.left + (point.x / viewBox.width) * svgRect.width;
        const y = svgRect.top - mapRect.top + (point.y / viewBox.height) * svgRect.height;
        el.style.left = `${((x / mapRect.width) * 100).toFixed(2)}%`;
        el.style.top = `${((y / mapRect.height) * 100).toFixed(2)}%`;
      });
    };

    const updateMethodStory = () => {
      methodRaf = 0;
      const staticScene = methodReduceMotion.matches || window.innerWidth <= 900;
      const total = Math.max(1, methodStory.offsetHeight - window.innerHeight);
      const progress = staticScene ? 1 : clampMethod(-methodStory.getBoundingClientRect().top / total);
      const phase = progress < 0.36 ? 0 : progress < 0.72 ? 1 : 2;

      methodStory.style.setProperty("--method-progress", progress.toFixed(4));
      methodStory.dataset.methodPhase = String(phase);
      methodSteps.forEach((step, index) => {
        const isActive = staticScene ? index === 2 : index === phase;
        step.classList.toggle("is-active", isActive);
      });
      updateMethodPaths(progress);
    };

    const requestMethodUpdate = () => {
      if (!methodRaf) methodRaf = window.requestAnimationFrame(updateMethodStory);
    };

    window.addEventListener("scroll", requestMethodUpdate, { passive: true });
    window.addEventListener("resize", () => {
      positionMethodWaypoints();
      requestMethodUpdate();
    });
    if (methodReduceMotion.addEventListener) {
      methodReduceMotion.addEventListener("change", requestMethodUpdate);
    } else if (methodReduceMotion.addListener) {
      methodReduceMotion.addListener(requestMethodUpdate);
    }
    window.addEventListener("load", positionMethodWaypoints);
    positionMethodWaypoints();
    updateMethodStory();
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
      const staticScene = servicesReduceMotion.matches;
      const rect = servicesFlow.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const travel = Math.max(1, servicesFlow.offsetHeight * 0.68);
      const rawProgress = staticScene
        ? 1
        : clampServices((window.scrollY - sectionTop) / travel);
      const progress = staticScene ? 1 : clampServices(rawProgress / 0.84);

      setServicesProgress(progress, rawProgress);
    };

    const requestServicesUpdate = () => {
      if (!servicesRaf) servicesRaf = window.requestAnimationFrame(updateServicesFlow);
    };

    window.addEventListener("scroll", requestServicesUpdate, { passive: true });
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

  if (!stored) {
    // Defer the banner so it doesn't fight the hero animation
    setTimeout(showBanner, 800);
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
          "Bitte fülle alle Pflichtfelder korrekt aus."
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
