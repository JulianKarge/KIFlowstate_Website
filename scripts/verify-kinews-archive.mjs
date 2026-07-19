import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = await readFile(path.join(root, "css", "styles.css"), "utf8");
const pageJs = await readFile(path.join(root, "js", "ki-news-page.js"), "utf8");

const indexRes = await fetch("https://juliankarge.github.io/DailyNews/data/api/index.json", {
  cache: "no-store",
});
assert.equal(indexRes.ok, true, `DailyNews index fetch failed: HTTP ${indexRes.status}`);

const index = await indexRes.json();
assert.equal(Array.isArray(index.days), true, "DailyNews index must expose a days array");
assert.ok(index.days.length >= 28, `Expected at least 28 published days, got ${index.days.length}`);

assert.match(
  pageJs,
  /days\s*=\s*sortDaysDesc\(index\.days\s*\|\|\s*\[\]\)/,
  "Full-page renderer must keep the complete index.days archive"
);
assert.doesNotMatch(
  pageJs,
  /index\.days\s*\|\|\s*\[\]\)\.slice|slice\s*\(\s*0\s*,\s*(?:2|3|7|14)\s*\)/,
  "Full-page renderer must not truncate the day archive"
);
assert.match(
  css,
  /\.ki-day-rail\s*\{[\s\S]*?display:\s*grid;/,
  "Day archive must render as a wrapping grid on larger screens"
);
assert.match(
  css,
  /\.ki-day-rail\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*172px\),\s*1fr\)\);/,
  "Day archive grid must expose all cards responsively"
);
assert.match(
  css,
  /\.ki-day-rail\s*>\s*li\s*\{[\s\S]*?min-width:\s*0;/,
  "Day archive items must fit their columns"
);
assert.match(
  css,
  /@media\s*\(max-width:\s*760px\)[\s\S]*?\.ki-day-rail\s*\{[\s\S]*?display:\s*flex;[\s\S]*?overflow-x:\s*auto;/,
  "Day archive must become a horizontal scroll rail on mobile"
);
assert.match(
  css,
  /@media\s*\(max-width:\s*760px\)[\s\S]*?\.ki-day-rail\s*>\s*li\s*\{[\s\S]*?flex:\s*0\s*0\s*clamp\(/,
  "Mobile day cards must keep a fixed readable width"
);

console.log(`KI-News archive verified: ${index.days.length} days render as a desktop grid and mobile scroll rail.`);
