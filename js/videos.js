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
    id: "TBD",
    title: "Baue dein KI-Supermodell mit Claude Code",
    thumbnailUrl: "Vers1.png",
    publishedAt: "2026-05-01",
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
            title: { de: "1. CLIs installieren (Terminal, nicht Claude Code)", en: "1. Install the CLIs (terminal, not Claude Code)" },
            content: `npm install -g @openai/codex
npm install -g @google/gemini-cli`
          },
          {
            title: { de: "2. Versionen prüfen (optional)", en: "2. Check versions (optional)" },
            content: `codex --version
gemini --version`
          },
          {
            title: { de: "3. Codex-Login (Browser öffnet sich)", en: "3. Codex login (browser opens)" },
            content: `codex login`
          },
          {
            title: { de: "4. Gemini einmal starten für Google-OAuth, danach /quit", en: "4. Launch Gemini once for Google OAuth, then /quit" },
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
              de: `<p>Jetzt rüber in Claude Code — und Achtung: die nächsten fünf Befehle gehen <strong>einzeln</strong> rein. Einer einfügen, Enter, kurz warten, nächster. Alle auf einmal bricht die Installation, weil Claude Code sie zu einem ungültigen Befehl zusammenklebt.</p>`,
              en: `<p>Now over to Claude Code — and a heads-up: the next five commands go in <strong>one at a time</strong>. Paste one, hit enter, wait briefly, then the next. Pasting all at once breaks the install — Claude Code glues them into a malformed command.</p>`
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
        heading: { de: "Bonus — DeepSeek als 4. Modell anbinden", en: "Bonus — Wire up DeepSeek as a 4th model" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>Wenn du DeepSeek auch noch im Stack haben willst — geht in drei Handgriffen:</p>
<ol>
  <li>API-Key erstellen:
    <a href="https://platform.deepseek.com/usage" target="_blank" rel="noopener">platform.deepseek.com/usage</a></li>
  <li>Repo klonen:
    <a href="https://github.com/Alishahryar1/free-claude-code" target="_blank" rel="noopener">github.com/Alishahryar1/free-claude-code</a></li>
  <li>Ordner in Claude Code öffnen und Claude bitten:
    <em>„Richte das Repo ein und packe meinen DeepSeek-API-Key in eine <code>.env</code>-Datei."</em><br>
    Den Rest erledigt Claude.</li>
</ol>`,
              en: `<p>Want DeepSeek in the stack too? Three quick moves:</p>
<ol>
  <li>Create an API key:
    <a href="https://platform.deepseek.com/usage" target="_blank" rel="noopener">platform.deepseek.com/usage</a></li>
  <li>Clone the repo:
    <a href="https://github.com/Alishahryar1/free-claude-code" target="_blank" rel="noopener">github.com/Alishahryar1/free-claude-code</a></li>
  <li>Open the folder in Claude Code and ask Claude:
    <em>"Set up this repo and put my DeepSeek API key in a <code>.env</code> file."</em><br>
    Claude takes it from there.</li>
</ol>`
            }
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
