import { WAVES } from './logo-waves.js';

// Disc radius in metres (0.5 m radius = 1 m tall logo), extrusion depth.
export const R = 0.5;
export const DEPTH = 0.15;
const CUT = 0.995; // waves are clamped just inside the rim

function clampR(x, y, cut = CUT) {
  const l = Math.hypot(x, y);
  return l > cut ? [x * cut / l, y * cut / l] : [x, y];
}

// Extrapolate a traced stripe past the circle edge so it reads as cut by the rim.
function extend(s) {
  const x = s.x.slice(), top = s.top.slice(), bot = s.bot.slice();
  const n = x.length, k = 6, steps = 24, span = 0.35;
  const sl = (a) => (a[k] - a[0]) / (x[k] - x[0]);
  const sr = (a) => (a[n - 1] - a[n - 1 - k]) / (x[n - 1] - x[n - 1 - k]);
  const slT = sl(top), slB = sl(bot), srT = sr(top), srB = sr(bot);
  const X0 = x[0], T0 = top[0], B0 = bot[0];
  const X1 = x[n - 1], T1 = top[n - 1], B1 = bot[n - 1];
  const L = { x: [], top: [], bot: [] };
  for (let i = steps; i >= 1; i--) {
    const dx = -span * i / steps;
    L.x.push(X0 + dx); L.top.push(T0 + slT * dx); L.bot.push(B0 + slB * dx);
  }
  const Rt = { x: [], top: [], bot: [] };
  for (let i = 1; i <= steps; i++) {
    const dx = span * i / steps;
    Rt.x.push(X1 + dx); Rt.top.push(T1 + srT * dx); Rt.bot.push(B1 + srB * dx);
  }
  return {
    x: [...L.x, ...x, ...Rt.x],
    top: [...L.top, ...top, ...Rt.top],
    bot: [...L.bot, ...bot, ...Rt.bot],
  };
}

// Gaussian-ish smoothing of a traced scanline array, then spline resampling —
// kills the pixel stair-stepping that shows up on the extruded bevels.
function smooth(a, passes = 6) {
  let v = a.slice();
  for (let p = 0; p < passes; p++) {
    const o = v.slice();
    for (let i = 1; i < v.length - 1; i++) v[i] = (o[i - 1] + 2 * o[i] + o[i + 1]) / 4;
  }
  return v;
}

function splineEdge(THREE, xs, ys, out = 190) {
  const step = Math.max(1, Math.floor(xs.length / 46));
  const ctrl = [];
  for (let i = 0; i < xs.length; i += step) ctrl.push(new THREE.Vector2(xs[i], ys[i]));
  const last = xs.length - 1;
  ctrl.push(new THREE.Vector2(xs[last], ys[last]));
  return new THREE.SplineCurve(ctrl).getPoints(out).map((p) => [p.x, p.y]);
}

function stripePoints(THREE, s, cut = CUT) {
  const e = extend({ x: s.x, top: smooth(s.top), bot: smooth(s.bot) });
  const top = splineEdge(THREE, e.x, e.top);
  const bot = splineEdge(THREE, e.x, e.bot);
  const pts = [];
  const push = ([x, y]) => {
    const [cx, cy] = clampR(x, y, cut);
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(last[0] - cx, last[1] - cy) > 6e-4) pts.push([cx, cy]);
  };
  top.forEach(push);
  for (let i = bot.length - 1; i >= 0; i--) push(bot[i]);
  return pts;
}

export function buildLogo(THREE, { standing = true } = {}) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1, 0, Math.PI * 2, false);
  for (const s of WAVES) {
    const path = new THREE.Path();
    const pts = stripePoints(THREE, s);
    path.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
    path.closePath();
    shape.holes.push(path);
  }

  const bevel = 0.026;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: (DEPTH / R) - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 6,
    curveSegments: 128,
  });
  geo.scale(R, R, R);
  geo.center();
  geo.computeVertexNormals();

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0292f1,
    roughness: 0.28,
    metalness: 0.05,
    clearcoat: 0.5,
    clearcoatRoughness: 0.14,
    envMapIntensity: 0.8,
  });
  material.name = 'logo_blue';

  const mesh = new THREE.Mesh(geo, material);
  mesh.name = 'flowstate_mark';
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // White inserts sitting inside the three wave channels only — no white
  // anywhere behind the disc. Slightly inset so a hairline of blue shows.
  const fillMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0,
    emissive: 0xffffff,
    emissiveIntensity: 0.12,
    clearcoat: 0.75,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.7,
  });
  fillMat.name = 'wave_white';

  const INSET = 0.012;      // shrink each band so blue edges stay visible
  const FILL_D = 0.13;      // insert thickness — spans the disc so white shows front and back
  const RECESS = 0.010;     // how far behind the blue front face it sits
  const fills = WAVES.map((s, i) => {
    const inner = { x: s.x, top: s.top.map((v) => v - INSET), bot: s.bot.map((v) => v + INSET) };
    const pts = stripePoints(THREE, inner, 0.968);
    const shp = new THREE.Shape();
    shp.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) shp.lineTo(pts[k][0], pts[k][1]);
    shp.closePath();
    const g = new THREE.ExtrudeGeometry(shp, {
      depth: FILL_D / R,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 3,
      curveSegments: 64,
    });
    g.scale(R, R, R);
    g.translate(0, 0, DEPTH / 2 - RECESS - FILL_D);    g.computeVertexNormals();
    const m = new THREE.Mesh(g, fillMat);
    m.name = `wave_insert_${i + 1}`;
    m.castShadow = false;
    m.receiveShadow = true;
    return m;
  });

  const group = new THREE.Group();
  group.name = 'flowstate_logo';
  fills.forEach((f) => group.add(f));
  group.add(mesh);
  if (standing) group.position.y = R; // base resting at y = 0
  return group;
}
