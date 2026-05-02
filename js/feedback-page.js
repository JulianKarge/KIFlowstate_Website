import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { feedbackCollection, firebaseConfig } from "./firebase-config.js";

/* feedback-page.js
   Customer questionnaire at /feedback.html.
   - Renders one continuous wave-slider (0–100%) per .wave-question
     placeholder. Native <input type="range"> drives interaction;
     a stylized SVG wave fills left → right as the value rises.
   - Chip-radio for "Wie haben Sie uns gefunden?" with a reveal-on-Sonstiges
     freitext field.
   - Writes submissions to Cloud Firestore.
   - Re-translates labels on language switch (DE ⇄ EN). */

(function () {
  "use strict";

  const DEFAULT_FEEDBACK_COLLECTION = feedbackCollection || "feedbackSubmissions";
  const REQUIRED_FIREBASE_FIELDS = ["apiKey", "authDomain", "projectId", "appId"];
  let feedbackDb = null;

  // Wave geometry. One calm body wave per side (BG + FILL), no animation,
  // no crest highlight — read as a still water surface. The path is
  // bounded to the SVG viewBox so the BG and the clipped FILL line up
  // perfectly at the boundary (no out-of-bounds artefacts).
  const WAVE_VIEW_W = 600;
  const WAVE_VIEW_H = 60;
  const WAVE_BASE_Y = 32;
  const WAVE_LENGTH = 150; // → 4 humps across the track
  const WAVE_AMP = 11;

  // Wave formula. Using -cos puts a crest at x=0 and at every multiple
  // of WAVE_LENGTH (= every 25% of the track), so the peaks line up
  // with the tick marks at 0 / 25 / 50 / 75 / 100 %. SVG +Y is down,
  // so subtracting amp pushes the curve UP into a crest.
  function waveYAt(x) {
    return WAVE_BASE_Y - WAVE_AMP * Math.cos((2 * Math.PI * x) / WAVE_LENGTH);
  }

  // Sample-and-bezier path generator. Each half-period bezier runs from
  // one baseline crossing to the next, with control points pulled to the
  // mid-period extremum — that gives smooth domes and bowls.
  //
  // Because crests now land on the viewBox edges (0, 150, 300, 450, 600),
  // we start the walk one quarter-period BEFORE the viewBox so the first
  // bezier still begins on a baseline. The SVG viewBox clips the
  // overflow on either side. Without this offset, the bezier control
  // points at the very first/last extremum sit at the baseline
  // (mid-period) and pull the crest into a sharp point.
  function buildWavePath() {
    const startX = -WAVE_LENGTH / 4;
    const endX = WAVE_VIEW_W + WAVE_LENGTH / 4;
    const halfWL = WAVE_LENGTH / 2;

    let d = "M " + startX + " " + waveYAt(startX).toFixed(2);
    let x = startX;
    while (x < endX) {
      const nextX = x + halfWL;
      const midY = waveYAt(x + halfWL / 2);
      const nextY = waveYAt(nextX);
      const cp1X = x + halfWL * 0.35;
      const cp2X = nextX - halfWL * 0.35;
      d +=
        " C " + cp1X.toFixed(2) + " " + midY.toFixed(2) +
        ", " + cp2X.toFixed(2) + " " + midY.toFixed(2) +
        ", " + nextX.toFixed(2) + " " + nextY.toFixed(2);
      x = nextX;
    }
    d += " L " + endX + " " + WAVE_VIEW_H + " L " + startX + " " + WAVE_VIEW_H + " Z";
    return d;
  }

  function buildWaveSvg(className, bodyFill) {
    const body = buildWavePath();
    return (
      '<svg class="' + className + '" ' +
        'viewBox="0 0 ' + WAVE_VIEW_W + ' ' + WAVE_VIEW_H + '" ' +
        'preserveAspectRatio="none" aria-hidden="true">' +
        '<path d="' + body + '" fill="' + bodyFill + '" />' +
      '</svg>'
    );
  }


  document.addEventListener("DOMContentLoaded", init);

  function init() {
    renderWaveQuestions();
    wireChipGroups();
    wireFormSubmit();
    wireTranslationHook();
    wireTextareaPlaceholders();
  }

  /* ───────────────────────────────────────────────────────────
     Wave-slider rendering
     ─────────────────────────────────────────────────────────── */

  function renderWaveQuestions() {
    document.querySelectorAll(".wave-question").forEach((q) => {
      const name = q.dataset.name;
      const required = q.dataset.required === "true";
      const qKey = q.dataset.questionKey || "";
      const lowKey = q.dataset.lowKey || "";
      const highKey = q.dataset.highKey || "";

      const qText = t(qKey, qKey);
      const lowText = t(lowKey, "");
      const highText = t(highKey, "");

      q.innerHTML =
        '<div class="wave-question-head">' +
          '<label class="feedback-q-label" for="slider-' + escapeAttr(name) + '">' +
            '<span data-translate="' + qKey + '">' + escapeHtml(qText) + '</span>' +
            (required ? ' <span class="req-mark" aria-hidden="true">*</span>' : "") +
          '</label>' +
          '<span class="wave-percentage" aria-hidden="true">—</span>' +
        '</div>' +

        '<div class="wave-slider" data-touched="false" style="--pct:0%">' +
          '<div class="wave-slider-track">' +
            buildWaveSvg("wave-slider-bg", "#cdd8ee") +
            '<div class="wave-slider-fill-clip">' +
              buildWaveSvg("wave-slider-fill", "url(#kif-wave-grad)") +
            '</div>' +
            '<input type="range" class="wave-slider-input" ' +
              'id="slider-' + escapeAttr(name) + '" ' +
              'name="' + escapeAttr(name) + '" ' +
              'min="0" max="100" step="1" value="0" ' +
              (required ? 'data-required="true" ' : "") +
              'aria-label="' + escapeAttr(qText) + '" />' +
          '</div>' +

          '<div class="wave-slider-scale" aria-hidden="true">' +
            '<span style="--at:25%">25&thinsp;%</span>' +
            '<span style="--at:50%">50&thinsp;%</span>' +
            '<span style="--at:75%">75&thinsp;%</span>' +
          '</div>' +

          '<div class="wave-slider-edges">' +
            '<span data-translate="' + lowKey + '">' + escapeHtml(lowText) + '</span>' +
            '<span data-translate="' + highKey + '">' + escapeHtml(highText) + '</span>' +
          '</div>' +

          '<p class="wave-slider-hint" data-translate="feedback_slider_hint">' +
            escapeHtml(t("feedback_slider_hint", "Klicken oder ziehen, um zu bewerten")) +
          '</p>' +
        '</div>';

      const slider = q.querySelector(".wave-slider");
      const input = q.querySelector(".wave-slider-input");
      const percentage = q.querySelector(".wave-percentage");

      const clearError = () => {
        slider.classList.remove("has-error");
        const err = q.querySelector(".wave-error");
        if (err) err.remove();
      };

      const update = (markTouched) => {
        const v = parseInt(input.value, 10) || 0;
        slider.style.setProperty("--pct", v + "%");
        if (markTouched) {
          slider.dataset.touched = "true";
          percentage.textContent = v + " %";
          percentage.classList.add("is-set");
          clearError();
        }
      };

      // Both 'input' (continuous, fires during drag) and 'change' (after release)
      // mark the slider as touched and clear error state. Defense in depth.
      input.addEventListener("input", () => update(true));
      input.addEventListener("change", () => update(true));
      // While the pointer is down we strip the fill/thumb transitions so the
      // wave tracks the cursor with no perceived lag. Transitions resume on
      // release for smooth keyboard / click jumps.
      const startDrag = () => {
        slider.classList.add("is-dragging");
        slider.dataset.touched = "true";
        clearError();
      };
      const endDrag = () => slider.classList.remove("is-dragging");
      input.addEventListener("pointerdown", startDrag);
      input.addEventListener("pointerup", endDrag);
      input.addEventListener("pointercancel", endDrag);
      input.addEventListener("pointerleave", endDrag);
      input.addEventListener("focus", () => slider.classList.add("is-focused"));
      input.addEventListener("blur", () => slider.classList.remove("is-focused"));
    });
  }

  /* ───────────────────────────────────────────────────────────
     "Wie haben Sie uns gefunden?" — chip group
     ─────────────────────────────────────────────────────────── */

  function wireChipGroups() {
    document.querySelectorAll(".chip-group").forEach((group) => {
      const name = group.dataset.name;
      const hidden = document.querySelector('input[type="hidden"][name="' + name + '"]');
      const otherField = group.parentElement.querySelector(".chip-other-field");

      group.querySelectorAll(".chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          group.querySelectorAll(".chip").forEach((c) => {
            c.classList.remove("is-active");
            c.setAttribute("aria-checked", "false");
          });
          chip.classList.add("is-active");
          chip.setAttribute("aria-checked", "true");
          if (hidden) hidden.value = chip.dataset.value;

          if (otherField) {
            const isOther = chip.dataset.value === "Sonstiges";
            otherField.hidden = !isOther;
            if (isOther) {
              const inp = otherField.querySelector("input");
              if (inp) setTimeout(() => inp.focus(), 80);
            }
          }
        });
      });
    });
  }

  /* ───────────────────────────────────────────────────────────
     Submit — write feedback into Cloud Firestore
     ─────────────────────────────────────────────────────────── */

  function wireFormSubmit() {
    const form = document.getElementById("feedback-form");
    const status = document.getElementById("form-status");
    const successPanel = document.getElementById("feedback-success");
    if (!form || !status) return;

    const submitBtn = form.querySelector(".form-submit");
    const showSuccess = () => {
      form.hidden = true;
      if (successPanel) {
        successPanel.hidden = false;
        successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = "";
      status.classList.remove("is-success", "is-error");

      // Required wave-sliders must have been touched (0 is a valid answer
      // but "untouched" is not).
      const missing = Array.from(form.querySelectorAll('input.wave-slider-input[data-required="true"]'))
        .filter((el) => el.closest(".wave-slider").dataset.touched !== "true");

      if (missing.length) {
        missing.forEach((el) => {
          const slider = el.closest(".wave-slider");
          const wrapper = el.closest(".wave-question");
          slider.classList.add("has-error");
          if (!wrapper.querySelector(".wave-error")) {
            const err = document.createElement("p");
            err.className = "wave-error";
            err.textContent = t("feedback_slider_required", "Bitte setzen Sie die Welle auf einen Wert.");
            wrapper.appendChild(err);
          }
        });
        status.textContent = t("feedback_status_required", "Bitte beantworten Sie alle Pflichtfragen.");
        status.classList.add("is-error");
        const firstWrapper = missing[0].closest(".wave-question");
        if (firstWrapper) firstWrapper.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      submitBtn.disabled = true;
      const original = submitBtn.textContent;
      submitBtn.textContent = t("feedback_sending", "Wird gesendet…");

      try {
        const data = new FormData(form);
        if (String(data.get("_gotcha") || "").trim()) {
          showSuccess();
          return;
        }

        await saveFeedback(form, data);
        showSuccess();
      } catch (err) {
        console.error("Feedback could not be saved to Firebase.", err);
        status.textContent = isFirebaseConfigured(firebaseConfig)
          ? t("feedback_status_error", "Etwas ist schiefgelaufen. Bitte erneut versuchen.")
          : t(
              "feedback_not_configured",
              "Firebase ist noch nicht konfiguriert. Bitte später erneut versuchen."
            );
        status.classList.add("is-error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      }
    });
  }

  async function saveFeedback(form, formData) {
    const db = getFeedbackDb();
    const collectionName =
      form.dataset.feedbackCollection || DEFAULT_FEEDBACK_COLLECTION;
    await addDoc(collection(db, collectionName), buildFeedbackPayload(formData));
  }

  function getFeedbackDb() {
    if (feedbackDb) return feedbackDb;
    if (!isFirebaseConfigured(firebaseConfig)) {
      throw new Error("Missing Firebase web app configuration.");
    }
    feedbackDb = getFirestore(initializeApp(firebaseConfig));
    return feedbackDb;
  }

  function isFirebaseConfigured(config) {
    if (!config) return false;
    return REQUIRED_FIREBASE_FIELDS.every((key) => {
      const value = String(config[key] || "").trim();
      return value && !value.includes("PASTE_") && !value.includes("YOUR_");
    });
  }

  function buildFeedbackPayload(formData) {
    return {
      formVersion: 1,
      createdAt: serverTimestamp(),
      submittedAtClient: new Date().toISOString(),
      language: document.documentElement.lang || "de",
      page: textValue(window.location.pathname, 240),
      referrer: textValue(document.referrer, 500),
      userAgent: textValue(navigator.userAgent, 500),
      name: textValue(formData.get("name"), 160),
      company: textValue(formData.get("firma"), 160),
      source: textValue(formData.get("quelle"), 80),
      sourceOther: textValue(formData.get("quelle_freitext"), 240),
      ratings: {
        flow: ratingValue(formData.get("rating_flow")),
        problemSolved: ratingValue(formData.get("rating_problem")),
        delivery: ratingValue(formData.get("rating_lieferung")),
        communication: ratingValue(formData.get("rating_kommunikation")),
        recommendation: ratingValue(formData.get("rating_empfehlung")),
      },
      workedWell: textValue(formData.get("was_gut"), 4000),
      couldImprove: textValue(formData.get("was_besser"), 4000),
      testimonialOk: formData.get("testimonial_ok") === "ja",
    };
  }

  function ratingValue(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(100, Math.round(number)));
  }

  function textValue(value, maxLength) {
    return String(value || "").trim().slice(0, maxLength);
  }

  /* ───────────────────────────────────────────────────────────
     Language hook — re-translate dynamic content on DE ⇄ EN switch.
     The site's existing setLanguage() in script.js updates [data-translate]
     elements; we extend it to also update <textarea> placeholders and
     <input> aria-labels via [data-translate-placeholder] / [data-translate-aria].
     ─────────────────────────────────────────────────────────── */

  function wireTranslationHook() {
    const langDe = document.getElementById("lang-de");
    const langEn = document.getElementById("lang-en");
    if (!langDe || !langEn) return;
    [langDe, langEn].forEach((btn) =>
      btn.addEventListener("click", () => {
        // Defer until script.js' own click handler has updated <html lang>.
        setTimeout(applyDynamicTranslations, 0);
      })
    );
  }

  function wireTextareaPlaceholders() {
    applyDynamicTranslations();
  }

  function applyDynamicTranslations() {
    document.querySelectorAll("[data-translate-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-translate-placeholder");
      const val = t(key, "");
      if (val) el.placeholder = val;
    });
    document.querySelectorAll(".wave-slider-input").forEach((el) => {
      const wrapper = el.closest(".wave-question");
      if (!wrapper) return;
      const qKey = wrapper.dataset.questionKey;
      if (qKey) el.setAttribute("aria-label", t(qKey, qKey));
    });
  }

  /* ───────────────────────────────────────────────────────────
     Tiny helpers
     ─────────────────────────────────────────────────────────── */

  function t(key, fallback) {
    const lang = document.documentElement.lang || "de";
    if (
      typeof translations !== "undefined" &&
      translations[lang] &&
      translations[lang][key]
    ) {
      return stripHtml(translations[lang][key]);
    }
    return fallback;
  }

  function stripHtml(s) {
    // For values that we use as plain text (aria-labels, bubble text, etc.).
    const tmp = document.createElement("div");
    tmp.innerHTML = s;
    return tmp.textContent || tmp.innerText || "";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }
})();
