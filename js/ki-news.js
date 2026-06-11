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
   * Click-and-drag (pointer) to swipe a horizontal scroller, plus
   * vertical-wheel -> horizontal translation. Suppresses the click
   * that would otherwise fire on a link after a drag.              */
  function enableDragScroll(scroller) {
    if (!scroller || scroller.dataset.dragBound) return;
    scroller.dataset.dragBound = "1";

    const DRAG_THRESHOLD = 6; // px before a press becomes a drag
    let down = false;
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    let pointerId = null;

    scroller.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      down = true;
      dragging = false;
      moved = false;
      startX = e.clientX;
      startLeft = scroller.scrollLeft;
      pointerId = e.pointerId;
      // NOTE: pointer capture is deliberately NOT taken here. Capturing on
      // pointerdown retargets the subsequent `click` to this scroller, which
      // breaks delegated clicks on child cards/links. We only capture once an
      // actual drag begins (see pointermove), so taps still click through.
    });

    scroller.addEventListener("pointermove", function (e) {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) <= DRAG_THRESHOLD) return; // still a potential click
        dragging = true;
        moved = true;
        scroller.classList.add("is-dragging");
        try {
          scroller.setPointerCapture(pointerId);
        } catch (err) {}
      }
      scroller.scrollLeft = startLeft - dx;
    });

    const release = function () {
      down = false;
      dragging = false;
      if (pointerId != null) {
        try {
          scroller.releasePointerCapture(pointerId);
        } catch (err) {}
      }
      pointerId = null;
      scroller.classList.remove("is-dragging");
    };
    scroller.addEventListener("pointerup", release);
    scroller.addEventListener("pointercancel", release);

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

    // Let a vertical mouse wheel scroll the rail horizontally.
    scroller.addEventListener(
      "wheel",
      function (e) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
          scroller.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }

  // Smoothly scroll a rail by ~one viewport of cards in a direction.
  function scrollRailBy(scroller, dir) {
    if (!scroller) return;
    const amount = Math.max(240, scroller.clientWidth * 0.8) * (dir < 0 ? -1 : 1);
    scroller.scrollBy({ left: amount, behavior: "smooth" });
  }

  /* ── scroll-aware rail edges ──────────────────────────────── *
   * Toggles .can-scroll-left / .can-scroll-right on the wrap so the
   * edge fades AND the prev/next arrows only appear on the side that
   * actually has off-screen content. At the start position the left
   * side is fully clear, so the active first card is never covered.   */
  function bindRailEdges(wrap, scroller) {
    if (!wrap || !scroller) return;

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
