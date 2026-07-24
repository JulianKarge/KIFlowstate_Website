const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");

const SITE = path.resolve(__dirname, "..");
const PLAYWRIGHT_FALLBACKS = [
  path.resolve(SITE, ".playwright-test", "node_modules", "playwright"),
  path.resolve(
    SITE,
    "..",
    "Workspace",
    "Browser_Automation",
    "node_modules",
    "playwright"
  )
];
const { chromium } = loadPlaywright();
const checks = [];

function loadPlaywright() {
  try {
    return require("playwright");
  } catch (primaryError) {
    for (const fallback of PLAYWRIGHT_FALLBACKS) {
      try {
        return require(fallback);
      } catch {}
    }
    throw primaryError;
  }
}

function check(name, pass, details = "") {
  const result = { name, pass: Boolean(pass), details };
  checks.push(result);
  process.stdout.write(`${result.pass ? "PASS" : "FAIL"} ${name}${details ? ` :: ${details}` : ""}\n`);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

function waitForServer(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const request = () => {
      const probe = http.get(url, response => {
        response.resume();
        if (response.statusCode >= 200 && response.statusCode < 400) {
          resolve();
          return;
        }
        retry(new Error(`HTTP ${response.statusCode}`));
      });
      probe.on("error", retry);
    };
    const retry = error => {
      if (Date.now() >= deadline) {
        reject(error);
        return;
      }
      setTimeout(request, 100);
    };
    request();
  });
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".mp4": "video/mp4",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp"
  }[extension] || "application/octet-stream";
}

function createStaticServer() {
  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = path.resolve(SITE, relative);
    const sitePrefix = `${SITE}${path.sep}`;
    if (filePath !== SITE && !filePath.startsWith(sitePrefix)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.stat(filePath, (error, stats) => {
      if (error || !stats.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      const headers = {
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        "Content-Type": contentType(filePath)
      };
      const range = request.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) {
          response.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
          response.end();
          return;
        }
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Math.min(Number(match[2]), stats.size - 1) : stats.size - 1;
        if (start > end || start >= stats.size) {
          response.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
          response.end();
          return;
        }
        response.writeHead(206, {
          ...headers,
          "Content-Length": end - start + 1,
          "Content-Range": `bytes ${start}-${end}/${stats.size}`
        });
        fs.createReadStream(filePath, { start, end }).pipe(response);
        return;
      }

      response.writeHead(200, {
        ...headers,
        "Content-Length": stats.size
      });
      fs.createReadStream(filePath).pipe(response);
    });
  });
}

async function openShowcase(browser, origin, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  const mediaRequests = [];
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("response", response => {
    if (response.url().startsWith(origin) && response.status() >= 400) {
      errors.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });
  page.on("request", request => {
    if (/invoice-showcase-[^/]+\.mp4(?:\?|$)/.test(request.url())) {
      mediaRequests.push(request.url());
    }
  });

  await page.goto(`${origin}/rechnung-demo.html`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.waitForFunction(() => (
    document.querySelector("[data-showcase]")?.dataset.showcaseReady === "true"
  ));
  await page.locator("[data-showcase]").evaluate(element => {
    element.scrollIntoView({ block: "center", inline: "nearest" });
  });
  await page.waitForFunction(() => (
    document.querySelector("[data-showcase]")?.dataset.showcaseVideoReady === "true"
  ));
  return { context, page, errors, mediaRequests };
}

async function verifyLayout(browser, origin, spec) {
  const { context, page, errors } = await openShowcase(browser, origin, {
    viewport: spec.viewport,
    hasTouch: spec.touch,
    isMobile: spec.touch,
    reducedMotion: "no-preference"
  });
  try {
    await page.waitForFunction(() => (
      document.querySelector("[data-showcase]")?.dataset.showcasePaused === "false"
    ));
    const state = await page.evaluate(() => {
      const root = document.querySelector("[data-showcase]");
      const videos = [...root.querySelectorAll("[data-showcase-video]")];
      const active = root.querySelector("[data-showcase-video].is-active");
      const stage = root.querySelector(".invoice-showcase-stage");
      return {
        layout: root.dataset.showcaseVideoLayout,
        activeLanguage: root.dataset.showcaseVideoLanguage,
        activeSource: active?.getAttribute("src") || "",
        activeVideos: videos.filter(video => video.classList.contains("is-active")).length,
        playingVideos: videos.filter(video => !video.paused).length,
        stageAnimations: stage?.getAnimations({ subtree: true }).length || 0,
        legacyFilmNodes: stage?.querySelectorAll(".invoice-showcase-animated").length || 0,
        floatingNudgePresent: Boolean(document.querySelector("#invoice-demo-nudge")),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });
    check(`${spec.name}: correct responsive source`, state.layout === spec.layout && state.activeSource.includes(`-${spec.layout}.mp4`), JSON.stringify(state));
    check(`${spec.name}: one active/playing video`, state.activeVideos === 1 && state.playingVideos === 1, JSON.stringify(state));
    check(
      `${spec.name}: legacy film has no live DOM or CSS animations`,
      state.stageAnimations === 0 && state.legacyFilmNodes === 0,
      JSON.stringify(state)
    );
    check(
      `${spec.name}: no floating CTA can cover the showcase`,
      state.floatingNudgePresent === false,
      JSON.stringify(state)
    );
    check(`${spec.name}: no horizontal overflow`, state.scrollWidth <= state.clientWidth + 1, `${state.scrollWidth}/${state.clientWidth}`);
    check(`${spec.name}: no runtime errors`, errors.length === 0, errors.join(" | "));
  } finally {
    await context.close();
  }
}

async function verifyLanguageContinuity(browser, origin) {
  const { context, page, errors, mediaRequests } = await openShowcase(browser, origin, {
    viewport: { width: 1600, height: 1000 },
    reducedMotion: "no-preference"
  });
  try {
    await page.waitForFunction(() => {
      const videos = [...document.querySelectorAll("[data-showcase-video]")];
      return videos.length === 2 && videos.every(video => video.readyState >= 2);
    });
    await page.waitForFunction(() => (
      document.querySelector("[data-showcase]")?.dataset.showcasePaused === "false"
    ));

    await page.evaluate(() => {
      const active = document.querySelector('[data-showcase-video="de"]');
      active.currentTime = 8.2;
    });
    await page.waitForTimeout(180);
    const beforeSwitch = await page.locator('[data-showcase-video="de"]').evaluate(video => video.currentTime);
    const requestsBefore = mediaRequests.length;
    await page.locator("#lang-en").click();
    await page.waitForFunction(() => (
      document.querySelector("[data-showcase]")?.dataset.showcaseVideoLanguage === "en"
    ));
    await page.waitForTimeout(220);
    const runningSwitch = await page.evaluate(() => {
      const de = document.querySelector('[data-showcase-video="de"]');
      const en = document.querySelector('[data-showcase-video="en"]');
      return {
        lang: document.documentElement.lang,
        dePaused: de.paused,
        enPaused: en.paused,
        time: en.currentTime,
        active: en.classList.contains("is-active"),
        navigationEntries: performance.getEntriesByType("navigation").length
      };
    });
    check(
      "language switch preserves running timestamp",
      runningSwitch.time >= beforeSwitch - 0.15 && runningSwitch.time < beforeSwitch + 1.2,
      `before=${beforeSwitch.toFixed(3)} after=${runningSwitch.time.toFixed(3)}`
    );
    check(
      "language switch changes the visible film without reloading",
      runningSwitch.lang === "en" &&
        runningSwitch.active &&
        runningSwitch.dePaused &&
        !runningSwitch.enPaused &&
        runningSwitch.navigationEntries === 1 &&
        mediaRequests.length === requestsBefore,
      JSON.stringify({ ...runningSwitch, requestsBefore, requestsAfter: mediaRequests.length })
    );

    await page.locator("[data-showcase-toggle]").click();
    await page.waitForFunction(() => (
      document.querySelector("[data-showcase]")?.dataset.showcasePaused === "true"
    ));
    const pausedBefore = await page.locator('[data-showcase-video="en"]').evaluate(video => video.currentTime);
    await page.locator("#lang-de").click();
    await page.waitForFunction(() => (
      document.querySelector("[data-showcase]")?.dataset.showcaseVideoLanguage === "de"
    ));
    await page.waitForTimeout(180);
    const pausedSwitch = await page.evaluate(() => {
      const de = document.querySelector('[data-showcase-video="de"]');
      const en = document.querySelector('[data-showcase-video="en"]');
      return {
        time: de.currentTime,
        dePaused: de.paused,
        enPaused: en.paused,
        rootPaused: document.querySelector("[data-showcase]").dataset.showcasePaused
      };
    });
    check(
      "language switch preserves paused timestamp and state",
      Math.abs(pausedSwitch.time - pausedBefore) < 0.25 &&
        pausedSwitch.dePaused &&
        pausedSwitch.enPaused &&
        pausedSwitch.rootPaused === "true",
      `before=${pausedBefore.toFixed(3)} after=${pausedSwitch.time.toFixed(3)} ${JSON.stringify(pausedSwitch)}`
    );

    await page.locator('[data-showcase-chapter="send"]').click();
    await page.waitForTimeout(180);
    const chapterTime = await page.locator('[data-showcase-video="de"]').evaluate(video => video.currentTime);
    check("chapter controls seek the video", Math.abs(chapterTime - 21.84) < 0.35, `time=${chapterTime.toFixed(3)}`);
    check("language continuity case has no runtime errors", errors.length === 0, errors.join(" | "));
  } finally {
    await context.close();
  }
}

async function verifyReducedMotion(browser, origin) {
  const { context, page, errors } = await openShowcase(browser, origin, {
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce"
  });
  try {
    await page.waitForTimeout(180);
    const state = await page.evaluate(() => {
      const root = document.querySelector("[data-showcase]");
      const active = root.querySelector("[data-showcase-video].is-active");
      return {
        motion: root.dataset.showcaseMotion,
        phase: root.dataset.showcasePhase,
        paused: root.dataset.showcasePaused,
        time: active.currentTime,
        videoPaused: active.paused,
        toggleDisabled: document.querySelector("[data-showcase-toggle]").disabled
      };
    });
    check(
      "reduced motion uses a static translated video frame",
      state.motion === "reduced" &&
        state.phase === "static" &&
        state.paused === "true" &&
        state.videoPaused &&
        state.toggleDisabled &&
        Math.abs(state.time - 21.84) < 0.35,
      JSON.stringify(state)
    );
    check("reduced motion case has no runtime errors", errors.length === 0, errors.join(" | "));
  } finally {
    await context.close();
  }
}

async function verifyMainThreadCost(browser, origin) {
  const { context, page, errors } = await openShowcase(browser, origin, {
    viewport: { width: 1600, height: 1000 },
    reducedMotion: "no-preference"
  });
  const session = await context.newCDPSession(page);
  try {
    await page.evaluate(() => {
      const root = document.querySelector("[data-showcase]");
      document.getAnimations({ subtree: true }).forEach(animation => {
        const target = animation.effect?.target;
        if (target && !root.contains(target)) animation.pause();
      });
    });
    await page.waitForTimeout(300);
    await session.send("Performance.enable");
    await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const metricMap = result => Object.fromEntries(
      result.metrics.map(metric => [metric.name, metric.value])
    );
    const before = metricMap(await session.send("Performance.getMetrics"));
    await page.waitForTimeout(5000);
    const after = metricMap(await session.send("Performance.getMetrics"));
    const deltas = {
      taskMs: Math.round(((after.TaskDuration || 0) - (before.TaskDuration || 0)) * 1000),
      scriptMs: Math.round(((after.ScriptDuration || 0) - (before.ScriptDuration || 0)) * 1000),
      styleMs: Math.round(((after.RecalcStyleDuration || 0) - (before.RecalcStyleDuration || 0)) * 1000),
      layoutMs: Math.round(((after.LayoutDuration || 0) - (before.LayoutDuration || 0)) * 1000)
    };
    check(
      "isolated five-second video playback keeps throttled main-thread work low",
      deltas.taskMs < 500 &&
        deltas.scriptMs < 150 &&
        deltas.styleMs < 100 &&
        deltas.layoutMs < 100,
      JSON.stringify({ cpuThrottle: 4, sampleSeconds: 5, ...deltas })
    );
    check("performance case has no runtime errors", errors.length === 0, errors.join(" | "));
  } finally {
    await session.send("Emulation.setCPUThrottlingRate", { rate: 1 }).catch(() => {});
    await context.close();
  }
}

async function main() {
  const port = await getFreePort();
  const origin = `http://127.0.0.1:${port}`;
  const server = createStaticServer();
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", resolve);
    });
    await waitForServer(`${origin}/rechnung-demo.html`);
    browser = await chromium.launch({ headless: true });
    await verifyLayout(browser, origin, {
      name: "desktop",
      viewport: { width: 1600, height: 1000 },
      touch: false,
      layout: "desktop"
    });
    await verifyLayout(browser, origin, {
      name: "laptop",
      viewport: { width: 1100, height: 900 },
      touch: false,
      layout: "laptop"
    });
    await verifyLayout(browser, origin, {
      name: "tablet",
      viewport: { width: 834, height: 1194 },
      touch: true,
      layout: "tablet"
    });
    await verifyLayout(browser, origin, {
      name: "mobile",
      viewport: { width: 390, height: 844 },
      touch: true,
      layout: "mobile"
    });
    await verifyLanguageContinuity(browser, origin);
    await verifyReducedMotion(browser, origin);
    await verifyMainThreadCost(browser, origin);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  const failed = checks.filter(result => !result.pass);
  process.stdout.write(`SUMMARY ${checks.length - failed.length}/${checks.length} passed\n`);
  if (failed.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
