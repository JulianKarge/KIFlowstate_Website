# Site Notes — KIFlowstate Website

This is the **append-only learning log** for the kiflowstate.de website specifically.

It is distinct from the brand-wide preferences in `../brand-agent-system/brand/likes-and-dislikes.md`:

- **Brand likes/dislikes** = visual/voice preferences that apply everywhere (videos, emails, site, copy).
- **Site notes (this file)** = learnings specific to *building this site*: code patterns, content decisions, deploy quirks, sections that worked or didn't, German legal constraints, GitHub Pages gotchas, accessibility findings.

## How to maintain this file

When Julian says things like:

- "Speicher das für die Website" / "remember this for the site"
- "Mach das immer so auf der Website" / "always do this on the site"
- "Das funktioniert nicht, nicht nochmal so" / "this didn't work, don't do that again"

…the AI appends a new entry to the matching section below using the template. Existing entries are never edited or deleted unless Julian explicitly asks.

### Entry template

```
### {{Short title}}
- **Date:** {{YYYY-MM-DD}}
- **Context:** {{What we were doing when this came up}}
- **Source / example:** {{file path, page, screenshot, or commit}}
- **What:** {{1 to 3 sentences, the rule or the learning}}
- **Where it applies:** {{specific page, all pages, deploy, content, …}}
- **Tags:** {{layout, copy, deploy, legal, accessibility, performance, …}}
```

If an entry becomes wrong over time, append `**Updated:** {{YYYY-MM-DD}}` with a short note instead of rewriting silently.

---

## Conventions, patterns to keep using

### Every video in `js/videos.js` must have `publishedAt`
- **Date:** 2026-05-01
- **Context:** When adding a new YouTube video to the resources page, only one of five entries had a `publishedAt` date, so the sidebar showed the date for one video and nothing for the rest — looked broken.
- **Source / example:** [js/videos.js](js/videos.js), sidebar rendered by [js/resources-page.js:130](js/resources-page.js#L130) (`video-tab-date`).
- **What:** Always set `publishedAt` (ISO `YYYY-MM-DD`) on every entry in the `VIDEOS` array. When adding a brand-new video, use today's date. If Julian gives a relative date ("4 days ago"), convert to the absolute ISO date before saving. Never leave `publishedAt` unset, even on placeholder entries with empty `sections`.
- **Where it applies:** `js/videos.js` — every video object, every time one is added or edited.
- **Tags:** content, video, resources-page

### Feedback results stay local-only
- **Date:** 2026-05-02
- **Context:** Connected the hidden customer feedback page to Firebase Firestore and added a private localhost dashboard for Julian to review submissions.
- **Source / example:** `feedback.html`, `js/feedback-page.js`, `firestore.rules`, `local-feedback-viewer/`, `.gitignore`.
- **What:** The customer-facing link is `/feedback.html`: it can be sent directly to customers, but it is not linked from the landing page and has `noindex,nofollow`. Submissions write to Firebase collection `feedbackSubmissions`; Firestore rules allow public creates only and block public reads/updates/deletes. Results are reviewed through the local-only Node dashboard at `http://127.0.0.1:8787`, and `local-feedback-viewer/` must stay ignored/unpublished.
- **Where it applies:** Feedback page, Firebase rules, deploy/publishing, local results dashboard.
- **Tags:** feedback, firebase, privacy, deploy, local-dashboard

---

## Pitfalls, things that broke or did not work

### German typographic quotes inside double-quoted JS strings break the whole file
- **Date:** 2026-05-01
- **Context:** Adding a new video entry to [js/videos.js](js/videos.js). The resources page sidebar suddenly went blank — no videos rendered.
- **Source / example:** `title: { de: "... „ready: true" ausgeben", ... }` — opening with `„` (U+201E) but closing with ASCII straight `"` (U+0022) terminated the JS string at `true`, which broke parsing of the entire `VIDEOS` array, which made the page silently empty.
- **What:** When writing German prose inside a JS double-quoted string, always pair `„` (U+201E) with `"` (U+201C) — never with ASCII `"`. Same applies to `'` vs `'`/`'`. Verify after any sizable edit to videos.js with `node -c js/videos.js` — a clean exit means the file parses; any parse error breaks the whole resources page silently.
- **Where it applies:** Any string-typed field in `js/videos.js` (`title`, `description.de`, prompt-card titles). Less of a risk in `text` items because the HTML lives in a backtick-delimited template literal.
- **Tags:** content, video, resources-page, encoding

---

## Open questions

<!-- Things still being figured out. -->
