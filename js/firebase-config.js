// Runtime Firebase Web App config for the KIFlowstate feedback form.
// Real values are loaded from js/firebase-env.js, generated from .env.local.
// Do not commit js/firebase-env.js or service account keys.
const runtimeConfig =
  typeof window !== "undefined" && window.__KIFLOWSTATE_FIREBASE_CONFIG__
    ? window.__KIFLOWSTATE_FIREBASE_CONFIG__
    : {};

function configValue(key) {
  return String(runtimeConfig[key] || "").trim();
}

export const firebaseConfig = {
  apiKey: configValue("apiKey"),
  authDomain: configValue("authDomain"),
  projectId: configValue("projectId"),
  storageBucket: configValue("storageBucket"),
  messagingSenderId: configValue("messagingSenderId"),
  appId: configValue("appId"),
  measurementId: configValue("measurementId"),
};

export const feedbackCollection =
  configValue("feedbackCollection") || "feedbackSubmissions";

// Resource gate on resources.html (series packs). Same Firebase project.
export const resourceLeadsCollection =
  configValue("resourceLeadsCollection") || "resourceLeads";

// Local testing only: "127.0.0.1:8080" points the gate at the Firestore
// emulator. Leave empty in production; the generated env file never sets it.
export const firestoreEmulatorHost = configValue("firestoreEmulatorHost");
