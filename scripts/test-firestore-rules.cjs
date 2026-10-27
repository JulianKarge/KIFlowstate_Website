// Firestore rules test for the resource gate and the feedback form.
// Runs only against the local Firestore emulator, never against the live project.
//
// One-time setup (outside the repo, e.g. in a temp folder):
//   npm install @firebase/rules-unit-testing firebase
// Run from the website root (Java 11+ on PATH for the emulator):
//   NODE_PATH=<that folder>/node_modules firebase emulators:exec --only firestore --project demo-kiflowstate "node scripts/test-firestore-rules.cjs"
//
// Reads the live rules from firestore.rules and the Teil-1 code from
// gate-codes.local.json (both gitignored).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");
const { addDoc, collection, doc, getDoc, setDoc, deleteDoc, serverTimestamp } = require("firebase/firestore");

const ROOT = path.resolve(__dirname, "..");
const PROJECT = "demo-kiflowstate";
const rules = fs.readFileSync(path.join(ROOT, "firestore.rules"), "utf8");
const codes = JSON.parse(fs.readFileSync(path.join(ROOT, "gate-codes.local.json"), "utf8")).codes;
const CODE = codes["teil-1"].code;
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080").split(":");

assert.ok(rules.includes(codes["teil-1"].sha256), "firestore.rules must contain the Teil-1 hash");

const lead = (overrides = {}) => ({
  formVersion: 1,
  createdAt: serverTimestamp(),
  email: "test@example.com",
  code: CODE,
  pack: "videostudio",
  part: "teil-1",
  consent: true,
  consentText: "Ich willige ein, dass KIFlowstate meine E-Mail-Adresse speichert.",
  marketingConsent: false,
  marketingConsentText: "Freiwillig: Ja, ich möchte darüber hinaus Hinweise bekommen.",
  consentVersion: 1,
  doubleOptIn: "pending",
  language: "de",
  page: "/resources.html#videostudio",
  submittedAtClient: new Date().toISOString(),
  ...overrides,
});

const without = (key) => { const data = lead(); delete data[key]; return data; };

const feedback = (overrides = {}) => ({
  formVersion: 1,
  createdAt: serverTimestamp(),
  submittedAtClient: new Date().toISOString(),
  language: "de",
  page: "/feedback.html",
  referrer: "",
  userAgent: "rules-test",
  name: "Test",
  company: "",
  source: "Empfehlung",
  sourceOther: "",
  ratings: { flow: 80, problemSolved: 90, delivery: 70, communication: 100, recommendation: 85 },
  workedWell: "Alles",
  couldImprove: "",
  testimonialOk: false,
  ...overrides,
});

(async () => {
  const env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { rules, host, port: Number(port) } });
  const db = env.unauthenticatedContext().firestore();
  const leads = collection(db, "resourceLeads");
  const results = [];
  const run = async (name, fn) => {
    await fn();
    results.push(name);
    console.log("PASS " + name);
  };

  try {
    await env.clearFirestore();

    await run("correct Teil-1 code is accepted", () => assertSucceeds(addDoc(leads, lead())));
    await run("marketing consent true is accepted", () => assertSucceeds(addDoc(leads, lead({ marketingConsent: true }))));
    await run("wrong code is rejected", () => assertFails(addDoc(leads, lead({ code: "ZZZZ9999" }))));
    await run("lowercase code is rejected (client uppercases)", () => assertFails(addDoc(leads, lead({ code: CODE.toLowerCase() }))));
    await run("Teil-1 code for part teil-2 is rejected", () => assertFails(addDoc(leads, lead({ part: "teil-2" }))));
    await run("Teil-1 code for another pack is rejected", () => assertFails(addDoc(leads, lead({ pack: "andere-serie" }))));
    await run("consent false is rejected", () => assertFails(addDoc(leads, lead({ consent: false }))));
    await run("missing consent field is rejected", () => assertFails(addDoc(leads, without("consent"))));
    await run("missing consentText is rejected", () => assertFails(addDoc(leads, without("consentText"))));
    await run("empty consentText is rejected", () => assertFails(addDoc(leads, lead({ consentText: "" }))));
    await run("uppercase email is rejected", () => assertFails(addDoc(leads, lead({ email: "Test@Example.com" }))));
    await run("invalid email is rejected", () => assertFails(addDoc(leads, lead({ email: "kein-at-zeichen" }))));
    await run("extra field (userAgent) is rejected", () => assertFails(addDoc(leads, lead({ userAgent: "x" }))));
    await run("doubleOptIn confirmed is rejected", () => assertFails(addDoc(leads, lead({ doubleOptIn: "confirmed" }))));
    await run("client timestamp is rejected", () => assertFails(addDoc(leads, lead({ createdAt: new Date() }))));
    await run("consentVersion 2 is rejected", () => assertFails(addDoc(leads, lead({ consentVersion: 2 }))));
    await run("consentText over 800 chars is rejected", () => assertFails(addDoc(leads, lead({ consentText: "x".repeat(801) }))));

    const someLead = doc(db, "resourceLeads", "fixed-id");
    await run("create with fixed id is accepted", () => assertSucceeds(setDoc(someLead, lead())));
    await run("reading a lead is rejected", () => assertFails(getDoc(someLead)));
    await run("updating a lead is rejected", () => assertFails(setDoc(someLead, lead({ doubleOptIn: "pending" }))));
    await run("deleting a lead is rejected", () => assertFails(deleteDoc(someLead)));

    const feedbackCol = collection(db, "feedbackSubmissions");
    await run("valid feedback is still accepted (regression)", () => assertSucceeds(addDoc(feedbackCol, feedback())));
    await run("feedback with extra field is still rejected", () => assertFails(addDoc(feedbackCol, feedback({ email: "x@y.de" }))));
    await run("other collections stay closed", () => assertFails(addDoc(collection(db, "anything"), { a: 1 })));

    console.log(`\nAll ${results.length} rules checks passed.`);
  } finally {
    await env.cleanup();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
