/* ─── BRIGHT FLOW FIELD ────────────────────────────────────────
   Four slow, clean wave bands with one distant contour line.
   The surface responds gently to the pointer without particles,
   bubbles, foam, or randomized drawing.
   ───────────────────────────────────────────────────────────── */
(() => {
  const hero = document.querySelector(".hero");
  const canvas = document.querySelector(".hero-ocean");
  if (!hero || !canvas || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const PALETTES = {
    light: {
      layers: [
        ["rgba(31, 103, 218, 0.26)", "rgba(28, 83, 185, 0.34)"],
        ["rgba(45, 128, 240, 0.36)", "rgba(34, 100, 213, 0.44)"],
        ["rgba(102, 170, 255, 0.54)", "rgba(66, 132, 239, 0.62)"],
        ["rgba(205, 231, 255, 0.9)", "#f8faff"],
      ],
      line: "rgba(239, 250, 255, 0.38)",
      contour: "rgba(238, 248, 255, 0.14)",
    },
    dark: {
      layers: [
        ["rgba(27, 93, 198, 0.3)", "rgba(22, 68, 158, 0.4)"],
        ["rgba(43, 120, 228, 0.4)", "rgba(31, 88, 191, 0.5)"],
        ["rgba(82, 151, 245, 0.54)", "rgba(52, 111, 214, 0.64)"],
        ["rgba(94, 143, 226, 0.78)", "#0d1730"],
      ],
      line: "rgba(222, 241, 255, 0.3)",
      contour: "rgba(230, 244, 255, 0.12)",
    },
  };

  const LAYERS = [
    { y: 0.66, amp: 0.012, len: 0.78, speed: 0.13, bob: 0.22, line: false },
    { y: 0.735, amp: 0.016, len: 0.64, speed: -0.1, bob: 0.36, line: true },
    { y: 0.815, amp: 0.021, len: 0.52, speed: 0.075, bob: 0.52, line: true },
    { y: 0.9, amp: 0.026, len: 0.42, speed: -0.055, bob: 0.7, line: true },
  ];

  let palette = PALETTES.light;
  let width = 0;
  let height = 0;
  let step = 4;
  let surface = new Float32Array(0);
  let pointerX = 0.5;
  let pointerY = 0.5;
  let targetX = 0.5;
  let targetY = 0.5;
  let response = 0;
  let responseTarget = 0;

  const syncTheme = () => {
    palette =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? PALETTES.dark
        : PALETTES.light;
  };

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    step = Math.max(3, Math.round(width / 320));
    surface = new Float32Array(Math.ceil((width + step) / step) + 1);
  };

  const surfaceY = (layer, index, x, time) => {
    const base =
      layer.y * height +
      Math.sin(time * 0.34 + index * 1.35) * 4 * layer.bob;
    const amplitude = layer.amp * height;
    const phase =
      (Math.PI * 2 * layer.len * x) / Math.max(1, width) +
      time * layer.speed * 3 +
      index * 0.9;
    const shape =
      Math.sin(phase) +
      0.18 * Math.sin(phase * 2 + 0.75) +
      0.08 * Math.sin(phase * 3 - 0.4);
    const distance = x / width - pointerX;
    const localResponse =
      1 + response * 0.24 * Math.exp(-(distance * distance) / 0.055);
    const pointerLift = (pointerY - 0.5) * response * (index + 1) * 3;
    const tilt = (0.5 - x / width) * (3 + index * 3);
    return base + shape * amplitude * localResponse + pointerLift + tilt;
  };

  const drawContour = (time) => {
    ctx.beginPath();
    for (let x = 0; x <= width + step; x += step) {
      const phase =
        (Math.PI * 2 * 1.35 * x) / Math.max(1, width) + time * 0.12;
      const y =
        height * 0.2 +
        Math.sin(phase) * 5 +
        Math.sin(phase * 2.1 + 0.9) * 2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = palette.contour;
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawFrame = (time) => {
    ctx.clearRect(0, 0, width, height);
    drawContour(time);

    LAYERS.forEach((layer, index) => {
      let points = 0;
      for (let x = 0; x <= width + step; x += step) {
        surface[points++] = surfaceY(layer, index, x, time);
      }

      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let point = 0; point < points; point += 1) {
        ctx.lineTo(point * step, surface[point]);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const crest = layer.y * height - layer.amp * height * 1.8;
      const gradient = ctx.createLinearGradient(0, crest, 0, height);
      gradient.addColorStop(0, palette.layers[index][0]);
      gradient.addColorStop(1, palette.layers[index][1]);
      ctx.fillStyle = gradient;
      ctx.fill();

      if (layer.line) {
        ctx.beginPath();
        ctx.moveTo(0, surface[0]);
        for (let point = 1; point < points; point += 1) {
          ctx.lineTo(point * step, surface[point]);
        }
        ctx.strokeStyle = palette.line;
        ctx.lineWidth = index === 2 ? 1.2 : 0.85;
        ctx.stroke();
      }
    });
  };

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / Math.max(1, rect.width);
    targetY = (event.clientY - rect.top) / Math.max(1, rect.height);
    responseTarget = 1;
  });

  hero.addEventListener("pointerleave", () => {
    responseTarget = 0;
    targetY = 0.5;
  });

  const STATIC_TIME = 4.2;
  let running = false;
  let visible = true;
  let lastTime = 0;
  let elapsed = 0;

  const tick = (now) => {
    if (!running) return;
    const delta = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;
    elapsed += delta;
    pointerX += (targetX - pointerX) * 0.045;
    pointerY += (targetY - pointerY) * 0.04;
    response += (responseTarget - response) * 0.045;
    drawFrame(elapsed);
    requestAnimationFrame(tick);
  };

  const updateLoop = () => {
    const shouldRun = visible && !document.hidden && !motionQuery.matches;
    if (shouldRun && !running) {
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(tick);
    } else if (!shouldRun) {
      running = false;
      drawFrame(STATIC_TIME);
    }
  };

  syncTheme();
  resize();

  new ResizeObserver(() => {
    resize();
    if (!running) drawFrame(STATIC_TIME);
  }).observe(hero);

  new MutationObserver(() => {
    syncTheme();
    if (!running) drawFrame(STATIC_TIME);
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      updateLoop();
    },
    { threshold: 0 }
  ).observe(hero);

  document.addEventListener("visibilitychange", updateLoop);
  motionQuery.addEventListener?.("change", updateLoop);
  updateLoop();
})();
