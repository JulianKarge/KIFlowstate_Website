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
    const setLanguage = (lang) => {
      langDeBtn.classList.toggle("active", lang === "de");
      langEnBtn.classList.toggle("active", lang === "en");
      document.documentElement.lang = lang;

      document.querySelectorAll("[data-translate]").forEach((element) => {
        const key = element.getAttribute("data-translate");
        if (translations[lang] && translations[lang][key]) {
          element.innerHTML = translations[lang][key];
        }
      });

      // Re-insert dynamic year after translation (footer uses innerHTML)
      setYear();

      // Counters lose their textContent if their label parent is re-rendered;
      // they aren't, but reset only if not yet animated.
    };

    langDeBtn.addEventListener("click", () => setLanguage("de"));
    langEnBtn.addEventListener("click", () => setLanguage("en"));

    setLanguage("de");
  }
});
