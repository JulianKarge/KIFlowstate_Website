/* ============================================================
 * KIFlowstate – KI-News shared data layer
 * ------------------------------------------------------------
 *  Fetches the Daily AI News JSON feed published by the
 *  separate "DailyNews" repo (Hermes agent updates it daily)
 *  and exposes a small, defensive API on window.KINews used by
 *  both the homepage band (ki-news-home.js) and the full page
 *  (ki-news-page.js).
 *
 *  Feed contract (see DailyNews/data/api/README.md):
 *    index.json          -> list of day summaries (newest first-ish)
 *    latest.json         -> full latest digest
 *    days/YYYY-MM-DD.json -> full digest for one day
 *
 *  The feed is German-only and occasionally messy (a whole essay
 *  dumped into one item's why_it_matters, inline "**Quelle:** url"
 *  markers, summaries that duplicate the title, truncated deks).
 *  Every render path here is written to survive that.
 * ============================================================ */

window.KINews = (function () {
  "use strict";

  const FEED_BASE = "https://juliankarge.github.io/DailyNews/data/api";
  const CACHE_PREFIX = "kif_kinews_cache_";
  const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min: feed sets max-age 600s

  /* ── i18n helper ─────────────────────────────────────────── */
  function lang() {
    return document.documentElement.lang || "de";
  }

  function t(key, fallback) {
    const l = lang();
    const table =
      (typeof translations !== "undefined" && translations[l]) || null;
    // hasOwnProperty — NOT truthiness — so an intentionally empty string
    // (e.g. kinews_lang_note in German) returns "" instead of leaking the key.
    if (table && Object.prototype.hasOwnProperty.call(table, key)) {
      return table[key];
    }
    return fallback != null ? fallback : key;
  }

  /* ── fetch with localStorage fallback cache ──────────────── *
   * Always tries the network first. On success the response is
   * cached. On failure we fall back to the last good cached copy
   * (even if stale) so a feed hiccup never blanks the UI.        */
  async function fetchJSON(url) {
    let cached = readCache(url);

    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      writeCache(url, data);
      return data;
    } catch (err) {
      if (cached) return cached.data;
      throw err;
    }
  }

  function readCache(url) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + url);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data) return null;
      return parsed; // { data, ts }
    } catch (e) {
      return null;
    }
  }

  function writeCache(url, data) {
    try {
      localStorage.setItem(
        CACHE_PREFIX + url,
        JSON.stringify({ data: data, ts: Date.now() })
      );
    } catch (e) {
      /* quota / private mode — ignore, network still works */
    }
  }

  function isFresh(url) {
    const c = readCache(url);
    return !!c && Date.now() - (c.ts || 0) < CACHE_TTL_MS;
  }

  /* ── feed endpoints ──────────────────────────────────────── */
  const getIndex = () => fetchJSON(FEED_BASE + "/index.json");
  const getLatest = () => fetchJSON(FEED_BASE + "/latest.json");
  const getDay = (date) => fetchJSON(FEED_BASE + "/days/" + date + ".json");

  /* ── text cleaning ───────────────────────────────────────── *
   * The feed sometimes packs the source URL and even an entire
   * follow-up essay into why_it_matters via a "**Quelle:** ..."
   * marker. Cut everything from that marker on (the source is
   * shown separately), strip markdown bold, collapse whitespace. */
  function cleanProse(text) {
    if (!text || typeof text !== "string") return "";
    let out = text;

    // Drop everything from the first source marker onward.
    const markers = [/\*\*\s*Quelle\s*:?\s*\*\*/i, /\n\s*Quelle\s*:/i];
    for (const m of markers) {
      const idx = out.search(m);
      if (idx > -1) out = out.slice(0, idx);
    }

    out = out
      .replace(/\*\*(.*?)\*\*/g, "$1") // **bold** -> bold
      .replace(/^#{1,6}\s+/gm, "") // markdown headings
      .replace(/`([^`]*)`/g, "$1") // inline code ticks
      // Brand rule: no em/en-dashes in site copy. A spaced dash reads as
      // prose punctuation -> comma; a tight dash (number/word ranges) -> hyphen.
      .replace(/\s+[—–]\s+/g, ", ")
      .replace(/[—–]/g, "-")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\s*\n\s*\n\s*/g, "\n")
      .trim();

    return out;
  }

  // The hero/dek summary often equals the first item title or is
  // truncated; just clean it for safe display.
  const cleanSummary = (text) => cleanProse(text);

  // Source chip label: prefer the feed's name, fall back to host.
  function sourceLabel(src) {
    if (!src) return "";
    if (src.name) return src.name;
    return hostOf(src.url);
  }

  function hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (e) {
      return url || "";
    }
  }

  // De-duplicate sources by url, keep order.
  function uniqueSources(sources) {
    const seen = new Set();
    const out = [];
    (sources || []).forEach((s) => {
      if (!s || !s.url || seen.has(s.url)) return;
      seen.add(s.url);
      out.push(s);
    });
    return out;
  }

  function confidenceLabel(level) {
    if (level === "high") return t("kinews_confidence_high", "high");
    if (level === "low") return t("kinews_confidence_low", "low");
    return t("kinews_confidence_medium", "medium");
  }

  /* ── small DOM/escape utils ──────────────────────────────── */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ── drag-to-scroll for horizontal rails ─────────────────── *
   * Click-and-drag (pointer) to move one card at a time. Suppresses
   * the click that would otherwise fire on a link after a drag.      */
  const railStageActive = new WeakMap();

  function railSnapItems(scroller) {
    return Array.from(scroller ? scroller.children : []).filter(function (item) {
      return item.offsetWidth > 0;
    });
  }

  function railIsStage(scroller) {
    return Boolean(
      scroller &&
      scroller.classList.contains("ki-items-rail") &&
      window.matchMedia("(min-width: 901px)").matches
    );
  }

  function railShouldLoop(scroller) {
    return Boolean(scroller && scroller.classList.contains("ki-items-rail"));
  }

  function normalizeRailIndex(scroller, index) {
    const items = railSnapItems(scroller);
    if (!items.length) return 0;
    if (railShouldLoop(scroller) && items.length > 1) {
      return ((index % items.length) + items.length) % items.length;
    }
    return Math.max(0, Math.min(items.length - 1, index));
  }

  function railSnapLeft(scroller, item) {
    const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const center = scroller.classList.contains("ki-items-rail");
    const left = center
      ? item.offsetLeft - (scroller.clientWidth - item.offsetWidth) / 2
      : item.offsetLeft;
    return Math.max(0, Math.min(max, left));
  }

  function railNearestIndex(scroller) {
    const items = railSnapItems(scroller);
    if (!items.length) return 0;
    if (railIsStage(scroller)) return normalizeRailIndex(scroller, railStageActive.get(scroller) || 0);
    const x = scroller.scrollLeft;
    return items.reduce(function (closest, item, index) {
      const itemDistance = Math.abs(railSnapLeft(scroller, item) - x);
      const closestDistance = Math.abs(railSnapLeft(scroller, items[closest]) - x);
      return itemDistance < closestDistance ? index : closest;
    }, 0);
  }

  function snapRailToNearest(scroller) {
    scrollRailToIndex(scroller, railNearestIndex(scroller));
  }

  function scrollRailToIndex(scroller, index) {
    const items = railSnapItems(scroller);
    if (!items.length) return;
    const safeIndex = normalizeRailIndex(scroller, index);
    if (railIsStage(scroller)) {
      railStageActive.set(scroller, safeIndex);
      updateRailDepth(scroller);
      return;
    }
    scroller.scrollTo({ left: railSnapLeft(scroller, items[safeIndex]), behavior: "smooth" });
  }

  function updateRailDepth(scroller) {
    if (!scroller || !scroller.classList.contains("ki-items-rail")) return;
    const active = railNearestIndex(scroller);
    const items = railSnapItems(scroller);
    items.forEach(function (item, index) {
      const forward = (index - active + items.length) % items.length;
      const backward = (active - index + items.length) % items.length;
      const distance = forward === 0 ? 0 : forward <= backward ? forward : -backward;
      item.classList.toggle("is-carousel-active", distance === 0);
      item.classList.toggle("is-carousel-prev", distance === -1);
      item.classList.toggle("is-carousel-next", distance === 1);
      item.classList.toggle("is-carousel-far", Math.abs(distance) > 1);
    });
  }

  function enableDragScroll(scroller) {
    if (!scroller || scroller.dataset.dragBound) return;
    if (
      scroller.classList.contains("ki-items-rail") &&
      window.KIMobileCardSwipers &&
      window.KIMobileCardSwipers.shouldUse()
    ) {
      const root = scroller.closest('.ki-items-wrap[data-rail="items"]');
      window.KIMobileCardSwipers.mountKiNewsItems(root, scroller);
      scroller.dataset.dragBound = "swiper";
      return;
    }
    scroller.dataset.dragBound = "1";

    const DRAG_THRESHOLD = 6; // px before a press becomes a drag
    let down = false;
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    let pointerId = null;
    let startIndex = 0;
    let depthTicking = false;
    let dragDelta = 0;
    let mobileSnapTimer = null;
    let mobileSnapping = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartIndex = 0;

    const isCoarsePointer = function () {
      return window.matchMedia("(hover: none), (pointer: coarse)").matches;
    };

    const isMobileRail = function () {
      return scroller.classList.contains("ki-items-rail") &&
        window.matchMedia("(max-width: 900px)").matches &&
        isCoarsePointer();
    };

    const snapMobileRail = function () {
      if (!isMobileRail() || mobileSnapping) return;
      const items = railSnapItems(scroller);
      if (!items.length) return;
      const index = railNearestIndex(scroller);
      const target = railSnapLeft(scroller, items[index]);
      if (Math.abs(scroller.scrollLeft - target) < 3) return;
      mobileSnapping = true;
      scroller.scrollTo({ left: target, behavior: "smooth" });
      window.setTimeout(function () { mobileSnapping = false; }, 420);
    };

    const scheduleMobileSnap = function () {
      if (!isMobileRail() || down) return;
      if (mobileSnapTimer) window.clearTimeout(mobileSnapTimer);
      mobileSnapTimer = window.setTimeout(snapMobileRail, 120);
    };

    const scheduleDepthUpdate = function () {
      if (!scroller.classList.contains("ki-items-rail") || depthTicking) return;
      if (!window.matchMedia("(min-width: 901px)").matches) return;
      depthTicking = true;
      requestAnimationFrame(function () {
        depthTicking = false;
        updateRailDepth(scroller);
      });
    };

    scroller.addEventListener("scroll", function () {
      scheduleDepthUpdate();
      scheduleMobileSnap();
    }, { passive: true });

    scroller.addEventListener("touchstart", function (e) {
      if (!isMobileRail() || !e.touches || !e.touches.length) return;
      if (mobileSnapTimer) window.clearTimeout(mobileSnapTimer);
      mobileSnapping = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartIndex = railNearestIndex(scroller);
    }, { passive: true });

    scroller.addEventListener("touchend", function (e) {
      if (!isMobileRail()) return;
      const touch = e.changedTouches && e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      const isHorizontalSwipe = Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.15;
      const dir = isHorizontalSwipe ? (dx < 0 ? 1 : -1) : 0;
      const targetIndex = touchStartIndex + dir;
      window.setTimeout(function () {
        scrollRailToIndex(scroller, targetIndex);
        window.setTimeout(function () { mobileSnapping = false; }, 460);
      }, 40);
    }, { passive: true });

    // Stage-mode drag: cards follow the pointer continuously, mirroring the
    // Belegdemo capability carousel. The formula interpolates the same values
    // the is-carousel-* classes use (78% / -76px / 15deg / 0.88 / opacity),
    // so the release settle transitions from wherever the drag left off.
    let startT = 0;

    const stageDistance = function (items, index, active) {
      const forward = (index - active + items.length) % items.length;
      const backward = (active - index + items.length) % items.length;
      return forward === 0 ? 0 : forward <= backward ? forward : -backward;
    };

    const stageSpan = function () {
      const items = railSnapItems(scroller);
      const active = items[normalizeRailIndex(scroller, railStageActive.get(scroller) || 0)];
      return active ? Math.max(active.offsetWidth * 0.9, 1) : 1;
    };

    const stageProgress = function () {
      return Math.max(-1.15, Math.min(1.15, dragDelta / stageSpan()));
    };

    const applyStageDrag = function (p) {
      const items = railSnapItems(scroller);
      if (!items.length) return;
      const active = normalizeRailIndex(scroller, railStageActive.get(scroller) || 0);
      items.forEach(function (item, index) {
        const d = stageDistance(items, index, active) + p;
        const sign = d < 0 ? -1 : 1;
        const within = Math.min(Math.abs(d), 1);
        const beyond = Math.max(Math.abs(d) - 1, 0);
        const tx = sign * (within * 78 + beyond * 26);
        const ty = -5 * (1 - within);
        const tz = -(within * 76 + Math.min(beyond, 1) * 64);
        const rotY = -15 * sign * within;
        const scale = 1 - 0.12 * within - 0.14 * Math.min(beyond, 1);
        const opacity = Math.max(0, 1 - 0.28 * within - 1.2 * beyond);
        item.style.transform =
          "translateX(" + tx + "%) translateY(" + ty + "px) translateZ(" + tz + "px) " +
          "rotateY(" + rotY + "deg) scale(" + scale + ")";
        item.style.opacity = String(opacity);
        item.style.zIndex = String(Math.max(1, Math.round(5 - 2 * Math.min(Math.abs(d), 2))));
      });
    };

    const clearStageDrag = function () {
      railSnapItems(scroller).forEach(function (item) {
        item.style.transform = "";
        item.style.opacity = "";
        item.style.zIndex = "";
      });
    };

    scroller.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch" || isCoarsePointer()) return;
      if (e.button != null && e.button !== 0) return;
      down = true;
      dragging = false;
      moved = false;
      dragDelta = 0;
      startX = e.clientX;
      startLeft = scroller.scrollLeft;
      startIndex = railNearestIndex(scroller);
      startT = performance.now();
      pointerId = e.pointerId;
      // NOTE: pointer capture is deliberately NOT taken here. Capturing on
      // pointerdown retargets the subsequent `click` to this scroller, which
      // breaks delegated clicks on child cards/links. We only capture once an
      // actual drag begins (see pointermove), so taps still click through.
    });

    scroller.addEventListener("pointermove", function (e) {
      if (!down) return;
      const dx = e.clientX - startX;
      dragDelta = dx;
      if (!dragging) {
        if (Math.abs(dx) <= DRAG_THRESHOLD) return; // still a potential click
        dragging = true;
        moved = true;
        scroller.classList.add("is-dragging");
        try {
          scroller.setPointerCapture(pointerId);
        } catch (err) {}
      }
      if (railIsStage(scroller)) {
        applyStageDrag(stageProgress());
        return;
      }
      scroller.scrollLeft = startLeft - dx;
    });

    const release = function () {
      const wasDragging = dragging;
      down = false;
      dragging = false;
      if (pointerId != null) {
        try {
          scroller.releasePointerCapture(pointerId);
        } catch (err) {}
      }
      pointerId = null;
      scroller.classList.remove("is-dragging");
      if (!moved) return;
      if (railIsStage(scroller)) {
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
        railStageActive.set(scroller, normalizeRailIndex(scroller, startIndex + dir));
        updateRailDepth(scroller);
        // Classes now describe the target; drop the inline drag styles on
        // the next frame so the 0.62s spring transition carries the cards
        // from the dragged position into place.
        requestAnimationFrame(function () {
          void scroller.offsetWidth;
          clearStageDrag();
        });
        return;
      }
      const dir = scroller.scrollLeft >= startLeft ? 1 : -1;
      setTimeout(function () { scrollRailToIndex(scroller, startIndex + dir); }, 60);
    };
    scroller.addEventListener("pointerup", release);
    scroller.addEventListener("pointercancel", release);
    if ("onscrollend" in window) {
      scroller.addEventListener("scrollend", function () {
        if (isCoarsePointer() || !window.matchMedia("(min-width: 901px)").matches) return;
        if (!down) snapRailToNearest(scroller);
      });
    }

    // Cancel link/button clicks that happen at the end of a drag.
    scroller.addEventListener(
      "click",
      function (e) {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
        }
      },
      true
    );

    requestAnimationFrame(scheduleDepthUpdate);
    setTimeout(scheduleDepthUpdate, 300);
  }

  // Smoothly scroll a rail one card at a time.
  function scrollRailBy(scroller, dir) {
    if (!scroller) return;
    const items = railSnapItems(scroller);
    if (!items.length) return;
    scrollRailToIndex(scroller, railNearestIndex(scroller) + (dir < 0 ? -1 : 1));
  }

  /* ── scroll-aware rail edges ──────────────────────────────── *
   * Toggles .can-scroll-left / .can-scroll-right on the wrap so the
   * edge fades AND the prev/next arrows only appear on the side that
   * actually has off-screen content. At the start position the left
   * side is fully clear, so the active first card is never covered.   */
  function bindRailEdges(wrap, scroller) {
    if (!wrap || !scroller) return;
    wrap.classList.toggle(
      "is-looping",
      scroller.classList.contains("ki-items-rail") && railSnapItems(scroller).length > 1
    );

    // Tolerance must exceed the rail's leading inline padding + scroll-snap
    // rest offset (~5px), otherwise the start position reads as "scrolled".
    const EDGE = 16;
    function update() {
      const max = scroller.scrollWidth - scroller.clientWidth;
      const x = scroller.scrollLeft;
      wrap.classList.toggle("can-scroll-left", x > EDGE);
      wrap.classList.toggle("can-scroll-right", x < max - EDGE);
    }

    if (!scroller.dataset.edgeBound) {
      scroller.dataset.edgeBound = "1";
      scroller.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      if (typeof ResizeObserver !== "undefined") {
        try {
          new ResizeObserver(update).observe(scroller);
        } catch (e) {}
      }
    }

    // Measure once layout has settled (fonts/images can shift widths).
    requestAnimationFrame(update);
    setTimeout(update, 300);
    return update;
  }

  // Re-render hook: fire callback whenever the language switches.
  function onLangChange(cb) {
    ["lang-de", "lang-en"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener("click", () => setTimeout(cb, 0));
    });
  }

  return {
    FEED_BASE,
    lang,
    t,
    getIndex,
    getLatest,
    getDay,
    isFresh,
    cleanProse,
    cleanSummary,
    sourceLabel,
    hostOf,
    uniqueSources,
    confidenceLabel,
    esc,
    enableDragScroll,
    scrollRailBy,
    bindRailEdges,
    onLangChange,
  };
})();
