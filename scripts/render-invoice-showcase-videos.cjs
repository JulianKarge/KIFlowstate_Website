const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");
const { once } = require("events");
const { spawn } = require("child_process");

const SITE = path.resolve(__dirname, "..");
const OUTPUT = path.join(SITE, "media", "invoice-showcase");
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
const DURATION_MS = 26000;
const FPS = 24;
const FRAME_COUNT = Math.round((DURATION_MS / 1000) * FPS);

const ALL_RENDERS = [
  {
    name: "invoice-showcase-de-desktop",
    lang: "de",
    viewport: { width: 1600, height: 1000 },
    mobile: false
  },
  {
    name: "invoice-showcase-en-desktop",
    lang: "en",
    viewport: { width: 1600, height: 1000 },
    mobile: false
  },
  {
    name: "invoice-showcase-de-laptop",
    lang: "de",
    viewport: { width: 1100, height: 900 },
    mobile: false
  },
  {
    name: "invoice-showcase-en-laptop",
    lang: "en",
    viewport: { width: 1100, height: 900 },
    mobile: false
  },
  {
    name: "invoice-showcase-de-tablet",
    lang: "de",
    viewport: { width: 834, height: 1194 },
    mobile: true
  },
  {
    name: "invoice-showcase-en-tablet",
    lang: "en",
    viewport: { width: 834, height: 1194 },
    mobile: true
  },
  {
    name: "invoice-showcase-de-mobile",
    lang: "de",
    viewport: { width: 390, height: 844 },
    mobile: true
  },
  {
    name: "invoice-showcase-en-mobile",
    lang: "en",
    viewport: { width: 390, height: 844 },
    mobile: true
  }
];
const requestedNames = new Set(process.argv.slice(2));
const RENDERS = requestedNames.size
  ? ALL_RENDERS.filter(render => requestedNames.has(render.name))
  : ALL_RENDERS;

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
    const tryRequest = () => {
      const request = http.get(url, response => {
        response.resume();
        if (response.statusCode >= 200 && response.statusCode < 400) {
          resolve();
          return;
        }
        retry(new Error(`HTTP ${response.statusCode}`));
      });
      request.on("error", retry);
    };
    const retry = error => {
      if (Date.now() >= deadline) {
        reject(error);
        return;
      }
      setTimeout(tryRequest, 100);
    };
    tryRequest();
  });
}

async function prepareAnimation(page, origin, render) {
  const url = `${origin}/rechnung-demo.html?render-showcase=1&lang=${render.lang}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);

  await page.evaluate(lang => {
    const root = document.querySelector("[data-showcase]");
    if (!root) throw new Error("Showcase root not found");

    const navbar = document.querySelector(".navbar");
    if (navbar) navbar.style.setProperty("visibility", "hidden", "important");

    // Fixed page UI can overlap the stage even when it lives outside the
    // showcase DOM. Remove all explicitly excluded elements before capture.
    document.querySelectorAll(
      "[data-showcase-recording-exclude], .invoice-demo-nudge"
    ).forEach(element => element.remove());

    const stage = root.querySelector(".invoice-showcase-stage");
    const template = document.querySelector("#invoice-showcase-render-template");
    if (template) {
      stage.replaceChildren(template.content.cloneNode(true));
    }

    const dictionary = typeof translations !== "undefined" ? translations[lang] : null;
    if (dictionary) {
      root.querySelectorAll("[data-translate]").forEach(element => {
        const key = element.getAttribute("data-translate");
        if (dictionary[key]) element.innerHTML = dictionary[key];
      });
      root.querySelectorAll("[data-translate-aria-label]").forEach(element => {
        const key = element.getAttribute("data-translate-aria-label");
        if (dictionary[key]) {
          const textarea = document.createElement("textarea");
          textarea.innerHTML = dictionary[key];
          element.setAttribute("aria-label", textarea.value);
        }
      });
    }

    document.documentElement.lang = lang;
    root.classList.remove("is-video-showcase");
    root.classList.add("is-enhanced", "is-running", "is-rendering-video");
  }, render.lang);

  const toggle = page.locator("[data-showcase-toggle]");
  if (await toggle.count()) {
    const action = await toggle.getAttribute("data-showcase-action");
    if (action === "pause") await toggle.click();
  }

  const stage = page.locator("[data-showcase] .invoice-showcase-stage");
  await stage.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const documentTop = rect.top + window.scrollY;
    const viewportOffset = Math.max(16, (window.innerHeight - rect.height) / 2);
    window.scrollTo(0, Math.max(0, documentTop - viewportOffset));
  });
  await page.waitForTimeout(120);

  const animationCount = await page.evaluate(() => {
    const root = document.querySelector("[data-showcase]");
    const animations = root.getAnimations({ subtree: true }).filter(
      animation => animation instanceof CSSAnimation
    );
    animations.forEach(animation => animation.pause());
    window.__showcaseRenderAnimations = animations;
    return animations.length;
  });
  if (animationCount < 20) {
    throw new Error(`Expected at least 20 CSS animations, found ${animationCount}`);
  }

  const box = await stage.boundingBox();
  if (!box || box.width < 300 || box.height < 500) {
    throw new Error(`Unexpected showcase stage bounds: ${JSON.stringify(box)}`);
  }
  return { stage, box, animationCount };
}

async function renderVideo(browser, origin, render) {
  const context = await browser.newContext({
    viewport: render.viewport,
    deviceScaleFactor: 1,
    hasTouch: render.mobile,
    isMobile: render.mobile,
    reducedMotion: "no-preference"
  });
  const page = await context.newPage();
  const outputPath = path.join(OUTPUT, `${render.name}.mp4`);
  const { box, animationCount } = await prepareAnimation(page, origin, render);

  const ffmpeg = spawn("ffmpeg", [
    "-hide_banner",
    "-loglevel", "error",
    "-y",
    "-f", "image2pipe",
    "-framerate", String(FPS),
    "-vcodec", "mjpeg",
    "-i", "pipe:0",
    "-an",
    "-vf", "scale=in_range=full:out_range=tv,format=yuv420p,pad=ceil(iw/2)*2:ceil(ih/2)*2:color=#08152f",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-color_range", "tv",
    "-g", String(FPS * 2),
    "-keyint_min", String(FPS * 2),
    "-sc_threshold", "0",
    "-movflags", "+faststart",
    outputPath
  ], {
    cwd: SITE,
    windowsHide: true,
    stdio: ["pipe", "ignore", "pipe"]
  });

  let ffmpegError = "";
  ffmpeg.stderr.on("data", chunk => {
    ffmpegError += chunk.toString();
  });

  process.stdout.write(
    `Rendering ${render.name}: ${Math.round(box.width)}x${Math.round(box.height)}, ` +
    `${animationCount} animations, ${FRAME_COUNT} frames\n`
  );

  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    const timeMs = (frame / FPS) * 1000;
    await page.evaluate(time => {
      window.__showcaseRenderAnimations.forEach(animation => {
        animation.currentTime = time;
      });
    }, timeMs);

    const image = await page.screenshot({
      clip: box,
      type: "jpeg",
      quality: 94,
      animations: "allow"
    });
    if (!ffmpeg.stdin.write(image)) await once(ffmpeg.stdin, "drain");

    if (frame === 0 || (frame + 1) % (FPS * 5) === 0 || frame === FRAME_COUNT - 1) {
      process.stdout.write(
        `  ${render.name}: ${frame + 1}/${FRAME_COUNT} frames\n`
      );
    }
  }

  ffmpeg.stdin.end();
  const [code] = await once(ffmpeg, "close");
  await context.close();
  if (code !== 0) {
    throw new Error(`ffmpeg failed for ${render.name}: ${ffmpegError.trim()}`);
  }

  const bytes = fs.statSync(outputPath).size;
  process.stdout.write(
    `Created ${path.relative(SITE, outputPath)} (${(bytes / 1024 / 1024).toFixed(2)} MB)\n`
  );
}

async function main() {
  if (!RENDERS.length) {
    throw new Error(
      `No matching render selected. Available names: ${ALL_RENDERS.map(render => render.name).join(", ")}`
    );
  }
  fs.mkdirSync(OUTPUT, { recursive: true });
  const port = await getFreePort();
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn(
    "python",
    ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", SITE],
    { windowsHide: true, stdio: "ignore" }
  );

  let browser;
  try {
    await waitForServer(`${origin}/rechnung-demo.html`);
    browser = await chromium.launch({ headless: true });
    let nextRenderIndex = 0;
    const workerCount = Math.min(3, RENDERS.length);
    const workers = Array.from({ length: workerCount }, async () => {
      while (nextRenderIndex < RENDERS.length) {
        const render = RENDERS[nextRenderIndex];
        nextRenderIndex += 1;
        await renderVideo(browser, origin, render);
      }
    });
    await Promise.all(workers);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
