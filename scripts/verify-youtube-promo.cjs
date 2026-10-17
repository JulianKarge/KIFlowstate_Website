// Run: node scripts/verify-youtube-promo.cjs
// Player requests are intercepted; this checks navigation and autoplay intent,
// not YouTube's network availability or browser-specific media permissions.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createStaticServer, loadPlaywright } = require("./verify-invoice-showcase-video.cjs");

const data = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../js/videos.js"), "utf8") + "; this.catalog = VIDEOS;", data);
// The catalog contract lists new releases first. The fixture below separately
// checks that the homepage also handles entries whose dates are out of order.
const latest = data.catalog.find(video => /^[A-Za-z0-9_-]{11}$/.test(video.youtubeId || video.id)
  && !video.draft && video.published !== false && !["draft", "coming-soon"].includes(video.status)
  && Number.isFinite(Date.parse(video.publishedAt)) && Date.parse(video.publishedAt) <= Date.now());
const latestYouTubeId = latest.youtubeId || latest.id;
const checks = [];
const check = name => { checks.push(name); console.log("PASS " + name); };

async function contextFor(browser, viewport) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(() => localStorage.setItem("kif_cookie_consent", JSON.stringify({ value: "essential" })));
  await context.route("https://www.youtube-nocookie.com/**", route => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Player test</title>" }));
  await context.route("https://gc.zgo.at/**", route => route.fulfill({ contentType: "text/javascript", body: "" }));
  return context;
}

async function reveal(page) {
  await page.locator("#youtube").evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 66));
  await page.waitForFunction(() => Boolean(document.querySelector("#youtube").dataset.featuredVideo));
}

async function navigation(browser, origin, name, viewport) {
  const context = await contextFor(browser, viewport);
  try {
    const page = await context.newPage();
    const errors = [];
    let catalogRequests = 0;
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (request.url().includes("/js/videos.js")) catalogRequests++; });
    await page.goto(origin, { waitUntil: "networkidle" });
    assert.equal(catalogRequests, 0, "Catalog must not compete with the hero");
    await reveal(page);
    assert.equal(await page.locator("#youtube").getAttribute("data-featured-video"), latest.id);
    assert.equal(await page.locator("[data-youtube-video-title]").textContent(), typeof latest.title === "string" ? latest.title : latest.title.de);
    assert.match(await page.locator(".youtube-promo-video-tag").textContent(), /Neu/);
    assert.equal(await page.locator(".youtube-promo-video > img").getAttribute("src"), latest.promoThumbnailUrl || latest.thumbnailUrl || `https://i.ytimg.com/vi/${latestYouTubeId}/hqdefault.jpg`);
    assert.equal(await page.locator(".youtube-promo-front").getAttribute("href"), "resources.html?play=1#" + latest.id);
    await page.locator(".youtube-promo-play").click();
    await page.waitForURL(origin + "resources.html#" + latest.id);
    const frame = page.locator(".video-player iframe");
    await frame.waitFor();
    await page.waitForTimeout(150);
    const url = new URL(await frame.getAttribute("src"));
    assert.equal(url.pathname, "/embed/" + latestYouTubeId);
    assert.equal(url.searchParams.get("autoplay"), "1");
    assert.equal(url.searchParams.get("playsinline"), "1");
    assert.match(await frame.getAttribute("allow"), /autoplay/);
    assert.equal(await page.locator(".video-tab.is-active").getAttribute("data-video-id"), latest.id);
    const playerTop = await page.locator(".video-player").evaluate(el => el.getBoundingClientRect().top);
    assert(playerTop >= 66 && playerTop < viewport.height - 100, "Player is visible below the navbar");
    assert.equal(new URL(page.url()).searchParams.has("play"), false);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await frame.count(), 0, "A consumed play request must not replay on refresh");
    await page.locator(".video-player-play").click();
    assert.equal(await frame.count(), 1, "Normal click-to-play still works");
    await page.locator('.video-tab[data-video-id="8j_BGdhi5w0"]').click();
    assert.equal(await frame.count(), 0, "Selecting another video does not autoplay");
    await page.goto(origin + "resources.html?play=1#typesafe-jev", { waitUntil: "networkidle" });
    assert.equal(await frame.count(), 1, "Resource aliases support the explicit play request");
    await page.goto(origin + "resources.html?play=1#missing-video", { waitUntil: "networkidle" });
    assert.equal(await frame.count(), 0, "An invalid link must not start an unrelated video");
    assert.deepEqual(errors, []);
    check(name + ": latest cover, direct play, refresh, aliases and normal selection");
  } finally { await context.close(); }
}

async function catalogSelection(browser, origin) {
  const context = await contextFor(browser, { width: 1440, height: 900 });
  try {
    const catalog = [
      { id: "older", youtubeId: "aaaaaaaaaaa", publishedAt: "2025-01-01", title: "Older" },
      { id: "draft", youtubeId: "bbbbbbbbbbb", publishedAt: "2026-10-17", status: "draft", title: "Draft" },
      { id: "future", youtubeId: "ccccccccccc", publishedAt: "2999-01-01", title: "Future" },
      { id: "not-published", youtubeId: "ddddddddddd", publishedAt: "2026-10-17", published: false, title: "Unpublished" },
      { id: "no-video", publishedAt: "2026-10-17", title: "Resources only" },
      { id: "newest", youtubeId: "eeeeeeeeeee", publishedAt: "2026-10-16", title: { de: "Neuestes veröffentlichtes Video", en: "Newest published video" }, thumbnailUrl: "images/jev-thumbnail.jpg" }
    ];
    await context.route("**/js/videos.js?*", route => route.fulfill({ contentType: "text/javascript", body: "const VIDEOS = " + JSON.stringify(catalog) + ";" }));
    const page = await context.newPage();
    await page.goto(origin, { waitUntil: "networkidle" });
    await reveal(page);
    assert.equal(await page.locator("#youtube").getAttribute("data-featured-video"), "newest");
    assert.equal(await page.locator(".youtube-promo-front").getAttribute("href"), "resources.html?play=1#newest");
    await page.locator("#lang-en").click();
    assert.equal(await page.locator("[data-youtube-video-title]").textContent(), "Newest published video");
    assert.equal(await page.locator(".youtube-promo-front").getAttribute("aria-label"), "Video and resources: Newest published video");
    check("New catalog entries update automatically; draft, future and missing videos are excluded; title translates");
  } finally { await context.close(); }
}

async function catalogFailure(browser, origin) {
  const context = await contextFor(browser, { width: 390, height: 844 });
  try {
    await context.route("**/js/videos.js?*", route => route.abort());
    const page = await context.newPage();
    await page.goto(origin + "#youtube", { waitUntil: "networkidle" });
    assert.equal(await page.locator(".youtube-promo-front").getAttribute("href"), "resources.html?play=1#jev");
    assert.match(await page.locator("[data-youtube-video-title]").textContent(), /Jev/);
    check("A failed catalog request preserves the working cover and play link");
  } finally { await context.close(); }
}

(async () => {
  const server = createStaticServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}/`;
  const playwright = loadPlaywright();
  try {
    for (const name of ["chromium", "firefox", "webkit"]) {
      const browser = await playwright[name].launch();
      try {
        await navigation(browser, origin, name + " desktop", { width: 1440, height: 900 });
        await navigation(browser, origin, name + " mobile", { width: 390, height: 844 });
        if (name === "chromium") { await catalogSelection(browser, origin); await catalogFailure(browser, origin); }
      } finally { await browser.close(); }
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
  console.log(`SUMMARY ${checks.length} passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
