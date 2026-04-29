# KIFlowstate_Website

Static site for kiflowstate (GitHub Pages, custom CNAME). Pure HTML/CSS/JS — no build step.

Outward-facing copy is **German, Sie-Form**. Internal chat with Julian is English.

## Brand source of truth

The brand system lives in the sibling `brand-agent-system/` folder. Always read it before producing outward-facing copy, markup, or visuals — it is loaded automatically via the imports below.

@../brand-agent-system/AGENTS.md
@../brand-agent-system/brand/brand-system.md
@../brand-agent-system/brand/voice-and-copy.md
@../brand-agent-system/brand/html-style.md
@../brand-agent-system/brand/likes-and-dislikes.md
@../brand-agent-system/skills/brand-html/SKILL.md
@../brand-agent-system/skills/brand-copy/SKILL.md

## Website-specific learning log

Site-specific conventions, pitfalls, and open questions live in [site-notes.md](site-notes.md). This is an append-only file: when Julian says "remember this for the site" or similar, append a new entry using the template at the top of that file. Do not edit or remove existing entries unless Julian explicitly asks.

@site-notes.md

## Notes on this repo

- Deploys via GitHub Pages from `main` (remote: `JulianKarge/KIFlowstate_Website`).
- `CNAME` controls the custom domain — do not edit casually.
- `index.html`, `impressum.html`, `datenschutz.html`, `resources.html` are the live pages; `demos/` holds prototypes that are not linked from the nav.
- This folder is a nested git repo inside `Workspace/`. Commit and push from inside `KIFlowstate_Website/`, not from the Workspace root.
