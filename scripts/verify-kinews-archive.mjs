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
assert.doesNotMatch(
  pageJs,
  /enableDragScroll\(railEl\)|bindRailEdges\(\s*document\.querySelector\('\.ki-rail-wrap\[data-rail="days"\]'\)/,
  "Day archive must not be wired as a horizontal drag rail"
);

assert.match(
  css,
  /\.ki-day-rail\s*\{[\s\S]*?display:\s*grid;/,
  "Day archive must render as a wrapping grid"
);
assert.match(
  css,
  /\.ki-day-rail\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*172px\),\s*1fr\)\);/,
  "Day archive grid must expose all cards responsively"
);
assert.match(
  css,
  /\.ki-day-rail\s*\{[\s\S]*?overflow-x:\s*visible;/,
  "Day archive must not hide days behind horizontal overflow"
);
assert.match(
  css,
  /\.ki-day-rail\s*>\s*li\s*\{[\s\S]*?min-width:\s*0;/,
  "Day archive grid items must fit their columns"
);

console.log(`KI-News archive verified: ${index.days.length} days render as a full wrapping archive.`);
