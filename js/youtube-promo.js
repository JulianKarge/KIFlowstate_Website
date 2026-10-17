/* Native scrolling only: approach, flip, then hold. No animation loop at rest. */
(() => {
  "use strict";
  const section = document.querySelector(".youtube-promo");
  if (!section) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const roomForMotion = matchMedia("(min-height: 700px) and (min-width: 350px)");
  const card = section.querySelector(".youtube-promo-card");
  const front = section.querySelector(".youtube-promo-front");
  const back = section.querySelector(".youtube-promo-back");
  let latestVideo = null;

  function updateFeaturedVideo() {
    if (!latestVideo) return;
    const lang = document.documentElement.lang || "de";
    const title = typeof latestVideo.title === "string" ? latestVideo.title
      : latestVideo.title?.[lang] || latestVideo.title?.de || latestVideo.title?.en || "KIFlowstate";
    const label = typeof translations !== "undefined" && translations[lang]?.youtube_featured_aria;
    section.querySelector("[data-youtube-video-title]").textContent = title;
    front.setAttribute("aria-label", (label || "Video und Ressourcen: {title}").replace("{title}", title));
    front.href = `resources.html?play=1#${encodeURIComponent(latestVideo.id)}`;
    section.dataset.featuredVideo = latestVideo.id;
  }

  function selectLatestVideo(catalog) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const youTubeId = video => /^[A-Za-z0-9_-]{11}$/.test(video.youtubeId || "") ? video.youtubeId
      : /^[A-Za-z0-9_-]{11}$/.test(video.id || "") ? video.id : "";
    latestVideo = catalog.filter(video => youTubeId(video) && !video.draft && video.published !== false
      && !["draft", "coming-soon"].includes(video.status)
      && Number.isFinite(Date.parse(video.publishedAt)) && Date.parse(video.publishedAt) <= today.getTime())
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
    if (!latestVideo) return;
    const image = section.querySelector(".youtube-promo-video > img");
    image.src = latestVideo.promoThumbnailUrl || latestVideo.thumbnailUrl
      || `https://i.ytimg.com/vi/${youTubeId(latestVideo)}/hqdefault.jpg`;
    updateFeaturedVideo();
  }

  function loadVideoCatalog() {
    if (typeof VIDEOS !== "undefined") { selectLatestVideo(VIDEOS); return; }
    // Use the resources' own catalog, loaded only near this section. A fresh
    // cache key picks up new entries without another homepage edit or build.
    const script = document.createElement("script");
    const url = new URL("js/videos.js", document.baseURI);
    url.searchParams.set("v", Math.floor(Date.now() / 60000));
    script.src = url.href;
    script.onload = () => { if (typeof VIDEOS !== "undefined") selectLatestVideo(VIDEOS); };
    // The approved static cover and working resource link remain on failure.
    document.head.append(script);
  }

  if (typeof IntersectionObserver !== "undefined") {
    const catalogObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        catalogObserver.disconnect();
        loadVideoCatalog();
      }
    }, { rootMargin: "800px 0px" });
    catalogObserver.observe(section);
  } else loadVideoCatalog();
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const mix = (from, to, amount) => from + (to - from) * amount;
  let enabled = false;
  let active = false;
  let frame = 0;
  let focused = false;

  function render() {
    frame = 0;
    if (!enabled) return;
    const rect = section.getBoundingClientRect();
    const viewport = section.querySelector(".youtube-promo-sticky").offsetHeight;
    const progress = focused ? 1 : clamp((66 - rect.top) / Math.max(1, rect.height - viewport));
    const approach = ease(progress / .43);
    const flip = ease((progress - .40) / .34);
    const scatter = ease((progress - .18) / .48);
    const style = section.style;
    style.setProperty("--yt-progress", progress.toFixed(4));
    style.setProperty("--yt-card-y", `${mix(20, 0, approach).toFixed(2)}px`);
    style.setProperty("--yt-card-z", `${(mix(-180, 42, approach) * (1 - ease((progress - .67) / .07))).toFixed(2)}px`);
    style.setProperty("--yt-card-rx", `${mix(9, 0, approach).toFixed(2)}deg`);
    style.setProperty("--yt-card-ry", `${(mix(-16, 0, approach) - 180 * flip).toFixed(2)}deg`);
    style.setProperty("--yt-card-rz", `${mix(-4, 0, approach).toFixed(2)}deg`);
    style.setProperty("--yt-left-x", `${mix(-70, -180, scatter).toFixed(2)}px`);
    style.setProperty("--yt-right-x", `${mix(70, 180, scatter).toFixed(2)}px`);
    style.setProperty("--yt-side-y", `${mix(0, 38, scatter).toFixed(2)}px`);
    style.setProperty("--yt-satellite-opacity", (1 - scatter * .86).toFixed(3));
    style.setProperty("--yt-hint-opacity", (1 - ease((progress - .15) / .25)).toFixed(3));
    section.dataset.youtubePhase = flip === 1 ? "resources" : flip > 0 ? "flip" : "videos";
    front.tabIndex = flip >= .5 ? -1 : 0;
    front.setAttribute("aria-hidden", String(flip >= .5));
  }

  function requestRender() {
    if (enabled && active && !frame) frame = requestAnimationFrame(render);
  }

  function configure() {
    enabled = !reducedMotion.matches && roomForMotion.matches && typeof IntersectionObserver !== "undefined";
    section.classList.toggle("is-animated", enabled);
    if (enabled) render();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
      section.dataset.youtubePhase = "static";
      front.removeAttribute("tabindex");
      front.removeAttribute("aria-hidden");
    }
  }

  if (typeof IntersectionObserver !== "undefined") {
    const observer = new IntersectionObserver(entries => {
      active = entries[0].isIntersecting;
      section.classList.toggle("is-active", active);
      requestRender();
    }, { rootMargin: "120px 0px" });
    observer.observe(section);
  }

  // A keyboard user reaches the actual links immediately, at any scroll phase.
  card.addEventListener("focusin", event => { focused = back.contains(event.target); if (enabled) render(); });
  card.addEventListener("focusout", event => {
    if (!card.contains(event.relatedTarget)) { focused = false; requestRender(); }
  });
  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", configure, { passive: true });
  window.addEventListener("pageshow", configure);
  reducedMotion.addEventListener("change", configure);
  roomForMotion.addEventListener("change", configure);
  document.addEventListener("kif:languagechange", () => { updateFeaturedVideo(); requestRender(); });
  configure();
})();
