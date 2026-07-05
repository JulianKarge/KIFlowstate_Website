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

### Method section works best as scroll-driven flow storytelling
- **Date:** 2026-07-05
- **Context:** Redesigning the homepage `#method` section after Julian liked the wave animation but disliked the three static fields below it. The goal was a professional but more futuristic interaction that reveals more information while scrolling.
- **Source / example:** `#method` in [index.html](index.html), `Method scrollytelling upgrade` in [css/styles.css](css/styles.css), `methodStory` in [js/script.js](js/script.js), method translation keys in [js/translations.js](js/translations.js).
- **What:** For the KI-Dschungel section, prefer a sticky scrollytelling pattern over static cards. The strongest metaphor is messy real-world inputs becoming one operational flow: chips reorganize, the wave draws forward, the active step changes, and output nodes appear progressively. Keep it calm and precise, with real workflow objects such as E-Mail, Excel, Belege, Versand, and Team instead of generic KI/neon/circuit visuals.
- **Where it applies:** Homepage `#method` and any future "how we work" or process storytelling section.
- **Tags:** layout, animation, scrollytelling, homepage, method

### Scroll interactions need static fallbacks and browser QA
- **Date:** 2026-07-05
- **Context:** Implementing the upgraded `#method` scrollytelling section with desktop sticky behavior, mobile static layout, dark mode, translation support, and reduced-motion handling.
- **Source / example:** `method-scrolly` CSS in [css/styles.css](css/styles.css), `methodStory` scroll controller in [js/script.js](js/script.js).
- **What:** When adding scroll-driven sections, verify desktop phases, mobile layout, dark mode, English/German strings, `prefers-reduced-motion`, anchor navigation, and horizontal overflow. On smaller screens, collapse to a non-sticky layout where all steps remain readable; dense visual nodes can be hidden if they would compete with the copy. Keep scroll animation progressive, not decorative: every motion should explain the workflow.
- **Where it applies:** Homepage scroll storytelling sections and future animated process sections.
- **Tags:** animation, responsive, accessibility, qa, dark-mode

### Useful references for professional scrollytelling
- **Date:** 2026-07-05
- **Context:** Looking for references that could make the KI-Dschungel section feel more interactive and future-facing without becoming sloppy or generic.
- **Source / example:** Codrops sticky section animation ideas, Codrops `OnScrollPathAnimations`, Codrops `ScrollBasedLayoutAnimations`, Chrome scroll-driven animation docs, and Shorthand scrollytelling examples.
- **What:** Good references for this site are sticky sections where one visual stage stays in view while scroll progress reveals state changes, path drawing, and information layers. Borrow the interaction principle, not the visual style: KIFlowstate should stay restrained, bright, operational, and brand-blue, not dark cyberpunk or over-animated.
- **Where it applies:** Future homepage sections, case-study pages, product demos, and any process reveal.
- **Tags:** references, animation, scrollytelling, design-direction

### Services section should guide one active idea at a time
- **Date:** 2026-07-05
- **Context:** Redesigning the homepage `#services` / "Was wir in Bewegung bringen" section after the four-card grid felt too dense next to the stronger KI-Dschungel section.
- **Source / example:** `#services` in [index.html](index.html), `Services liquid wave reset` in [css/styles.css](css/styles.css), service keys in [js/translations.js](js/translations.js).
- **What:** For service/capability sections, avoid equal-weight grids when the user needs quick comprehension. Use a sticky selector plus one active detail pane, supported by a simple operational visual such as Bedarf -> Umsetzung -> Betrieb. Keep copy short: one service promise and one outcome per step. On mobile or reduced motion, fall back to readable stacked cards.
- **Updated:** 2026-07-05 - The service scroll should hold the first and final states longer, avoid duplicate labels in the visual deck, and keep the copy self-selection oriented: when this service fits, and what outcome the visitor gets.
- **Updated:** 2026-07-05 - For the homepage services section specifically, simplify further: remove the service-category menu, detailed cards, scroll ball, and any orb metaphor. Keep only the headline, one concise sentence, and a liquid-glass wave carrying Bedarf -> Umsetzung -> Betrieb. Motion should feel like the homepage wave system and Apple-style frosted glass: high quality, restrained, and brand-blue.
- **Updated:** 2026-07-05 - The services wave should include a short scroll-linked reveal, not just idle motion. The wave itself should advance from left to right and the active label can lift subtly with scroll progress. Do not use green/teal in this section; stay within the KIFlowstate blue identity.
- **Updated:** 2026-07-05 - Avoid boxed dashboard panels and three glass-button cards in the services wave. They looked cheap and disconnected from the site. The better direction is an unframed typographic wave ribbon: soft full-width blue motion, labels as text, active state via a small underline, and no visible component container.
- **Updated:** 2026-07-05 - The services scroll should not jump away as soon as the wave reaches the final state. Let the wave complete around two-thirds through the pinned scroll, then hold `Betrieb` visibly before the next section. Keep the labels in a stage rail below the wave, not floating inside it.
- **Updated:** 2026-07-05 - Services should not sit as white-on-white against the following method section. Use a subtle light-blue band with narrow, slow-moving full-width wave dividers at the top and bottom only. Keep the main wave central, but do not let decorative waves fill the whole section. Reduce vertical padding so the section feels like part of the page flow rather than a huge isolated scroll scene.
- **Updated:** 2026-07-05 - The services section works better as a compact scroll-reactive band than as a tall pinned scene. Keep the top and bottom waves small, full-width, and slowly moving; keep the central wave thin; avoid large empty hold space. If scroll progress is needed, calculate it against the section's own scroll position and hold the final `Betrieb` state briefly without forcing a full extra viewport.
- **Updated:** 2026-07-05 - The services-to-method handoff should not reveal a blank white gap. The method section can start with a very subtle blue tint and should not rely on the generic reveal observer for visibility, because its tall scrollytelling height delays the reveal and makes the transition feel unfinished.
- **Where it applies:** Homepage services section, future capability sections, and product/service overview pages.
- **Tags:** services, layout, animation, responsive, copy

### Appointment section: wrap Google Calendar in a branded booking panel
- **Date:** 2026-07-05
- **Context:** Redesigning the homepage `#appointment` section because the raw Google Appointment Schedule embed felt like a generic template, required awkward inner scrolling on desktop, and looked disconnected in dark mode.
- **Source / example:** [index.html](index.html), [css/styles.css](css/styles.css), [js/translations.js](js/translations.js), screenshots in `.codex-screenshots/appointment-*`.
- **What:** Keep the Google Calendar surface itself white, because Google controls the iframe and it is built for a light UI. Make the surrounding section carry the KIFlowstate feel: subtle blue grid background, centered section header, compact context pills, dark-mode shell, and a direct "open calendar in new tab" fallback. Do not put explanatory marketing text beside the iframe, because the calendar needs width.
- **Where it applies:** Homepage appointment section and any future embedded booking flow.
- **Tags:** layout, appointment, google-calendar, dark-mode, conversion

### Google Calendar embed needs width, height, and real browser QA
- **Date:** 2026-07-05
- **Context:** The original Google Appointment Schedule iframe used a 600px height and showed an annoying internal scrollbar on desktop. The fix was not copy-only, it required giving the iframe a larger internal viewport and checking what Google actually rendered.
- **Source / example:** `.calendar-wrapper` and `.calendar-embed` in [css/styles.css](css/styles.css), `calendar-template` in [index.html](index.html).
- **What:** For the desktop booking embed, use a wide frame and a taller internal iframe canvas, currently `height: 860px` with `transform: scale(0.88)` inside a `757px` wrapper. This removed the visible inner scrollbar in desktop captures while keeping the section reasonably compact. On mobile, expect Google to stay tall or scroll internally, so keep the new-tab fallback prominent and avoid extra horizontal compression.
- **Where it applies:** Google Calendar Appointment Schedule embeds.
- **Tags:** layout, iframe, appointment, qa, responsive

### Appointment copy must match the actual booking product
- **Date:** 2026-07-05
- **Context:** The website copy said 30-minute strategy call, but the actual Google schedule is a 15-minute discovery call.
- **Source / example:** `appointment_text`, `appointment_meta_duration` in [js/translations.js](js/translations.js), appointment markup in [index.html](index.html).
- **What:** Keep the public copy aligned with the Google schedule. If the calendar product changes duration or purpose, update German and English strings in the same pass. The current promise is a free 15-minute discovery or strategy call about AI automation.
- **Where it applies:** Appointment CTA copy, hero CTA expectation, privacy/legal references if duration or provider changes.
- **Tags:** copy, appointment, translation, conversion

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

### resources.html uses du-form, not Sie
- **Date:** 2026-05-19
- **Context:** Julian decided the Sie register feels wrong for the resources page (tutorials, video walkthroughs, prompt cards). The rest of the site keeps Sie; resources switches to personal du-form.
- **Source / example:** [resources.html](resources.html), [js/resources-page.js](js/resources-page.js), [js/videos.js](js/videos.js).
- **What:** All copy that renders on the resources page addresses the reader in du. Sie → du, Ihr/Ihre → dein/deine, Ihnen → dir, "Lernen Sie" → "Lerne". Compound words with ASCII hyphen (KI-Flow, KI-Agent) stay fine. Important: this overrides `brand-agent-system/brand/voice-and-copy.md`, which still mandates Sie for index.html, impressum.html, datenschutz.html, and any future marketing pages. If a string in videos.js is shared with another page, ask before flipping it.
- **Where it applies:** resources.html and its data files only. Not index, not legal pages.
- **Tags:** copy, voice, resources-page

### Never use em-dashes or en-dashes in site copy
- **Date:** 2026-05-19
- **Context:** Julian dislikes em-dash (U+2014) and en-dash (U+2013) in prose. They read as "AI-generated" and clash with the warm/human voice.
- **Source / example:** Applies to all copy files: HTML, js/videos.js descriptions, prompt cards, image alt text, meta tags.
- **What:** Use a comma, colon, semicolon, or two short sentences instead of em/en-dashes. ASCII hyphen `-` is fine in compound words ("KI-Flow", "Schritt-für-Schritt", "Q-und-A"). Watch out for accidental smart-quote conversion that turns `--` into `—`.
- **Where it applies:** All site copy across every page, not just resources.
- **Tags:** copy, typography, style

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
