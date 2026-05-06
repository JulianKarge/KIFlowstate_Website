/* ============================================================
 * KIFlowstate – Video Resources Data
 * ============================================================
 *
 *  HOW TO ADD A NEW VIDEO
 *  ----------------------
 *  1. Copy the YouTube video ID from the URL.
 *       https://www.youtube.com/watch?v=ABC123xyz   →  id: "ABC123xyz"
 *  2. Paste a new entry at the TOP of the VIDEOS array (newest first).
 *  3. Fill in title / publishedAt / description / sections.
 *  4. Title and description can be a plain string OR an object
 *     { de: "…", en: "…" } if you want both languages.
 *  5. Each video lives at:    /resources.html#<id>
 *     – exactly the URL you paste in your YouTube comments.
 *
 *  SECTION TYPES
 *  -------------
 *  • "prompts"  — copy-able prompt cards.
 *                 items: [{ title, content }]
 *  • "links"    — labeled outbound links.
 *                 items: [{ label, url, description? }]
 *  • "text"     — free-form HTML paragraph(s).
 *                 items: [{ html }]   (HTML is rendered as-is)
 *
 *  The thumbnail is fetched automatically from YouTube — no extra work.
 * ============================================================
 */

const VIDEOS = [
  {
    id: "xVuMcYM_5aE",
    title: "Ich habe Claude ein eigenes Wiki gebaut",
    publishedAt: "2026-05-06",
    description: {
      de: "Inspiriert von Andrej Karpathys LLM-Wiki-Idee: Claude bekommt ein eigenes, persistentes Wiki, das über Sessions hinweg mitwächst. Hier findest du die zwei Plugin-Befehle aus dem Video sowie das Original-Gist von Karpathy zum Nachlesen.",
      en: "Inspired by Andrej Karpathy's \"LLM Wiki\" idea: Claude gets its own persistent wiki that grows across sessions. Below you'll find the two plugin commands from the video plus Karpathy's original gist for reference."
    },
    sections: [
      {
        heading: { de: "Plugin installieren (Claude Code)", en: "Install the plugin (Claude Code)" },
        type: "prompts",
        items: [
          {
            title: { de: "1. Marketplace hinzufügen", en: "1. Add the marketplace" },
            content: `/plugin marketplace add bradautomates/claude-video`
          },
          {
            title: { de: "2. Watch-Plugin installieren", en: "2. Install the watch plugin" },
            content: `/plugin install watch@claude-video`
          }
        ]
      },
      {
        heading: { de: "Repository & Inspiration", en: "Repository & inspiration" },
        type: "links",
        items: [
          {
            label: "Karpathy — LLM Wiki Gist",
            url: "https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f",
            description: {
              de: "Andrej Karpathys Original-Gist mit der LLM-Wiki-Idee — die Grundlage für das, was im Video gebaut wird.",
              en: "Andrej Karpathy's original gist with the LLM Wiki idea — the foundation for what's built in the video."
            }
          }
        ]
      }
    ]
  },
  {
    id: "5jfWQ3Y9qRg",
    title: "Baue dein KI-Supermodell mit Claude Code",
    publishedAt: "2026-05-03",
    description: {
      de: "Codex und Gemini ziehen direkt neben Claude Code in dein Terminal ein — alle drei Modelle in einem Fenster, kein Tool-Wechsel mehr. Hier findest du jeden Befehl zum Kopieren, in der richtigen Reihenfolge. Optional am Ende: DeepSeek als günstiges 4. Modell.",
      en: "Codex and Gemini move in right next to Claude Code in your terminal — all three models in one window, no more tool-switching. Below you'll find every command ready to copy, in the right order. Optional at the end: DeepSeek as a cheap 4th model."
    },
    sections: [
      {
        heading: { de: "Was du brauchst", en: "What you need" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>Vier Sachen, die vorab da sein sollten — danach geht's los:</p>
<ul>
  <li><strong>Node.js 20+</strong> (<code>node --version</code> zum Prüfen)</li>
  <li><strong>Claude Code</strong> installiert und lauffähig</li>
  <li><strong>ChatGPT-Account</strong> (Free reicht) oder OpenAI-API-Key</li>
  <li><strong>Google-Account</strong> für den kostenlosen Gemini-Tarif</li>
</ul>`,
              en: `<p>Four things to have in place before we start:</p>
<ul>
  <li><strong>Node.js 20+</strong> (<code>node --version</code> to check)</li>
  <li><strong>Claude Code</strong> installed and running</li>
  <li><strong>ChatGPT account</strong> (Free works) or OpenAI API key</li>
  <li><strong>Google account</strong> for the free Gemini tier</li>
</ul>`
            }
          }
        ]
      },
      {
        heading: { de: "Schritt 1 — CLIs installieren & einloggen (im Terminal)", en: "Step 1 — Install & log in to the CLIs (in your terminal)" },
        type: "prompts",
        items: [
          {
            title: { de: "1. Optional — Claude Code installieren (falls noch nicht vorhanden)", en: "1. Optional — Install Claude Code (if you don't have it yet)" },
            content: `npm install -g @anthropic-ai/claude-code`
          },
          {
            title: { de: "2. CLIs installieren (Terminal, nicht Claude Code)", en: "2. Install the CLIs (terminal, not Claude Code)" },
            content: `npm install -g @openai/codex
npm install -g @google/gemini-cli`
          },
          {
            title: { de: "3. Versionen prüfen (optional)", en: "3. Check versions (optional)" },
            content: `codex --version
gemini --version`
          },
          {
            title: { de: "4. Codex-Login (Browser öffnet sich)", en: "4. Codex login (browser opens)" },
            content: `codex login`
          },
          {
            title: { de: "5. Gemini einmal starten für Google-OAuth, danach /quit", en: "5. Launch Gemini once for Google OAuth, then /quit" },
            content: `gemini`
          }
        ]
      },
      {
        heading: { de: "⚠ Wichtig vor Schritt 2", en: "⚠ Important before Step 2" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>Jetzt rüber in Claude Code. Achtung: die nächsten fünf Befehle gehen <strong>einzeln</strong> rein. Einen einfügen, Enter, kurz warten, nächster. Alle auf einmal bricht die Installation, weil Claude Code sie zu einem ungültigen Befehl zusammenklebt.</p>`,
              en: `<p>Now over to Claude Code. Heads-up: the next five commands go in <strong>one at a time</strong>. Paste one, hit enter, wait briefly, then the next. Pasting all at once breaks the install, because Claude Code glues them into a malformed command.</p>`
            }
          }
        ]
      },
      {
        heading: { de: "Schritt 2 — Plugins in Claude Code laden", en: "Step 2 — Load the plugins into Claude Code" },
        type: "prompts",
        items: [
          {
            title: { de: "1. Codex-Marketplace hinzufügen", en: "1. Add Codex marketplace" },
            content: `/plugin marketplace add openai/codex-plugin-cc`
          },
          {
            title: { de: "2. Codex-Plugin installieren", en: "2. Install Codex plugin" },
            content: `/plugin install codex@openai-codex`
          },
          {
            title: { de: "3. Gemini-Marketplace hinzufügen", en: "3. Add Gemini marketplace" },
            content: `/plugin marketplace add thepushkarp/cc-gemini-plugin`
          },
          {
            title: { de: "4. Gemini-Plugin installieren", en: "4. Install Gemini plugin" },
            content: `/plugin install cc-gemini-plugin@cc-gemini-plugin`
          },
          {
            title: { de: "5. Neu laden", en: "5. Reload" },
            content: `/reload-plugins`
          }
        ]
      },
      {
        heading: { de: "Schritt 3 — Verbindung testen", en: "Step 3 — Test the connection" },
        type: "prompts",
        items: [
          {
            title: { de: "In Claude Code — gibt „ready: true“ aus", en: "Inside Claude Code — prints \"ready: true\"" },
            content: `/codex:setup`
          },
          {
            title: { de: "Im Terminal — gibt einen Gruß aus", en: "In the terminal — prints a greeting" },
            content: `gemini -p "say hello"`
          }
        ]
      },
      {
        heading: { de: "DeepSeek anbinden", en: "Wire up DeepSeek" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>DeepSeek läuft als lokaler Proxy parallel zu Claude Code, günstigere Inferenz, gleiche Oberfläche. Zwei Schritte vorab, dann erledigt der Setup-Prompt unten den Rest:</p>
<ol>
  <li>API-Key erstellen: <a href="https://platform.deepseek.com/usage" target="_blank" rel="noopener">platform.deepseek.com/usage</a></li>
  <li>Setup-Prompt unten in Claude Code einfügen und API-Key an der markierten Stelle eintragen. Fertig.</li>
</ol>`,
              en: `<p>DeepSeek runs as a local proxy alongside Claude Code, cheaper inference, same UI. Two quick steps up front, then the setup prompt below handles the rest:</p>
<ol>
  <li>Create an API key: <a href="https://platform.deepseek.com/usage" target="_blank" rel="noopener">platform.deepseek.com/usage</a></li>
  <li>Paste the setup prompt below into Claude Code and drop your API key into the marked placeholder. Done.</li>
</ol>`
            }
          }
        ]
      },
      {
        heading: { de: "DeepSeek-Setup-Prompt", en: "DeepSeek setup prompt" },
        type: "prompts",
        items: [
          {
            title: { de: "DeepSeek anbinden — kompletter Setup-Prompt", en: "Wire up DeepSeek — full setup prompt" },
            content: `You are going to set up "Free Claude Code" — a local Anthropic-compatible proxy that routes Claude Code traffic to DeepSeek instead of Anthropic. Execute every step in order. If a step fails, diagnose the root cause and fix it before continuing. Never print the API key back to me, never commit it, never write it anywhere except .env.

MY_DEEPSEEK_API_KEY = "<<<PASTE_YOUR_DEEPSEEK_API_KEY_HERE>>>"

Goal: after you finish, I can open any new terminal and type \`claude-deepseek\` (or the short alias \`cdp\`) and Claude Code starts, talking to DeepSeek through a local proxy on port 8082.

=== Step 1: Prerequisites ===
Verify these are on PATH and report versions: git, python (>=3.14), uv, claude.
If any are missing, install them first:
  - Windows:     powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
                 then  uv python install 3.14
  - macOS/Linux: curl -LsSf https://astral.sh/uv/install.sh | sh
                 then  uv python install 3.14
  - Claude Code: https://github.com/anthropics/claude-code

=== Step 2: Clone ===
Clone https://github.com/Alishahryar1/free-claude-code.git into the current working directory.
cd into it for the rest of the steps.

=== Step 3: .env ===
IMPORTANT — the project's README is out of date. DeepSeek deprecated \`deepseek-chat\` and now serves \`deepseek-v4-pro\` and \`deepseek-v4-flash\`. Verify the live model names yourself before writing .env:

   curl -s -H "Authorization: Bearer $MY_DEEPSEEK_API_KEY" https://api.deepseek.com/v1/models

Use whatever model IDs the API returns. If the names match what I list below, use:
  MODEL=deepseek/deepseek-v4-pro
  MODEL_OPUS=deepseek/deepseek-v4-pro
  MODEL_SONNET=deepseek/deepseek-v4-pro
  MODEL_HAIKU=deepseek/deepseek-v4-flash

Otherwise substitute the current names. Then start from .env.example:
  - copy .env.example to .env
  - set DEEPSEEK_API_KEY to MY_DEEPSEEK_API_KEY
  - set MODEL / MODEL_OPUS / MODEL_SONNET / MODEL_HAIKU as above
  - set ANTHROPIC_AUTH_TOKEN="freecc"
  - set MESSAGING_PLATFORM="none"
  - set VOICE_NOTE_ENABLED=false
  - leave all other keys empty / at their defaults

Before writing the key, confirm .env is git-ignored:
  git check-ignore -v .env
The output must show .gitignore matching .env. If it does not, abort and tell me.

=== Step 4: Install dependencies ===
Run \`uv sync\` inside the project folder.

=== Step 5: Smoke-test the proxy ===
Start the proxy in the background:
  uv run uvicorn server:app --host 127.0.0.1 --port 8082
Wait until \`curl -H "x-api-key: freecc" http://127.0.0.1:8082/v1/models\` returns 200 and the JSON includes your configured DeepSeek models. Then send a real message:
  curl -X POST http://127.0.0.1:8082/v1/messages \\
       -H "x-api-key: freecc" \\
       -H "anthropic-version: 2023-06-01" \\
       -H "content-type: application/json" \\
       -d '{"model":"claude-haiku-4-20250514","max_tokens":50,
            "messages":[{"role":"user","content":"Reply with: PROXY_OK"}]}'
You should see SSE events from upstream model \`deepseek-v4-flash\` (Haiku is mapped to flash).
Then stop the proxy.

=== Step 6: Launcher scripts ===
Create these files inside the project folder:

(a) claude-deepseek.ps1  — Windows PowerShell launcher. It must:
    1. Check if a proxy is already listening on 127.0.0.1:8082. If yes, reuse it.
    2. Otherwise start \`uv run uvicorn server:app --host 127.0.0.1 --port 8082\`
       via Start-Process, redirecting stdout to server.log and stderr to
       server.log.err, save the PID to .proxy.pid, and wait (poll /v1/models)
       up to 30 s until it answers 200.
    3. Set $env:ANTHROPIC_BASE_URL = "http://127.0.0.1:8082"
       and $env:ANTHROPIC_AUTH_TOKEN = "freecc".
    4. Null out $env:ANTHROPIC_API_KEY for this session so Claude Code uses the
       proxy and not a real Anthropic key.
    5. Run \`claude @args\`.
    6. On exit (try/finally): if WE started the proxy, kill its entire process
       tree with \`taskkill /PID <pid> /T /F\`. This is critical — \`uv run\` spawns
       uvicorn as a CHILD process, and Stop-Process on the parent alone leaves
       the child holding port 8082. As a safety net, also kill anything still
       listening on 8082 via Get-NetTCPConnection.

(b) claude-deepseek.cmd  — Windows CMD wrapper, one line:
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0claude-deepseek.ps1" %*

(c) On macOS/Linux create claude-deepseek.sh equivalent: start uv with \`setsid\`,
    write the PGID to .proxy.pid, and on exit \`kill -TERM -<pgid>\` to take down
    the whole tree.

=== Step 7: Global alias ===
Wire up an alias so the launcher works from any directory:

  - PowerShell: append to $PROFILE (create the parent directory if missing):
        function claude-deepseek { & "<ABSOLUTE_PATH_TO>\\claude-deepseek.ps1" @args }
        Set-Alias cdp claude-deepseek

  - bash/zsh:    append to ~/.bashrc or ~/.zshrc:
        alias claude-deepseek='<ABSOLUTE_PATH_TO>/claude-deepseek.sh'
        alias cdp='claude-deepseek'

Tell me explicitly that the alias only takes effect in NEW terminal windows (or after \`. $PROFILE\` / \`source ~/.zshrc\`).

=== Step 8: Verify the launcher end-to-end ===
Do a non-interactive test: temporarily put a fake \`claude\` shim earlier on PATH that just echoes the env vars and exits. Run \`claude-deepseek\`. Confirm:
  - the proxy started,
  - the shim saw ANTHROPIC_BASE_URL=http://127.0.0.1:8082 and AUTH_TOKEN=freecc,
  - after the shim exits, no process is left listening on port 8082.
Then remove the shim.

=== Step 9: Final report ===
Print a short summary:
  - which command launches Claude Code on DeepSeek,
  - where .env lives and that it's gitignored,
  - which model is used for Opus/Sonnet/Haiku traffic,
  - where to find server.log if something misbehaves,
  - that the alias is active in NEW terminals only.

=== Constraints ===
- The API key only ever lives in .env. Never print it, log it, or write it elsewhere.
- Do not add features beyond what is listed.
- Use the host's native shell — don't force PowerShell onto Unix or bash onto Windows.
- Common pitfalls to avoid:
    * Port 8082 already in use → identify and stop the listener, do not pick a different port.
    * DeepSeek model name drift → always trust /v1/models over the README.
    * uv child-process leak → process-tree kill, not single-process kill.
    * Existing $env:ANTHROPIC_API_KEY → must be unset for the launcher session.`
          }
        ]
      },
      {
        heading: { de: "Bonus", en: "Bonus" },
        type: "prompts",
        items: [
          {
            title: { de: "Bonus-Repos klonen (shadcn-ui + awesome-design-md)", en: "Clone bonus repos (shadcn-ui + awesome-design-md)" },
            content: `You're going to set up two GitHub repos as reference material for my current project — not as dependencies. After cloning, skim them so you know where to look, then wait for me to say what to build.

=== Step 1: Clone (shallow) into a references/ folder ===
Create references/ in the current working directory if it doesn't exist, then:

    git clone --depth 1 https://github.com/shadcn-ui/ui.git references/shadcn-ui
    git clone --depth 1 https://github.com/VoltAgent/awesome-design-md.git references/awesome-design-md

If references/<repo> already exists, skip the clone for that repo.

=== Step 2: Index both repos ===
Map each repo so you know where to look later. Report 3-5 bullets per repo:

- shadcn-ui: where the component sources live (e.g. registry/, apps/v4/...),
  how the \`npx shadcn add\` flow works, and which file documents styling
  conventions.
- awesome-design-md: which categories of design resources it curates (colors,
  typography, inspiration galleries, icon sets, etc.) and the entry README
  that lists them.

Don't read every file — just enough to navigate confidently on the next ask.

=== Step 3: Ask, don't act ===
After indexing, stop and ask me what I want to build. I'll tell you which shadcn component to lift or which design resource to pull from, and you adapt it to my project's actual stack — even if that stack is plain HTML, not React+Tailwind. Port shadcn components by inlining Tailwind utility classes and rewriting JSX as semantic HTML where required.

=== Constraints ===
- Don't run install scripts inside references/. They are read-only.
- Don't add either repo as a dependency to my project.
- Don't copy reference files into my project root — only the specific
  components/snippets I ask for, adapted to my stack.
- references/ should be added to .gitignore if my project uses git.`
          }
        ]
      },
      {
        heading: { de: "Aktualisieren & entfernen", en: "Update & remove" },
        type: "prompts",
        items: [
          {
            title: { de: "Plugins aktualisieren (Claude Code)", en: "Update plugins (Claude Code)" },
            content: `/plugin marketplace update cc-gemini-plugin
/plugin marketplace update openai-codex
/reload-plugins`
          },
          {
            title: { de: "Plugins entfernen (Claude Code)", en: "Remove plugins (Claude Code)" },
            content: `/plugin uninstall codex@openai-codex
/plugin uninstall cc-gemini-plugin@cc-gemini-plugin`
          },
          {
            title: { de: "CLIs entfernen (Terminal)", en: "Remove CLIs (terminal)" },
            content: `npm uninstall -g @openai/codex @google/gemini-cli`
          }
        ]
      },
      {
        heading: { de: "Repositories & Links", en: "Repositories & Links" },
        type: "links",
        items: [
          {
            label: "DeepSeek Platform",
            url: "https://platform.deepseek.com/usage",
            description: {
              de: "API-Key erstellen.",
              en: "Create your API key."
            }
          },
          {
            label: "free-claude-code",
            url: "https://github.com/Alishahryar1/free-claude-code",
            description: {
              de: "DeepSeek-Bonus-Repo.",
              en: "DeepSeek bonus repo."
            }
          },
          {
            label: "codex-plugin-cc",
            url: "https://github.com/openai/codex-plugin-cc",
            description: {
              de: "Quelle des Codex-Plugins.",
              en: "Codex plugin source."
            }
          },
          {
            label: "cc-gemini-plugin",
            url: "https://github.com/thepushkarp/cc-gemini-plugin",
            description: {
              de: "Quelle des Gemini-Plugins.",
              en: "Gemini plugin source."
            }
          }
        ]
      }
    ]
  },
  {
    id: "eKXC93LEs8c",
    title: "Claude + Playwright = Automatisierter Webagent",
    publishedAt: "2026-05-01",
    description: {
      de: "Wie du Claude und Playwright kombinierst, um einen Webagenten zu bauen, der eigenständig im Browser arbeitet. Prompts und Links zum Video folgen hier.",
      en: "How to combine Claude and Playwright to build a web agent that works autonomously in the browser. Prompts and links from the video will be added here."
    },
    sections: []
  },
  {
    id: "LDLa7NZ6eyc",
    title: "3D Websites erstellen war noch nie so einfach",
    thumbnailUrl: "https://i.ytimg.com/vi/LDLa7NZ6eyc/maxresdefault.jpg",
    publishedAt: "2026-04-29",
    description: {
      de: "Mit einem einzigen, gut strukturierten Claude-Prompt baust du eine komplette scroll-gesteuerte 3D-Video-Landingpage. Hier findest du den vollständigen Prompt zum Kopieren sowie die Tools und Inspirationen aus dem Video.",
      en: "With one well-structured Claude prompt you can build a complete scroll-driven 3D video landing page. Below you'll find the full prompt to copy, plus the tools and inspirations mentioned in the video."
    },
    sections: [
      {
        heading: { de: "Prompts", en: "Prompts" },
        type: "prompts",
        items: [
          {
            title: "Claude Design Prompt – Scroll-Driven Video Landing Page",
            content: `Build a scroll-driven video landing page using the uploaded MP4.

═══════════════════════════════════════════════════════════
STEP 1 — BEFORE WRITING ANY CODE: ASK A QUESTIONNAIRE
═══════════════════════════════════════════════════════════
Use the questions tool to ask the user about everything that goes
ON TOP of the video. Ask at minimum:

  • Topic / theme of the website (yoga studio? product launch?
    portfolio? agency? event?)
  • Brand name + tagline (if any)
  • Tone (calm/meditative, bold/energetic, editorial/luxury,
    playful, technical/serious, ...)
  • Color palette (warm cream + dark? high-contrast monochrome?
    brand colors? "decide for me"?)
  • Typography vibe (elegant serif? geometric sans? mixed?)
  • Captions during the scroll-video — do they want short poetic
    text overlays as the video plays? How many lines?
  • What sections/elements appear AFTER the video ends? Options:
      – Pricing card / call-to-action
      – Feature pillars (2-4 columns)
      – Testimonial / quote
      – Contact form
      – Image gallery
      – Stats / numbers
      – Custom sections (let them describe)
  • For each post-video section: should it overlay the FROZEN
    final frame (immersive, all on one pinned hero) OR appear as
    a normal scrolling section below?
  • Animation style for content reveals (slide from sides, fade
    up, scale in, none)
  • Visual treatment for cards (liquid glass / frosted? solid?
    minimal outline? "decide for me"?)

End with: "Anything else you want to specify, or shall I make
sensible choices for the rest?"

WAIT for the answers before building anything.

═══════════════════════════════════════════════════════════
STEP 2 — BUILD THE VIDEO MECHANIC (always the same, regardless
of answers)
═══════════════════════════════════════════════════════════

CORE BEHAVIOR:
- Uploaded MP4 is the full-screen hero background.
- NOT autoplay. Scrolling drives playback frame-by-frame, both
  directions.
- When video reaches its last frame, it FREEZES as a static
  background while content overlays scroll over it (or normal
  sections begin, depending on user's answer).

REQUIRED TECHNICAL SETUP (otherwise it stutters / jumps to 0):

1. BLOB LOADING — Don't use <source src="video.mp4">. Instead:
     fetch('video.mp4').then(r => r.blob()).then(blob => {
       video.src = URL.createObjectURL(blob);
       video.load();
     });
   Streaming MP4s often report seekable=[[0,0]] and currentTime
   won't advance. Blob URL fixes this.

2. CANVAS RENDERING — Hide the <video> (display:none) and draw
   each decoded frame into a <canvas> via
   requestVideoFrameCallback. Eliminates seek-flicker, makes
   reverse playback work.

3. FRAME-QUANTIZED SEEKING — In a requestAnimationFrame loop:
   • target = scrollProgress * video.duration
   • Ease: displayedTime += (target - displayedTime) * 0.30
   • Snap to frame grid: round(displayedTime / (1/FPS)) * (1/FPS)
   • Only seek if snap differs from last seek
   • Track seekInFlight via 'seeking'/'seeked'; skip new seeks
     while one is in flight (else they get cancelled → stutter)
   • Idle > 250ms + diff < 0.003 → snap exact, stop loop

4. SCROLL STRUCTURE:
     .scrollytell { position: relative; height: ~10vh per content
                    phase + 4vh for video; }
       .stage { position: sticky; top: 0; height: 100vh; }
         <canvas> (object-fit: cover, drawn manually)
         <video style="display:none">
   • Video maps to first ~25-30% of scroll progress
   • Remainder = frozen frame + content phases (per user's answers)

5. RE-ENCODE HINT — If video still stutters after correct code,
   tell user to re-export with dense keyframes:
     ffmpeg -i in.mp4 -c:v libx264 -crf 20 -g 3 -keyint_min 3 \\
       -sc_threshold 0 -movflags +faststart -an out.mp4
   Or in Premiere/Media Encoder: H.264, Keyframe Distance 1-3,
   Fast Start enabled.

═══════════════════════════════════════════════════════════
STEP 3 — BUILD THE CONTENT BASED ON THE ANSWERS
═══════════════════════════════════════════════════════════
Apply the user's choices for theme, palette, typography,
sections, and reveal animations on top of the video mechanic.

After delivery, offer iterative tweaks: "Want me to change the
copy / re-arrange the sections / try a different palette /
adjust timing?"`
          }
        ]
      },
      {
        heading: { de: "Tools & Inspiration", en: "Tools & Inspiration" },
        type: "links",
        items: [
          {
            label: "Motion Sites",
            url: "https://motionsites.ai/",
            description: {
              de: "Inspiration für scroll-gesteuerte Video-Websites — kuratierte Galerie aus echten Motion-Designs.",
              en: "Inspiration for scroll-driven video sites — a curated gallery of real motion designs."
            }
          },
          {
            label: "GitHub",
            url: "https://github.com/",
            description: {
              de: "Im Video erwähnt — zum Hosten und Versionieren des fertigen Projekts.",
              en: "Mentioned in the video — for hosting and versioning the finished project."
            }
          }
        ]
      }
    ]
  },
  {
    id: "LzD5fF1SJLg",
    title: "Claude 4.7 vs ChatGPT 5.5: Das große KI-Duell",
    publishedAt: "2026-04-27",
    description: {
      de: "Direkter Vergleich der beiden Top-Modelle im Praxiseinsatz: Claude 4.7 gegen ChatGPT 5.5. Wer macht den besseren Job, und wann lohnt sich welches Tool? Prompts und Links zum Video folgen hier.",
      en: "Head-to-head comparison of the two leading models in real use: Claude 4.7 versus ChatGPT 5.5. Which one delivers better, and when should you reach for which? Prompts and links from the video will be added here."
    },
    sections: []
  },
  {
    id: "b6NKgJ6FEKE",
    title: "Ich teste das neueste Bildgenerierungs-Tool von ChatGPT",
    publishedAt: "2026-04-25",
    description: {
      de: "Ich nehme das neue Bildgenerierungs-Tool von ChatGPT in die Praxis-Mangel und zeige dir, wo es überrascht und wo es noch hakt. Prompts und Links zum Video folgen hier.",
      en: "Putting ChatGPT's new image generation tool through real-world tests and showing where it shines and where it still falls short. Prompts and links from the video will be added here."
    },
    sections: []
  },
  {
    id: "dBtKy0hiDOY",
    title: "Wie du Claudes Nutzungs-Limit ausdribbelst",
    publishedAt: "2026-04-23",
    description: {
      de: "Praktische Tipps und Workflows, mit denen du Claudes tägliches Nutzungs-Limit clever umgehst und ohne Unterbrechung weiterarbeitest. Prompts und Links zum Video folgen hier.",
      en: "Practical tips and workflows for getting around Claude's daily usage limits and staying productive without interruptions. Prompts and links from the video will be added here."
    },
    sections: []
  }
];
