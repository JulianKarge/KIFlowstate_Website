/* ============================================================
 * KIFlowstate – Resources Page
 * ------------------------------------------------------------
 *  Renders the video list (left sidebar) and the active video's
 *  resources (right panel). Reads its data from videos.js.
 *
 *  URL hash linking:
 *      /resources.html#<videoId>
 *  ...selects that video on load, and clicking a video updates
 *  the hash so the URL is shareable from YouTube comments.
 * ============================================================ */

(() => {
  if (typeof VIDEOS === "undefined") return;

  const sidebar      = document.getElementById("video-list");
  const sidebarEmpty = document.getElementById("video-list-empty");
  const content      = document.getElementById("resources-content");
  const toast        = document.getElementById("copy-toast");
  if (!sidebar || !content) return;

  /* ── helpers ─────────────────────────────────────────────── */
  const t = (key, fallback) => {
    const lang = document.documentElement.lang || "de";
    return (
      (typeof translations !== "undefined" &&
        translations[lang] &&
        translations[lang][key]) ||
      fallback
    );
  };

  // Pick the right translation: a string is used as-is; an
  // object {de, en} returns the current language (or falls back).
  const pick = (val) => {
    if (val == null) return "";
    if (typeof val === "string") return val;
    const lang = document.documentElement.lang || "de";
    return val[lang] || val.de || val.en || "";
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const lang = document.documentElement.lang || "de";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang === "de" ? "de-DE" : "en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
  };

  const ytThumb = (id) =>
    `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`;

  const ytThumbHQ = (id) =>
    `https://i.ytimg.com/vi/${encodeURIComponent(id)}/maxresdefault.jpg`;

  // Returns the URL for a video's thumbnail. Honors a per-video override
  // (`thumbnailUrl`) if set in videos.js — falls back to YouTube otherwise.
  // `size` is "hq" (player) or "small" (sidebar).
  const thumbUrl = (video, size) => {
    if (video && video.thumbnailUrl) return video.thumbnailUrl;
    return size === "hq" ? ytThumbHQ(video.id) : ytThumb(video.id);
  };

  const ytEmbed = (id) =>
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;

  const ytWatch = (id) =>
    `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;

  const hostFromUrl = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch { return ""; }
  };

  // Minimal HTML escape for user-supplied text. Section type "text"
  // is the only place we render raw HTML — and that comes from your
  // own videos.js, not user input, so it's safe.
  const escapeHtml = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("is-shown"));
    clearTimeout(showToast._tid);
    showToast._tid = setTimeout(() => {
      toast.classList.remove("is-shown");
      setTimeout(() => { toast.hidden = true; }, 350);
    }, 1600);
  };

  /* ── rendering ───────────────────────────────────────────── */
  const renderSidebar = (activeId) => {
    if (!VIDEOS.length) {
      sidebar.innerHTML = "";
      if (sidebarEmpty) sidebarEmpty.hidden = false;
      return;
    }
    if (sidebarEmpty) sidebarEmpty.hidden = true;

    sidebar.innerHTML = VIDEOS.map((v) => {
      const isActive = v.id === activeId;
      return `
        <li role="presentation">
          <button
            type="button"
            class="video-tab ${isActive ? "is-active" : ""}"
            role="tab"
            aria-selected="${isActive}"
            data-video-id="${escapeHtml(v.id)}"
          >
            <span class="video-tab-thumb">
              <img
                src="${escapeHtml(thumbUrl(v, "small"))}"
                alt=""
                loading="lazy"
                onerror="this.style.opacity=0.3"
              />
            </span>
            <span class="video-tab-meta">
              <span class="video-tab-title">${escapeHtml(pick(v.title))}</span>
              <span class="video-tab-date">${escapeHtml(formatDate(v.publishedAt))}</span>
            </span>
          </button>
        </li>
      `;
    }).join("");
  };

  const renderSection = (section) => {
    const heading = escapeHtml(pick(section.heading));
    const items = Array.isArray(section.items) ? section.items : [];
    if (!items.length) return "";

    let inner = "";
    let icon = "fa-bookmark";

    if (section.type === "prompts") {
      icon = "fa-wand-magic-sparkles";
      inner = items.map((p, i) => `
        <article class="prompt-card">
          <header class="prompt-card-head">
            <h4 class="prompt-card-title">${escapeHtml(pick(p.title))}</h4>
            <button
              type="button"
              class="copy-btn"
              data-copy-target="prompt-${i}"
              aria-label="${escapeHtml(t("resources_copy", "Kopieren"))}"
            >
              <i class="fas fa-copy" aria-hidden="true"></i>
              <span>${escapeHtml(t("resources_copy", "Kopieren"))}</span>
            </button>
          </header>
          <pre id="prompt-${i}">${escapeHtml(pick(p.content))}</pre>
        </article>
      `).join("");
    } else if (section.type === "links") {
      icon = "fa-link";
      const cards = items.map((l) => {
        const host = hostFromUrl(l.url);
        return `
          <a class="link-card" href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">
            <span class="link-card-icon"><i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></span>
            <span class="link-card-body">
              <span class="link-card-label">${escapeHtml(pick(l.label))}</span>
              ${host ? `<span class="link-card-host">${escapeHtml(host)}</span>` : ""}
              ${l.description ? `<span class="link-card-desc">${escapeHtml(pick(l.description))}</span>` : ""}
            </span>
          </a>
        `;
      }).join("");
      inner = `<div class="link-grid">${cards}</div>`;
    } else if (section.type === "text") {
      icon = "fa-circle-info";
      inner = items.map((it) => `<div class="resource-text">${pick(it.html)}</div>`).join("");
    } else {
      // Unknown type — render labels safely as a list
      icon = "fa-bookmark";
      inner = `<ul>${items.map((it) => `<li>${escapeHtml(JSON.stringify(it))}</li>`).join("")}</ul>`;
    }

    return `
      <section class="resource-section">
        <h3 class="resource-section-heading">
          <i class="fas ${icon}" aria-hidden="true"></i>
          ${heading}
        </h3>
        ${inner}
      </section>
    `;
  };

  const renderEmpty = () => {
    content.innerHTML = `
      <div class="resource-empty-state">
        <i class="fas fa-circle-play" aria-hidden="true"></i>
        <p>${escapeHtml(t("resources_no_video", "Wähle links ein Video, um die Ressourcen zu sehen."))}</p>
      </div>
    `;
  };

  const renderVideo = (video) => {
    if (!video) {
      renderEmpty();
      return;
    }

    const title = pick(video.title);
    const desc  = pick(video.description);
    const sections = (video.sections || []).map(renderSection).join("");

    content.innerHTML = `
      <article class="resource-video" data-video-id="${escapeHtml(video.id)}">
        <div class="video-player" data-yt-id="${escapeHtml(video.id)}" tabindex="0" role="button" aria-label="${escapeHtml(t("resources_play", "Video abspielen"))}">
          <img
            src="${escapeHtml(thumbUrl(video, "hq"))}"
            alt=""
            loading="lazy"
            onerror="this.src='${ytThumb(video.id)}'"
          />
          <button type="button" class="video-player-play" aria-label="${escapeHtml(t("resources_play", "Video abspielen"))}">
            <i class="fas fa-play" aria-hidden="true"></i>
          </button>
        </div>

        <header class="video-header">
          <div>
            <h2>${escapeHtml(title)}</h2>
            <div class="video-header-meta">
              ${video.publishedAt ? `<span><i class="far fa-calendar" aria-hidden="true"></i> ${escapeHtml(formatDate(video.publishedAt))}</span>` : ""}
            </div>
          </div>
          <div class="video-header-actions">
            <a class="btn-yt" href="${ytWatch(video.id)}" target="_blank" rel="noopener noreferrer">
              <i class="fab fa-youtube" aria-hidden="true"></i>
              <span>${escapeHtml(t("resources_open_yt", "Auf YouTube ansehen"))}</span>
            </a>
            <button type="button" class="btn-share" data-share-id="${escapeHtml(video.id)}">
              <i class="fas fa-link" aria-hidden="true"></i>
              <span>${escapeHtml(t("resources_share", "Link kopieren"))}</span>
            </button>
          </div>
        </header>

        ${desc ? `<p class="video-description">${escapeHtml(desc)}</p>` : ""}

        ${sections}
      </article>
    `;
  };

  /* ── interactions ────────────────────────────────────────── */
  const findVideo = (id) => VIDEOS.find((v) => v.id === id);

  const setActive = (id, { scroll = false, updateHash = true } = {}) => {
    const video = findVideo(id) || VIDEOS[0];
    if (!video) {
      renderEmpty();
      return;
    }
    renderSidebar(video.id);
    renderVideo(video);

    if (updateHash) {
      const newHash = "#" + video.id;
      if (location.hash !== newHash) {
        history.replaceState(null, "", newHash);
      }
    }

    if (scroll) {
      content.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Click on a sidebar tab
  sidebar.addEventListener("click", (e) => {
    const btn = e.target.closest(".video-tab");
    if (!btn) return;
    const id = btn.dataset.videoId;
    if (!id) return;
    setActive(id);
  });

  // Click handlers inside the content area (delegated)
  content.addEventListener("click", async (e) => {
    // Play YouTube video (facade → iframe)
    const player = e.target.closest(".video-player");
    if (player && !player.querySelector("iframe")) {
      const id = player.dataset.ytId;
      if (id) {
        player.innerHTML = `<iframe
          src="${ytEmbed(id)}"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>`;
      }
      return;
    }

    // Copy a prompt
    const copyBtn = e.target.closest(".copy-btn");
    if (copyBtn) {
      const targetId = copyBtn.dataset.copyTarget;
      const target = targetId && document.getElementById(targetId);
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent);
        copyBtn.classList.add("is-copied");
        const span = copyBtn.querySelector("span");
        const original = span ? span.textContent : "";
        if (span) span.textContent = t("resources_copied", "Kopiert!");
        showToast(t("resources_copied", "Kopiert!"));
        setTimeout(() => {
          copyBtn.classList.remove("is-copied");
          if (span) span.textContent = original;
        }, 1600);
      } catch {
        showToast(t("resources_copy_failed", "Kopieren fehlgeschlagen"));
      }
      return;
    }

    // Share / copy link to this video's resources
    const shareBtn = e.target.closest(".btn-share");
    if (shareBtn) {
      const id = shareBtn.dataset.shareId;
      const url = `${location.origin}${location.pathname}#${id}`;
      try {
        await navigator.clipboard.writeText(url);
        showToast(t("resources_link_copied", "Link kopiert!"));
      } catch {
        showToast(t("resources_copy_failed", "Kopieren fehlgeschlagen"));
      }
    }
  });

  // Keyboard support for the player facade
  content.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const player = e.target.closest(".video-player");
    if (!player) return;
    e.preventDefault();
    player.click();
  });

  // Hash → video on load
  const initialId = (location.hash || "").replace(/^#/, "");
  if (VIDEOS.length) {
    setActive(initialId || VIDEOS[0].id, { updateHash: !!initialId });
  } else {
    renderSidebar(null);
    renderEmpty();
  }

  // React to back/forward navigation
  window.addEventListener("hashchange", () => {
    const id = (location.hash || "").replace(/^#/, "");
    if (id) setActive(id, { updateHash: false });
  });

  // Re-render when language changes (translations.js triggers this
  // via the lang-btn click handler in script.js, which mutates
  // document.documentElement.lang). We watch for that.
  const langObserver = new MutationObserver(() => {
    const id = (location.hash || "").replace(/^#/, "") || (VIDEOS[0] && VIDEOS[0].id);
    if (id) setActive(id, { updateHash: false });
  });
  langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
