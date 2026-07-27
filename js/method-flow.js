/* ─── METHOD FLOW FIELD ────────────────────────────────────────
   Scroll chapter for #method. Seven separate currents run against
   each other at the start and braid into the KIFlowstate wave trio
   by the end. The canvas only ever draws water: every label, step
   and statement stays in the DOM so it is crisp and translatable.

   The surface model is trochoidal rather than a plain sine, so the
   water carries the three cues that make a wave read as water:
   sharp crests over broad troughs, a bright lip with its own shaded
   face just underneath, and a specular run that only lights the
   slopes turned toward the light. Harmonics drift at their own
   dispersion speed, so the profile evolves as it travels instead of
   sliding past as a rigid texture.

   Same engine conventions as js/hero-waves.js (rAF only while the
   section is on screen, DPR-capped backing store, theme + motion
   observers) so both surfaces read as one system.
   ───────────────────────────────────────────────────────────── */
(() => {
  const section = document.querySelector(".flowfield");
  const canvas = section && section.querySelector(".flowfield-canvas");
  if (!section || !canvas || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  const stage = section.querySelector(".flowfield-stage");
  const steps = Array.from(section.querySelectorAll(".flowfield-step"));
  const lines = Array.from(section.querySelectorAll(".flowfield-line"));
  const tokens = Array.from(section.querySelectorAll(".flowfield-token"));
  const stations = Array.from(section.querySelectorAll(".flowfield-station"));
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactQuery = window.matchMedia("(max-width: 900px)");

  const TAU = Math.PI * 2;
  const HALF_PI = Math.PI / 2;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  /* smoothstep over an arbitrary window, used for every reveal below */
  const ramp = (value, start, end) => {
    const t = clamp((value - start) / (end - start));
    return t * t * (3 - 2 * t);
  };

  /* Deep-water dispersion: harmonic n travels at sqrt(n) times the
     fundamental, which is what stops the profile from translating
     rigidly. Precomputed because they are used on every sample. */
  const D2 = Math.SQRT2;
  const D3 = Math.sqrt(3);
  const D6 = Math.sqrt(6);

  /* The end state: the three-layer wave from the logo. Values are
     shares of the band, speeds match the hero so both drift alike.
     `steep` is the trochoid shape factor: 0 is a plain sine and the
     crest sharpens from there. The front layer is nearest, so it is
     the steepest and carries the strongest light. */
  const TRIO = [
    { y: 0.26, amp: 0.055, len: 0.78, speed: 0.13, weight: 1.1, steep: 0.32 },
    { y: 0.45, amp: 0.075, len: 0.62, speed: -0.1, weight: 1.5, steep: 0.44 },
    { y: 0.64, amp: 0.1, len: 0.5, speed: 0.075, weight: 2, steep: 0.56 },
  ];

  /* The start state: conflicting currents. `into` is the trio line a
     current joins; -1 means it is absorbed and fades out entirely. */
  const CURRENTS = [
    { y: 0.1, amp: 0.3, len: 0.3, tilt: -0.16, speed: 0.42, phase: 0, into: 0, steep: 0.42 },
    { y: 0.3, amp: 0.22, len: 0.21, tilt: 0.24, speed: -0.55, phase: 1.7, into: -1, steep: 0.42 },
    { y: 0.44, amp: 0.34, len: 0.38, tilt: 0.1, speed: 0.3, phase: 3.1, into: 1, steep: 0.42 },
    { y: 0.58, amp: 0.18, len: 0.17, tilt: -0.26, speed: -0.38, phase: 4.4, into: -1, steep: 0.42 },
    { y: 0.72, amp: 0.28, len: 0.26, tilt: 0.18, speed: 0.5, phase: 0.9, into: 2, steep: 0.42 },
    { y: 0.86, amp: 0.2, len: 0.33, tilt: -0.12, speed: -0.28, phase: 2.4, into: -1, steep: 0.42 },
    { y: 0.2, amp: 0.16, len: 0.14, tilt: 0.26, speed: 0.62, phase: 5.2, into: -1, steep: 0.42 },
  ];

  /* Where the day-to-day tokens float before the current takes them: the
     strip just above the water, clear of the headline and the step rail. */
  const TOKEN_SPOTS = [
    { x: 0.08, y: 0.55, rot: -6 },
    { x: 0.27, y: 0.51, rot: 5 },
    { x: 0.46, y: 0.44, rot: -4 },
    { x: 0.63, y: 0.52, rot: 7 },
    { x: 0.79, y: 0.45, rot: -5 },
  ];

  const STATION_X = [0.2, 0.5, 0.8];

  /* Light sits high and to the left, matching the sheen on the hero
     wave, so the descending face of every crest is the lit one. */
  const LIGHT = -1;
  /* Specular is quantised into this many strokes per layer: enough for a
     continuous run of light, few enough to stay one path each. Below about
     eight the highlight beads up into visible steps. */
  const SHEEN_BANDS = 10;

  /* Each trio layer is described as a slab of water rather than a flat
     tint: `rim` is the lit lip, `shade` the face it casts on itself,
     `body`/`deep` the mass underneath, `cast` the shadow it throws on
     the water behind it, `under` the far face seen through the near
     water. Back to front, so the nearest layer is the most saturated. */
  const PALETTES = {
    light: {
      chaos: "rgba(86, 118, 180, 0.46)",
      chaosSheen: "rgba(255, 255, 255, 0.62)",
      chaosVeil: "rgba(104, 148, 220, 0.05)",
      /* Aerial perspective across the three: the far layer is lighter, softer
         and lower in contrast, the near one deeper and crisper. */
      bands: [
        {
          rim: "rgba(186, 216, 255, 0.26)",
          sheen: "rgba(255, 255, 255, 0.4)",
          shade: "rgba(44, 92, 186, 0.07)",
          body: "rgba(96, 152, 240, 0.12)",
          deep: "rgba(51, 105, 242, 0.02)",
          cast: "rgba(30, 68, 152, 0.016)",
          under: "rgba(206, 230, 255, 0.14)",
        },
        {
          rim: "rgba(172, 208, 255, 0.34)",
          sheen: "rgba(255, 255, 255, 0.56)",
          shade: "rgba(38, 84, 176, 0.11)",
          body: "rgba(80, 138, 236, 0.21)",
          deep: "rgba(37, 88, 200, 0.05)",
          cast: "rgba(26, 60, 140, 0.022)",
          under: "rgba(198, 226, 255, 0.19)",
        },
        {
          rim: "rgba(214, 234, 255, 0.46)",
          sheen: "rgba(255, 255, 255, 0.78)",
          shade: "rgba(34, 78, 172, 0.15)",
          body: "rgba(104, 162, 248, 0.38)",
          deep: "rgba(51, 105, 242, 0.14)",
          cast: "rgba(22, 54, 132, 0.03)",
          under: "rgba(212, 234, 255, 0.26)",
        },
      ],
      head: "#3369f2",
      headCore: "#ffffff",
      headGlow: "rgba(51, 105, 242, 0.28)",
    },
    dark: {
      chaos: "rgba(143, 176, 255, 0.3)",
      chaosSheen: "rgba(214, 232, 255, 0.5)",
      chaosVeil: "rgba(96, 148, 240, 0.05)",
      bands: [
        {
          rim: "rgba(150, 190, 255, 0.2)",
          sheen: "rgba(226, 240, 255, 0.3)",
          shade: "rgba(6, 18, 48, 0.15)",
          body: "rgba(84, 140, 255, 0.14)",
          deep: "rgba(84, 140, 255, 0.02)",
          cast: "rgba(4, 12, 34, 0.05)",
          under: "rgba(150, 194, 255, 0.12)",
        },
        {
          rim: "rgba(160, 198, 255, 0.27)",
          sheen: "rgba(232, 243, 255, 0.42)",
          shade: "rgba(5, 15, 42, 0.19)",
          body: "rgba(62, 120, 234, 0.25)",
          deep: "rgba(31, 66, 150, 0.06)",
          cast: "rgba(3, 10, 30, 0.062)",
          under: "rgba(158, 200, 255, 0.16)",
        },
        {
          rim: "rgba(186, 216, 255, 0.36)",
          sheen: "rgba(244, 250, 255, 0.6)",
          shade: "rgba(4, 12, 36, 0.23)",
          body: "rgba(96, 158, 255, 0.34)",
          deep: "rgba(46, 94, 204, 0.12)",
          cast: "rgba(2, 8, 26, 0.078)",
          under: "rgba(176, 212, 255, 0.2)",
        },
      ],
      head: "#8fb0ff",
      headCore: "#ffffff",
      headGlow: "rgba(143, 176, 255, 0.3)",
    },
  };

  let palette = PALETTES.light;
  let width = 0;
  let height = 0;
  let step = 4;
  let count = 0;
  /* Fine detail is sized against the canvas: the same capillary ripple that
     reads as texture on a desktop band turns into noise on a phone. */
  let detail = 1;
  let bandTop = 0;
  let bandHeight = 0;
  let progress = 0;
  let order = 0;
  let elapsed = 0;
  let lastTime = 0;
  let running = false;
  let visible = false;
  /* null, not -1: the compact layout asks for chapter -1 straight away and
     that first call still has to clear the markup's default active step. */
  let chapter = null;
  let pointerX = 0.5;
  let pointerTargetX = 0.5;
  let response = 0;
  let responseTarget = 0;

  /* One scratch buffer for the sampled surface, reused every frame so a
     60fps scroll never allocates. */
  let samples = new Float32Array(0);

  const syncTheme = () => {
    palette =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? PALETTES.dark
        : PALETTES.light;
  };

  const resize = () => {
    const rect = (stage || section).getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    step = Math.max(3, Math.round(width / 300));
    count = Math.ceil((width + step) / step) + 1;
    samples = new Float32Array(count);
    detail = clamp(width / 1100, 0.5, 1);
    /* On phones the band is the whole canvas; on desktop it sits in the
       lower half so the copy above it keeps a calm background. With reduced
       motion the section is not pinned, so the water drops further down to
       stay clear of the copy that now sits in normal flow. */
    const top = compactQuery.matches ? -0.08 : motionQuery.matches ? 0.72 : 0.58;
    bandTop = height * top;
    bandHeight = height * (0.98 - top);
  };

  /* Resolved geometry of one current at the current order factor. */
  const currentAt = (index) => {
    const line = CURRENTS[index];
    const target = TRIO[line.into < 0 ? 1 : line.into];
    return {
      y: bandTop + mix(line.y, target.y, order) * bandHeight,
      amp: mix(line.amp * 0.5, target.amp, order) * bandHeight,
      len: mix(line.len, target.len, order),
      tilt: mix(line.tilt, 0, order) * bandHeight,
      speed: mix(line.speed, target.speed, order),
      steep: mix(line.steep, target.steep, order),
      phase: line.phase,
      weight: mix(0.9, target.weight, order),
      into: line.into,
    };
  };

  /* Trochoid: solving q = q0 + K·sin(q) moves sample density toward the
     crest, which narrows it and broadens the trough the way gravity waves
     actually break down. At K = 0 this returns exactly sin(q0 - π/2), so
     the wave keeps the position and amplitude it had as a plain sine. */
  const trochoid = (base, k) => {
    const q0 = base + HALF_PI;
    let q = q0;
    q = q0 + k * Math.sin(q);
    q = q0 + k * Math.sin(q);
    q = q0 + k * Math.sin(q);
    q = q0 + k * Math.sin(q);
    return -Math.cos(q);
  };

  const surfaceY = (line, x, time) => {
    /* Spatial phase and temporal advance are kept apart so each harmonic
       can travel at its own speed. */
    const space = (TAU * x) / Math.max(1, width * line.len) + line.phase;
    const drift = time * line.speed * 2.2;
    const shape =
      trochoid(space + drift, clamp(line.steep, 0, 0.6)) +
      0.22 * Math.sin(2 * space + drift * D2 + 0.7) +
      0.09 * (0.7 + 0.3 * detail) * Math.sin(3 * space + drift * D3 - 0.4) +
      0.045 * detail * Math.sin(6 * space + drift * D6 + 1.9);
    const distance = x / Math.max(1, width) - pointerX;
    const bump = response * 14 * Math.exp(-(distance * distance) / 0.012);
    return line.y + shape * line.amp + line.tilt * (x / Math.max(1, width) - 0.5) - bump;
  };

  const sample = (line, time) => {
    for (let i = 0; i < count; i += 1) samples[i] = surfaceY(line, i * step, time);
  };

  /* Midpoint quadratics instead of a polyline: at the sampling step the
     surface would otherwise show flat facets on every shallow slope. */
  const traceSurface = (path) => {
    path.moveTo(0, samples[0]);
    for (let i = 1; i < count - 1; i += 1) {
      const x = i * step;
      path.quadraticCurveTo(
        x,
        samples[i],
        (x + (i + 1) * step) / 2,
        (samples[i] + samples[i + 1]) / 2
      );
    }
    path.lineTo((count - 1) * step, samples[count - 1]);
  };

  const surfacePath = () => {
    const path = new Path2D();
    traceSurface(path);
    return path;
  };

  const bodyPath = () => {
    const path = new Path2D();
    traceSurface(path);
    path.lineTo((count - 1) * step, height);
    path.lineTo(0, height);
    path.closePath();
    return path;
  };

  /* Every band that has to hug the water is the one surface path drawn at a
     vertical offset, so a layer only ever builds its curve twice per frame.
     Stroking an offset path also spreads the band along the surface normal,
     which is where a lit or shaded face actually sits. */
  const strokeOffset = (path, offset, color, lineWidth) => {
    ctx.save();
    ctx.translate(0, offset);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.stroke(path);
    ctx.restore();
  };

  /* Specular: the run of light along a crest is not uniform, it only
     picks out the faces turned toward the light. Slope is quantised into
     a handful of buckets so the whole highlight is a few strokes. */
  const strokeSheen = (color, baseWidth, alpha) => {
    const buckets = [];
    let previous = -1;
    for (let i = 1; i < count; i += 1) {
      const slope = (samples[i] - samples[i - 1]) / step;
      const lit = clamp(0.5 + (slope * LIGHT) / 0.34, 0, 1);
      const bucket = Math.min(SHEEN_BANDS - 1, Math.floor(lit * SHEEN_BANDS));
      if (!buckets[bucket]) buckets[bucket] = new Path2D();
      const path = buckets[bucket];
      /* Start each run one sample back so neighbouring buckets overlap
         and the highlight never breaks into dashes. */
      if (bucket !== previous) path.moveTo((i - 1) * step, samples[i - 1]);
      path.lineTo(i * step, samples[i]);
      previous = bucket;
    }

    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const reach = alpha * mix(0.62, 1, detail);
    for (let b = 0; b < SHEEN_BANDS; b += 1) {
      const path = buckets[b];
      if (!path) continue;
      /* Cubic falloff: light collapses onto the few faces turned toward it
         instead of smearing evenly along the crest. */
      const t = (b + 0.5) / SHEEN_BANDS;
      const strength = t * t * t;
      ctx.globalAlpha = reach * strength;
      ctx.lineWidth = baseWidth * (0.55 + strength * 0.75);
      ctx.stroke(path);
    }
    ctx.globalAlpha = 1;
  };

  /* The leading edge of the flow: scroll pushes it left to right. */
  const headX = () => width * (0.04 + progress * 0.92);

  const drawCurrent = (line, time) => {
    const isTrio = line.into >= 0;
    /* Absorbed currents can disappear completely. Skip their path sampling
       once there is nothing left to paint. */
    const strokeAlpha = isTrio ? mix(0.8, 1, order) : 1 - ramp(order, 0.15, 0.8);
    if (strokeAlpha <= 0.01) return;

    sample(line, time);

    const band = palette.bands[isTrio ? line.into : 1];
    const bodyIn = isTrio ? order : 0;
    const surface = surfacePath();

    if (bodyIn > 0.01) {
      ctx.save();
      ctx.globalAlpha = bodyIn;

      /* Contact shadow the near wave throws on the water behind it, laid down
         before the body so the fill covers everything below the crest and only
         the part above it survives. Four widening passes of a very low alpha
         accumulate into a soft falloff; a canvas shadow gives the same result
         but costs enough per frame to drop the section below 60fps. */
      const cast = Math.max(9, line.amp * 0.8);
      for (let pass = 0; pass < 4; pass += 1) {
        const spread = (pass + 1) / 4;
        strokeOffset(surface, -cast * spread * 0.5, band.cast, cast * spread);
      }

      /* The mass of water. The gradient is anchored just above the highest
         crest so the tint does not drift with the band height. */
      const gradient = ctx.createLinearGradient(0, line.y - line.amp * 1.35, 0, height);
      gradient.addColorStop(0, band.body);
      gradient.addColorStop(0.55, band.body);
      gradient.addColorStop(1, band.deep);
      ctx.fillStyle = gradient;
      ctx.fill(bodyPath());

      /* The wave's own shaded face, hugging the surface from underneath.
         That dark step right below a bright lip is what reads as a lip
         instead of an outline. */
      const shade = Math.max(6, line.amp * 0.5);
      strokeOffset(surface, shade * 0.5 + 1.5, band.shade, shade);

      /* The far face of the same wave, seen through the near water. */
      strokeOffset(surface, line.amp * 1.5, band.under, 1);
      ctx.restore();
    }

    if (!isTrio) {
      /* Loose currents are still water, not wireframe: a faint sheet under
         the line gives them a surface to catch light on. */
      ctx.save();
      ctx.globalAlpha = strokeAlpha;
      ctx.fillStyle = palette.chaosVeil;
      ctx.fill(bodyPath());
      ctx.strokeStyle = palette.chaos;
      ctx.lineWidth = line.weight;
      ctx.lineJoin = "round";
      ctx.stroke(surface);
      ctx.restore();
      strokeSheen(palette.chaosSheen, line.weight * 0.9, strokeAlpha * 0.55);
      return;
    }

    ctx.save();
    ctx.globalAlpha = strokeAlpha;
    ctx.strokeStyle = order > 0.45 ? band.rim : palette.chaos;
    ctx.lineWidth = line.weight;
    ctx.lineJoin = "round";
    ctx.stroke(surface);
    ctx.restore();

    strokeSheen(band.sheen, line.weight, strokeAlpha * mix(0.25, 1, order));
  };

  /* Bright travelling front on the top trio line, so scrolling reads as
     the flow actually moving forward rather than a state toggle. */
  const drawHead = (line, time) => {
    const head = headX();
    const tail = Math.max(0, head - width * 0.22);
    const gradient = ctx.createLinearGradient(tail, 0, head, 0);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(1, palette.head);

    ctx.beginPath();
    for (let x = tail; x <= head; x += step) ctx.lineTo(x, surfaceY(line, x, time));
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.stroke();

    const y = surfaceY(line, head, time);
    const glow = ctx.createRadialGradient(head, y, 0, head, y, 46);
    glow.addColorStop(0, palette.headGlow);
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(head - 46, y - 46, 92, 92);

    ctx.beginPath();
    ctx.arc(head, y, 4.2, 0, TAU);
    ctx.fillStyle = palette.head;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head, y, 1.8, 0, TAU);
    ctx.fillStyle = palette.headCore;
    ctx.fill();
  };

  const drawFrame = (time) => {
    ctx.clearRect(0, 0, width, height);
    const resolved = CURRENTS.map((_, index) => currentAt(index));
    /* Back to front: absorbed currents first, then the trio bottom-up so
       each body of water layers over the one behind it. */
    const paintOrder = resolved
      .map((line, index) => ({ line, index }))
      .sort((a, b) => (a.line.into < 0 ? -1 : b.line.into < 0 ? 1 : a.line.into - b.line.into));
    paintOrder.forEach(({ line }) => drawCurrent(line, time));

    const front = resolved.find((line) => line.into === 0);
    if (front) drawHead(front, time);
    return front;
  };

  const setChapter = (next) => {
    if (next === chapter) return;
    chapter = next;
    section.dataset.flowChapter = String(next);
    steps.forEach((item, index) => {
      const isActive = index === next;
      item.classList.toggle("is-active", isActive);
      const button = item.querySelector("button");
      if (button) {
        if (isActive) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      }
    });
    lines.forEach((line, index) => line.classList.toggle("is-active", index === next));
  };

  /* Below 900px the tokens and stations are laid out by CSS, so the engine
     hands their positioning back instead of pinning them to canvas pixels. */
  const releaseNodes = () => {
    [...tokens, ...stations].forEach((node) => {
      node.style.transform = "";
      node.style.opacity = "";
    });
    stations.forEach((station) => station.style.removeProperty("--station-in"));
  };

  /* Tokens ride down into the current one after another and dissolve. */
  const placeTokens = (front, time) => {
    tokens.forEach((token, index) => {
      const spot = TOKEN_SPOTS[index] || TOKEN_SPOTS[0];
      const pull = ramp(progress, 0.16 + index * 0.07, 0.5 + index * 0.07);
      const x = width * mix(spot.x, spot.x + 0.05, pull);
      const restY = height * spot.y;
      const target = front ? surfaceY(front, x, time) : height * 0.7;
      const y = mix(restY, target, pull);
      const drift = Math.sin(time * 0.7 + index * 1.9) * 6 * (1 - pull);
      token.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + drift).toFixed(1)}px, 0) translate(-50%, -50%) rotate(${mix(spot.rot, 0, pull).toFixed(2)}deg) scale(${mix(1, 0.82, pull).toFixed(3)})`;
      // Gone before it touches the surface, so a token never overprints a
      // station label on its way into the water.
      token.style.opacity = (1 - ramp(pull, 0.08, 0.7)).toFixed(3);
    });
  };

  /* Stations sit on the water: the dot follows the wave surface. */
  const placeStations = (front, time) => {
    stations.forEach((station, index) => {
      const x = width * STATION_X[index];
      const y = front ? surfaceY(front, x, time) : height * 0.7;
      const reached = ramp(headX() / Math.max(1, width), STATION_X[index] - 0.06, STATION_X[index] + 0.02);
      station.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      station.style.setProperty("--station-in", reached.toFixed(3));
    });
  };

  const readProgress = () => {
    /* Without a pinned stage there is no runway to tell the story, so the
       compact layout shows the settled flow rather than a frame of chaos. */
    if (compactQuery.matches) {
      progress = 1;
      order = 1;
      setChapter(-1);
      section.style.setProperty("--flow-progress", "1");
      section.style.setProperty("--flow-order", "1");
      return;
    }
    const runway = Math.max(1, section.offsetHeight - window.innerHeight);
    const raw = clamp(-section.getBoundingClientRect().top / runway);
    /* The last stretch holds the finished flow instead of racing into the
       next section (see site-notes: let the final state breathe). */
    progress = clamp(raw / 0.86);
    order = ramp(progress, 0.12, 0.82);
    setChapter(progress < 0.34 ? 0 : progress < 0.7 ? 1 : 2);
    section.style.setProperty("--flow-progress", progress.toFixed(4));
    section.style.setProperty("--flow-order", order.toFixed(4));
  };

  const render = (time) => {
    const front = drawFrame(time);
    if (compactQuery.matches) {
      releaseNodes();
      return;
    }
    placeTokens(front, time);
    placeStations(front, time);
  };

  const STATIC_TIME = 5.6;

  const drawStatic = () => {
    /* Reduced motion and off-screen frames still show the finished flow. */
    if (motionQuery.matches && !compactQuery.matches) {
      progress = 1;
      order = 1;
      setChapter(2);
      section.style.setProperty("--flow-progress", "1");
      section.style.setProperty("--flow-order", "1");
    } else {
      readProgress();
    }
    render(STATIC_TIME);
  };

  const tick = (now) => {
    if (!running) return;
    const delta = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;
    elapsed += delta;
    pointerX += (pointerTargetX - pointerX) * 0.05;
    response += (responseTarget - response) * 0.05;
    readProgress();
    render(elapsed);
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
      drawStatic();
    }
  };

  /* Step buttons scroll to their own chapter, which keeps the rail usable
     by keyboard without a second set of controls. */
  const jumpTo = (index) => {
    /* The compact layout has no pinned runway, so a tap would scroll to an
       arbitrary point inside the section instead of to its chapter. */
    if (compactQuery.matches) return;
    const runway = Math.max(1, section.offsetHeight - window.innerHeight);
    const top = section.getBoundingClientRect().top + window.scrollY;
    const stops = [0.06, 0.44, 0.78];
    window.scrollTo({
      top: top + runway * stops[clamp(index, 0, 2)],
      behavior: motionQuery.matches ? "auto" : "smooth",
    });
  };

  const syncStepControls = () => {
    steps.forEach((item) => {
      const button = item.querySelector("button");
      if (button) button.disabled = compactQuery.matches;
    });
  };

  steps.forEach((item, index) => {
    const button = item.querySelector("button");
    if (button) button.addEventListener("click", () => jumpTo(index));
  });

  if (stage) {
    stage.addEventListener("pointermove", (event) => {
      const rect = stage.getBoundingClientRect();
      pointerTargetX = clamp((event.clientX - rect.left) / Math.max(1, rect.width));
      responseTarget = 1;
    });
    stage.addEventListener("pointerleave", () => {
      responseTarget = 0;
    });
  }

  syncTheme();
  resize();

  new ResizeObserver(() => {
    resize();
    if (!running) drawStatic();
  }).observe(stage || section);

  new MutationObserver(() => {
    syncTheme();
    if (!running) drawStatic();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      updateLoop();
    },
    { threshold: 0 }
  ).observe(section);

  document.addEventListener("visibilitychange", updateLoop);
  motionQuery.addEventListener?.("change", () => {
    resize();
    updateLoop();
  });
  compactQuery.addEventListener?.("change", () => {
    resize();
    syncStepControls();
    if (!running) drawStatic();
  });
  syncStepControls();
  drawStatic();
})();
