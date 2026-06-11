/* ============================================================
 * KIFlowstate – KI-News homepage band
 * ------------------------------------------------------------
 *  Fills #ki-news-latest on index.html with the latest digest:
 *  date, dek, top 3 item headlines + source chips, and a link
 *  to the full KI-News page. Pure read from window.KINews.
 * ============================================================ */

(function () {
  "use strict";
  if (typeof KINews === "undefined") return;

  const mount = document.getElementById("ki-news-latest");
  if (!mount) return;

  const TOP_N = 3;
  let latest = null; // cache the fetched digest across re-renders

  const t = KINews.t;
  const esc = KINews.esc;

  function dateLabel(day) {
    return day.date_label || day.date || "";
  }

  function metaLine(day) {
    const items = day.item_count != null ? day.item_count : (day.items || []).length;
    const srcs =
      day.source_count != null ? day.source_count : (day.sources || []).length;
    const parts = [];
    if (items) parts.push(items + " " + t("kinews_items_label", "updates"));
    if (srcs) parts.push(srcs + " " + t("kinews_sources_label", "sources"));
    return parts.join(" · ");
  }

  function skeleton() {
    mount.innerHTML =
      '<div class="ki-home-skeleton" role="status" aria-live="polite">' +
      '<span class="ki-home-spinner" aria-hidden="true"></span>' +
      "<span>" +
      esc(t("kinews_loading", "Loading news…")) +
      "</span></div>";
  }

  function errorState() {
    mount.innerHTML =
      '<div class="ki-home-error">' +
      '<i class="fas fa-cloud-arrow-down" aria-hidden="true"></i>' +
      "<h3>" +
      esc(t("kinews_error_title", "News not reachable")) +
      "</h3>" +
      "<p>" +
      esc(t("kinews_error_text", "The feed is currently unavailable.")) +
      "</p>" +
      '<a class="ki-home-error-link" href="ki-news.html">' +
      esc(t("kinews_error_link", "Go to the news archive")) +
      " <i class=\"fas fa-arrow-right\" aria-hidden=\"true\"></i></a>" +
      "</div>";
  }

  function render() {
    if (!latest) return;
    const day = latest;
    const items = (day.items || []).slice(0, TOP_N);

    const rows = items
      .map(function (item) {
        const title = esc(item.title || "");
        const src = item.source || (item.sources && item.sources[0]);
        let chip = "";
        if (src && src.url) {
          chip =
            '<a class="ki-home-chip" href="' +
            esc(src.url) +
            '" target="_blank" rel="noopener noreferrer" ' +
            'title="' +
            esc(KINews.sourceLabel(src)) +
            '">' +
            '<i class="fas fa-link" aria-hidden="true"></i>' +
            esc(KINews.sourceLabel(src)) +
            "</a>";
        }
        return (
          '<li class="ki-home-item">' +
          '<span class="ki-home-bullet" aria-hidden="true"></span>' +
          '<div class="ki-home-item-body">' +
          '<p class="ki-home-item-title">' +
          title +
          "</p>" +
          chip +
          "</div></li>"
        );
      })
      .join("");

    const dek = KINews.cleanSummary(day.dek || day.summary || "");

    mount.innerHTML =
      '<div class="ki-home-card-head">' +
      '<span class="ki-home-date"><i class="fas fa-calendar-day" aria-hidden="true"></i>' +
      esc(dateLabel(day)) +
      "</span>" +
      '<span class="ki-home-meta">' +
      esc(metaLine(day)) +
      "</span>" +
      "</div>" +
      (dek ? '<p class="ki-home-dek">' + esc(dek) + "</p>" : "") +
      '<ul class="ki-home-list">' +
      rows +
      "</ul>" +
      '<a class="ki-home-cta" href="ki-news.html">' +
      esc(t("kinews_home_cta", "See all AI news")) +
      ' <i class="fas fa-arrow-right" aria-hidden="true"></i></a>';
  }

  async function load() {
    skeleton();
    try {
      latest = await KINews.getLatest();
      render();
    } catch (e) {
      errorState();
    }
  }

  // Re-render labels/dates when the user flips DE/EN (content stays German).
  KINews.onLangChange(function () {
    if (latest) render();
  });

  load();
})();
