import * as THREE from 'three';
import { buildLogo } from './logo-model.js';

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function nearestEquivalent(target, value) {
  return target + Math.round((value - target) / TAU) * TAU;
}

function studioEnvironment() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;

  const context = canvas.getContext('2d');
  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#ffffff');
  sky.addColorStop(0.45, '#dfe9f2');
  sky.addColorStop(0.62, '#9fb0c0');
  sky.addColorStop(1, '#4c5762');
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const softbox = (x, y, width, height, alpha) => {
    const light = context.createRadialGradient(
      x + width / 2,
      y + height / 2,
      0,
      x + width / 2,
      y + height / 2,
      width / 2
    );
    light.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    light.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = light;
    context.fillRect(x, y, width, height);
  };

  softbox(40, 10, 220, 150, 1);
  softbox(300, 40, 170, 120, 0.7);
  softbox(150, 150, 260, 110, 0.35);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function mountHeroLogo(container, { backgroundMode = false } = {}) {
  const landingSlot = container.closest('.hero-logo-slot');
  if (!landingSlot) {
    throw new Error('The hero logo requires a .hero-logo-slot landing element.');
  }

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = reducedMotionQuery.matches;

  container.classList.toggle('is-background-mode', backgroundMode);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const cameraDistance = backgroundMode ? 2.3 : 2.48;
  camera.position.set(0, 0, cameraDistance);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, backgroundMode ? 1.35 : 2)
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.domElement.className = 'hero-logo-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const environment = studioEnvironment();
  scene.environment = environment;
  scene.environmentIntensity = 0.62;

  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x8aa6bf, 0.24);
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(2.5, 3, 4);
  const fill = new THREE.DirectionalLight(0xcfe6ff, 0.42);
  fill.position.set(-3, -1, 2);
  const specular = new THREE.PointLight(0xf4fcff, 3.7, 12, 2);
  specular.position.set(-1.8, 1.4, 2.1);
  const accentLight = new THREE.PointLight(0x63cfff, 1.8, 10, 2);
  accentLight.position.set(1.8, -0.8, 1.6);
  const rim = new THREE.DirectionalLight(0xffffff, 1.3);
  rim.position.set(-2.2, 1.6, -2.5);
  scene.add(hemisphere, key, fill, specular, accentLight, rim);

  const logo = buildLogo(THREE, { standing: false });
  const brandMesh = logo.getObjectByName('flowstate_mark');
  if (brandMesh?.material) {
    brandMesh.material.color.setHex(0x0292f1);
    brandMesh.material.emissive.setHex(0x0067a7);
    brandMesh.material.emissiveIntensity = 0.16;
    brandMesh.material.roughness = 0.24;
    brandMesh.material.clearcoat = 0.72;
    brandMesh.material.clearcoatRoughness = 0.1;
    brandMesh.material.envMapIntensity = 1.05;
  }

  const waveMesh = logo.getObjectByName('wave_insert_1');
  if (waveMesh?.material) {
    waveMesh.material.color.setHex(0xffffff);
    waveMesh.material.emissive.setHex(0xffffff);
    waveMesh.material.emissiveIntensity = 0.2;
    waveMesh.material.roughness = 0.24;
    waveMesh.material.envMapIntensity = 2;
  }

  const fallRoot = new THREE.Group();
  const rotationRoot = new THREE.Group();
  rotationRoot.add(logo);
  fallRoot.add(rotationRoot);
  scene.add(fallRoot);

  const rest = { x: -0.035, y: -0.18, z: 0 };
  const startsAtRest = reducedMotion || backgroundMode;
  const motion = {
    x: startsAtRest ? rest.x : -0.16,
    y: startsAtRest ? rest.y : 0.96,
    z: startsAtRest ? rest.z : -0.12,
    vx: startsAtRest ? 0 : 0.16,
    vy: startsAtRest ? 0 : -0.92,
    vz: startsAtRest ? 0 : 0.18,
  };

  const gravity = 2600;
  const restitution = 0.32;
  let siteOffsetY = 0;
  let siteVelocity = 0;
  let landingDistance = 1;
  let bounceCount = 0;
  let entrySettled = startsAtRest;
  let entryPrepared = false;
  let entryStartsAt = performance.now() + 180;
  let returnStartsAt = performance.now();

  let dragging = false;
  let activePointer = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastPointerTime = 0;

  let disposed = false;
  let inView = true;
  let loopRunning = false;
  let previousFrame = performance.now();
  const animationStartedAt = previousFrame;

  function syncLandingRect() {
    if (!entryPrepared || entrySettled) return;
    const rect = landingSlot.getBoundingClientRect();
    container.style.left = `${rect.left}px`;
    container.style.top = `${rect.top}px`;
    container.style.width = `${rect.width}px`;
    container.style.height = `${rect.height}px`;
  }

  function prepareEntry() {
    if (reducedMotion || backgroundMode || entryPrepared) return;
    const rect = landingSlot.getBoundingClientRect();
    landingDistance = Math.max(1, rect.top + rect.height * 0.9);
    siteOffsetY = -landingDistance;
    siteVelocity = 0;
    entryPrepared = true;
    container.classList.add('is-site-dropping');
    document.body.appendChild(container);
    syncLandingRect();
    container.style.transform = `translate3d(0, ${siteOffsetY}px, 0)`;
  }

  function restoreToLandingSlot() {
    if (container.parentElement !== landingSlot) {
      landingSlot.appendChild(container);
    }
    container.classList.remove('is-site-dropping');
    container.style.removeProperty('left');
    container.style.removeProperty('top');
    container.style.removeProperty('width');
    container.style.removeProperty('height');
    container.style.removeProperty('transform');
  }

  function resize() {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || width;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = cameraDistance / Math.min(1, camera.aspect);
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (reducedMotion && !dragging) updateLoop();
  });
  resizeObserver.observe(container);
  resize();
  prepareEntry();

  function updateShadow() {
    const heightRatio = clamp(Math.abs(siteOffsetY) / landingDistance, 0, 1);
    const hoverLift = entrySettled && !reducedMotion ? 0.03 : 0;
    const opacity = 0.28 - heightRatio * 0.2 - hoverLift;
    const scale = 1 - heightRatio * 0.42;
    landingSlot.style.setProperty('--logo-shadow-opacity', opacity.toFixed(3));
    landingSlot.style.setProperty('--logo-shadow-scale', scale.toFixed(3));
  }

  function settleEntry(now) {
    entrySettled = true;
    siteOffsetY = 0;
    siteVelocity = 0;
    returnStartsAt = now;
    restoreToLandingSlot();
  }

  function updateEntry(now, delta) {
    if (entrySettled || now < entryStartsAt) return;

    siteVelocity += gravity * delta;
    siteOffsetY += siteVelocity * delta;
    motion.x += motion.vx * delta;
    motion.y += motion.vy * delta;
    motion.z += motion.vz * delta;

    const airDrag = Math.exp(-0.42 * delta);
    motion.vx *= airDrag;
    motion.vy *= airDrag;
    motion.vz *= airDrag;

    if (siteOffsetY < 0) return;

    siteOffsetY = 0;
    siteVelocity = -siteVelocity * restitution;
    motion.vx *= 0.68;
    motion.vy *= 0.68;
    motion.vz *= 0.68;
    bounceCount += 1;

    if (bounceCount >= 3 || Math.abs(siteVelocity) < 70) {
      settleEntry(now);
    }
  }

  function springAxis(value, velocity, target, delta) {
    const stiffness = 19;
    const damping = 7.6;
    const acceleration = (target - value) * stiffness - velocity * damping;
    velocity += acceleration * delta;
    value += velocity * delta;
    return [value, velocity];
  }

  function updateRotation(now, delta) {
    if (dragging || !entrySettled) return;

    if (now < returnStartsAt) {
      motion.x += motion.vx * delta;
      motion.y += motion.vy * delta;
      motion.z += motion.vz * delta;
      const inertiaDrag = Math.exp(-3.1 * delta);
      motion.vx *= inertiaDrag;
      motion.vy *= inertiaDrag;
      motion.vz *= inertiaDrag;
      motion.x = clamp(motion.x, -1.18, 1.18);
      return;
    }

    const targetY = nearestEquivalent(rest.y, motion.y);
    [motion.x, motion.vx] = springAxis(motion.x, motion.vx, rest.x, delta);
    [motion.y, motion.vy] = springAxis(motion.y, motion.vy, targetY, delta);
    [motion.z, motion.vz] = springAxis(motion.z, motion.vz, rest.z, delta);

    if (
      Math.abs(motion.x - rest.x) < 0.0005 &&
      Math.abs(motion.y - targetY) < 0.0005 &&
      Math.abs(motion.z - rest.z) < 0.0005 &&
      Math.abs(motion.vx) + Math.abs(motion.vy) + Math.abs(motion.vz) < 0.004
    ) {
      motion.x = rest.x;
      motion.y = rest.y;
      motion.z = rest.z;
      motion.vx = 0;
      motion.vy = 0;
      motion.vz = 0;
    }
  }

  function renderFrame(now) {
    const delta = Math.min((now - previousFrame) / 1000, 1 / 24);
    const time = (now - animationStartedAt) / 1000;
    previousFrame = now;

    if (!dragging) {
      updateEntry(now, delta);
      updateRotation(now, delta);
    }

    if (backgroundMode) {
      const mobileMotion = reducedMotion ? 0 : 1;
      fallRoot.position.y = mobileMotion * Math.sin(time * 0.54) * 0.014;
      rotationRoot.rotation.set(
        rest.x + mobileMotion * Math.sin(time * 0.41) * 0.055,
        rest.y + mobileMotion * time * 0.33,
        mobileMotion * Math.sin(time * 0.29) * 0.025
      );
    } else {
      const ambient = entrySettled && !dragging && !reducedMotion ? 1 : 0;
      const hover = ambient * Math.sin(time * 0.72) * 0.018;
      fallRoot.position.y = hover;
      rotationRoot.rotation.set(
        motion.x + ambient * Math.sin(time * 0.58) * 0.018,
        motion.y + ambient * Math.sin(time * 0.44) * 0.035,
        motion.z + ambient * Math.sin(time * 0.34) * 0.015
      );
    }

    if (!reducedMotion) {
      scene.environmentRotation.y = time * 0.24;
      key.position.set(
        2.6 * Math.cos(time * 0.38) + 0.5,
        2.8 + Math.sin(time * 0.31) * 0.55,
        3.8
      );
      specular.position.set(
        Math.sin(time * 0.86) * 2.15,
        1.05 + Math.cos(time * 0.67) * 1.05,
        2.15
      );
      specular.intensity = 3.55 + Math.sin(time * 1.12) * 0.65;
      accentLight.position.set(
        Math.cos(time * 0.72) * 1.75,
        -0.65 + Math.sin(time * 0.58) * 0.8,
        1.65
      );
      accentLight.intensity = 1.55 + Math.cos(time * 0.94) * 0.4;
    }

    if (!entrySettled) {
      container.style.transform = `translate3d(0, ${siteOffsetY}px, 0)`;
    }

    updateShadow();
    renderer.render(scene, camera);

    if (!container.classList.contains('is-ready')) {
      container.classList.add('is-ready');
    }
  }

  function updateLoop() {
    if (disposed) return;
    const canRender = inView && !document.hidden;
    const shouldRun = canRender && (!reducedMotion || dragging);
    if (shouldRun !== loopRunning) {
      loopRunning = shouldRun;
      previousFrame = performance.now();
      renderer.setAnimationLoop(shouldRun ? renderFrame : null);
    }
    if (!shouldRun && canRender && reducedMotion && !dragging) {
      renderFrame(performance.now());
    }
  }

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      updateLoop();
    },
    { rootMargin: '120px 0px' }
  );
  intersectionObserver.observe(landingSlot);

  function onVisibilityChange() {
    updateLoop();
  }

  function onViewportChange() {
    syncLandingRect();
  }

  function onPointerDown(event) {
    if (backgroundMode || event.button !== 0) return;
    dragging = true;
    activePointer = event.pointerId;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastPointerTime = performance.now();
    settleEntry(lastPointerTime);
    returnStartsAt = Number.POSITIVE_INFINITY;
    motion.vx = 0;
    motion.vy = 0;
    motion.vz = 0;
    container.setPointerCapture(event.pointerId);
    container.classList.add('is-grabbing', 'is-interacted');
    updateLoop();
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== activePointer) return;

    const now = performance.now();
    const delta = Math.max((now - lastPointerTime) / 1000, 1 / 120);
    const moveX = event.clientX - lastPointerX;
    const moveY = event.clientY - lastPointerY;
    const yaw = moveX * 0.012;
    const pitch = moveY * 0.009;

    motion.y += yaw;
    motion.x = clamp(motion.x + pitch, -1.18, 1.18);
    motion.vy = clamp(yaw / delta, -9, 9);
    motion.vx = clamp(pitch / delta, -7, 7);
    motion.vz = clamp(-moveX * 0.0015 / delta, -2.5, 2.5);

    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastPointerTime = now;
  }

  function endDrag(event) {
    if (!dragging || (event.pointerId != null && event.pointerId !== activePointer)) return;
    dragging = false;
    activePointer = null;
    container.classList.remove('is-grabbing');

    if (reducedMotion) {
      motion.x = rest.x;
      motion.y = rest.y;
      motion.z = rest.z;
      motion.vx = 0;
      motion.vy = 0;
      motion.vz = 0;
      returnStartsAt = performance.now();
    } else {
      returnStartsAt = performance.now() + 360;
    }
    updateLoop();
  }

  function onReducedMotionChange(event) {
    reducedMotion = event.matches;
    if (reducedMotion) {
      settleEntry(performance.now());
      motion.x = rest.x;
      motion.y = rest.y;
      motion.z = rest.z;
      motion.vx = 0;
      motion.vy = 0;
      motion.vz = 0;
    }
    updateLoop();
  }

  function onContextLost() {
    container.classList.remove('is-ready');
    container.classList.add('is-fallback');
  }

  function onContextRestored() {
    container.classList.remove('is-fallback');
    container.classList.add('is-ready');
    updateLoop();
  }

  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', endDrag);
  container.addEventListener('lostpointercapture', endDrag);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('scroll', onViewportChange, { passive: true });
  reducedMotionQuery.addEventListener('change', onReducedMotionChange);
  updateLoop();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange);
      reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', endDrag);
      container.removeEventListener('pointercancel', endDrag);
      container.removeEventListener('lostpointercapture', endDrag);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      logo.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else if (object.material) {
          object.material.dispose();
        }
      });

      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      restoreToLandingSlot();
      container.classList.remove(
        'is-ready',
        'is-grabbing',
        'is-interacted',
        'is-background-mode'
      );
      landingSlot.style.removeProperty('--logo-shadow-opacity');
      landingSlot.style.removeProperty('--logo-shadow-scale');
    },
  };
}
