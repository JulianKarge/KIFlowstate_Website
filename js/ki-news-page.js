/* ============================================================
 * KIFlowstate – KI-News full page (horizontal card stage)
 * ------------------------------------------------------------
 *  Day rail  = horizontal, drag-to-swipe row of day cards.
 *  Item rail = horizontal, drag-to-swipe gallery of news posts
 *              for the selected day.
 *
 *  URL hash linking:  ki-news.html#YYYY-MM-DD selects that day.
 * ============================================================ */

(function () {
  "use strict";
  if (typeof KINews === "undefined") return;

  const railEl = document.getElementById("ki-day-list");
  const emptyEl = document.getElementById("ki-day-list-empty");
  const contentEl = document.getElementById("ki-news-content");
  if (!railEl || !contentEl) return;

  const t = KINews.t;
  const esc = KINews.esc;

  let days = [];
  let activeDate = null;
  const dayCache = {};

  /* ── helpers ─────────────────────────────────────────────── */
  function sortDaysDesc(arr) {
    return arr.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }

  function splitLabel(day) {
    const lbl = day.date_label || day.date || "";
    const parts = lbl.split(", ");
    return {
      weekday: day.weekday || parts[0] || "",
      date: parts.length > 1 ? parts.slice(1).join(", ") : day.date || lbl,
    };
  }

  function pad2(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  /* ── day rail ────────────────────────────────────────────── */
  function renderDayRail() {
    if (!days.length) {
      railEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    railEl.innerHTML = days
      .map(function (day, i) {
        const active = day.date === activeDate;
        const parts = splitLabel(day);
        const count = (day.item_count || 0) + " " + t("kinews_items_label", "updates");
        return (
          '<li role="presentation">' +
          '<button class="ki-day-card' +
          (active ? " is-active" : "") +
          '" role="tab" type="button" data-date="' +
          esc(day.date) +
          '" aria-selected="' +
          (active ? "true" : "false") +
          '">' +
          '<span class="ki-day-card-num">' +
          pad2(days.length - i) +
          "</span>" +
          '<span class="ki-day-card-weekday">' +
          esc(parts.weekday) +
          "</span>" +
          '<span class="ki-day-card-date">' +
          esc(parts.date) +
          "</span>" +
          '<span class="ki-day-card-count"><i class="fas fa-newspaper" aria-hidden="true"></i>' +
          esc(count) +
          "</span>" +
          "</button></li>"
        );
      })
      .join("");

    KINews.enableDragScroll(railEl);
    KINews.bindRailEdges(
      document.querySelector('.ki-rail-wrap[data-rail="days"]'),
      railEl
    );
    scrollActiveDayIntoView();
  }

  function scrollActiveDayIntoView() {
    const card = railEl.querySelector(".ki-day-card.is-active");
    if (!card) return;
    const target = card.offsetLeft - railEl.clientWidth / 2 + card.clientWidth / 2;
    railEl.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }

  /* ── content: language note, hero, item rail ─────────────── */
  function langNote() {
    const note = t("kinews_lang_note", "");
    if (!note) return "";
    return (
      '<p class="ki-lang-note"><i class="fas fa-language" aria-hidden="true"></i>' +
      esc(note) +
      "</p>"
    );
  }

  function loadingPanel() {
    contentEl.innerHTML =
      '<div class="ki-content-loading" role="status" aria-live="polite">' +
      '<span class="ki-home-spinner" aria-hidden="true"></span>' +
      "<span>" +
      esc(t("kinews_loading", "Loading news…")) +
      "</span></div>";
  }

  function emptyPanel() {
    contentEl.innerHTML =
      '<div class="ki-content-empty"><i class="fas fa-newspaper" aria-hidden="true"></i>' +
      "<p>" +
      esc(t("kinews_select_day", "Pick a day to see the digest.")) +
      "</p></div>";
  }

  function sourceLinks(sources) {
    const uniq = KINews.uniqueSources(sources);
    if (!uniq.length) return "";
    const label =
      uniq.length > 1 ? t("kinews_sources", "Sources") : t("kinews_source", "Source");
    const links = uniq
      .map(function (s) {
        return (
          '<a class="ki-source" href="' +
          esc(s.url) +
          '" target="_blank" rel="noopener noreferrer">' +
          '<i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>' +
          esc(KINews.sourceLabel(s)) +
          "</a>"
        );
      })
      .join("");
    return (
      '<div class="ki-item-sources"><span class="ki-item-sources-label">' +
      esc(label) +
      ":</span>" +
      links +
      "</div>"
    );
  }

  function tagChips(tags) {
    if (!tags || !tags.length) return "";
    const chips = tags
      .map((tag) => '<span class="ki-tag">#' + esc(tag) + "</span>")
      .join("");
    return '<div class="ki-item-tags">' + chips + "</div>";
  }

  function itemCard(item, i) {
    const why = KINews.cleanProse(item.why_it_matters || "");
    const long = why.length > 240;
    const conf = item.confidence || "medium";
    const title = item.title || "";

    return (
      '<article class="ki-item" role="listitem" style="--ki-stagger:' +
      i +
      '">' +
      '<span class="ki-item-index" aria-hidden="true">' +
      pad2(i + 1) +
      "</span>" +
      '<span class="ki-item-accent" aria-hidden="true"></span>' +
      '<span class="ki-conf ki-conf-' +
      esc(conf) +
      '"><span class="ki-conf-dot" aria-hidden="true"></span>' +
      esc(KINews.confidenceLabel(conf)) +
      "</span>" +
      '<h3 class="ki-item-title" title="' +
      esc(title) +
      '">' +
      esc(title) +
      "</h3>" +
      (why
        ? '<div class="ki-item-why' +
          (long ? " is-clamped" : "") +
          '">' +
          '<span class="ki-item-why-label">' +
          esc(t("kinews_why", "Why it matters")) +
          "</span>" +
          '<p class="ki-item-why-text">' +
          esc(why) +
          "</p>" +
          (long
            ? '<button class="ki-why-toggle" type="button" data-more="' +
              esc(t("kinews_more", "more")) +
              '" data-less="' +
              esc(t("kinews_less", "less")) +
              '"><span class="ki-why-toggle-label">' +
              esc(t("kinews_more", "more")) +
              '</span><i class="fas fa-chevron-down" aria-hidden="true"></i>' +
              "</button>"
            : "") +
          "</div>"
        : "") +
      '<div class="ki-item-foot">' +
      tagChips(item.tags) +
      sourceLinks(item.sources && item.sources.length ? item.sources : [item.source]) +
      "</div>" +
      "</article>"
    );
  }

  function renderDay(day) {
    const items = day.items || [];
    const accent = day.hero && day.hero.accent ? day.hero.accent : "#3369f2";
    const dek = KINews.cleanSummary(day.dek || day.summary || "");
    const meta = [];
    if (items.length) meta.push(items.length + " " + t("kinews_items_label", "updates"));
    const srcCount = KINews.uniqueSources(day.sources).length;
    if (srcCount) meta.push(srcCount + " " + t("kinews_sources_label", "sources"));

    contentEl.innerHTML =
      langNote() +
      '<header class="ki-day-hero" style="--ki-accent:' +
      esc(accent) +
      '">' +
      '<span class="ki-day-hero-bar" aria-hidden="true"></span>' +
      '<p class="ki-day-hero-date">' +
      esc(day.date_label || day.date) +
      "</p>" +
      (dek ? '<p class="ki-day-hero-dek">' + esc(dek) + "</p>" : "") +
      '<p class="ki-day-hero-meta">' +
      esc(meta.join(" · ")) +
      "</p>" +
      "</header>" +
      '<div class="ki-rail-wrap ki-items-wrap" data-rail="items">' +
      '<button class="ki-rail-arrow ki-rail-prev" type="button" data-dir="-1" aria-label="' +
      esc(t("kinews_more", "more")) +
      '"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>' +
      '<div class="ki-items-rail" id="ki-items-rail" role="list">' +
      items.map(itemCard).join("") +
      "</div>" +
      '<button class="ki-rail-arrow ki-rail-next" type="button" data-dir="1" aria-label="' +
      esc(t("kinews_more", "more")) +
      '"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>' +
      "</div>";

    const itemsRail = document.getElementById("ki-items-rail");
    const itemsWrap = contentEl.querySelector(".ki-items-wrap");
    KINews.enableDragScroll(itemsRail);
    KINews.bindRailEdges(itemsWrap, itemsRail);
    wireArrows(itemsWrap, itemsRail);
    bindToggles();
  }

  function bindToggles() {
    contentEl.querySelectorAll(".ki-why-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const box = btn.closest(".ki-item-why");
        if (!box) return;
        const clamped = box.classList.toggle("is-clamped");
        btn.classList.toggle("is-open", !clamped);
        const label = btn.querySelector(".ki-why-toggle-label");
        if (label) {
          label.textContent = clamped
            ? btn.getAttribute("data-more")
            : btn.getAttribute("data-less");
        }
      });
    });
  }

  /* ── rail arrow wiring ───────────────────────────────────── */
  function wireArrows(wrap, scroller) {
    if (!wrap || !scroller) return;
    wrap.querySelectorAll(".ki-rail-arrow").forEach(function (btn) {
      btn.addEventListener("click", function () {
        KINews.scrollRailBy(scroller, parseInt(btn.getAttribute("data-dir"), 10) || 1);
      });
    });
  }

  /* ── selection ───────────────────────────────────────────── */
  async function selectDay(date, updateHash) {
    if (!date) return;
    activeDate = date;
    renderDayRail();
    if (updateHash) {
      try {
        history.replaceState(null, "", "#" + date);
      } catch (e) {
        location.hash = date;
      }
    }

    if (dayCache[date]) {
      renderDay(dayCache[date]);
      return;
    }
    loadingPanel();
    try {
      const day = await KINews.getDay(date);
      dayCache[date] = day;
      if (activeDate === date) renderDay(day);
    } catch (e) {
      contentEl.innerHTML =
        '<div class="ki-content-empty"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i>' +
        "<p>" +
        esc(t("kinews_error_text", "The feed is currently unavailable.")) +
        "</p></div>";
    }
  }

  /* ── events ──────────────────────────────────────────────── */
  railEl.addEventListener("click", function (e) {
    const btn = e.target.closest && e.target.closest(".ki-day-card");
    if (!btn) return;
    const date = btn.getAttribute("data-date");
    if (date && date !== activeDate) selectDay(date, true);
  });

  // Day-rail arrows (static in the HTML).
  wireArrows(document.querySelector('.ki-rail-wrap[data-rail="days"]'), railEl);

  window.addEventListener("hashchange", function () {
    const date = location.hash.replace(/^#/, "");
    if (date && date !== activeDate && dayExists(date)) selectDay(date, false);
  });

  KINews.onLangChange(function () {
    renderDayRail();
    if (activeDate && dayCache[activeDate]) renderDay(dayCache[activeDate]);
    else if (!activeDate) emptyPanel();
  });

  function dayExists(date) {
    return days.some((d) => d.date === date);
  }

  /* ── boot ────────────────────────────────────────────────── */
  async function init() {
    loadingPanel();
    try {
      const index = await KINews.getIndex();
      days = sortDaysDesc(index.days || []);
    } catch (e) {
      days = [];
    }
    renderDayRail();

    if (!days.length) {
      emptyPanel();
      return;
    }

    const hashDate = location.hash.replace(/^#/, "");
    const start = dayExists(hashDate) ? hashDate : days[0].date;
    selectDay(start, !dayExists(hashDate));
  }

  init();
})();
