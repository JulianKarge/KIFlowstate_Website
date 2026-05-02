#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = fs.existsSync(path.join(root, ".env.local"))
  ? path.join(root, ".env.local")
  : path.join(root, ".env");
const outputPath = path.join(root, "js", "firebase-env.js");

const envToConfig = {
  FIREBASE_API_KEY: "apiKey",
  FIREBASE_AUTH_DOMAIN: "authDomain",
  FIREBASE_PROJECT_ID: "projectId",
  FIREBASE_STORAGE_BUCKET: "storageBucket",
  FIREBASE_MESSAGING_SENDER_ID: "messagingSenderId",
  FIREBASE_APP_ID: "appId",
  FIREBASE_MEASUREMENT_ID: "measurementId",
  FIREBASE_FEEDBACK_COLLECTION: "feedbackCollection",
};

function parseEnv(contents) {
  const values = {};

  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) return;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  });

  return values;
}

if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local. Copy .env.example to .env.local first.");
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, "utf8"));
const config = {};

Object.entries(envToConfig).forEach(([envKey, configKey]) => {
  const value = env[envKey];
  if (value) config[configKey] = value;
});

const required = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
];
const missing = required.filter((key) => !config[key]);

if (missing.length > 0) {
  console.error("Missing required Firebase config values: " + missing.join(", "));
  process.exit(1);
}

const output =
  "// Generated from .env.local by scripts/generate-firebase-env.js.\n" +
  "// Do not edit manually. Do not commit this file.\n" +
  "window.__KIFLOWSTATE_FIREBASE_CONFIG__ = Object.freeze(" +
  JSON.stringify(config, null, 2) +
  ");\n";

fs.writeFileSync(outputPath, output);
console.log("Wrote " + path.relative(root, outputPath));
