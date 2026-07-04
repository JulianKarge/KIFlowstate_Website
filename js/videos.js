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
    id: "hermes-local-ollama-free-claude-code-deepseek",
    youtubeId: "O45ecYSe5HE",
    title: {
      de: "ChatGPT gesperrt? Diese KI läuft auf deinem PC.",
      en: "ChatGPT blocked? This AI runs on your PC."
    },
    publishedAt: "2026-07-04",
    description: {
      de: "Zwei Setups aus dem neuen Tutorial: erst Hermes Agent lokal mit Ollama und einem Open-Source-Modell, danach Free Claude Code mit DeepSeek. Der DeepSeek-Teil nutzt denselben Setup-Prompt aus dem KI-Supermodell-Video.",
      en: "Two setups from the new tutorial: first Hermes Agent locally with Ollama and an open-source model, then Free Claude Code with DeepSeek. The DeepSeek part reuses the same setup prompt from the AI supermodel video."
    },
    thumbnailUrl: "images/osguide-thumbnail.png",
    sections: [
      {
        heading: { de: "Teil 1: Hermes lokal mit Ollama", en: "Part 1: Hermes locally with Ollama" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>Der lokale Weg l&auml;uft am besten als kurze manuelle Einrichtung. Erst Ollama installieren, dann ein Modell herunterladen, danach Hermes mit diesem lokalen Modell verbinden. Ollama stellt daf&uuml;r einen OpenAI-kompatiblen Endpoint unter <code>http://127.0.0.1:11434/v1</code> bereit.</p>
<ol>
  <li><strong>Ollama herunterladen.</strong> Entweder &uuml;ber den Browser auf <a href="https://ollama.com/download" target="_blank" rel="noopener">ollama.com/download</a> oder direkt im Terminal mit dem passenden Installationsbefehl unten.</li>
  <li><strong>Ollama einmal &ouml;ffnen.</strong> Danach pr&uuml;fen, ob der Befehl <code>ollama</code> im Terminal funktioniert.</li>
  <li><strong>Modell Ihrer Wahl herunterladen.</strong> Suchen Sie sich ein Modell aus der Ollama-Bibliothek aus und laden Sie es mit <code>ollama run &lt;modell&gt;</code>.</li>
  <li><strong>Hermes installieren oder starten.</strong> Am einfachsten mit <code>ollama launch hermes</code>. Alternativ Hermes direkt mit dem passenden Terminal-Befehl f&uuml;r macOS, Linux, WSL oder Windows installieren.</li>
  <li><strong>Hermes verbinden.</strong> Im Setup den lokalen Ollama-Endpoint ausw&auml;hlen und das heruntergeladene Modell best&auml;tigen.</li>
</ol>`,
              en: `<p>The local path works best as a short manual setup. First install Ollama, then download a model, then connect Hermes to that local model. Ollama exposes an OpenAI-compatible endpoint at <code>http://127.0.0.1:11434/v1</code>.</p>
<ol>
  <li><strong>Download Ollama.</strong> Either use the browser at <a href="https://ollama.com/download" target="_blank" rel="noopener">ollama.com/download</a>, or install it directly in the terminal with the matching command below.</li>
  <li><strong>Open Ollama once.</strong> Then check whether the <code>ollama</code> command works in your terminal.</li>
  <li><strong>Download a model of your choice.</strong> Pick a model from the Ollama library and pull it with <code>ollama run &lt;model&gt;</code>.</li>
  <li><strong>Install or launch Hermes.</strong> The easiest route is <code>ollama launch hermes</code>. Alternatively, install Hermes directly with the matching terminal command for macOS, Linux, WSL, or Windows.</li>
  <li><strong>Connect Hermes.</strong> In setup, select the local Ollama endpoint and confirm the model you downloaded.</li>
</ol>`
            }
          }
        ]
      },
      {
        heading: { de: "Schritt 1 und 2: Ollama installieren, Modell laden", en: "Step 1 and 2: install Ollama, pull a model" },
        type: "prompts",
        icon: "fa-terminal",
        items: [
          {
            title: {
              de: "Option A: Download im Browser",
              en: "Option A: browser download"
            },
            content: `https://ollama.com/download`
          },
          {
            title: {
              de: "Option B: Terminal-Installation",
              en: "Option B: terminal install"
            },
            content: `# macOS / Linux / WSL
curl -fsSL https://ollama.com/install.sh | sh

# Windows PowerShell
irm https://ollama.com/install.ps1 | iex`
          }
        ]
      },
      {
        heading: { de: "Schritt 3: Hermes installieren", en: "Step 3: install Hermes" },
        type: "prompts",
        icon: "fa-robot",
        items: [
          {
            title: {
              de: "Empfohlen: Hermes &uuml;ber Ollama starten",
              en: "Recommended: launch Hermes through Ollama"
            },
            content: `# Ollama handles the Hermes setup flow and connects it to your local model.
ollama launch hermes`
          },
          {
            title: {
              de: "Terminal-Installation",
              en: "Terminal install"
            },
            content: `# macOS / Linux / WSL
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash

# Windows PowerShell
iex (irm https://hermes-agent.nousresearch.com/install.ps1)`
          }
        ]
      },
      {
        heading: { de: "Teil 2: Free Claude Code mit DeepSeek", en: "Part 2: Free Claude Code with DeepSeek" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>Der zweite Teil nutzt das bekannte Free-Claude-Code-Setup: ein lokaler Anthropic-kompatibler Proxy startet auf Port <code>8082</code> und leitet Claude-Code-Traffic an DeepSeek weiter. Den Setup-Prompt unten habe ich aus dem KI-Supermodell-Video &uuml;bernommen, damit beide Videos dieselbe robuste Anleitung verwenden.</p>`,
              en: `<p>The second part uses the known Free Claude Code setup: a local Anthropic-compatible proxy starts on port <code>8082</code> and routes Claude Code traffic to DeepSeek. The setup prompt below is reused from the AI supermodel video so both videos use the same robust walkthrough.</p>`
            }
          }
        ]
      },
      {
        id: "deepseek-setup-prompt",
        heading: { de: "DeepSeek-Setup-Prompt", en: "DeepSeek setup prompt" },
        type: "prompts",
        items: [
          {
            title: {
              de: "Free Claude Code mit DeepSeek einrichten",
              en: "Set up Free Claude Code with DeepSeek"
            },
            content: "Dieser Prompt wird automatisch aus dem bestehenden KI-Supermodell-Ressourcen-Eintrag übernommen."
          }
        ]
      },
      {
        heading: { de: "Links & Ressourcen", en: "Links & resources" },
        type: "links",
        items: [
          {
            label: "Ollama Hermes Integration",
            url: "https://docs.ollama.com/integrations/hermes",
            description: {
              de: "Offizielle Ollama-Anleitung für Hermes Agent, inklusive ollama launch hermes und manuellem Setup.",
              en: "Official Ollama guide for Hermes Agent, including ollama launch hermes and manual setup."
            }
          },
          {
            label: "Ollama Download",
            url: "https://ollama.com/download",
            description: {
              de: "Installer für Windows, macOS und Linux.",
              en: "Installer for Windows, macOS, and Linux."
            }
          },
          {
            label: "free-claude-code",
            url: "https://github.com/Alishahryar1/free-claude-code",
            description: {
              de: "GitHub-Repository für den lokalen Claude-Code-Proxy.",
              en: "GitHub repository for the local Claude Code proxy."
            }
          },
          {
            label: "DeepSeek Platform",
            url: "https://platform.deepseek.com/usage",
            description: {
              de: "API-Key erstellen und Verbrauch prüfen.",
              en: "Create an API key and check usage."
            }
          },
          {
            label: "DeepSeek Claude Code Docs",
            url: "https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code",
            description: {
              de: "Offizielle DeepSeek-Dokumentation zur Claude-Code-Integration.",
              en: "Official DeepSeek documentation for Claude Code integration."
            }
          }
        ]
      }
    ]
  },
  {
    id: "WxxyjK4ib50",
    title: {
      de: "Claude Code Tutorial 2026: Vom Anfänger zum Profi in 5 Schritten",
      en: "Claude Code Tutorial 2026: From beginner to pro in 5 steps"
    },
    publishedAt: "2026-06-16",
    description: {
      de: "Ein kompakter Lernpfad für Claude Code: vom richtigen Agenten-Mindset über CLAUDE.md, Memory und Skills bis zu MCPs, Automationen, Remote-Steuerung und Orchestrierung. Unten findest du die fünf Schritte als Spickzettel, drei Copy-Prompts und die wichtigsten offiziellen Docs.",
      en: "A compact learning path for Claude Code: from the right agent mindset through CLAUDE.md, memory and skills to MCPs, automation, remote control and orchestration. Below you'll find the five steps as a cheat sheet, three copy prompts and the most important official docs."
    },
    sections: [
      {
        heading: { de: "Die fünf Schritte", en: "The five steps" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>Der Fahrplan aus dem Video, kurz zum Nachschlagen:</p>
<ol>
  <li><strong>Grundlagen:</strong> Behandle Claude Code nicht wie einen Chatbot, sondern wie einen Agenten, der Dateien lesen, schreiben, Befehle ausführen und Aufgaben in Schleifen erledigen kann.</li>
  <li><strong>Verstehen:</strong> Nutze <code>CLAUDE.md</code> und Memory bewusst. Alles, was immer geladen wird, kostet Kontext. Dauerhafte Regeln gehören dort hinein, lange Spezialanleitungen besser nicht.</li>
  <li><strong>Üben:</strong> Lege wiederverwendbare Skills an. So bekommt Claude Code genau dann Spezialwissen, wenn es gebraucht wird, ohne jede Session mit riesigem Kontext zu starten.</li>
  <li><strong>Aufbauen:</strong> Verbinde externe Tools über MCPs, Hooks und geplante Workflows. So wird aus einem lokalen Coding-Agenten ein System, das mit Kalendern, Figma, Notion, Gmail oder Dateien arbeiten kann.</li>
  <li><strong>Meistern:</strong> Denk als Orchestrator. Wähle je Aufgabe das passende Modell, kombiniere Skills, Agents, MCPs und Automationen und halte Feedback-Schleifen fest, damit dein Setup mit jeder Session besser wird.</li>
</ol>`,
              en: `<p>The roadmap from the video, summarized for quick reference:</p>
<ol>
  <li><strong>Fundamentals:</strong> Treat Claude Code as an agent, not a chatbot. It can read files, write files, run commands and work through tasks in loops.</li>
  <li><strong>Understanding:</strong> Use <code>CLAUDE.md</code> and memory deliberately. Anything that always loads spends context. Permanent rules belong there, long specialist instructions usually do not.</li>
  <li><strong>Practice:</strong> Create reusable skills. Claude Code gets specialist knowledge only when needed, instead of starting every session with huge context.</li>
  <li><strong>Build:</strong> Connect external tools through MCPs, hooks and scheduled workflows. This turns a local coding agent into a system that can work with calendars, Figma, Notion, Gmail or files.</li>
  <li><strong>Mastery:</strong> Think like an orchestrator. Pick the right model for each job, combine skills, agents, MCPs and automation, and preserve feedback loops so your setup improves with every session.</li>
</ol>`
            }
          }
        ]
      },
      {
        heading: { de: "Setup nach Bedarf", en: "Setup as needed" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>Installiere nur die Tools, die du wirklich nutzen willst. Für den Start reicht Claude Code. Codex und Gemini sind sinnvoll, wenn du zusätzliche Modelle direkt im Terminal verwenden möchtest.</p>
<ul>
  <li><strong>Claude Code:</strong> dein Haupt-Agent im Projektordner.</li>
  <li><strong>Codex CLI:</strong> OpenAI-Coding-Agent im Terminal.</li>
  <li><strong>Gemini CLI:</strong> Google-Coding-Agent im Terminal.</li>
  <li><strong>Frontend Design:</strong> besseres UI-Gefühl und weniger generische Designs.</li>
  <li><strong>Skill Creator:</strong> eigene Skills sauber erstellen oder verbessern.</li>
  <li><strong>Memory / Remember:</strong> Sitzungen zusammenfassen und Wissen über längere Arbeit hinweg behalten.</li>
</ul>`,
              en: `<p>Install only the tools you actually want to use. Claude Code is enough to get started. Codex and Gemini are useful when you want extra models directly in your terminal.</p>
<ul>
  <li><strong>Claude Code:</strong> your main agent inside a project folder.</li>
  <li><strong>Codex CLI:</strong> OpenAI coding agent in the terminal.</li>
  <li><strong>Gemini CLI:</strong> Google coding agent in the terminal.</li>
  <li><strong>Frontend Design:</strong> stronger UI taste and less generic designs.</li>
  <li><strong>Skill Creator:</strong> create or improve your own skills cleanly.</li>
  <li><strong>Memory / Remember:</strong> summarize sessions and keep knowledge across longer work.</li>
</ul>`
            }
          }
        ]
      },
      {
        heading: { de: "CLI-Downloads", en: "CLI downloads" },
        type: "prompts",
        icon: "fa-download",
        items: [
          {
            title: {
              de: "Claude Code installieren",
              en: "Install Claude Code"
            },
            content: {
              de: `# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# macOS, Linux oder WSL
curl -fsSL https://claude.ai/install.sh | bash

# Danach im Projektordner starten
cd dein-projekt
claude

# Optional: Version prüfen
claude --version`,
              en: `# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# macOS, Linux or WSL
curl -fsSL https://claude.ai/install.sh | bash

# Then start it inside your project folder
cd your-project
claude

# Optional: check version
claude --version`
            }
          },
          {
            title: {
              de: "Codex CLI installieren",
              en: "Install Codex CLI"
            },
            content: {
              de: `# Windows PowerShell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"

# macOS oder Linux
curl -fsSL https://chatgpt.com/codex/install.sh | sh

# Alternative mit npm
npm install -g @openai/codex

# Danach anmelden und starten
codex login
codex`,
              en: `# Windows PowerShell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"

# macOS or Linux
curl -fsSL https://chatgpt.com/codex/install.sh | sh

# Alternative with npm
npm install -g @openai/codex

# Then log in and start
codex login
codex`
            }
          },
          {
            title: {
              de: "Gemini CLI installieren",
              en: "Install Gemini CLI"
            },
            content: {
              de: `# Mit npm global installieren
npm install -g @google/gemini-cli

# Oder ohne globale Installation testen
npx @google/gemini-cli

# Danach starten und mit Google anmelden
gemini

# Optional: Version prüfen
gemini --version`,
              en: `# Install globally with npm
npm install -g @google/gemini-cli

# Or test without a global install
npx @google/gemini-cli

# Then start it and sign in with Google
gemini

# Optional: check version
gemini --version`
            }
          }
        ]
      },
      {
        heading: { de: "Claude-Code-Plugins installieren", en: "Install Claude Code plugins" },
        type: "prompts",
        icon: "fa-puzzle-piece",
        items: [
          {
            title: {
              de: "Frontend Design",
              en: "Frontend Design"
            },
            content: `/plugin install frontend-design@claude-plugins-official
/reload-plugins`
          },
          {
            title: {
              de: "Skill Creator",
              en: "Skill Creator"
            },
            content: `/plugin install skill-creator@claude-plugins-official
/reload-plugins`
          },
          {
            title: {
              de: "Memory / Remember",
              en: "Memory / Remember"
            },
            content: `/plugin install remember@claude-plugins-official
/reload-plugins
/remember:init`
          }
        ]
      },
      {
        heading: { de: "Kurze Nutzung", en: "Quick usage" },
        type: "text",
        items: [
          {
            html: {
              de: `<ol>
  <li>Erst ein neues Terminal öffnen und im Projektordner <code>claude</code> starten.</li>
  <li>Die drei Plugin-Befehle in Claude Code einzeln einfügen, nicht als großen Block.</li>
  <li>Danach kurz testen: <code>Nutze den frontend-design Skill und überarbeite diese Komponente</code>, <code>Nutze skill-creator und hilf mir, einen Skill für X zu bauen</code> oder <code>/remember:init</code>.</li>
  <li>Wenn ein Plugin nicht auftaucht, Claude Code schließen, neu öffnen und <code>/plugin list</code> prüfen.</li>
</ol>`,
              en: `<ol>
  <li>Open a new terminal first and start <code>claude</code> inside your project folder.</li>
  <li>Paste the three plugin commands into Claude Code one by one, not as one large block.</li>
  <li>Then test quickly: <code>Use the frontend-design skill and improve this component</code>, <code>Use skill-creator and help me build a skill for X</code>, or <code>/remember:init</code>.</li>
  <li>If a plugin does not show up, close Claude Code, reopen it and check <code>/plugin list</code>.</li>
</ol>`
            }
          }
        ]
      },
      {
        heading: { de: "Copy-Prompts", en: "Copy prompts" },
        type: "prompts",
        items: [
          {
            title: {
              de: "1. Claude-Code-Setup auditieren",
              en: "1. Audit my Claude Code setup"
            },
            content: {
              de: `Prüfe mein aktuelles Claude-Code-Setup und erstelle einen konkreten Verbesserungsplan.

Ziel:
Ich will Claude Code langfristig wie einen Agenten nutzen, nicht nur wie einen Chatbot. Prüfe, ob mein Setup dafür sauber strukturiert ist.

Bitte arbeite so:
1. Lies zuerst die Projektstruktur.
2. Suche nach CLAUDE.md, AGENTS.md, .claude/, skills, agents, hooks, MCP-Konfigurationen und relevanten Settings.
3. Ändere noch keine Dateien.
4. Erstelle eine kurze Bestandsaufnahme:
   - Was ist bereits gut eingerichtet?
   - Was lädt wahrscheinlich zu viel Kontext?
   - Was sollte in CLAUDE.md bleiben?
   - Was sollte besser als Skill, Agent, Hook oder MCP gelöst werden?
5. Schlage danach einen Umsetzungsplan in kleinen, sicheren Schritten vor.
6. Warte auf mein OK, bevor du Dateien änderst.

Bewerte besonders:
- persistenter Kontext
- wiederverwendbare Skills
- Tool-Zugriffe über MCP
- Sicherheitsregeln vor gefährlichen Aktionen
- Feedback-Schleifen, damit Claude Code aus Projekten lernt`,
              en: `Audit my current Claude Code setup and create a concrete improvement plan.

Goal:
I want to use Claude Code as a long-term agent, not just as a chatbot. Check whether my setup is structured for that.

Please work like this:
1. Read the project structure first.
2. Look for CLAUDE.md, AGENTS.md, .claude/, skills, agents, hooks, MCP configs and relevant settings.
3. Do not edit files yet.
4. Create a short inventory:
   - What is already set up well?
   - What probably loads too much context?
   - What should stay in CLAUDE.md?
   - What should become a skill, agent, hook or MCP instead?
5. Then propose an implementation plan in small, safe steps.
6. Wait for my OK before changing files.

Focus especially on:
- persistent context
- reusable skills
- tool access through MCP
- safety rules before risky actions
- feedback loops so Claude Code learns from projects`
            }
          },
          {
            title: {
              de: "2. Persönlichen Skill erstellen",
              en: "2. Create a personal skill"
            },
            content: {
              de: `Erstelle mit mir einen wiederverwendbaren Claude-Code-Skill.

Wichtig:
Stelle zuerst Fragen. Erstelle den Skill erst, wenn du genug Kontext hast.

Fragen:
1. Für welchen wiederkehrenden Workflow soll der Skill sein?
2. Welche Eingaben bekommt der Skill normalerweise?
3. Welche Dateien, Tools, Webseiten oder APIs muss er kennen?
4. Welche Entscheidungen soll er selbst treffen dürfen?
5. Welche Aktionen brauchen immer meine Freigabe?
6. Wie soll das Ergebnis aussehen?
7. Welche Beispiele für gute und schlechte Ergebnisse gibt es?
8. Soll der Skill eher knapp, gründlich, kreativ oder streng arbeiten?

Nach meinen Antworten:
1. Fasse das Ziel des Skills kurz zusammen.
2. Schlage eine Skill-Struktur vor.
3. Erstelle ein SKILL.md mit:
   - Name
   - Beschreibung
   - Wann der Skill genutzt werden soll
   - Schritt-für-Schritt-Workflow
   - Qualitätskriterien
   - Sicherheitsregeln
   - Beispiel-Prompts
4. Wenn der Skill Dateien braucht, schlage sinnvolle Unterordner vor.
5. Erkläre am Ende, wie ich den Skill testen kann.`,
              en: `Create a reusable Claude Code skill with me.

Important:
Ask questions first. Do not create the skill until you have enough context.

Questionnaire:
1. Which recurring workflow should this skill handle?
2. What inputs does the skill usually receive?
3. Which files, tools, websites or APIs does it need to know?
4. Which decisions may it make on its own?
5. Which actions always require my approval?
6. What should the output look like?
7. What are examples of good and bad results?
8. Should the skill be concise, thorough, creative or strict?

After my answers:
1. Summarize the goal of the skill.
2. Propose a skill structure.
3. Create a SKILL.md with:
   - Name
   - Description
   - When to use the skill
   - Step-by-step workflow
   - Quality criteria
   - Safety rules
   - Example prompts
4. If the skill needs files, suggest useful subfolders.
5. Explain how I can test the skill.`
            }
          },
          {
            title: {
              de: "3. MCP- und Automations-Plan bauen",
              en: "3. Build an MCP and automation plan"
            },
            content: {
              de: `Hilf mir, einen MCP- und Automations-Plan für meinen Agenten zu bauen.

Ziel:
Ich will wiederkehrende Aufgaben nicht mehr manuell starten müssen. Der Agent soll wissen, welche Tools er braucht, welche Trigger sinnvoll sind und wo Sicherheitsgrenzen liegen.

Bitte frage zuerst:
1. Welche wiederkehrende Aufgabe soll automatisiert werden?
2. Welche Tools oder Datenquellen sind beteiligt?
3. Soll der Workflow manuell, zeitgesteuert oder durch ein Ereignis starten?
4. Welche Aktionen darf der Agent nur lesen?
5. Welche Aktionen dürfen schreiben oder senden?
6. Welche Schritte brauchen immer Freigabe?
7. Wo sollen Logs, Zusammenfassungen oder Ergebnisse abgelegt werden?

Danach liefere:
1. Eine Architektur in einfachen Worten.
2. Welche MCP-Server oder Integrationen gebraucht werden.
3. Welche Hooks oder Scheduler sinnvoll sind.
4. Ein Sicherheitsmodell mit Freigabepunkten.
5. Einen Testplan mit Dummy-Daten.
6. Erst danach konkrete Installations- oder Konfigurationsschritte.

Regel:
Keine Credentials ausgeben, keine Secrets speichern, keine externen Aktionen ausführen, bevor ich ausdrücklich zustimme.`,
              en: `Help me build an MCP and automation plan for my agent.

Goal:
I do not want to start recurring tasks manually anymore. The agent should know which tools it needs, which triggers make sense and where the safety boundaries are.

Ask first:
1. Which recurring task should be automated?
2. Which tools or data sources are involved?
3. Should the workflow start manually, on a schedule or from an event?
4. Which actions should be read-only?
5. Which actions may write or send?
6. Which steps always require approval?
7. Where should logs, summaries or results be stored?

Then deliver:
1. An architecture in simple language.
2. Which MCP servers or integrations are needed.
3. Which hooks or schedulers make sense.
4. A safety model with approval points.
5. A test plan with dummy data.
6. Only then concrete installation or configuration steps.

Rule:
Do not print credentials, do not store secrets and do not perform external actions before I explicitly approve.`
            }
          }
        ]
      },
      {
        heading: { de: "Offizielle Docs", en: "Official docs" },
        type: "links",
        items: [
          {
            label: "OpenAI Codex CLI",
            url: "https://developers.openai.com/codex/cli",
            description: {
              de: "Offizielle Codex-CLI-Seite von OpenAI mit Installation, Login und Terminal-Workflow.",
              en: "Official OpenAI Codex CLI page with installation, login and terminal workflow."
            }
          },
          {
            label: "Gemini CLI",
            url: "https://github.com/google-gemini/gemini-cli",
            description: {
              de: "Offizielles Google-GitHub-Repository für Gemini CLI.",
              en: "Official Google GitHub repository for Gemini CLI."
            }
          },
          {
            label: "Claude Plugins",
            url: "https://claude.com/plugins",
            description: {
              de: "Offizielles Plugin-Verzeichnis für Claude Code, inklusive Frontend Design, Skill Creator und Remember.",
              en: "Official plugin directory for Claude Code, including Frontend Design, Skill Creator and Remember."
            }
          },
          {
            label: "Claude Code Overview",
            url: "https://docs.anthropic.com/en/docs/claude-code/overview",
            description: {
              de: "Offizieller Einstieg: Was Claude Code ist, wo es läuft und wie du es installierst.",
              en: "Official starting point: what Claude Code is, where it runs and how to install it."
            }
          },
          {
            label: "Claude Code Memory",
            url: "https://docs.anthropic.com/en/docs/claude-code/memory",
            description: {
              de: "Wie Claude Code Projektwissen speichert und wann Memory statt langer Startanweisungen sinnvoll ist.",
              en: "How Claude Code stores project knowledge and when memory is better than long startup instructions."
            }
          },
          {
            label: "Claude Code Skills",
            url: "https://docs.anthropic.com/en/docs/claude-code/skills",
            description: {
              de: "Skills erstellen, verwalten und als wiederverwendbare Workflows nutzen.",
              en: "Create, manage and use skills as reusable workflows."
            }
          },
          {
            label: "Claude Code MCP",
            url: "https://docs.anthropic.com/en/docs/claude-code/mcp",
            description: {
              de: "Claude Code mit externen Tools, Datenbanken und APIs über das Model Context Protocol verbinden.",
              en: "Connect Claude Code to external tools, databases and APIs through the Model Context Protocol."
            }
          },
          {
            label: "Claude Code Hooks",
            url: "https://docs.anthropic.com/en/docs/claude-code/hooks",
            description: {
              de: "Automationen an Ereignisse im Claude-Code-Lifecycle hängen, zum Beispiel Formatierung, Prüfungen oder Benachrichtigungen.",
              en: "Attach automation to events in the Claude Code lifecycle, for example formatting, checks or notifications."
            }
          },
          {
            label: "Claude Code Subagents",
            url: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
            description: {
              de: "Spezialisierte Agents für getrennte Aufgaben, eigenes Wissen und saubere Kontexttrennung.",
              en: "Specialized agents for separate tasks, their own knowledge and cleaner context separation."
            }
          }
        ]
      }
    ]
  },
  {
    id: "e-M-K0jYX5w",
    title: {
      de: "Die Claude Mythos Familie ist nun verfügbar",
      en: "The Claude Mythos family is now available"
    },
    publishedAt: "2026-06-09",
    description: {
      de: "Das neue Claude-Mythos-Modell erscheint jetzt als Fable 5. Im Video trenne ich den IPO-Hype von den tatsächlichen Use Cases, damit du dir ein objektives Bild vom Release machen kannst. Unten findest du die beiden Artikel von Anthropic zum Nachlesen.",
      en: "The new Claude Mythos model is launching as Fable 5. In the video I separate the IPO hype from the actual use cases so you can form an objective view of the release. Below you'll find the two Anthropic articles to read up on."
    },
    sections: [
      {
        heading: { de: "Zum Nachlesen", en: "Further reading" },
        type: "links",
        items: [
          {
            label: "Claude Fable 5 & Mythos 5 (Anthropic)",
            url: "https://www.anthropic.com/news/claude-fable-5-mythos-5",
            description: {
              de: "Die offizielle Ankündigung von Anthropic zur neuen Mythos-Familie und zum Release von Fable 5.",
              en: "Anthropic's official announcement of the new Mythos family and the Fable 5 release."
            }
          },
          {
            label: "Recursive Self-Improvement (Anthropic Institute)",
            url: "https://www.anthropic.com/institute/recursive-self-improvement",
            description: {
              de: "Hintergrund vom Anthropic Institute zu rekursiver Selbstverbesserung, dem Forschungsthema hinter dem neuen Modell.",
              en: "Background from the Anthropic Institute on recursive self-improvement, the research behind the new model."
            }
          }
        ]
      }
    ]
  },
  {
    id: "mbw_as_-Um8",
    title: {
      de: "Hermes Agent | Dein KI-Mitarbeiter, der nie vergisst",
      en: "Hermes Agent | Your AI coworker who never forgets"
    },
    thumbnailUrl: "images/vid9-hermes.png",
    publishedAt: "2026-06-02",
    description: {
      de: "Hermes ist ein KI-Agent, der eigenständig Aufgaben übernimmt. Hier zeige ich dir, wie ich ihn in meinen Workflow integriert habe und wofür ich ihn täglich nutze. Unten findest du den Setup-Prompt, mit dem du fünf Erweiterungen auf einmal aktivierst.",
      en: "Hermes is an AI agent that handles tasks autonomously. Here I'll show you how I've integrated it and what I use it for every day. Below you'll find the setup prompt that activates five extensions in one go."
    },
    sections: [
      {
        heading: { de: "Skill-Pack auf einmal aktivieren", en: "Activate the skill pack in one shot" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>Mit einem einzigen Prompt richtet Hermes dein vollständiges
<strong>Basis-Setup</strong> ein:
<strong>Identität, Zeitzone &amp; Sprache</strong>,
<strong>Tagesbudget</strong> für LLM-Kosten,
<strong>Holographic Memory</strong> (sessionübergreifendes Gedächtnis),
<strong>Kanban</strong> (Aufgabenverwaltung),
<strong>Walk-Away Mode</strong> (langes autonomes Arbeiten),
<strong>Remote Approval Gate</strong> (Sicherheitsabfrage vor unwiderruflichen Aktionen),
<strong>MCP-Integration</strong> (Filesystem, Git, Web Search) und
<strong>automatisches Backup</strong> deiner Memory- und Kanban-Daten.</p>
<p>Bevor Hermes etwas installiert, stellt er dir eine
<strong>kurze Q&amp;A</strong> mit allen Fragen auf einmal. So wird das
Setup auf dich persönlich zugeschnitten (z. B. Backup-Ziel, Tagesbudget in €,
gewünschte zusätzliche MCPs). Halte idealerweise Credentials für dein
Backup-Ziel bereit (S3, Backblaze, Google Drive oder ein anderer Pfad).</p>
<p>Der Agent prüft selbständig, was bereits eingerichtet ist, und überspringt
vorhandene Komponenten. Du kannst den Prompt also gefahrlos auch mehrfach
schicken. Am Ende erhältst du im selben Chat einen kompakten Statusbericht
(✅ neu / ⏭️ vorhanden / ❌ fehlgeschlagen).</p>
<p><strong>So gehst du vor:</strong> Prompt unten kopieren und an Hermes
schicken, egal über welchen Kanal du den Agenten ansprichst
(Messenger, Web-UI, Terminal). Kurz die Q&amp;A beantworten, fertig.</p>`,
              en: `<p>A single prompt sets up your complete Hermes
<strong>base configuration</strong>:
<strong>identity, timezone &amp; language</strong>,
a <strong>daily cost cap</strong> for LLM usage,
<strong>Holographic Memory</strong> (cross-session memory),
<strong>Kanban</strong> (task management),
<strong>Walk-Away Mode</strong> (long autonomous runs),
<strong>Remote Approval Gate</strong> (safety check before irreversible actions),
<strong>MCP integration</strong> (filesystem, git, web search), and
<strong>automatic backup</strong> of your memory and kanban data.</p>
<p>Before installing anything, Hermes runs a <strong>short Q&amp;A</strong>
with all questions in one batch, so the setup is tailored to you (e.g.
backup target, daily budget in €, optional extra MCPs). Have credentials
ready for your backup target (S3, Backblaze, Google Drive, or another
path).</p>
<p>The agent checks what's already in place and skips anything present, so
it's safe to send more than once. At the end you'll get a compact status
report in the same chat (✅ new / ⏭️ already present / ❌ failed).</p>
<p><strong>How to use it:</strong> copy the prompt below and send it to
Hermes through whichever channel you talk to the agent
(messenger, web UI, terminal). Answer the short Q&amp;A, done.</p>`
            }
          }
        ]
      },
      {
        heading: { de: "Setup-Prompt", en: "Setup prompt" },
        type: "prompts",
        items: [
          {
            title: {
              de: "Hermes Basis-Setup: komplettes Setup mit kurzer Q&A",
              en: "Hermes base setup — complete setup with a short Q&A"
            },
            content: {
              de: `Du bist Hermes Agent. Bitte richte mein vollständiges Basis-Setup ein.

ABLAUF (bitte in dieser Reihenfolge):
1. ZUERST: alle acht Punkte unten lesen.
2. DANN: alle [FRAGEN]-Punkte (0, 1, 6, 7) in EINER einzigen Nachricht im
   aktuellen Chat stellen, als nummerierte Liste, mit Vorschlagswerten in
   Klammern, damit ich nur das Nötigste eintippen muss.
3. AUF MEINE ANTWORTEN WARTEN. Nichts installieren, bevor ich geantwortet habe.
4. DANACH: alles installieren / konfigurieren. Vorhandenes überspringen.
5. ABSCHLUSS: kompakten Statusbericht ausgeben (siehe unten).

REGELN:
- Vor jeder Installation prüfen, ob bereits vorhanden. Wenn ja: überspringen.
- Verhaltensregeln, Modi, Gates, Budget und Backup-Plan in der
  Systemkonfiguration verankern (z. B. CLAUDE.md, AGENTS.md oder dem
  entsprechenden Hermes-Instruction-File), damit sie sessionübergreifend
  gelten, nicht nur in dieser Konversation.
- Bei fehlenden Infos oder Unklarheiten: im aktuellen Chat zurückfragen
  statt raten.

── GRUNDEINSTELLUNGEN ──

0) Identität, Zeitzone & Sprache  [FRAGEN]
   - Wie soll ich dich ansprechen? (Vor- oder Vor-/Nachname; Du-Form)
   - Default-Antwortsprache? (Deutsch / Englisch / passend zur Eingabe)
   - Zeitzone? (Vorschlag: Europe/Berlin)
   Als feste Werte in der Systemkonfiguration hinterlegen.

1) Tagesbudget für LLM-Kosten  [FRAGEN]
   - Maximales Tagesbudget in € oder Tokens? (Vorschlag: 5 € pro Tag)
   - Verhalten bei Erreichen? (a) hart stoppen, (b) erst nachfragen
   Cost-Tracker installieren, falls noch nicht vorhanden. Limit als hartes
   Cap in der Systemkonfiguration verankern.

── FÄHIGKEITEN ──

2) Holographic Memory
   Aktiviere den Hermes-Memory-Provider „holographic", ein lokales,
   HRR-basiertes Langzeitgedächtnis (Holographic Reduced Representations)
   mit SQLite-Speicher, Trust-Scoring (selbstkorrigierend, wiederholt
   bestätigte Erinnerungen gewinnen Gewicht) und ohne externe Services.
   - Zuerst ~/.hermes/config.yaml prüfen. Wenn dort bereits
     "memory: { provider: holographic }" gesetzt ist: überspringen.
   - Andernfalls: entweder den Wizard ausführen
       hermes memory setup
     und "holographic" auswählen, oder die Konfiguration direkt eintragen:
       memory:
         provider: holographic
   - Standard-Speicherort akzeptieren (lokale SQLite-Datei am Hermes-Default).

3) Kanban
   Aktiviere das Kanban-Modul von Hermes (Spalten: Backlog / In Arbeit /
   Wartet / Erledigt). Konfiguriere es so, dass neue Aufgaben aus
   eingehenden Nachrichten automatisch im Backlog landen und ich den Status
   per Nachricht ändern kann.

4) Walk-Away Mode
   Modus für autonomes Arbeiten über längere Zeit (Standard-Fenster: 30 Minuten).
   Statt einzelner Zwischenfragen lieferst du eine zusammengefasste Statusmeldung
   am Ende des Fensters oder sobald ein Block erledigt ist. Unterbrich nur
   bei echten Blockern oder wenn der Approval Gate (Punkt 5) auslöst.

5) Remote Approval Gate
   Vor jeder unwiderruflichen oder kostenverursachenden Aktion (Dateien löschen,
   E-Mails versenden, Zahlungen, kostenpflichtige API-Calls, git push --force,
   DNS- oder Domain-Änderungen) schreibst du mir im aktuellen Chat:
     Aktion · Begründung · erwartete Auswirkung.
   Warte auf „ok" / „nein" / freie Antwort. Bei „nein" oder Timeout
   (10 Minuten): abbrechen und melden.

6) MCP-Integration  [FRAGEN]
   Installiere die Basis-MCP-Server (Filesystem, Git, Web Search) und
   verbinde sie mit deiner MCP-Konfiguration.
   - Soll ich darüber hinaus weitere MCPs einrichten?
     (z. B. Notion, Linear, Gmail, Kalender, bitte nennen, welche.)
   - Falls ja: benötigte Credentials einzeln abfragen, bevor installiert wird.

── SICHERUNG ──

7) Automatisches Backup  [FRAGEN]
   Tägliches Backup von Holographic-Memory-DB, Kanban-Stand und
   Hermes-Konfiguration.
   - Wohin? (z. B. S3, Backblaze B2, Google Drive, lokaler Pfad auf
     separatem Volume)
   - Wie oft? (Vorschlag: täglich 03:00 lokale Zeit)
   - Aufbewahrung? (Vorschlag: 30 Tage rollierend)
   - Credentials / Bucket / Ordner-Pfad? (einzeln abfragen)
   Cron-Job (oder systemd-Timer) anlegen, einen Test-Backup-Lauf direkt
   nach der Einrichtung ausführen und Erfolg melden.

── ABSCHLUSS ──

Gib im selben Chat eine kompakte Statusliste aus:
  ✅ neu installiert  ⏭️ bereits vorhanden  ❌ fehlgeschlagen (mit Begründung)
Bei Fehlern nicht eigenständig debuggen, sondern Fehler melden und auf
meine Anweisung warten.`,
              en: `You are Hermes Agent. Please set up my complete base configuration.

FLOW (please follow this order):
1. FIRST: read all eight items below.
2. THEN: ask every [QUESTIONS] item (0, 1, 6, 7) in a SINGLE message in the
   current chat — as a numbered list, with suggested defaults in brackets,
   so I only need to type the bits that differ.
3. WAIT for my answers. Do not install anything before I have replied.
4. THEN: install / configure everything. Skip anything already present.
5. WRAP-UP: output a compact status report (see below).

RULES:
- Before any install, check whether it's already in place. If yes: skip.
- Persist behavioral rules, modes, gates, budget and backup plan to your
  system configuration (e.g. CLAUDE.md, AGENTS.md or the equivalent Hermes
  instruction file) so they apply across sessions — not just here.
- For missing information or anything unclear: ask back in the current chat
  instead of guessing.

── FOUNDATIONS ──

0) Identity, timezone & language  [QUESTIONS]
   - How should I address you? (first or first + last name; formal or casual)
   - Default response language? (German / English / match the input)
   - Timezone? (suggestion: Europe/Berlin)
   Persist as fixed values in the system configuration.

1) Daily LLM cost cap  [QUESTIONS]
   - Max daily budget in € or tokens? (suggestion: 5 € per day)
   - On reaching the cap? (a) hard stop, (b) ask before continuing
   Install a cost tracker if not already present. Enforce the cap as a hard
   limit in the system configuration.

── CAPABILITIES ──

2) Holographic Memory
   Enable the Hermes memory provider "holographic" — a local, HRR-based
   long-term memory (Holographic Reduced Representations) backed by SQLite,
   with trust scoring (self-correcting: memories confirmed repeatedly gain
   weight) and no external services.
   - First check ~/.hermes/config.yaml. If "memory: { provider: holographic }"
     is already set: skip.
   - Otherwise: either run the wizard
       hermes memory setup
     and select "holographic" — or write the config directly:
       memory:
         provider: holographic
   - Accept the default storage location (local SQLite at the Hermes default).

3) Kanban
   Enable the Hermes kanban module (columns: Backlog / In Progress / Waiting /
   Done). Configure it so new tasks from incoming messages automatically land
   in Backlog and I can update status by message.

4) Walk-Away Mode
   Autonomous-operation mode for extended windows (default: 30 minutes).
   Instead of intermediate questions, deliver one consolidated status update
   at the end of the window or once a block is complete. Interrupt only for
   real blockers or when the Approval Gate (item 5) triggers.

5) Remote Approval Gate
   Before any irreversible or cost-incurring action — deleting files, sending
   email, payments, paid API calls, git push --force, DNS / domain changes —
   message me in the current chat:
     Action · Reason · Expected impact.
   Wait for "ok" / "no" / free-form response. On "no" or timeout (10 minutes):
   abort and report.

6) MCP integration  [QUESTIONS]
   Install the base MCP servers (Filesystem, Git, Web Search) and wire them
   into your MCP config.
   - Should I install any additional MCPs?
     (e.g. Notion, Linear, Gmail, Calendar — please name which.)
   - If yes: ask for the needed credentials one by one before installing.

── BACKUP ──

7) Automatic backup  [QUESTIONS]
   Daily backup of the Holographic Memory DB, Kanban state, and Hermes
   configuration.
   - Where to? (e.g. S3, Backblaze B2, Google Drive, local path on a
     separate volume)
   - How often? (suggestion: daily at 03:00 local time)
   - Retention? (suggestion: 30 days rolling)
   - Credentials / bucket / folder path? (ask for each separately)
   Create a cron job (or systemd timer), run a test backup immediately
   after setup, and report success.

── WRAP-UP ──

Output a compact status list in the same chat:
  ✅ newly installed  ⏭️ already present  ❌ failed (with reason)
On failure: do not debug autonomously — report the error and wait for
instructions.`
            }
          }
        ]
      },
      {
        heading: { de: "Google Calendar anbinden (read-only)", en: "Connect Google Calendar (read-only)" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>Hermes kann deinen Google-Kalender <strong>nur lesen</strong>, ideal, wenn der Agent kommende Termine kennen, aber nichts ändern soll. Sechs Schritte, etwa zehn Minuten Aufwand.</p>
<ol>
  <li>
    <strong>Google Cloud Projekt anlegen.</strong>
    In der Google Cloud Console ein Projekt erstellen oder auswählen. Anschließend die Google Calendar API aktivieren unter <em>APIs &amp; Services → Library → Google Calendar API → Enable</em>.
  </li>
  <li>
    <strong>OAuth Consent Screen konfigurieren.</strong>
    Unter <em>APIs &amp; Services → OAuth consent screen</em>. Für private Nutzung reicht der Testing-Modus. Die eigene Google-Adresse als Test User eintragen. Scope möglichst eng halten: <code>https://www.googleapis.com/auth/calendar.readonly</code>.
  </li>
  <li>
    <strong>OAuth Client erstellen.</strong>
    <em>APIs &amp; Services → Credentials → Create Credentials → OAuth client ID</em>. Application type: <strong>Desktop app</strong>. JSON-Datei herunterladen.
  </li>
  <li>
    <strong>JSON in Hermes hinterlegen.</strong>
    Die heruntergeladene Client-JSON in Hermes speichern, z. B. als <code>google_client_secret.json</code>. Secrets nie öffentlich committen.
  </li>
  <li>
    <strong>OAuth-Link generieren.</strong>
    Hermes erzeugt eine Google-Login-URL mit Calendar-read-only-Scope. URL im Browser öffnen, mit dem Test-User anmelden, danach die komplette Redirect-URL (mit <code>code=…</code>) zurück an Hermes geben.
  </li>
  <li>
    <strong>Token speichern und testen.</strong>
    Hermes tauscht den Code gegen einen lokalen Token, z. B. <code>google_token.json</code>. Direkt einen Live-Test ausführen: Kalenderliste oder kommende Termine abrufen.
  </li>
</ol>
<p><strong>Häufige Stolperfallen</strong></p>
<ul>
  <li><code>access_denied</code> von Google → der verwendete Google-Account ist wahrscheinlich nicht als Test User eingetragen.</li>
  <li><code>Google Calendar API disabled</code> → Calendar API im Projekt aktivieren und ein paar Minuten warten.</li>
  <li>Redirect-Fehler → für Desktop-App-OAuth den Standard-Redirect <code>http://localhost</code> nutzen.</li>
  <li>Nur <code>calendar.readonly</code>-Scope verwenden, wenn Hermes Termine lediglich lesen soll, sonst bekommt der Agent mehr Rechte als nötig.</li>
  <li><strong>Niemals</strong> <code>client_secret</code>, OAuth-Code oder Token öffentlich speichern oder ins Repo committen.</li>
</ul>`,
              en: `<p>Hermes can <strong>read-only</strong> access your Google Calendar — perfect when the agent should know your upcoming events but never change them. Six steps, about ten minutes of effort.</p>
<ol>
  <li>
    <strong>Create a Google Cloud project.</strong>
    In the Google Cloud Console, create or select a project. Then enable the Google Calendar API at <em>APIs &amp; Services → Library → Google Calendar API → Enable</em>.
  </li>
  <li>
    <strong>Configure the OAuth Consent Screen.</strong>
    Under <em>APIs &amp; Services → OAuth consent screen</em>. Testing mode is enough for private use. Add your own Google address as a Test User. Keep the scope as narrow as possible: <code>https://www.googleapis.com/auth/calendar.readonly</code>.
  </li>
  <li>
    <strong>Create the OAuth client.</strong>
    <em>APIs &amp; Services → Credentials → Create Credentials → OAuth client ID</em>. Application type: <strong>Desktop app</strong>. Download the JSON file.
  </li>
  <li>
    <strong>Store the JSON in Hermes.</strong>
    Save the downloaded client JSON in Hermes, e.g. as <code>google_client_secret.json</code>. Never commit secrets publicly.
  </li>
  <li>
    <strong>Generate the OAuth link.</strong>
    Hermes produces a Google login URL with the calendar-read-only scope. Open the URL in your browser, sign in with the test user, then paste the complete redirect URL (containing <code>code=…</code>) back to Hermes.
  </li>
  <li>
    <strong>Save the token and test.</strong>
    Hermes exchanges the code for a local token, e.g. <code>google_token.json</code>. Run a live test right away: fetch the calendar list or upcoming events.
  </li>
</ol>
<p><strong>Common pitfalls</strong></p>
<ul>
  <li><code>access_denied</code> from Google → the account you signed in with is most likely not registered as a Test User.</li>
  <li><code>Google Calendar API disabled</code> → enable the Calendar API in the project and wait a few minutes.</li>
  <li>Redirect errors → for desktop-app OAuth, use the default <code>http://localhost</code> redirect.</li>
  <li>Only use the <code>calendar.readonly</code> scope when Hermes should only read events — otherwise the agent gets more permissions than needed.</li>
  <li><strong>Never</strong> store or commit <code>client_secret</code>, OAuth code, or tokens publicly.</li>
</ul>`
            }
          }
        ]
      }
    ]
  },
  {
    id: "jLgUZnuQuDM",
    title: {
      de: "Claude Code hat grade ein massives Upgrade bekommen",
      en: "Claude Code just got a massive upgrade"
    },
    publishedAt: "2026-05-29",
    description: {
      de: "Ein neues Update rund um Claude Code und was es praktisch für deinen KI-Workflow bedeutet. Prompts und Links aus dem Video folgen hier.",
      en: "A new update around Claude Code and what it means in practice for your AI workflow. Prompts and links from the video will be added here."
    },
    sections: []
  },
  {
    id: "KvqmMzOJo9s",
    title: {
      de: "Diese 3 Skills bringen deine Agenten aufs nächste Level",
      en: "The 3 agent skills I use every day"
    },
    thumbnailUrl: "images/vid11-three-skills.png",
    publishedAt: "2026-05-20",
    description: {
      de: "Drei wiederverwendbare Agent-Skills, die ich täglich nutze: ein persönlicher Admin- und Assistenz-Workflow, ein Research-Briefing-Skill und ein YouTube-Content-Workflow. Jeder Prompt führt zuerst ein kurzes Questionnaire durch und richtet den Skill dann auf deine Tools, deinen Stil und deine Prioritäten ein.",
      en: "Three reusable agent skills I use every day: a personal admin and assistant workflow, a research briefing skill, and a YouTube content workflow. Each prompt runs a short questionnaire first and then tailors the skill to your tools, your style, and your priorities."
    },
    sections: [
      {
        heading: { de: "Worum es geht", en: "What this is" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>Jeder der drei Prompts unten richtet einen eigenständigen Agent-Skill ein. Die Prompts sind unabhängig voneinander, brauchen keine zusätzlichen Plugins und funktionieren in jedem fähigen Assistenten (Claude, ChatGPT, Hermes, OpenClaw …).</p>
<ol>
  <li><strong>Personal Assistant / Admin Skill</strong>: E-Mails, Kalender, Termine und Follow-ups in eine klare Tagesübersicht bringen.</li>
  <li><strong>Research Briefing / Daily Newsletter Skill</strong>: relevante Signale aus Quellen erkennen, priorisieren und in ein kompaktes Briefing verwandeln.</li>
  <li><strong>YouTube Content Workflow Skill</strong>: aus einer Idee ein strukturiertes Content-Paket mit These, Hook, Outline, Skript und Shorts-Ideen machen.</li>
</ol>
<p>Wähle unten den passenden Prompt, kopiere ihn und schicke ihn an deinen Agenten. Der Agent stellt zuerst ein paar Fragen, fasst deine Antworten zusammen und baut daraus einen Skill, der zu deiner Situation passt.</p>`,
              en: `<p>Each of the three prompts below sets up a standalone agent skill. They are independent of each other, need no extra plugins, and work in any capable assistant (Claude, ChatGPT, Hermes, OpenClaw, …).</p>
<ol>
  <li><strong>Personal Assistant / Admin Skill</strong> — turn email, calendar, meetings, and follow-ups into one clear daily overview.</li>
  <li><strong>Research Briefing / Daily Newsletter Skill</strong> — surface relevant signals from your sources, score them, and turn them into a compact briefing.</li>
  <li><strong>YouTube Content Workflow Skill</strong> — go from an idea to a structured content package: thesis, hook, outline, script, shorts.</li>
</ol>
<p>Pick the prompt that fits, copy it, and send it to your agent. The agent will ask a short set of questions, summarize your answers, and build a personalized skill from them.</p>`
            }
          }
        ]
      },
      {
        heading: { de: "Setup-Prompts", en: "Setup prompts" },
        type: "prompts",
        items: [
          {
            title: {
              de: "1. Personal Assistant / Admin Skill",
              en: "1. Personal Assistant / Admin Skill"
            },
            content: `Richte einen wiederverwendbaren Agent-Skill ein:

Name:
Personal Assistant / Admin Skill

Ziel:
Der Skill soll als persönlicher Admin- und Assistenz-Workflow dienen. Er soll dabei helfen, E-Mails, Kalender, Dateien, Kontakte, Notizen und offene Aufgaben in eine klare, priorisierte Übersicht zu bringen.

Dieser Prompt soll eigenständig funktionieren. Er ist nicht von anderen Skills abhängig.

Wichtig:
Bevor du den Skill erstellst, führe zuerst ein kurzes Questionnaire durch. Stelle mir die Fragen nacheinander oder in übersichtlichen Blöcken. Nutze meine Antworten, um den Skill auf meine Situation, meine Tools, meine Prioritäten und meinen Arbeitsstil anzupassen.

Arbeitsweise:
1. Prüfe zuerst, welche Tools, Dateien, Integrationen und Zugriffe verfügbar sind.
2. Stelle danach das Questionnaire.
3. Fasse meine Antworten kurz zusammen.
4. Erstelle daraus einen personalisierten Skill-Workflow.
5. Wenn Zugriffe fehlen, markiere sie klar und schlage einfache Alternativen vor.
6. Wiederhole keine sensiblen Daten unnötig im Chat.
7. Sende keine E-Mails, Nachrichten oder Termine automatisch, ohne vorher einen Entwurf oder eine Zusammenfassung zur Freigabe zu zeigen.

Questionnaire:

1. Rolle und Arbeitskontext
- Wofür soll der Assistenz-Skill hauptsächlich genutzt werden?
  Beispiele: Selbstständigkeit, Creator-Business, Team-Management, Kundenarbeit, interne Organisation, private Admin-Aufgaben.
- Was ist aktuell das größte Admin-Problem?
  Beispiele: zu viele E-Mails, vergessene Follow-ups, unklare Prioritäten, Kalender-Chaos, verstreute Informationen.
- Arbeitest du allein oder mit einem Team?

2. Quellen und Tools
- Welche Quellen soll der Skill berücksichtigen?
  Beispiele: E-Mail, Kalender, Kontakte, Google Drive, Notion, Obsidian, lokale Dateien, Projektmanagement-Tools, CRM, Slack, Discord, Telegram.
- Welche dieser Quellen sind bereits für den Agenten zugänglich?
- Gibt es bestimmte Ordner, Dateien, Kalender oder Postfächer, die besonders wichtig sind?
- Gibt es Daten, die der Agent ausdrücklich nicht verwenden soll?

3. Tagesplanung und Prioritäten
- Was soll in einer täglichen Übersicht enthalten sein?
  Beispiele: Termine, wichtigste Aufgaben, E-Mails, Follow-ups, Deadlines, offene Entscheidungen.
- Wie viele Top-Prioritäten sollen pro Tag angezeigt werden?
  Beispiele: Top 3, Top 5, vollständige Liste.
- Soll der Skill eher streng priorisieren oder möglichst vollständig sammeln?

4. Kommunikation
- Soll der Skill E-Mail- oder Nachrichtenentwürfe schreiben?
- In welchem Stil sollen Entwürfe formuliert sein?
  Beispiele: kurz und direkt, freundlich-professionell, locker, sehr formell.
- Soll der Skill Follow-ups aktiv vorschlagen?
- Gibt es Personen, Kunden oder Projekte, die besonders wichtig sind?

5. Output-Format
- Wie soll die Ausgabe aussehen?
  Beispiele: kurze Tagesübersicht, ausführlicher Markdown-Report, Telegram-Nachricht, E-Mail-Draft, Aufgabenliste, Wochenreview.
- Wie lang soll die tägliche Übersicht ungefähr sein?
  Beispiele: sehr kurz, mittel, ausführlich.
- Soll der Skill am Ende immer eine konkrete "Was mache ich jetzt?"-Liste erstellen?

6. Wiederholung und Automatisierung
- Soll der Skill manuell gestartet werden oder regelmäßig laufen?
  Beispiele: täglich morgens, wöchentlich montags, vor Meetings, nach Feierabend.
- Falls regelmäßig: Zu welcher Uhrzeit?
- Soll der Skill eine Feedback-Schleife nutzen, um künftige Ausgaben zu verbessern?

7. Feedback-Präferenzen
- Welche Art von Ergebnissen soll der Skill stärker berücksichtigen, wenn ich "LIKE" sage?
- Was soll bei "AVOID" künftig reduziert werden?
- Soll der Skill Stilwünsche merken, z. B. kürzer, direkter, ausführlicher, mehr Kontext?

Nach dem Questionnaire:
Erstelle einen personalisierten Skill mit folgender Struktur:

1. Skill-Beschreibung
2. Ziel des Skills
3. Nutzerprofil und Arbeitskontext
4. Verfügbare Quellen und Tools
5. Standard-Workflow
6. Täglicher Ablauf
7. Output-Template
8. Kommunikationsregeln
9. Datenschutz- und Freigaberegeln
10. Feedback-Schleife
11. Optionale Cron-/Automations-Version
12. Erste Beispielausgabe

Der Skill soll folgende Aufgaben unterstützen:
- Tagesübersicht erstellen
- wichtige E-Mails oder Nachrichten priorisieren
- Antwortentwürfe vorbereiten
- Follow-ups erkennen
- Termine und Deadlines sichtbar machen
- offene Entscheidungen markieren
- wiederkehrende Admin-Arbeit erkennen
- Automationsideen vorschlagen

Standard-Output:
Nutze, sofern nicht anders gewünscht, diese Struktur:

1. Kurzüberblick
2. Top-Prioritäten
3. Termine und Deadlines
4. Wichtige Kommunikation
5. Offene Entscheidungen
6. Follow-ups
7. Aufgaben, die warten können
8. Mögliche Automationen
9. Nächste konkrete Schritte

Feedback-Schleife:
Der Skill soll folgendes Feedback verstehen:
- LIKE: Davon mehr berücksichtigen
- AVOID: Das künftig niedriger priorisieren
- FIX: Fehler korrigieren
- STYLE: Ton oder Format anpassen
- WATCH: Thema, Kontakt oder Aufgabe weiter beobachten

Wichtig:
Der Workflow soll auch dann nutzbar sein, wenn nicht alle Integrationen vorhanden sind. In diesem Fall soll der Agent mit manuell eingefügten Informationen, lokalen Dateien oder einfachen Listen arbeiten.`
          },
          {
            title: {
              de: "2. Research Briefing / Daily Newsletter Skill",
              en: "2. Research Briefing / Daily Newsletter Skill"
            },
            content: `Richte einen wiederverwendbaren Agent-Skill ein:

Name:
Research Briefing / Daily Newsletter Skill

Ziel:
Der Skill soll regelmäßig relevante Informationen aus Quellen wie Webseiten, Blogs, Newslettern, Changelogs, Videos, Dokumentationen, Repositories oder internen Notizen sammeln, bewerten und in ein kompaktes Research Briefing verwandeln.

Der Skill soll nicht möglichst viele Links sammeln, sondern relevante Signale erkennen, priorisieren und daraus konkrete Ideen, Entscheidungen oder nächste Schritte ableiten.

Dieser Prompt soll eigenständig funktionieren. Er ist nicht von anderen Skills abhängig.

Wichtig:
Bevor du den Skill erstellst, führe zuerst ein kurzes Questionnaire durch. Nutze meine Antworten, um den Skill auf meine Branche, meine Zielgruppe, meine Quellen, meinen Stil und meine gewünschten Outputs anzupassen.

Arbeitsweise:
1. Prüfe zuerst, welche Tools, Quellen, Dateien und Integrationen verfügbar sind.
2. Stelle danach das Questionnaire.
3. Fasse meine Antworten kurz zusammen.
4. Erstelle daraus einen personalisierten Research-Skill.
5. Priorisiere Qualität vor Vollständigkeit.
6. Kennzeichne unsichere Informationen klar.
7. Trenne Fakten, Einschätzung und Empfehlung sichtbar voneinander.

Questionnaire:

1. Ziel und Nutzung
- Wofür soll das Research Briefing genutzt werden?
  Beispiele: Content-Ideen, Business-Entscheidungen, Produktentwicklung, Marktbeobachtung, Newsletter, Social Media, interne Strategie.
- Wer ist die Zielgruppe des Briefings?
  Beispiele: du selbst, ein Team, Kunden, Newsletter-Leser, YouTube-Zuschauer, Community.
- Soll das Briefing eher informieren, priorisieren oder konkrete Handlungsempfehlungen liefern?

2. Themenbereiche
- Welche Themen soll der Skill beobachten?
  Beispiele: AI, Automatisierung, Marketing, SaaS, E-Commerce, Finance, Creator Economy, Bildung, Coding, Produktivität.
- Welche Unterthemen sind besonders wichtig?
- Welche Themen sollen ausdrücklich vermieden oder niedrig priorisiert werden?
- Gibt es bestimmte Begriffe, Unternehmen, Tools oder Personen, die regelmäßig beobachtet werden sollen?

3. Quellen
- Welche Quellen soll der Skill nutzen?
  Beispiele: Blogs, Newsletter, YouTube-Kanäle, RSS-Feeds, GitHub-Repos, Produkt-Changelogs, Dokumentationen, X/Twitter, LinkedIn, interne Notizen.
- Gibt es bereits eine Watchlist?
- Sollen nur kostenlose und öffentliche Quellen verwendet werden?
- Gibt es Quellen, die besonders vertrauenswürdig sind?
- Gibt es Quellen, die ignoriert werden sollen?

4. Bewertung und Priorisierung
- Wie soll Relevanz bewertet werden?
  Beispiele: praktischer Nutzen, Neuigkeitswert, Business-Relevanz, Demo-Potenzial, Risiko, Zeitersparnis, Zielgruppeninteresse.
- Soll der Skill jedes Thema mit einem Score bewerten?
- Wie viele Top-Themen sollen pro Briefing enthalten sein?
  Beispiele: Top 3, Top 5, Top 10.
- Soll der Skill auch Themen nennen, die bewusst ignoriert werden können?

5. Output-Format
- Wie soll das Briefing aussehen?
  Beispiele: kurze Telegram-Nachricht, ausführlicher Markdown-Report, Newsletter-Entwurf, Themenliste, Content-Ideen-Liste.
- Wie lang soll das Briefing sein?
  Beispiele: sehr kurz, mittel, ausführlich.
- Soll das Briefing Quellenlinks enthalten?
- Soll es konkrete Content-, Produkt- oder Workflow-Ideen ableiten?

6. Frequenz
- Wie oft soll der Skill genutzt werden?
  Beispiele: täglich, wöchentlich, vor Content-Planung, bei Bedarf.
- Zu welcher Tageszeit wäre ein Briefing sinnvoll?
- Soll der Skill automatisch als geplanter Agent-Job laufen können?

7. Feedback-Präferenzen
- Was bedeutet "LIKE" in diesem Research-Kontext?
- Was soll bei "AVOID" künftig niedriger priorisiert werden?
- Welche Quellen oder Themen sollen bei "WATCH" dauerhaft beobachtet werden?
- Soll der Skill Stilwünsche wie "kürzer", "mehr Quellen", "mehr Einschätzung" oder "mehr konkrete Ideen" berücksichtigen?

Nach dem Questionnaire:
Erstelle einen personalisierten Skill mit folgender Struktur:

1. Skill-Beschreibung
2. Ziel des Research-Workflows
3. Zielgruppe
4. Themenbereiche
5. Quellen- und Watchlist-Struktur
6. Bewertungskriterien
7. Scoring-System
8. Standard-Workflow
9. Output-Template
10. Feedback-Schleife
11. Optionale Cron-/Automations-Version
12. Erste Beispielausgabe

Der Skill soll können:
- relevante neue Informationen finden
- Quellen nach Wichtigkeit sortieren
- schwache Signale aussortieren
- Themen bewerten
- Quellenlinks sammeln
- konkrete Empfehlungen ableiten
- Content-, Produkt- oder Prozessideen entwickeln
- eine Watchlist aktualisieren

Standard-Output:
Nutze, sofern nicht anders gewünscht, diese Struktur:

1. Executive Summary
2. Wichtigste Signale
3. Top-Themen mit Bewertung
4. Quellen und Links
5. Warum es relevant ist
6. Mögliche Anwendung oder nächste Schritte
7. Themen mit niedriger Priorität
8. Offene Fragen
9. Empfehlung: Was sollte als Nächstes geprüft werden?

Bewertungssystem:
Bewerte jedes Thema mit einem Score von 1 bis 10 und kurzer Begründung:
- 1–3: kaum relevant
- 4–6: interessant, aber nicht dringend
- 7–8: relevant und prüfenswert
- 9–10: hohe Priorität

Feedback-Schleife:
Der Skill soll folgendes Feedback verstehen:
- LIKE: Mehr Themen dieser Art
- WATCH: Quelle oder Thema weiter beobachten
- AVOID: Quelle oder Thema niedriger priorisieren
- FIX: Fehler korrigieren
- STYLE: Ton, Länge oder Format anpassen

Wichtig:
Der Skill soll nicht nur zusammenfassen, sondern priorisieren. Lieber wenige gute Signale als eine lange Liste irrelevanter Links.`
          },
          {
            title: {
              de: "3. YouTube Content Workflow Skill",
              en: "3. YouTube Content Workflow Skill"
            },
            content: `Richte einen wiederverwendbaren Agent-Skill ein:

Name:
YouTube Content Workflow Skill

Ziel:
Der Skill soll aus einem Thema, einer Recherche, einer Quelle oder einer groben Idee ein strukturiertes Content-Paket für ein YouTube-Video erstellen. Dazu gehören These, Zielgruppe, Hook, Outline, Skriptentwurf, Demo-Plan, Visual-Ideen, Shorts-Ideen und Beschreibungstexte.

Der Skill soll nicht generischen Content erzeugen, sondern einem Creator helfen, schneller von einer Idee zu einem gut vorbereiteten Video zu kommen.

Dieser Prompt soll eigenständig funktionieren. Er ist nicht von anderen Skills abhängig.

Wichtig:
Bevor du den Skill erstellst, führe zuerst ein kurzes Questionnaire durch. Nutze meine Antworten, um den Skill auf meinen Kanal, meine Zielgruppe, meinen Stil, meine Videoformate und meinen Produktionsprozess anzupassen.

Arbeitsweise:
1. Prüfe zuerst das Thema, die Zielgruppe und den vorhandenen Kontext.
2. Stelle danach das Questionnaire.
3. Fasse meine Antworten kurz zusammen.
4. Erstelle daraus einen personalisierten YouTube-Content-Skill.
5. Frage nur nach, wenn wichtige Informationen fehlen, die das Ergebnis stark verändern würden.
6. Entwickle eine klare Video-These statt nur eine allgemeine Zusammenfassung.
7. Vermeide übertriebene Versprechen, Hype und generische KI-Formulierungen.
8. Schreibe so, dass ein Mensch daraus weiterarbeiten und aufnehmen kann.

Questionnaire:

1. Kanal und Zielgruppe
- Worum geht es auf dem Kanal?
- Wer ist die Zielgruppe?
  Beispiele: Anfänger, Fortgeschrittene, Unternehmer, Creator, Entwickler, Eltern, Investoren, Teams.
- Welches Problem soll der Content für diese Zielgruppe lösen?
- Welche Art von Videos funktionieren bisher gut?
- Gibt es Videos oder Creator, deren Stil als Orientierung dienen kann?

2. Content-Stil
- Wie soll der Ton sein?
  Beispiele: ruhig, direkt, unterhaltsam, analytisch, praktisch, erklärend, kritisch, locker.
- Was soll vermieden werden?
  Beispiele: Hype, Clickbait, zu viel Fachsprache, zu lange Intros, generische KI-Phrasen.
- Soll das Video eher Tutorial, Meinung, Analyse, Demo, Erfahrungsbericht oder Story sein?
- Soll der Skill eher kurze Skripte oder ausführliche Produktionspakete erstellen?

3. Videoformat
- Wie lang sollen die Videos typischerweise sein?
  Beispiele: 3 Minuten, 7 Minuten, 10–15 Minuten, Longform.
- Gibt es eine bevorzugte Struktur?
  Beispiele: Hook → Problem → Lösung → Demo → Fazit.
- Soll der Skill Kapitelmarker erzeugen?
- Soll er auch Shorts aus dem Longform-Thema ableiten?

4. Themen und Inputs
- Welche Arten von Inputs wird der Skill meistens bekommen?
  Beispiele: grobe Idee, Link, Research Briefing, Produktupdate, Tool, Kundenfrage, Trend, persönlicher Erfahrungsbericht.
- Soll der Skill eigene Themenvorschläge machen dürfen?
- Soll er Quellen prüfen oder nur mit bereitgestelltem Material arbeiten?
- Gibt es Themen, die besonders häufig vorkommen?

5. Produktionsprozess
- Was soll der Skill für die Produktion vorbereiten?
  Beispiele: Hook, Outline, Skript, B-Roll-Plan, Demo-Schritte, Thumbnail-Texte, Beschreibung, Shorts.
- Werden Bildschirmaufnahmen, Demos, Slides oder Excalidraws genutzt?
- Soll der Skill visuelle Konzepte oder Diagramm-Ideen liefern?
- Gibt es feste Branding-, Design- oder Strukturvorgaben?

6. Veröffentlichung
- Soll der Skill YouTube-Titelvarianten schreiben?
- Soll er Beschreibung, Kapitelmarker und Pinned Comment vorbereiten?
- Soll er Social-Posts oder Newsletter-Teaser ableiten?
- Soll er mehrere Varianten für unterschiedliche Plattformen erstellen?

7. Feedback-Präferenzen
- Was bedeutet "LIKE" für diesen Content-Skill?
- Was soll bei "AVOID" künftig vermieden werden?
- Soll der Skill bei "STYLE" Ton, Länge oder Struktur anpassen?
- Soll der Skill bei "SHORTS" automatisch Kurzvideo-Ideen ausarbeiten?
- Soll der Skill erfolgreiche Videoformate künftig stärker berücksichtigen?

Nach dem Questionnaire:
Erstelle einen personalisierten Skill mit folgender Struktur:

1. Skill-Beschreibung
2. Kanal- und Zielgruppenprofil
3. Content-Stil
4. Standard-Videoformate
5. Input-Arten
6. Workflow von Idee zu Video
7. Skript- und Outline-Regeln
8. Demo-/B-Roll-Regeln
9. Visual-/Diagramm-Regeln
10. Shorts-Ableitung
11. Veröffentlichungs-Assets
12. Feedback-Schleife
13. Erste Beispielausgabe

Der Skill soll können:
- Thema klären
- Zielgruppe bestimmen
- Video-These entwickeln
- Hook-Varianten schreiben
- Kapitelstruktur erstellen
- Skriptentwurf schreiben
- Demo- oder B-Roll-Plan erstellen
- Visual- oder Diagramm-Konzept erstellen
- Shorts ableiten
- Titel, Beschreibung und Kapitelmarker vorbereiten

Standard-Output:
Nutze, sofern nicht anders gewünscht, diese Struktur:

1. Video-Briefing
2. Hauptthese
3. Zielgruppe
4. Nutzenversprechen
5. Hook-Varianten
6. Kapitelstruktur
7. Skriptentwurf
8. Demo-/B-Roll-Plan
9. Visual- oder Diagramm-Konzept
10. Shorts-Ideen
11. Titel, Beschreibung und Kapitelmarker
12. Offene Fragen
13. Nächste Produktionsschritte

Feedback-Schleife:
Der Skill soll folgendes Feedback verstehen:
- LIKE: Mehr von diesem Stil oder Format
- AVOID: Diesen Angle oder Ton vermeiden
- FIX: Fehler korrigieren
- STYLE: Ton, Länge oder Struktur anpassen
- SHORTS: Mehr Kurzform-Ideen daraus machen
- WATCH: Thema für spätere Videos weiter beobachten

Wichtig:
Das Ergebnis soll Creator unterstützen, nicht ersetzen. Der Skill soll Struktur, Recherche und Entwürfe liefern, aber Raum für persönliche Meinung, Erfahrung und Aufnahme-Stil lassen.`
          }
        ]
      }
    ]
  },
  {
    id: "f2ZTBqFPG3c",
    title: {
      de: "So macht du ChatGPT zu deinem Motion Graphics Editor",
      en: "Turn ChatGPT into your Motion Graphics Editor"
    },
    publishedAt: "2026-05-16",
    description: {
      de: "Motion Graphics manuell editieren ist mühsam. Hyperframes erlaubt es Coding-Modellen wie Codex oder Claude Code, Animationen direkt als HTML zu schreiben und als Video zu rendern. Unten findest du die Links zu Codex und zum Hyperframes-Repository.",
      en: "Editing motion graphics by hand is painful. Hyperframes lets coding models like Codex or Claude Code write animations directly as HTML and render them as video. Below you'll find the links to Codex and the Hyperframes repository."
    },
    sections: [
      {
        heading: { de: "Tools & Repository", en: "Tools & repository" },
        type: "links",
        items: [
          {
            label: "OpenAI Codex App",
            url: "https://developers.openai.com/codex/app",
            description: {
              de: "Die Codex-App von OpenAI — das Coding-Modell, mit dem im Video die HTML-Motion-Graphics geschrieben werden.",
              en: "OpenAI's Codex app — the coding model used in the video to write the HTML motion graphics."
            }
          },
          {
            label: "Hyperframes (GitHub)",
            url: "https://github.com/heygen-com/hyperframes",
            description: {
              de: "Open-Source-Framework von HeyGen: HTML schreiben, Video rendern. Gebaut für KI-Agenten.",
              en: "HeyGen's open-source framework: write HTML, render video. Built for AI agents."
            }
          }
        ]
      }
    ]
  },
  {
    id: "yJpb60o_4KQ",
    title: {
      de: "So steuerst du deinen PC von überall mit OpenClaw",
      en: "Control your PC from anywhere with OpenClaw"
    },
    publishedAt: "2026-05-11",
    description: {
      de: "Mit OpenClaw läuft ein autonomer KI-Agent direkt auf deinem Rechner, erreichbar per Telegram, immer ansprechbar, auch wenn du gerade nicht am Schreibtisch sitzt. Hier findest du fünf konkrete Anwendungsfälle und den vollständigen Setup-Prompt zum Kopieren.",
      en: "OpenClaw runs an autonomous AI agent right on your machine, reachable via Telegram, always on, even when you're away from your desk. Below you'll find five concrete use cases and the complete setup prompt ready to copy."
    },
    sections: [
      {
        heading: { de: "Fünf Anwendungsfälle", en: "Five use cases" },
        type: "text",
        items: [
          {
            html: {
              de: `<p>Fünf typische Einsatzszenarien, sobald OpenClaw läuft:</p>
<ol>
  <li>
    <strong>Always-on Inbox-Triage.</strong>
    Prüft alle paar Minuten E-Mails und Nachrichten, erkennt, was dringend ist,
    fasst das Wichtige zusammen und meldet sich nur, wenn du wirklich
    handeln musst.
  </li>
  <li>
    <strong>Persönlicher Reminder- &amp; Follow-Up-Agent.</strong>
    Du sagst ihm „erinnere mich, falls X bis Freitag nicht antwortet" oder
    „check das später nochmal", und er behält das im Kopf, ohne dass du
    eine Task-App öffnen musst.
  </li>
  <li>
    <strong>Remote-Steuerung deines Rechners vom Handy.</strong>
    Über Telegram oder Signal lässt du Dateien finden, Apps starten, Logs
    prüfen, Befehle ausführen oder etwas vorbereiten, während du unterwegs
    bist.
  </li>
  <li>
    <strong>Meeting- &amp; Tagesvorbereitung.</strong>
    Vor einem Call checkt er deinen Kalender, holt die relevanten Dokumente,
    fasst den Kontext zusammen und bereitet Gesprächspunkte vor.
  </li>
  <li>
    <strong>Hintergrund-Recherche und Drafting.</strong>
    Du beauftragst Recherchen, Vergleiche, Skripte, Angebote, E-Mails oder
    Content-Ideen. Er sucht, sammelt, schreibt und legt das Ergebnis fertig
    ab.
  </li>
</ol>`,
              en: `<p>Five typical scenarios once OpenClaw is running:</p>
<ol>
  <li>
    <strong>Always-on inbox triage.</strong>
    Checks email and messages every few minutes, detects what's urgent,
    summarizes what matters, and only pings you when you actually need to act.
  </li>
  <li>
    <strong>Personal reminder &amp; follow-up agent.</strong>
    You tell it "remind me if X doesn't reply by Friday" or "check this
    later," and it keeps track without you opening a task app.
  </li>
  <li>
    <strong>Remote PC control from your phone.</strong>
    From Telegram or Signal you can ask it to find files, start apps,
    inspect logs, run commands, or prepare something on your computer while
    you're away.
  </li>
  <li>
    <strong>Meeting &amp; workday prep.</strong>
    Before a call it can check your calendar, pull relevant docs, summarize
    context and prepare talking points automatically.
  </li>
  <li>
    <strong>Background research &amp; drafting.</strong>
    Ask for research, comparisons, scripts, offers, emails, or content ideas.
    It searches, compiles, drafts, and leaves the result ready as a file.
  </li>
</ol>`
            }
          }
        ]
      },
      {
        heading: { de: "Setup-Prompt", en: "Setup prompt" },
        type: "prompts",
        items: [
          {
            title: { de: "OpenClaw — vollständiger Setup-Prompt", en: "OpenClaw — full setup prompt" },
            content: `You are helping me install *OpenClaw* — an open-source autonomous AI agent
framework (github.com/openclaw/openclaw, formerly Clawdbot) that runs on my
machine, connects to messaging platforms like Telegram, and can do tasks for
me proactively (heartbeats, cron, background coding agents).

### Your role

Walk me through the install *step by step, **verifying each step* before
moving on. Don't barrel through. If a step fails, diagnose and fix the root
cause — don't paper over with workarounds. Keep me in the loop with short
status updates. Ask before any destructive action (deleting state, killing
processes, installing system services). When you store credentials I give
you, *never echo them back in plaintext* — refer to them by label instead.

### What we're building

By the end of this session, I should have:

1. OpenClaw installed globally via npm.
2. A Telegram bot I can DM that responds as my agent (default name:
   pick something memorable — examples: "Aang", "Pi", "Claw").
3. The gateway installed as a system service that auto-starts on every
   boot/login, survives sleep/wake, and survives brief AC drops.
4. The agent's "primary brain" routed through whichever AI subscription
   I already pay for (so I'm not spending API tokens for chat).
5. Optional: the coding-agent skill enabled so I can dispatch coding work
   to Claude Code / Codex / Gemini CLI from Telegram and walk away.

### Step 0 — Tell me about myself first

Before any install command, ask me these questions and *wait for my answers*.
Don't assume defaults. The answers shape the rest of the session:

1. *OS?* (Windows 10/11, macOS, Linux)
2. *Which AI subscriptions do I have?* (any of: Claude Pro, ChatGPT
   Plus/Pro/Codex, Gemini Pro/Advanced, GitHub Copilot, none)
3. *Do I have a paid LLM API key on hand?* (Anthropic, OpenAI, DeepSeek,
   Google AI Studio). DeepSeek V4 is the cheap-and-good default if I want
   to spend a little money rather than rely on subscription rate limits.
4. *Messaging channel?* (Telegram is fastest to set up — about 2 min via
   @BotFather. The alternative channels — Discord, Slack, WhatsApp,
   Signal, etc. — work but take longer.)
5. *Always-on?* (Will OpenClaw run on this machine 24/7, or is this a
   laptop that closes? If laptop, we'll harden the install for sleep/wake.)

### Step 1 — Prerequisites

Verify before installing:

- *Node.js 24 LTS* (or *Node 22.14+*). Run node --version. If older or
  missing, install from nodejs.org first. Node 25+ may work but isn't on
  the project's supported list.
- *npm* comes with Node.
- *Windows only*: WSL2 is recommended by the project. If I'm on bare
  Windows, proceed with native Windows but flag any platform-specific
  oddities as we hit them.

### Step 2 — Install OpenClaw

    npm install -g openclaw@latest

Verify with openclaw --version. The version string includes today's date
(e.g., 2026.5.6) — OpenClaw ships daily.

### Step 3 — Initial configuration

Run openclaw configure for the interactive wizard, *or* set values
non-interactively. The minimum required keys before the gateway will start:

- gateway.mode = "local" — *mandatory*, otherwise the gateway refuses
  to start with "missing gateway.mode".
- gateway.bind = "loopback"
- gateway.port = 18789 (default)
- agents.defaults.workspace — must be an **absolute path with forward
  slashes** even on Windows (e.g., "C:/Users/me/.openclaw/workspace").
  *Backslashes get eaten by JSON escaping in shell quoting* and the path
  ends up relative to the current working directory. Do not use \\\\.
- Make sure the workspace directory actually exists: mkdir -p it.

Use openclaw config set <path> <json-value> for each. Examples:

    openclaw config set gateway.mode '"local"'
    openclaw config set gateway.bind '"loopback"'
    openclaw config set gateway.port 18789
    openclaw config set agents.defaults.workspace '"C:/Users/me/.openclaw/workspace"'
    mkdir -p "C:/Users/me/.openclaw/workspace"   # adjust path

### Step 4 — Pick the primary model (cost-aware)

OpenClaw's "primary brain" runs on every Telegram message I send. This is
the layer where token spend accumulates. Choose based on what I told you in
Step 0.

*Recommended priority:*

1. *If I have ChatGPT Plus/Pro and the Codex CLI installed:* route the
   primary brain through openai-codex provider with model gpt-5.5 (or
   gpt-5.1 if 5.5 isn't in my available list). This uses my subscription
   via OAuth, ~free up to rate limits.
2. *If I have GitHub Copilot:* github-copilot/claude-opus-4.6 works
   similarly.
3. *If only paid API:* DeepSeek V4 Pro (deepseek/deepseek-v4-pro) —
   cheapest competent reasoning model. Anthropic and OpenAI direct API are
   pricier alternatives.

Whatever I pick for primary, *add a paid-API fallback* so the agent
doesn't go silent when I hit subscription rate limits:

    openclaw config set agents.defaults.model.primary '"openai-codex/gpt-5.5"'
    openclaw config set 'agents.defaults.models["openai-codex/gpt-5.5"]' '{}'
    openclaw config set agents.defaults.model.fallbacks '["deepseek/deepseek-v4-pro"]'
    openclaw config set 'agents.defaults.models["deepseek/deepseek-v4-pro"]' '{}'

For *subagents* (concurrent worker model), use a cheap-and-fast model so
parallel work doesn't blow the budget:

    openclaw config set agents.defaults.subagents.model.primary '"deepseek/deepseek-v4-flash"'
    openclaw config set 'agents.defaults.models["deepseek/deepseek-v4-flash"]' '{}'

### Step 5 — Authenticate the chosen providers

For each provider in the primary + fallback + subagent set, I need to
register an auth profile.

*Important for the assistant*: openclaw infer model auth login requires
an interactive TTY. *You cannot drive it from your tool harness.* Tell me
the exact command to run *myself* and what to expect:

    openclaw infer model auth login --provider <provider-id>

For each provider:

- openai-codex → opens a browser for OAuth tied to my ChatGPT account.
  This is the path that uses my subscription. If it asks for an API key
  instead of a browser flow, that's metered API spend — abort and look for
  a sign-in option.
- deepseek → prompts for an API key (sk-...) from
  platform.deepseek.com.
- anthropic → prompts for an API key (sk-ant-...).
- google → prompts for an API key from Google AI Studio.

*Verify after each login:*

    openclaw infer model auth status

Look for missingProvidersInUse: [] (empty list = good).

*Critical pitfall*: clipboard managers can append characters (notably +,
trailing whitespace, or "smart-quoted" variants) when pasting an API key. If
the gateway later returns "401 invalid api key" but the key looks right,
*read the auth file directly*:

    cat ~/.openclaw/agents/main/agent/auth-profiles.json

Compare the stored key character-for-character with the original. If
there's a stray suffix, edit the file directly to remove it.

### Step 6 — Telegram bot

Tell me to do this — I have to do it myself in Telegram:

1. In Telegram, message *@BotFather*.
2. Send /newbot.
3. Pick a display name (e.g., "My Aang").
4. Pick a username ending in bot (must be globally unique; e.g.,
   myname_aang_bot).
5. BotFather replies with a token like
   1234567890:ABCdef-ghIjkLmNoPqRstUvWxYz. **Tell me to paste that to
   you.** Treat the token as a credential — store it, don't echo it.

Then configure OpenClaw (DM-only is the safest default):

    openclaw config set channels.telegram.botToken '"<token>"'
    openclaw config set channels.telegram.enabled true
    openclaw config set channels.telegram.dmPolicy '"pairing"'
    openclaw config set channels.telegram.groupPolicy '"allowlist"'
    openclaw config set plugins.entries.telegram.enabled true

### Step 7 — Start the gateway

    openclaw gateway --verbose

Watch the log. Success markers:

- [gateway] ready
- [telegram] [default] starting provider (@yourbot_name) — confirms the
  bot token is valid and Telegram accepted it.
- [heartbeat] started — the proactive tick is running.

Common failure modes:

- "Gateway start blocked: existing config is missing gateway.mode" → Step 3.
- "Skipping agent main: workspace does not exist" → workspace path is
  wrong (probably backslash-escaping); revisit Step 3 with forward slashes.

### Step 8 — Pair my Telegram identity

In Telegram, find my bot and send any message. The bot replies with a
pairing code (e.g., ABCD1234) and tells me to ask the bot owner to
approve it. The owner is *me*, on this machine:

    openclaw pairing approve telegram <CODE>

This also auto-promotes me to *command owner* (commands.ownerAllowFrom)
if it was empty — meaning I can run privileged commands via Telegram.

Now I should be able to DM the bot and get a real agent reply. Ask me to
test before continuing.

### Step 9 — Make it persistent (laptop hardening)

Right now the gateway only runs while my terminal is open. To survive
reboots and lid-close, install it as a service.

*Linux*: openclaw gateway install creates a systemd unit. Run as a
normal user; OpenClaw uses systemd --user.

*macOS*: openclaw gateway install creates a launchd plist.

*Windows*: needs admin + (almost always) a PowerShell execution policy
fix. Walk me through this carefully:

1. Press Win + X → *Terminal (Administrator)*.
2. In the admin terminal:

       Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
       openclaw gateway install

3. Verify:

       schtasks /Query /TN "OpenClaw Gateway" /V /FO LIST

**Critical Windows hardening (must do, otherwise the task dies on lid
close):** the default scheduled task has battery-killer settings turned on.
Run this in the *admin* terminal:

    $t = Get-ScheduledTask -TaskName "OpenClaw Gateway"
    $t.Settings.DisallowStartIfOnBatteries = $false
    $t.Settings.StopIfGoingOnBatteries     = $false
    $t.Settings.RestartCount               = 5
    $t.Settings.RestartInterval            = "PT1M"
    $t.Settings.ExecutionTimeLimit         = "PT0S"
    $resume = New-CimInstance -ClassName MSFT_TaskEventTrigger \`
      -Namespace "Root/Microsoft/Windows/TaskScheduler" -ClientOnly -Property @{
        Enabled = $true
        Subscription = '<QueryList><Query Id="0" Path="System"><Select Path="System">*[System[Provider[@Name=''Microsoft-Windows-Power-Troubleshooter''] and EventID=1]]</Select></Query></QueryList>'
      }
    Set-ScheduledTask -TaskName "OpenClaw Gateway" \`
      -Settings $t.Settings -Trigger @($t.Triggers + $resume)

What it does:
- Removes the "stop if on battery" / "don't start on battery" flags
  (Windows briefly thinks you're on battery during sleep/wake transitions
  and kills the task otherwise).
- Auto-restart 5× with 1-minute interval if the gateway crashes.
- Removes the default 72-hour execution time limit (lets it run forever).
- Adds a "system resume from sleep" event trigger so the gateway is
  guaranteed to refire after a wake.

*Power settings*: also set sleep-on-AC to "Never" and lid-close on AC to
"Do nothing" via Settings → System → Power & battery (or
powercfg /change standby-timeout-ac 0). These don't need admin if I
change them via Settings.

### Step 10 — Verify everything

    openclaw health
    openclaw infer model auth status | grep missingProvidersInUse
    openclaw agents list

Expectations:
- Gateway event loop is "ok" (or "degraded" briefly during startup, then ok).
- missingProvidersInUse: [].
- Workspace path is correct (no Userskarge.openclaw mangling).
- Bot is reachable from my phone.

*Smoke test*: send the bot "what model are you running on?" and confirm
it answers within ~10–40 seconds (reasoning models with high thinking are
slow on first tokens).

### Step 11 — Optional power-ups

Mention these but *don't enable them automatically* — ask me first:

- *coding-agent skill*: lets the agent dispatch coding tasks to a
  locally-installed claude (Claude Code), codex, or gemini CLI as a
  background process. Telegram message in → 2-15 minutes later → "done"
  ping with file paths. Enable with:

      openclaw config set skills.entries.coding-agent.enabled true
      openclaw gateway restart

  Requires the relevant CLI(s) on PATH and authenticated. Verify with
  which claude && which codex && which gemini (use where on Windows
  cmd, Get-Command in PowerShell).

- *Cron*: openclaw cron add for recurring scheduled tasks (morning
  email summary, evening retro, watch-and-alert patterns). The proactive
  heartbeat (default 30 min) covers ad-hoc proactivity already.

- *Dashboard*: openclaw dashboard opens a local control panel at
  http://127.0.0.1:18789/ with session logs, skills toggles, cron
  manager, memory inspector. Same brain as Telegram, just a different
  surface.

- *More channels*: Discord, Slack, WhatsApp, Signal, iMessage (via
  BlueBubbles) etc. Same channels.<name>.botToken / enabled /
  dmPolicy pattern.

### Pitfalls cheat sheet (if something breaks)

- *"401 invalid api key"* despite a freshly-pasted key → check
  auth-profiles.json for trailing characters from clipboard.
- *"Skipping agent main: workspace does not exist"* → workspace path has
  backslash escaping issues; use forward slashes, ensure dir exists.
- *"Gateway start blocked: missing gateway.mode"* → set
  gateway.mode = "local".
- *PowerShell "Datei kann nicht geladen werden / cannot be loaded"* →
  execution policy; fix with Set-ExecutionPolicy -Scope CurrentUser
  RemoteSigned -Force in admin PowerShell.
- *schtasks create failed: Access denied* → admin terminal needed.
- *Bot replies with "OpenClaw: access not configured"* → I need to send
  openclaw pairing approve telegram <CODE> from this machine.
- *Gateway dies after closing the laptop* → battery-killer scheduled-task
  settings; apply the hardening in Step 9.
- *Subagents silently fall back to primary model* → known issue across
  multiple OpenClaw versions; check the GitHub issue tracker for the
  current state and worst case dispatch coding work explicitly via the
  coding-agent skill instead of relying on automatic subagent routing.
- *Slow first response (10–40 s)* → expected. Reasoning models +
  thinking=high + ~30k-character system prompt. If chat feels too slow,
  ask me whether to lower thinking to medium for everyday chat (trades
  reasoning quality for speed).

### Communication style I prefer from you

- Concise. One short status line per real action. No paragraphs of
  narration about your own thought process.
- German Language during the whole conversation
- File / directory references as clickable paths when supported.
- Don't echo my API keys, bot tokens, or pairing codes back to me. Refer
  to them by label.
- When something fails, find the root cause from logs before suggesting a
  workaround.
- Pause and ask if you'd take a destructive action (delete ~/.openclaw,
  kill running processes, force-overwrite my config). The cost of asking
  is tiny; the cost of destroying state is large.
- Save backups before deleting anything: mv ~/.openclaw
  ~/.openclaw.backup-YYYY-MM-DD rather than rm -rf.

Begin with Step 0 — ask me the questions about my setup, then proceed.`
          }
        ]
      },
      {
        heading: { de: "Links & Ressourcen", en: "Links & resources" },
        type: "links",
        items: [
          {
            label: "DeepSeek Platform",
            url: "https://platform.deepseek.com/",
            description: {
              de: "API-Key für DeepSeek erstellen. Die günstige Fallback-Option, falls dein Abo-Limit erreicht ist.",
              en: "Create a DeepSeek API key. The cheap fallback when your subscription rate limit is hit."
            }
          }
        ]
      }
    ]
  },
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

(function syncSharedPromptContent() {
  const sourceVideo = VIDEOS.find((video) => video.id === "5jfWQ3Y9qRg");
  const targetVideo = VIDEOS.find(
    (video) => video.id === "hermes-local-ollama-free-claude-code-deepseek"
  );
  if (!sourceVideo || !targetVideo) return;

  const sourceSection = (sourceVideo.sections || []).find((section) => {
    const heading = section.heading || {};
    return heading.de === "DeepSeek-Setup-Prompt" || heading.en === "DeepSeek setup prompt";
  });
  const sourcePrompt = sourceSection && sourceSection.items && sourceSection.items[0];
  const targetSection = (targetVideo.sections || []).find(
    (section) => section.id === "deepseek-setup-prompt"
  );
  const targetPrompt = targetSection && targetSection.items && targetSection.items[0];

  if (sourcePrompt && sourcePrompt.content && targetPrompt) {
    targetPrompt.content = sourcePrompt.content;
  }
})();
