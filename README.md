# PromptSketch

Design, run and analyze educational activities with an AI assistant. Compare versions of the assistant, watch participants live, download the data and get a first plain-language reading of what worked.

Built for teachers, researchers and learning designers. Available in Spanish, English and Portuguese (Brazil).

---

## How it works

1. **Create a campaign** – an ordered list of *steps*. Each step has one or more *conditions* (a case for the participant plus optional instructions for the assistant), an optional welcome message and an optional end-of-step survey.
2. **Share one code or QR** per campaign. Participants join, enter a name or pseudonym, optionally accept an informed-consent notice, chat with the assistant and answer the survey.
3. **Watch it live** – who is in each step, how conditions are balanced, and plain-language alerts (for example: the assistant is running in simulation, someone joined but never wrote, a step is paused).
4. **Get the results** – download tidy CSV files (one row per session, per message, or per participant across steps) with a variable dictionary, and read a first comparison of the conditions. A detailed analysis page shows the assumptions and tests behind it.

Conditions are assigned at random and balanced. Two conditions are not a limit: with three or more, the platform uses Welch's ANOVA or Kruskal-Wallis followed by Holm-corrected pairwise comparisons.

## Features

- **Campaigns, steps and conditions** with a full editor (create, edit, reorder, duplicate, delete) and a preview link.
- **Live monitor** with KPIs, prioritised alerts, per-step progress and a projectable QR.
- **Results hub** with CSV exports and a plain-language first reading; detailed analysis under progressive disclosure.
- **Statistics** (`lib/stats*.js`): assumption checks (Shapiro-Wilk, Levene), Welch's t, Mann-Whitney U with Cliff's δ, Welch's ANOVA, Kruskal-Wallis, Holm-Bonferroni, Cronbach's α, Hake's gain, Cohen's κ and Gwet's AC₁, conversational metrics (MATTR, MLU-w, reading latency). Golden values are checked against SciPy.
- **AI engine** (`lib/ai-engine.js`): OpenRouter, Groq, OpenAI, Anthropic and Ollama with streaming, `<think>` tag stripping, latency/token/cost telemetry and a simulated fallback when no key is configured. A model picker shows live OpenRouter pricing.
- **Floating assistant** for facilitators, with an offline answer base.
- **Participant flow** with visible progress, required-question handling, a case drawer on phones and a completion screen.
- **Demo mode** loads sample data and removes only that data when you leave.
- **Accessibility**: WCAG 2.2 AAA contrast for text (checked in CI), 44px targets, keyboard-operable components.
- **Security**: signed httpOnly admin session; every `/api/admin/*` request is checked in `proxy.js`.

## Quick start

```bash
git clone https://github.com/Rydozz15/workshop-platform.git
cd workshop-platform
npm install
./scripts/run.sh          # in-memory database, http://localhost:3000
```

Open `http://localhost:3000/admin`. Outside production the local default password is `workshop2025`; set `ADMIN_PASSWORD` to use your own. In **production the admin stays locked until `ADMIN_PASSWORD` is set**.

**Not a programmer, or on Windows?** Double-click `iniciar.bat` (Windows) or `iniciar.command` (macOS); both run `npm run local`. Step-by-step guide in Spanish: [`docs/MODO_LOCAL.md`](docs/MODO_LOCAL.md). The `.sh` scripts need a Unix shell (macOS, Linux, or WSL on Windows).

For a booth or classroom demo with a public HTTPS link and a terminal QR code:

```bash
./scripts/run-demo.sh     # generates an admin password for the session if none is set
```

## Configuration

Create `.env.local` (all optional except `ADMIN_PASSWORD` in production):

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Admin password. Required in production. |
| `SESSION_SECRET` | Extra secret mixed into the admin session signature. |
| `DB_PROVIDER` | `memory` (default, JSON file) or `supabase`. |
| `DB_MEMORY_PATH` | Path of the JSON file used by the memory provider (default `./data.json`). |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Supabase connection when `DB_PROVIDER=supabase`. |
| `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | AI provider keys. Placeholder values run the simulated assistant. |
| `OLLAMA_BASE_URL` | Local Ollama server (default `http://localhost:11434`). |
| `DEFAULT_MODEL` | Default model when none is configured in Settings. |
| `NEXT_PUBLIC_BASE_URL` | Public base URL used for participant links. |

The memory provider keeps data in a single JSON file and is meant for demos and single-instance use. For real workshops with concurrency, use Supabase.

### Supabase

1. Create a project and run `docs/migrations/001_base_schema.sql`, then `docs/migrations/002_campaigns.sql` in the SQL editor. The first file is reconstructed from the code: try it on a scratch project before production.
2. Set `DB_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `ADMIN_PASSWORD` in your host (for example Vercel).

### Privacy

Conversations are sent to the AI provider you choose. Review its data policy and, for research, your ethics requirements. The Ollama option keeps everything on your machine. Participants can be asked for informed consent per campaign.

## Testing

```bash
npm test               # unit and logic suites + 126 E2E API/logic tests (no server needed)
npm run test:ui        # Playwright journeys in Google Chrome (starts its own dev server)
npm run test:contrast  # WCAG AAA contrast of the design tokens
npm run test:slop      # design-rule lint (no emojis, no layout-shifting hover, ...)
npm run lint
```

`test/i18n.test.js` fails when a UI string lacks an English or Portuguese translation, or when a translation is unused.

## Project structure

```
app/                    Next.js App Router (participant pages, /admin, /api)
components/             UI primitives (blueprint/), campaign editor, assistant
lib/                    db providers, AI engine, statistics, campaigns, live monitor, i18n
test/, e2e-ui/          logic tests and Playwright UI tests
docs/                   SQL migrations and design notes
```

Conventions: Spanish is the source language for UI text (`tr('Texto')`, translations in `lib/i18n/messages-*.js`); design rules are enforced by `npm run test:slop`.

## Development with Claude Code

The first iteration of PromptSketch, its features and its product direction were designed and written by Juan Pablo Fuentes Abarca. The current version was then improved and programmed with [Claude Code](https://claude.com/claude-code) (Anthropic; models Claude Opus 5.5 and Sonnet 5.5) following those guidelines. In line with common practice for AI-assisted projects:

- **Transparency.** Commits made with Claude Code carry a `Co-Authored-By: Claude …` trailer, so AI-assisted changes can be traced in the history.
- **Human direction and ownership.** The maintainer sets the goals, the product decisions and the review criteria, and owns the result. The logo is based on the maintainer's own artwork.
- **What Claude Code produced.** The redesign and most of the current code, tests, documentation and the English and Portuguese translations were drafted with Claude Code on top of the original product.
- **Verification, not blind trust.** Changes are gated by the automated suites above (logic, statistics against SciPy reference values, UI journeys, accessibility contrast, design lint). These catch regressions; they are not a substitute for review.
- **Known limits.**
  - The code has not had an independent security audit.
  - The English and Portuguese translations have not been reviewed by native speakers.
  - The earlier iteration was validated with facilitators; this latest version has not yet been tested with real facilitators. A protocol for that is in `docs/PRUEBA_USABILIDAD.md`.
  - Check privacy, consent and data-protection requirements before using it with real participants.

If you contribute, please say how AI was used in your pull request, keep the test suites green and review generated code as you would any other.

## For AI agents

`AGENTS.md` tells coding agents how to work on this repository (commands, conventions, rules that are easy to break) and tells operating agents how to drive a running instance through its API (authentication, campaign payloads, participant simulation, exports, guardrails).

## License

MIT, see [`LICENSE`](LICENSE).
