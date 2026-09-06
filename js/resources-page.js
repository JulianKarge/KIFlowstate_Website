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

  // This is a regular selection list, not a full ARIA tabs widget. Keeping
  // native list + button semantics avoids promising unsupported tab behavior.
  sidebar.removeAttribute("role");
  sidebar.removeAttribute("aria-orientation");

  /* ── helpers ─────────────────────────────────────────────── */
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
    if (iso === "coming-soon") return t("resources_coming_soon", "Kommt bald");
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

  const isLikelyYouTubeId = (id) =>
    typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id);

  const videoYouTubeId = (video) => {
    if (!video) return "";
    if (isLikelyYouTubeId(video.youtubeId)) return video.youtubeId;
    return isLikelyYouTubeId(video.id) ? video.id : "";
  };

  // Returns the URL for a video's thumbnail. Honors a per-video override
  // (`thumbnailUrl`) if set in videos.js — falls back to YouTube otherwise.
  // `size` is "hq" (player) or "small" (sidebar).
  const thumbUrl = (video, size) => {
    if (video && video.thumbnailUrl) return video.thumbnailUrl;
    const id = videoYouTubeId(video);
    if (!id) return "";
    return size === "hq" ? ytThumbHQ(id) : ytThumb(id);
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
  const searchInput = document.getElementById("video-search");
  const searchStatus = document.getElementById("video-search-status");
  const filterVideos = () => {
    const query = (searchInput?.value || "").trim().toLocaleLowerCase();
    let count = 0;
    sidebar.querySelectorAll("li").forEach((item) => {
      const video = findVideo(item.querySelector("button").dataset.videoId);
      const matches = `${pick(video.title)} ${pick(video.description)}`.toLocaleLowerCase().includes(query);
      item.hidden = !matches;
      if (matches) count++;
    });
    if (searchInput) searchInput.placeholder = t("resources_search", "Videos durchsuchen");
    if (searchStatus) searchStatus.textContent = count
      ? `${count} ${t("resources_search_results", "Videos")}`
      : t("resources_search_empty", "Kein Treffer. Probiere einen anderen Suchbegriff.");
  };

  const renderSidebar = (activeId) => {
    if (!VIDEOS.length) {
      sidebar.innerHTML = "";
      if (sidebarEmpty) sidebarEmpty.hidden = false;
      return;
    }
    if (sidebarEmpty) sidebarEmpty.hidden = true;

    sidebar.innerHTML = VIDEOS.map((v) => {
      const isActive = v.id === activeId;
      const thumb = thumbUrl(v, "small");
      return `
        <li>
          <button
            type="button"
            class="video-tab ${isActive ? "is-active" : ""}"
            aria-pressed="${isActive}"
            data-video-id="${escapeHtml(v.id)}"
          >
            <span class="video-tab-thumb">
              ${thumb
                ? `<img
                    src="${escapeHtml(thumb)}"
                    alt=""
                    loading="lazy"
                    onerror="this.style.opacity=0.3"
                  />`
                : `<span class="video-tab-thumb-placeholder" aria-hidden="true"><i class="fas fa-video"></i></span>`}
            </span>
            <span class="video-tab-meta">
              <span class="video-tab-title">${escapeHtml(pick(v.title))}</span>
              <span class="video-tab-date">${escapeHtml(formatDate(v.publishedAt))}</span>
            </span>
          </button>
        </li>
      `;
    }).join("");
    filterVideos();
  };

  const renderSection = (section, sectionIndex = 0) => {
    const heading = escapeHtml(pick(section.heading));
    const items = Array.isArray(section.items) ? section.items : [];
    if (!items.length) return "";

    let inner = "";
    let icon = "fa-bookmark";

    if (section.type === "prompts") {
      icon = "fa-wand-magic-sparkles";
      inner = items.map((p, i) => {
        const promptId = `prompt-${sectionIndex}-${i}`;
        return `
        <article class="prompt-card">
          <header class="prompt-card-head">
            <h4 class="prompt-card-title">${escapeHtml(pick(p.title))}</h4>
            <button
              type="button"
              class="copy-btn"
              data-copy-target="${promptId}"
              aria-label="${escapeHtml(t("resources_copy", "Kopieren"))}"
            >
              <i class="fas fa-copy" aria-hidden="true"></i>
              <span>${escapeHtml(t("resources_copy", "Kopieren"))}</span>
            </button>
          </header>
          <div class="prompt-pre-wrap">
            <pre id="${promptId}">${escapeHtml(pick(p.content))}</pre>
            <div class="prompt-fade" aria-hidden="true"></div>
          </div>
          <button
            type="button"
            class="prompt-expand"
            aria-expanded="false"
            aria-controls="${promptId}"
          >
            <span data-expand-label>${escapeHtml(t("resources_show_more", "Mehr anzeigen"))}</span>
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
          </button>
        </article>
      `;
      }).join("");
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
    } else if (section.type === "sources") {
      // Collapsible source cards. Each item carries the four fields we want to
      // keep per source (ref / publisher / published / usedFor) so a claim in a
      // video can later be linked straight to the source that backs it.
      icon = "fa-book-open";
      const field = (label, value) =>
        value
          ? `<div class="source-field">
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(value)}</dd>
            </div>`
          : "";

      const cards = items.map((s) => {
        const ref       = pick(s.ref);
        const title     = pick(s.title);
        const publisher = pick(s.publisher);
        const published = pick(s.published);
        const usedFor   = pick(s.usedFor);
        const desc      = pick(s.description);
        const access    = pick(s.access);
        const note      = pick(s.note);
        const host      = hostFromUrl(s.url);
        const metaLine  = [publisher, published].filter(Boolean).join(" · ");

        return `
          <details class="source-card"${ref ? ` data-source-ref="${escapeHtml(ref)}"` : ""}>
            <summary title="${escapeHtml(t("resources_source_expand", "Details ein- oder ausklappen"))}">
              ${ref ? `<span class="source-ref">${escapeHtml(ref)}</span>` : ""}
              <span class="source-head">
                <span class="source-title">${escapeHtml(title)}</span>
                ${metaLine ? `<span class="source-meta-line">${escapeHtml(metaLine)}</span>` : ""}
              </span>
              <i class="fas fa-chevron-down source-chevron" aria-hidden="true"></i>
            </summary>
            <div class="source-body">
              ${desc ? `<p class="source-desc">${escapeHtml(desc)}</p>` : ""}
              ${note
                ? `<p class="source-note">
                    <strong>${escapeHtml(t("resources_source_note", "Einordnung"))}:</strong>
                    ${escapeHtml(note)}
                  </p>`
                : ""}
              <dl class="source-fields">
                ${field(t("resources_source_publisher", "Herausgeber"), publisher)}
                ${field(t("resources_source_published", "Veröffentlicht"), published)}
                ${field(t("resources_source_used_for", "Verwendet für"), usedFor)}
                ${field(t("resources_source_access", "So kommst du ran"), access)}
              </dl>
              ${s.url
                ? `<a class="source-link" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
                    <span>${escapeHtml(t("resources_source_open", "Quelle öffnen"))}</span>
                    ${host ? `<span class="source-link-host">${escapeHtml(host)}</span>` : ""}
                  </a>`
                : ""}
            </div>
          </details>
        `;
      }).join("");
      inner = `<div class="source-list">${cards}</div>`;
    } else if (section.type === "text") {
      icon = "fa-circle-info";
      inner = items.map((it) => `<div class="resource-text">${pick(it.html)}</div>`).join("");
    } else {
      // Unknown type — render labels safely as a list
      icon = "fa-bookmark";
      inner = `<ul>${items.map((it) => `<li>${escapeHtml(JSON.stringify(it))}</li>`).join("")}</ul>`;
    }

    // Optional per-section icon override (e.g. command/download cards vs. AI-prompt cards)
    if (typeof section.icon === "string" && section.icon) {
      icon = section.icon;
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

  // A video can bundle several of its sections into one collapsible "route"
  // card, so a walkthrough with multiple alternative paths stays navigable:
  // the reader picks a route first, then unfolds only that one.
  //
  //   video.groups   = [{ id, title, subtitle?, icon?, tags?, open? }, …]
  //   section.group  = "<group id>"
  //
  // Sections without a `group` render inline, exactly as before.
  const renderGroup = (group, index, body) => {
    const subtitle = pick(group.subtitle);
    const tags = Array.isArray(group.tags)
      ? group.tags
          .map((tag) => `<span class="route-tag">${escapeHtml(pick(tag))}</span>`)
          .join("")
      : "";

    return `
      <details class="route-card" name="video-routes" data-route="${escapeHtml(group.id)}"${group.open ? " open" : ""}>
        <summary>
          <span class="route-index" aria-hidden="true">${index}</span>
          ${group.icon
            ? `<span class="route-icon" aria-hidden="true"><i class="fas ${escapeHtml(group.icon)}"></i></span>`
            : ""}
          <span class="route-head">
            <span class="route-title">${escapeHtml(pick(group.title))}</span>
            ${subtitle ? `<span class="route-sub">${escapeHtml(subtitle)}</span>` : ""}
            ${tags ? `<span class="route-tags">${tags}</span>` : ""}
          </span>
          <span class="route-action"><span class="route-action-closed">${escapeHtml(t("resources_route_open", "Anleitung öffnen"))}</span><span class="route-action-open">${escapeHtml(t("resources_route_close", "Schließen"))}</span><i class="fas fa-chevron-down route-chevron" aria-hidden="true"></i></span>
        </summary>
        <div class="route-body">${body}</div>
      </details>
    `;
  };

  const renderSections = (video) => {
    const sections = Array.isArray(video.sections) ? video.sections : [];
    const groups = Array.isArray(video.groups) ? video.groups : [];
    if (!groups.length) return sections.map(renderSection).join("");

    const byId = new Map(groups.map((g) => [g.id, g]));
    const emitted = new Set();

    return sections.map((section, i) => {
      const gid = section.group;
      if (!gid || !byId.has(gid)) return renderSection(section, i);
      if (emitted.has(gid)) return "";      // already rendered with its group
      emitted.add(gid);

      const group = byId.get(gid);
      // Keep the original index so prompt-card ids stay unique across groups.
      const body = sections
        .map((s, j) => (s.group === gid ? renderSection(s, j) : ""))
        .join("");
      return renderGroup(group, groups.findIndex((g) => g.id === gid) + 1, body);
    }).join("");
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
    const sections = renderSections(video);
    const ytId = videoYouTubeId(video);
    const heroThumb = thumbUrl(video, "hq");

    content.innerHTML = `
      <article class="resource-video" data-video-id="${escapeHtml(video.id)}">
        <div class="video-overview">
        ${ytId
          ? `<div class="video-player" data-yt-id="${escapeHtml(ytId)}">
              <img
                src="${escapeHtml(heroThumb)}"
                alt=""
                loading="lazy"
                onerror="this.onerror=null;this.src='${ytThumb(ytId)}'"
              />
              <button type="button" class="video-player-play" aria-label="${escapeHtml(t("resources_play", "Video abspielen"))}">
                <i class="fas fa-play" aria-hidden="true"></i>
              </button>
            </div>`
          : heroThumb
            ? `<div class="video-player video-player-draft">
                <img
                  src="${escapeHtml(heroThumb)}"
                  alt=""
                  loading="lazy"
                />
              </div>`
          : `<div class="video-player video-player-placeholder" aria-label="${escapeHtml(t("resources_coming_soon", "Kommt bald"))}">
              <span class="video-player-placeholder-icon" aria-hidden="true">
                <i class="fas fa-video"></i>
              </span>
              <span>${escapeHtml(t("resources_coming_soon", "Kommt bald"))}</span>
            </div>`}

        <header class="video-header">
          <div>
            <h2>${escapeHtml(title)}</h2>
            <div class="video-header-meta">
              ${video.publishedAt ? `<span><i class="far fa-calendar" aria-hidden="true"></i> ${escapeHtml(formatDate(video.publishedAt))}</span>` : ""}
            </div>
          </div>
          <div class="video-header-actions">
            ${ytId
              ? `<a class="btn-yt" href="${ytWatch(ytId)}" target="_blank" rel="noopener noreferrer">
                  <i class="fab fa-youtube" aria-hidden="true"></i>
                  <span>${escapeHtml(t("resources_open_yt", "Auf YouTube ansehen"))}</span>
                </a>`
              : ""}
            <button type="button" class="btn-share" data-share-id="${escapeHtml(video.id)}">
              <i class="fas fa-link" aria-hidden="true"></i>
              <span>${escapeHtml(t("resources_share", "Link kopieren"))}</span>
            </button>
          </div>
        </header>
        </div>

        ${desc ? `<p class="video-description">${escapeHtml(desc)}</p>` : ""}

        ${video.groups?.length ? `<nav class="resource-jump" aria-label="${escapeHtml(t("resources_routes", "Direkt zur Anleitung"))}">
          ${video.groups.map((g) => `<button type="button" data-open-route="${escapeHtml(g.id)}"><i class="fas ${escapeHtml(g.icon || "fa-book")}" aria-hidden="true"></i>${escapeHtml(pick(g.shortTitle || g.title))}<i class="fas fa-arrow-down" aria-hidden="true"></i></button>`).join("")}
        </nav>` : ""}

        ${sections}
      </article>
    `;
  };

  /* ── interactions ────────────────────────────────────────── */
  const findVideo = (id) => VIDEOS.find((v) => v.id === id || v.youtubeId === id || v.aliases?.includes(id));

  searchInput?.addEventListener("input", filterVideos);

  // Closed details have no measurable prompt height. Measure after opening.
  content.addEventListener("toggle", (event) => {
    if (event.target.matches(".route-card") && event.target.open) {
      content.querySelectorAll(".route-card[open]").forEach((card) => {
        if (card !== event.target) card.open = false;
      });
      requestAnimationFrame(refreshPromptCollapsibility);
    }
  }, true);

  const restoreSidebarFocus = (id) => {
    const next = Array.from(sidebar.querySelectorAll(".video-tab"))
      .find((button) => button.dataset.videoId === id);
    if (next) next.focus({ preventScroll: true });
  };

  // Mark prompts that are tall enough to be worth collapsing on mobile.
  // The CSS only collapses cards with `.is-collapsible` (and only at mobile
  // widths), so short prompts never get a fade or "Mehr anzeigen" button.
  const refreshPromptCollapsibility = () => {
    const cards = content.querySelectorAll(".prompt-card");
    if (!cards.length) return;
    const COLLAPSED_MAX = 320; // keep in sync with CSS max-height on mobile
    cards.forEach((card) => {
      const pre = card.querySelector("pre");
      if (!pre) return;
      // Measure the natural (uncapped) height by toggling off any cap.
      const wasCollapsible = card.classList.contains("is-collapsible");
      const wasExpanded = card.classList.contains("is-expanded");
      card.classList.remove("is-collapsible");
      const naturalHeight = pre.scrollHeight;
      if (naturalHeight > COLLAPSED_MAX + 8) {
        card.classList.add("is-collapsible");
        if (wasCollapsible && wasExpanded) card.classList.add("is-expanded");
      } else {
        card.classList.remove("is-expanded");
      }
    });
  };

  const setActive = (id, { scroll = false, updateHash = true } = {}) => {
    const video = findVideo(id) || VIDEOS[0];
    if (!video) {
      renderEmpty();
      return;
    }
    const restoreFocus = sidebar.contains(document.activeElement);
    renderSidebar(video.id);
    if (restoreFocus) restoreSidebarFocus(video.id);
    renderVideo(video);
    // Wait one frame so layout has settled before measuring.
    requestAnimationFrame(refreshPromptCollapsibility);

    if (updateHash) {
      const newHash = "#" + video.id;
      if (location.hash !== newHash) {
        history.replaceState(null, "", newHash);
      }
    }

    if (scroll) {
      content.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start"
      });
    }
  };

  // Re-measure on resize (e.g. orientation change) — debounced.
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refreshPromptCollapsibility, 150);
  });

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
    const routeButton = e.target.closest("[data-open-route]");
    if (routeButton) {
      const card = Array.from(content.querySelectorAll(".route-card"))
        .find((el) => el.dataset.route === routeButton.dataset.openRoute);
      if (card) {
        content.querySelectorAll(".route-card[open]").forEach((other) => { other.open = false; });
        card.open = true;
        card.querySelector("summary").focus({ preventScroll: true });
        card.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
      }
      return;
    }
    // Play YouTube video (facade → iframe)
    const player = e.target.closest(".video-player");
    if (player && !player.querySelector("iframe")) {
      const id = player.dataset.ytId;
      if (id) {
        player.closest(".video-overview")?.classList.add("is-playing");
        const videoId = player.closest("[data-video-id]")?.dataset.videoId;
        const video = videoId ? findVideo(videoId) : null;
        const frameTitle = video
          ? pick(video.title)
          : t("resources_play", "Video abspielen");
        player.innerHTML = `<iframe
          src="${ytEmbed(id)}"
          title="${escapeHtml(frameTitle)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>`;
      }
      return;
    }

    // Expand / collapse a long prompt (mobile only — desktop hides the button)
    const expandBtn = e.target.closest(".prompt-expand");
    if (expandBtn) {
      const card = expandBtn.closest(".prompt-card");
      if (!card) return;
      const nowExpanded = !card.classList.contains("is-expanded");
      card.classList.toggle("is-expanded", nowExpanded);
      expandBtn.setAttribute("aria-expanded", nowExpanded ? "true" : "false");
      const label = expandBtn.querySelector("[data-expand-label]");
      if (label) {
        label.textContent = nowExpanded
          ? t("resources_show_less", "Weniger anzeigen")
          : t("resources_show_more", "Mehr anzeigen");
      }
      const icon = expandBtn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-chevron-down", !nowExpanded);
        icon.classList.toggle("fa-chevron-up", nowExpanded);
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
