# KIFlowstate Website

Static site for kiflowstate.de (GitHub Pages, custom CNAME). Pure HTML/CSS/JS — no build step.

Outward-facing copy is **German, Sie-Form**. Internal chat with Julian is English.

## Repo location

This folder is its own standalone git repo at `Desktop/KIFlowstate/Website/` (remote: `JulianKarge/KIFlowstate_Website`). It used to live inside `Workspace/KIFlowstate_Website/` but was extracted on 2026-04-30 so the site can be developed and pushed independently of the Workspace repo.

## Brand source of truth

The brand system is mirrored locally in `brand-agent-system/` so this folder is self-contained. The files below are auto-loaded into context for any work on the site.

@brand-agent-system/AGENTS.md
@brand-agent-system/brand/brand-system.md
@brand-agent-system/brand/voice-and-copy.md
@brand-agent-system/brand/html-style.md
@brand-agent-system/brand/likes-and-dislikes.md
@brand-agent-system/skills/brand-html/SKILL.md
@brand-agent-system/skills/brand-copy/SKILL.md

**Important:** `brand-agent-system/` here is a **local snapshot**, gitignored, and not pushed to the public Pages repo. The canonical master still lives in `Desktop/KIFlowstate/Workspace/brand-agent-system/` because videos and emails depend on it too. If a brand decision changes, update the master in Workspace first, then re-sync this snapshot. If the snapshot ever drifts, treat the Workspace copy as authoritative.

## Website-specific learning log

Site-specific conventions, pitfalls, and open questions live in [site-notes.md](site-notes.md). Append-only: when Julian says "remember this for the site" or similar, add a new entry using the template at the top of that file. Do not edit or remove existing entries unless Julian explicitly asks.

@site-notes.md

## Notes on this repo

- Deploys via GitHub Pages from `main` (remote: `JulianKarge/KIFlowstate_Website`).
- `CNAME` controls the custom domain — do not edit casually.
- `index.html`, `impressum.html`, `datenschutz.html`, `resources.html` are the live pages; `demos/` holds prototypes that are not linked from the nav.
- Local preview: `python -m http.server 8000` from this folder, then open `http://localhost:8000`.
- `brand-agent-system/` and `.DS_Store` files are local-only — see `.gitignore`.
