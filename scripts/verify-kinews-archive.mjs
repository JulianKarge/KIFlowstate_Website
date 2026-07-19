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
  /\.ki-day-rail\s*\{[\s\S]*?display:\s*flex;[\s\S]*?overflow-x:\s*auto;/,
  "Day archive must render as a horizontal scroll rail"
);
assert.match(
  css,
  /\.ki-day-rail\s*>\s*li\s*\{[\s\S]*?flex:\s*0\s*0\s*clamp\(/,
  "Day archive cards must keep a readable fixed width"
);
assert.match(
  css,
  /\.ki-rail-wrap::before,\s*\.ki-rail-wrap::after\s*\{[\s\S]*?display:\s*block;/,
  "Day archive must expose edge cues for scrolling"
);
assert.match(
  pageJs,
  /enableDragScroll\(railEl\)[\s\S]*?bindRailEdges\(dayRailWrap,\s*railEl\)/,
  "Day archive must support pointer dragging and scroll edge state"
);

console.log(`KI-News archive verified: ${index.days.length} days render as a horizontal scroll rail at every viewport size.`);
