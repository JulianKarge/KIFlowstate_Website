// Playwright check for the series entries and the resource gate on resources.html.
//
// Against the Firestore emulator (recommended, exercises the real rules):
//   firebase emulators:exec --only firestore --project demo-kiflowstate "node scripts/verify-resource-gate.cjs"
// With a mocked Firestore write (no emulator, no Java needed):
//   node scripts/verify-resource-gate.cjs
//
// Never touches the live project: js/firebase-env.js is replaced by a demo
// config and every request to firestore.googleapis.com is blocked and counted.
// Needs gate-codes.local.json (gitignored) for the Teil-1 code.
// Screenshots: .qa/resource-gate/
const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createStaticServer, loadPlaywright } = require("./verify-invoice-showcase-video.cjs");

const { chromium } = loadPlaywright();
const SITE = path.resolve(__dirname, "..");
const QA = path.join(SITE, ".qa", "resource-gate");
const EMU = process.env.FIRESTORE_EMULATOR_HOST || "";
const PROJECT = "demo-kiflowstate";
const MODE = EMU ? `emulator ${EMU}` : "mocked write";

const gateCodes = JSON.parse(fs.readFileSync(path.join(SITE, "gate-codes.local.json"), "utf8"));
const RIGHT = gateCodes.codes["teil-1"].code;
const HASH = gateCodes.codes["teil-1"].sha256;
const WRONG = RIGHT === "ZZZZ9999" ? "YYYY8888" : "ZZZZ9999";

const checks = [];
const check = (name) => { checks.push(name); console.log("PASS " + name); };

/* ── catalog and translations ─────────────────────────────── */
const catalog = (() => {
  const ctx = {};
  vm.runInNewContext(fs.readFileSync(path.join(SITE, "js/videos.js"), "utf8") + ";this.V = VIDEOS;", ctx);
  return ctx.V;
})();
const T = (() => {
  const ctx = {};
  vm.runInNewContext(fs.readFileSync(path.join(SITE, "js/translations.js"), "utf8") + ";this.T = translations;", ctx);
  return ctx.T;
})();
const series = catalog.find((v) => v.id === "videostudio");
const isYouTubeId = (id) => typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id);

function dataChecks() {
  assert.ok(series, "series entry videostudio exists");
  assert.equal(catalog[0].id, "videostudio", "series entry is at the top of VIDEOS");
  for (const entry of catalog.filter((v) => v.series)) {
    const ids = entry.parts.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length, `${entry.id}: part ids are unique`);
    for (const part of entry.parts) {
      assert.match(part.id, /^[a-z0-9-]{1,40}$/, `${entry.id}: part id ${part.id} is URL safe`);
      assert.ok(["draft", "coming-soon", "published"].includes(part.status), `${entry.id}/${part.id}: known status`);
      if (part.status === "published") assert.ok(isYouTubeId(part.youtubeId), `${entry.id}/${part.id}: published part has a YouTube id`);
    }
    if (Number.isFinite(Date.parse(entry.publishedAt))) {
      // The homepage promo treats an 11-character id as a YouTube id. A dated
      // series entry therefore needs the real YouTube id of a published part.
      const published = entry.parts.filter((p) => p.status === "published").map((p) => p.youtubeId);
      assert.ok(isYouTubeId(entry.youtubeId) && published.includes(entry.youtubeId),
        `${entry.id}: dated series needs youtubeId of a published part (TODO(release))`);
    } else {
      assert.equal(entry.publishedAt, "coming-soon", `${entry.id}: publishedAt is a date or "coming-soon"`);
    }
    assert.match(entry.gate.id, /^[a-z0-9-]{1,40}$/);
    for (const lang of ["de", "en"]) {
      const teaser = entry.gate.teaser[lang];
      assert.ok(Array.isArray(teaser) && teaser.length >= 3 && teaser.length <= 5, `${entry.id}: 3 to 5 teaser points (${lang})`);
    }
    assert.ok(!/[–—]/.test(JSON.stringify(entry)), `${entry.id}: no en or em dashes`);
  }
  check("catalog: series entry on top, part ids, statuses, release consistency, teaser, no dashes");

  // Same selection rule as js/youtube-promo.js: the series must not become the
  // homepage promo while it has no real YouTube id.
  const promoId = (v) => isYouTubeId(v.youtubeId) ? v.youtubeId : isYouTubeId(v.id) ? v.id : "";
  const promoCandidate = promoId(series) && !series.draft && series.published !== false
    && !["draft", "coming-soon"].includes(series.status) && Number.isFinite(Date.parse(series.publishedAt));
  assert.ok(!promoCandidate || isYouTubeId(series.youtubeId), "homepage promo never sees the series id as a video id");
  check("homepage promo: series is skipped until it has a real YouTube id");

  const translationsDe = Object.keys(T.de).filter((k) => k.startsWith("gate_") || k.startsWith("resources_series_"));
  const missingEn = translationsDe.filter((k) => !T.en[k]);
  assert.deepEqual(missingEn, [], "every gate translation exists in EN");
  assert.ok(!/[–—]/.test(translationsDe.map((k) => T.de[k] + T.en[k]).join("")), "gate copy has no dashes");
  check(`translations: ${translationsDe.length} gate keys in DE and EN, no dashes`);

  // Anti-goal from the design: no code or code hash in anything that is published.
  const published = [];
  for (const dir of ["js", "css", "."]) {
    for (const name of fs.readdirSync(path.join(SITE, dir))) {
      if (/\.(js|css|html|json|example)$/.test(name) && name !== "gate-codes.local.json") published.push(path.join(dir, name));
    }
  }
  const leaks = published.filter((file) => {
    const text = fs.readFileSync(path.join(SITE, file), "utf8");
    return text.includes(RIGHT) || text.includes(HASH);
  });
  assert.deepEqual(leaks, [], "code or hash found in a published file");
  for (const file of ["firestore.rules", "gate-codes.local.json", "js/firebase-env.js", "local-feedback-viewer/server.js"]) {
    const ignored = childProcess.spawnSync("git", ["check-ignore", "-q", file], { cwd: SITE }).status === 0;
    assert.ok(ignored, `${file} must be gitignored`);
  }
  check(`no code or hash in ${published.length} published files; rules, codes, env and viewer are gitignored`);
}

/* ── browser helpers ──────────────────────────────────────── */
const blockedProductionRequests = [];
const mockWrites = [];
const pageErrors = [];
const expectedDenials = [];

const firebaseEnv = (config) =>
  `window.__KIFLOWSTATE_FIREBASE_CONFIG__ = Object.freeze(${JSON.stringify(config)});`;

const DEMO_CONFIG = {
  apiKey: "demo-api-key",
  authDomain: `${PROJECT}.firebaseapp.com`,
  projectId: PROJECT,
  appId: "1:000000000000:web:0000000000000000",
  ...(EMU ? { firestoreEmulatorHost: EMU } : {}),
};

// Mock of the two Firebase CDN modules. Mirrors the rules: the SHA-256 of the
// code must map to exactly "<pack>/<part>", consent must be true.
const MOCK_APP = `
export const initializeApp = (config) => ({ options: config });
export const getApps = () => [];
export const getApp = () => { throw new Error("no app"); };`;
const MOCK_FIRESTORE = `
const TARGETS = ${JSON.stringify({ [HASH]: "videostudio/teil-1" })};
export const getFirestore = () => ({});
export const connectFirestoreEmulator = () => {};
export const collection = (db, name) => ({ name });
export const serverTimestamp = () => ({ serverTimestamp: true });
export async function addDoc(col, data) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.code));
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const accepted = TARGETS[hex] === data.pack + "/" + data.part && data.consent === true
    && data.email === data.email.toLowerCase() && data.doubleOptIn === "pending";
  await window.__recordGateWrite({ ...data, createdAt: "serverTimestamp" }, accepted);
  if (!accepted) { const e = new Error("Missing or insufficient permissions."); e.code = "permission-denied"; throw e; }
  return { id: "mock-" + Date.now() };
}`;

async function setup(browser, { viewport, theme = "light", reducedMotion = "no-preference", config = "demo", unlocked = false } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion });
  await context.addInitScript(({ theme, unlocked }) => {
    try {
      localStorage.setItem("kif_cookie_consent", JSON.stringify({ value: "essential" }));
      if (theme === "dark") localStorage.setItem("kif_theme", "dark");
      if (unlocked) localStorage.setItem("kif_pack:videostudio", JSON.stringify({ unlockedAt: "2026-10-27T00:00:00.000Z", via: "teil-1" }));
    } catch {}
  }, { theme, unlocked });
  await context.route("https://gc.zgo.at/**", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
  await context.route("**/js/firebase-env.js", (route) => route.fulfill({
    contentType: "text/javascript",
    body: config === "empty" ? firebaseEnv({}) : firebaseEnv(DEMO_CONFIG),
  }));
  await context.route("https://firestore.googleapis.com/**", (route) => {
    blockedProductionRequests.push(route.request().url());
    return route.abort();
  });
  if (!EMU) {
    const cors = { "Access-Control-Allow-Origin": "*" };
    await context.route("https://www.gstatic.com/firebasejs/*/firebase-app.js", (route) =>
      route.fulfill({ contentType: "text/javascript", headers: cors, body: MOCK_APP }));
    await context.route("https://www.gstatic.com/firebasejs/*/firebase-firestore.js", (route) =>
      route.fulfill({ contentType: "text/javascript", headers: cors, body: MOCK_FIRESTORE }));
    await context.exposeBinding("__recordGateWrite", (_source, data, accepted) => { mockWrites.push({ data, accepted }); });
  }
  context.on("page", (page) => watch(page));
  const page = await context.newPage();
  return { context, page };
}

function watch(page) {
  page.on("pageerror", (error) => pageErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    // A rejected code is an expected permission-denied write in emulator mode.
    if (/PERMISSION_DENIED|permission-denied|insufficient permissions/i.test(text)) { expectedDenials.push(text); return; }
    pageErrors.push(`console: ${text}`);
  });
}

async function openSeries(page, origin, hash) {
  await page.goto("about:blank");
  await page.goto(`${origin}/resources.html#${hash}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".resource-video");
  await page.waitForFunction(() => !!window.KIResourceGate || !document.querySelector(".resource-gate"));
}

async function setLanguage(page, lang) {
  if (await page.evaluate(() => document.documentElement.lang) === lang) return;
  await page.evaluate((id) => document.getElementById(id).click(), `lang-${lang}`);
  await page.waitForFunction((l) => document.documentElement.lang === l, lang);
  await page.waitForSelector(".resource-video");
}

const noHorizontalScroll = (page) => page.evaluate(() => {
  const gate = document.querySelector(".resource-gate");
  return document.documentElement.scrollWidth <= innerWidth + 1
    && (!gate || gate.getBoundingClientRect().right <= innerWidth + 1);
});

const gateState = (page) => page.evaluate(() => {
  const gate = document.querySelector(".resource-gate");
  return {
    locked: !gate.querySelector(".resource-gate-locked").hidden,
    unlocked: !gate.querySelector(".resource-gate-unlocked").hidden,
    status: gate.querySelector(".resource-gate-status")?.textContent.trim() || "",
    stored: (() => { try { return localStorage.getItem("kif_pack:videostudio"); } catch { return "blocked"; } })(),
  };
});

async function submit(page) {
  await page.click(".resource-gate-submit");
}

async function waitForStatus(page, text) {
  await page.waitForFunction((t) => document.querySelector(".resource-gate-status")?.textContent.trim() === t, text, { timeout: 25000 });
}

const screenshot = (page, name) => page.screenshot({ path: path.join(QA, name), fullPage: true });

/* ── stored leads (emulator REST or mock log) ─────────────── */
const decode = (value) => {
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  return value;
};

async function storedLeads() {
  if (!EMU) return mockWrites.filter((w) => w.accepted).map((w) => w.data);
  const url = `http://${EMU}/v1/projects/${PROJECT}/databases/(default)/documents/resourceLeads?pageSize=200`;
  const response = await fetch(url, { headers: { Authorization: "Bearer owner" } });
  assert.ok(response.ok, `emulator read failed: ${response.status}`);
  const json = await response.json();
  return (json.documents || [])
    .map((doc) => Object.fromEntries(Object.entries(doc.fields).map(([k, v]) => [k, decode(v)])))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

async function clearEmulator() {
  if (!EMU) return;
  const response = await fetch(`http://${EMU}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  assert.ok(response.ok, "could not clear the emulator");
}

const plain = (html) => String(html).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/* ── scenarios ────────────────────────────────────────────── */
async function layoutMatrix(browser, origin) {
  for (const width of [360, 768, 1280]) {
    for (const theme of ["light", "dark"]) {
      for (const lang of ["de", "en"]) {
        const { context, page } = await setup(browser, { viewport: { width, height: 900 }, theme });
        await openSeries(page, origin, "videostudio");
        await setLanguage(page, lang);
        const info = await page.evaluate(() => ({
          sidebarFirst: document.querySelector(".video-tab-title")?.textContent.trim(),
          title: document.querySelector(".resource-gate-title")?.textContent.trim(),
          submit: document.querySelector(".resource-gate-submit span")?.textContent.trim(),
          parts: document.querySelectorAll(".series-part-tab").length,
          formBg: getComputedStyle(document.querySelector(".resource-gate-form")).backgroundColor,
          consentChecked: document.querySelector('input[name="consent"]').checked,
          marketingChecked: document.querySelector('input[name="marketing"]').checked,
        }));
        assert.equal(info.sidebarFirst, series.title[lang]);
        assert.equal(info.title, T[lang].gate_title_locked);
        assert.equal(info.submit, T[lang].gate_submit);
        assert.equal(info.parts, series.parts.length);
        assert.equal(info.consentChecked, false, "consent box is not pre-ticked");
        assert.equal(info.marketingChecked, false, "marketing box is not pre-ticked");
        if (theme === "dark") assert.notEqual(info.formBg, "rgb(255, 255, 255)", "dark mode form surface");
        const state = await gateState(page);
        assert.ok(state.locked && !state.unlocked, "starts locked");
        assert.ok(await noHorizontalScroll(page), `no horizontal scroll at ${width}px`);
        await screenshot(page, `locked-${width}-${theme}-${lang}.png`);
        await context.close();
      }
    }
  }
  check("locked gate at 360/768/1280, light/dark, DE/EN: texts, unticked boxes, no horizontal scroll");
}

async function routing(browser, origin) {
  const { context, page } = await setup(browser, { viewport: { width: 1280, height: 900 } });
  const activePart = () => page.evaluate(() => document.querySelector(".series-part-tab.is-active")?.dataset.partId);

  await openSeries(page, origin, "videostudio-teil-3");
  assert.equal(await activePart(), "teil-3");
  assert.equal(await page.textContent("#series-part-title"), series.parts[2].title.de);

  await page.click('.series-part-tab[data-part-id="teil-2"]');
  await page.waitForFunction(() => location.hash === "#videostudio-teil-2");
  assert.equal(await activePart(), "teil-2");
  assert.equal(await page.getAttribute(".btn-share", "data-share-id"), "videostudio-teil-2");
  assert.ok(await page.isVisible(".resource-gate-note-code"), "coming-soon code note on teil-2");
  assert.ok(await page.isVisible(".video-player-placeholder"), "coming-soon placeholder on teil-2");

  await page.click('.series-part-tab[data-part-id="teil-1"]');
  await page.waitForFunction(() => location.hash === "#videostudio-teil-1");
  assert.equal(await page.isVisible(".resource-gate-note-code"), false, "no code note on teil-1");
  assert.ok(await page.isVisible(".video-player-draft"), "draft thumbnail on teil-1");
  assert.equal(await page.locator(".video-player-play").count(), 0, "draft part has no play button");

  await openSeries(page, origin, "video-studio-agent");
  assert.equal(await page.textContent(".resource-series h2"), series.title.de);
  assert.equal(await activePart(), "teil-1");

  await openSeries(page, origin, "videostudio");
  assert.equal(await page.evaluate(() => location.hash), "#videostudio");

  // A regular video still renders the classic layout without a gate.
  await openSeries(page, origin, catalog[1].id);
  assert.equal(await page.locator(".resource-gate").count(), 0);
  assert.equal(await page.locator(".series-parts").count(), 0);
  await context.close();
  check("routing: #videostudio, #videostudio-teil-N, alias, part switch updates hash and share link; regular videos unchanged");
}

async function validationAndWrongCode(browser, origin) {
  const { context, page } = await setup(browser, { viewport: { width: 1280, height: 900 } });
  await openSeries(page, origin, "videostudio");
  const before = (await storedLeads()).length;
  const attemptsBefore = mockWrites.length;

  await submit(page);
  await waitForStatus(page, T.de.gate_status_invalid_email);
  assert.equal(await page.getAttribute('input[name="email"]', "aria-invalid"), "true");

  await page.fill('input[name="email"]', "  Julian.Test@Example.COM ");
  await submit(page);
  await waitForStatus(page, T.de.gate_status_missing_code);

  await page.fill('input[name="code"]', WRONG);
  await submit(page);
  await waitForStatus(page, T.de.gate_status_consent);
  assert.equal(mockWrites.length, attemptsBefore, "nothing is sent before client validation passes");
  check("client validation: empty email, missing code, missing consent; nothing sent");

  await page.check('input[name="consent"]');
  await submit(page);
  await waitForStatus(page, T.de.gate_status_wrong_code);
  const state = await gateState(page);
  assert.ok(state.locked && !state.unlocked, "wrong code keeps the gate locked");
  assert.equal(state.stored, null, "wrong code stores nothing in localStorage");
  assert.equal((await storedLeads()).length, before, "wrong code creates no lead");
  await screenshot(page, "wrong-code-1280.png");
  await context.close();
  check("wrong code: error text, still locked, no lead, no localStorage");
}

async function rightCode(browser, origin) {
  const { context, page } = await setup(browser, { viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const otherTab = await context.newPage();
  await openSeries(otherTab, origin, "videostudio");
  await openSeries(page, origin, "videostudio-teil-2");
  const before = (await storedLeads()).length;

  await page.fill('input[name="email"]', "Julian.Test@Example.COM");
  await page.fill('input[name="code"]', ` ${RIGHT.toLowerCase()} `);
  await page.check('input[name="consent"]');
  await submit(page);
  await page.waitForSelector(".resource-gate-unlocked:not([hidden])", { timeout: 25000 });

  const state = await gateState(page);
  assert.ok(!state.locked && state.unlocked, "right code unlocks");
  const stored = JSON.parse(state.stored);
  assert.equal(stored.via, "teil-1", "a Teil-1 code unlocks from the teil-2 view");
  assert.ok(!Number.isNaN(Date.parse(stored.unlockedAt)));
  assert.ok(!state.stored.includes("@"), "no email in localStorage");
  assert.ok(await page.isVisible(".resource-gate-coming"), "teil-2 shows the coming-soon note when unlocked");

  const leads = await storedLeads();
  assert.equal(leads.length, before + 1, "exactly one lead is stored");
  const lead = leads[leads.length - 1];
  assert.deepEqual(Object.keys(lead).sort(), [
    "code", "consent", "consentText", "consentVersion", "createdAt", "doubleOptIn", "email", "formVersion",
    "language", "marketingConsent", "marketingConsentText", "pack", "page", "part", "submittedAtClient",
  ]);
  assert.equal(lead.email, "julian.test@example.com");
  assert.equal(lead.code, RIGHT);
  assert.equal(lead.pack, "videostudio");
  assert.equal(lead.part, "teil-1");
  assert.equal(lead.consent, true);
  assert.equal(lead.marketingConsent, false);
  assert.equal(lead.consentVersion, 1);
  assert.equal(lead.doubleOptIn, "pending");
  assert.equal(lead.language, "de");
  assert.equal(lead.page, "/resources.html#videostudio-teil-2");
  assert.equal(lead.consentText, plain(T.de.gate_consent_text), "stored consent text equals the shown text");
  assert.equal(lead.marketingConsentText, plain(T.de.gate_marketing_text), "stored marketing text even when unticked");
  check(`right code: unlocks, stores one minimal lead (${MODE}), localStorage holds no email`);

  await otherTab.waitForSelector(".resource-gate-unlocked:not([hidden])", { timeout: 5000 });
  check("second tab unlocks through the storage event");

  await page.click('.series-part-tab[data-part-id="teil-1"]');
  await page.waitForSelector(".resource-gate-unlocked .prompt-card");
  const unlockedInfo = await page.evaluate(() => ({
    prompts: document.querySelectorAll(".resource-gate-unlocked .prompt-card").length,
    links: [...document.querySelectorAll(".resource-gate-unlocked .link-card")].map((a) => a.href),
    tree: !!document.querySelector(".resource-gate-unlocked .resource-tree"),
    formVisible: !!document.querySelector(".resource-gate-form")?.offsetParent,
  }));
  assert.equal(unlockedInfo.prompts, 1);
  assert.ok(unlockedInfo.tree, "folder tree is shown");
  assert.ok(unlockedInfo.links.some((href) => href.includes("github.com")), "starter package link is shown");
  assert.equal(unlockedInfo.formVisible, false);
  await screenshot(page, "unlocked-1280-light-de.png");

  await page.reload();
  await page.waitForSelector(".resource-gate");
  const afterReload = await gateState(page);
  assert.ok(!afterReload.locked && afterReload.unlocked, "stays unlocked after reload");
  await context.close();
  check("unlocked content of teil-1 (prompt, tree, links); stays unlocked after reload");
}

async function unlockedLayouts(browser, origin) {
  for (const [width, theme, lang] of [[360, "dark", "en"], [360, "light", "de"], [768, "light", "de"]]) {
    const { context, page } = await setup(browser, { viewport: { width, height: 900 }, theme, unlocked: true });
    await openSeries(page, origin, "videostudio-teil-1");
    await setLanguage(page, lang);
    const state = await gateState(page);
    assert.ok(state.unlocked, "stored unlock is honored");
    assert.equal((await page.textContent(".resource-gate-unlocked-line")).trim(), T[lang].gate_unlocked_line);
    assert.ok(await noHorizontalScroll(page), `no horizontal scroll unlocked at ${width}px`);
    await screenshot(page, `unlocked-${width}-${theme}-${lang}.png`);
    await context.close();
  }
  check("unlocked gate at 360 (dark EN, light DE) and 768: no horizontal scroll");
}

async function duplicateSignup(browser, origin) {
  const { context, page } = await setup(browser, { viewport: { width: 768, height: 900 } });
  await openSeries(page, origin, "videostudio");
  const before = (await storedLeads()).length;
  await page.fill('input[name="email"]', "julian.test@example.com");
  await page.fill('input[name="code"]', RIGHT);
  await page.check('input[name="consent"]');
  await page.check('input[name="marketing"]');
  await submit(page);
  await page.waitForSelector(".resource-gate-unlocked:not([hidden])", { timeout: 25000 });
  const leads = await storedLeads();
  assert.equal(leads.length, before + 1);
  assert.equal(leads[leads.length - 1].marketingConsent, true);
  await context.close();
  check("second signup with marketing consent is stored (duplicate for the dashboard test)");
}

async function unavailableConfig(browser, origin) {
  const { context, page } = await setup(browser, { viewport: { width: 1280, height: 900 }, config: "empty" });
  await openSeries(page, origin, "videostudio");
  await page.waitForFunction(() => document.querySelector(".resource-gate-submit")?.disabled === true);
  assert.equal((await gateState(page)).status, T.de.gate_status_unavailable);
  assert.ok(await page.isVisible(".resource-gate-teaser"), "teaser stays visible");
  await screenshot(page, "unavailable-1280.png");
  await context.close();
  check("missing Firebase config: button disabled, unavailable text, teaser visible");
}

async function main() {
  fs.mkdirSync(QA, { recursive: true });
  console.log(`Mode: ${MODE}`);
  dataChecks();
  await clearEmulator();

  const server = createStaticServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    await layoutMatrix(browser, origin);
    await routing(browser, origin);
    await validationAndWrongCode(browser, origin);
    await rightCode(browser, origin);
    await unlockedLayouts(browser, origin);
    await duplicateSignup(browser, origin);
    await unavailableConfig(browser, origin);

    assert.deepEqual(blockedProductionRequests, [], "no request may reach the live Firestore project");
    check("no request reached firestore.googleapis.com");
    assert.deepEqual(pageErrors, [], "no console errors");
    check(`no console errors or page errors (${expectedDenials.length} expected permission-denied logs ignored)`);
  } finally {
    await browser.close();
    server.close();
  }

  fs.writeFileSync(path.join(QA, "report.json"), JSON.stringify({
    mode: MODE, ranAt: new Date().toISOString(), checks, leadsStored: (await storedLeads()).length,
  }, null, 2));
  console.log(`\nAll ${checks.length} checks passed (${MODE}). Screenshots: .qa/resource-gate/`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
