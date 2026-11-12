import { firebaseConfig, firestoreEmulatorHost, resourceLeadsCollection } from "./firebase-config.js";

/* resource-gate.js
   Soft resource gate for series entries on /resources.html.
   - resources-page.js renders the gate card (locked form + unlocked content).
     This module owns the unlock state and the Firestore write.
   - The code is never checked in the browser: the write to `resourceLeads`
     only succeeds when the Firestore rules accept the code hash, so a
     successful write is the unlock signal.
   - Unlock state lives in localStorage (`kif_pack:<gateId>`, no email) and in
     page memory for browsers without storage. Tabs sync via the storage event.
   - Firebase is loaded on demand (first focus into the form or submit) from
     the same CDN build feedback-page.js uses. */

const FIREBASE_VERSION = "12.7.0";
const FIREBASE_CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
const STORAGE_PREFIX = "kif_pack:";
const FORM_VERSION = 1;
const CONSENT_VERSION = 1;
const WRITE_TIMEOUT_MS = 15000;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REQUIRED_FIREBASE_FIELDS = ["apiKey", "authDomain", "projectId", "appId"];

const unlockedInMemory = new Set();
let firestorePromise = null;

const t = (key, fallback) => {
  const lang = document.documentElement.lang || "de";
  const table = typeof translations !== "undefined" ? translations[lang] : null;
  return (table && table[key]) || fallback;
};

const isFirebaseConfigured = () =>
  REQUIRED_FIREBASE_FIELDS.every((key) => {
    const value = String(firebaseConfig?.[key] || "").trim();
    return value && !value.includes("PASTE_") && !value.includes("YOUR_");
  });

/* ── unlock state ────────────────────────────────────────── */
const readStored = (gateId) => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + gateId);
    if (!raw) return null;
    const value = JSON.parse(raw);
    return value && typeof value.unlockedAt === "string" ? value : null;
  } catch {
    return null;
  }
};

const isUnlocked = (gateId) => !!gateId && (unlockedInMemory.has(gateId) || !!readStored(gateId));

const remember = (gateId, via) => {
  unlockedInMemory.add(gateId);
  try {
    localStorage.setItem(STORAGE_PREFIX + gateId, JSON.stringify({ unlockedAt: new Date().toISOString(), via }));
  } catch {
    /* Storage blocked: the in-memory flag keeps this page session open. */
  }
};

const setStatus = (form, message, { error = false, success = false } = {}) => {
  const status = form.querySelector(".resource-gate-status");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", error);
  status.classList.toggle("is-success", success);
};

const markUnavailable = (form) => {
  const button = form.querySelector(".resource-gate-submit");
  if (button) {
    button.disabled = true;
    button.dataset.unavailable = "true";
  }
  setStatus(form, t("gate_status_unavailable", "Freischaltung gerade nicht verfügbar. Bitte versuch es später noch einmal."), { error: true });
};

const refresh = () => {
  document.querySelectorAll(".resource-gate").forEach((gate) => {
    const unlocked = isUnlocked(gate.dataset.gateId);
    gate.classList.toggle("is-unlocked", unlocked);
    const locked = gate.querySelector(".resource-gate-locked");
    const open = gate.querySelector(".resource-gate-unlocked");
    if (locked) locked.hidden = unlocked;
    if (open) open.hidden = !unlocked;
    const form = gate.querySelector(".resource-gate-form");
    if (form && !unlocked && !isFirebaseConfigured()) markUnavailable(form);
  });
  // Header shortcut: "unlock the pack" while locked, "go to the pack" after.
  document.querySelectorAll("[data-gate-jump]").forEach((button) => {
    const unlocked = isUnlocked(button.dataset.gateJump);
    button.classList.toggle("is-unlocked", unlocked);
    button.querySelectorAll("[data-gate-when]").forEach((label) => {
      label.hidden = (label.dataset.gateWhen === "unlocked") !== unlocked;
    });
  });
};

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setPending = (form, pending) => {
  const icon = form.querySelector(".resource-gate-submit i");
  if (!icon) return;
  icon.className = pending ? "fas fa-circle-notch fa-spin" : "fas fa-unlock";
};

// Restart the shake so a second wrong attempt animates again.
const shake = (element) => {
  if (!element || reducedMotion()) return;
  element.classList.remove("is-shake");
  void element.offsetWidth;
  element.classList.add("is-shake");
};

/* ── Firebase (lazy) ─────────────────────────────────────── */
const loadFirestore = () => {
  if (!firestorePromise) {
    firestorePromise = (async () => {
      const [{ initializeApp, getApps, getApp }, firestore] = await Promise.all([
        import(`${FIREBASE_CDN}/firebase-app.js`),
        import(`${FIREBASE_CDN}/firebase-firestore.js`),
      ]);
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const db = firestore.getFirestore(app);
      if (firestoreEmulatorHost) {
        const [host, port] = firestoreEmulatorHost.split(":");
        firestore.connectFirestoreEmulator(db, host, Number(port) || 8080);
      }
      return {
        db,
        addDoc: firestore.addDoc,
        collection: firestore.collection,
        serverTimestamp: firestore.serverTimestamp,
      };
    })().catch((error) => {
      firestorePromise = null;
      throw error;
    });
  }
  return firestorePromise;
};

const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error("Gate write timed out");
      error.code = "timeout";
      reject(error);
    }, ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });

const plainText = (element) => (element?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 800);

const clip = (value, max) => String(value || "").slice(0, max);

/* ── submit ──────────────────────────────────────────────── */
const handleSubmit = async (form) => {
  const gate = form.closest(".resource-gate");
  if (!gate || form.dataset.pending === "true") return;
  const gateId = gate.dataset.gateId;
  if (isUnlocked(gateId)) { refresh(); return; }

  const emailInput = form.elements.namedItem("email");
  const codeInput = form.elements.namedItem("code");
  const consentInput = form.elements.namedItem("consent");
  const marketingInput = form.elements.namedItem("marketing");
  const email = String(emailInput?.value || "").trim().toLowerCase();
  const code = String(codeInput?.value || "").trim().toUpperCase();

  [emailInput, codeInput, consentInput].forEach((el) => el?.setAttribute("aria-invalid", "false"));

  if (code.length < 4 || code.length > 32) {
    codeInput?.setAttribute("aria-invalid", "true");
    setStatus(form, t("gate_status_missing_code", "Bitte gib den Code aus dem Video ein."), { error: true });
    codeInput?.focus();
    return;
  }
  if (!EMAIL_RE.test(email) || email.length < 5 || email.length > 254) {
    emailInput?.setAttribute("aria-invalid", "true");
    setStatus(form, t("gate_status_invalid_email", "Bitte gib eine gültige E-Mail-Adresse ein."), { error: true });
    emailInput?.focus();
    return;
  }
  if (!consentInput?.checked) {
    consentInput?.setAttribute("aria-invalid", "true");
    setStatus(form, t("gate_status_consent", "Bitte kreuze die Einwilligung an, damit wir deine E-Mail speichern dürfen."), { error: true });
    consentInput?.focus();
    return;
  }
  if (!isFirebaseConfigured()) {
    markUnavailable(form);
    return;
  }

  // The rules tie each code hash to one part. The visitor may be looking at
  // a later part while holding the code from part 1, so try the active part
  // first and fall back to the others. A rejected attempt writes nothing.
  const parts = (gate.dataset.partOrder || gate.dataset.partId || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const button = form.querySelector(".resource-gate-submit");
  form.dataset.pending = "true";
  gate.setAttribute("aria-busy", "true");
  if (button) button.disabled = true;
  setStatus(form, t("gate_status_sending", "Wird gesendet …"));
  setPending(form, true);

  try {
    const fb = await loadFirestore();
    let via = null;
    for (const part of parts) {
      const payload = {
        formVersion: FORM_VERSION,
        createdAt: fb.serverTimestamp(),
        email,
        code,
        pack: gateId,
        part,
        consent: true,
        consentText: plainText(form.querySelector("[data-consent-text]")),
        marketingConsent: !!marketingInput?.checked,
        marketingConsentText: plainText(form.querySelector("[data-marketing-text]")),
        consentVersion: CONSENT_VERSION,
        doubleOptIn: "pending",
        language: clip(document.documentElement.lang || "de", 8),
        page: clip(`${location.pathname}${location.hash}`, 240),
        submittedAtClient: clip(new Date().toISOString(), 40),
      };
      try {
        await withTimeout(fb.addDoc(fb.collection(fb.db, resourceLeadsCollection), payload), WRITE_TIMEOUT_MS);
        via = part;
        break;
      } catch (error) {
        if (error?.code === "permission-denied") continue;
        throw error;
      }
    }

    if (!via) {
      codeInput?.setAttribute("aria-invalid", "true");
      setStatus(form, t("gate_status_wrong_code", "Der Code stimmt nicht. Schau noch einmal ins Video."), { error: true });
      shake(codeInput);
      codeInput?.focus();
      codeInput?.select?.();
      return;
    }

    remember(gateId, via);
    setStatus(form, t("gate_status_success", "Freigeschaltet! Viel Spaß mit dem Paket."), { success: true });
    refresh();
    gate.classList.add("is-just-unlocked");
    gate.querySelector(".resource-gate-unlocked-line")?.focus({ preventScroll: true });
    gate.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  } catch (error) {
    // Network, timeout or a failed CDN import. Nothing was confirmed, so the
    // gate stays locked and the visitor can retry.
    const unavailable = error?.message?.includes("import") || error?.name === "TypeError";
    setStatus(
      form,
      unavailable
        ? t("gate_status_unavailable", "Freischaltung gerade nicht verfügbar. Bitte versuch es später noch einmal.")
        : t("gate_status_network", "Gerade keine Verbindung. Bitte versuch es gleich noch einmal."),
      { error: true }
    );
  } finally {
    form.dataset.pending = "false";
    setPending(form, false);
    gate.removeAttribute("aria-busy");
    if (button && button.dataset.unavailable !== "true") button.disabled = false;
  }
};

/* ── wiring ──────────────────────────────────────────────── */
document.addEventListener("submit", (event) => {
  const form = event.target.closest?.(".resource-gate-form");
  if (!form) return;
  event.preventDefault();
  handleSubmit(form);
});

// Typing clears the error on that field; the code is normalised as typed.
document.addEventListener("input", (event) => {
  const input = event.target;
  const form = input.closest?.(".resource-gate-form");
  if (!form) return;
  if (input.name === "code") {
    const clean = input.value.replace(/\s+/g, "").toUpperCase();
    if (clean !== input.value) input.value = clean;
  }
  if (input.getAttribute("aria-invalid") === "true") {
    input.setAttribute("aria-invalid", "false");
    const status = form.querySelector(".resource-gate-status");
    if (status?.classList.contains("is-error")) setStatus(form, "");
  }
});
document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.name !== "consent" || !input.closest?.(".resource-gate-form")) return;
  if (input.checked && input.getAttribute("aria-invalid") === "true") {
    input.setAttribute("aria-invalid", "false");
    setStatus(input.form, "");
  }
});

// Header shortcut: scroll to the gate; while locked, put the cursor in the code field.
document.addEventListener("click", (event) => {
  const button = event.target.closest?.("[data-gate-jump]");
  if (!button) return;
  const gate = document.querySelector(`.resource-gate[data-gate-id="${CSS.escape(button.dataset.gateJump)}"]`);
  if (!gate) return;
  gate.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  const target = isUnlocked(gate.dataset.gateId)
    ? gate.querySelector(".resource-gate-unlocked-line")
    : gate.querySelector('input[name="code"]');
  target?.focus({ preventScroll: true });
});

// Warm up the SDK as soon as the visitor touches the form.
document.addEventListener("focusin", (event) => {
  if (!event.target.closest?.(".resource-gate-form") || !isFirebaseConfigured()) return;
  loadFirestore().catch(() => { /* Reported on submit. */ });
});

window.addEventListener("storage", (event) => {
  if (!event.key?.startsWith(STORAGE_PREFIX) || !event.newValue) return;
  refresh();
});

window.KIResourceGate = { isUnlocked, refresh, storagePrefix: STORAGE_PREFIX };
refresh();
