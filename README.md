# PromptSketch (v2.0)

> **Publication-Grade Scientific Workbench for Educational Prompt A/B Experimentation & Learning Analytics (LAK / AIED)**

PromptSketch is an open-source, reproducible experimental platform designed for educational researchers, learning designers, and EdTech engineers. It enables running randomized, pre-registered A/B interventions on pedagogical conversational agents, collecting high-resolution student interaction telemetry, and generating publication-ready statistical analyses adhering to the highest standards of the Learning Analytics & Knowledge (LAK), AIED, and EDM communities.

Built with Next.js 16 (React 19), Tailwind CSS, and a strict **CAD Blueprint / Sketchbook** design system compliant with **WCAG 2.2 Level AAA**, PromptSketch completely eradicates "AI slop" (zero emojis, zero SaaS gradients, zero rounded pills) in favor of 90% technical drawing precision and 10% human marginalia.

---

## 1-Click Cloud Deployment

Deploy your own live PromptSketch instance in less than two minutes:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frydozz%2FPromptSketch&env=DB_PROVIDER,SUPABASE_URL,SUPABASE_ANON_KEY,ADMIN_PASSWORD,GROQ_API_KEY&project-name=promptsketch&repo-name=promptsketch)

---

## Core Capabilities

### 1. Multi-Provider AI Engine & Real-Time Telemetry
* **Ecosystem Providers:** Native integrations with **Groq Cloud API** (ultra-fast inference, Llama 3.3 70B, Llama 3.1 8B), **OpenRouter**, **OpenAI** (GPT-4o, GPT-4o-mini), **Anthropic** (Claude 3.5 Sonnet), and **Ollama** (offline local inference for air-gapped classrooms).
* **Deterministic Fallback:** Robust mock engine for zero-cost automated tests and offline demonstrations when no API keys are present.
* **Granular Telemetry:** Captures exact prompt and completion tokens, Time-to-First-Token (TTFT), total latency, and estimated monetary cost (\$ USD) per turn.
* **Reasoning Tag Stripping:** Automatically parses and hides internal `<think>...</think>` tags from DeepSeek R1 and reasoning models before rendering to participants, while preserving them in researcher audit logs.

### 2. Assumption-First Statistical Gatekeeper & Rigor LAK
* **Normality & Homoscedasticity Pre-Flight:** Evaluates Shapiro-Wilk ($W$, $p$) and Levene's variance homogeneity ($F$, $p$) before suggesting inferential tests. When assumptions fail, it automatically gates the analysis toward non-parametric methods and explains *why*.
* **Inferential Testing:** Computes Welch's $t$ with Cohen's $d$, and Mann-Whitney $U$ with Cliff's delta ($\delta$) derived directly from rank sums:
  $$\delta = \frac{2U}{n_1 n_2} - 1$$
* **Family-Wise Error Rate Control:** Step-down Holm-Bonferroni correction ($p_{\text{Holm}}$) adjusted dynamically across multiple survey items and behavioral dimensions.
* **Psychometrics & Paired Learning Gain:** Cronbach's alpha ($\alpha$) with item-rest correlations, and Hake's normalized learning gain ($g$) for pre/post-test diagnostic pairs:
  $$g = \frac{\text{Post} - \text{Pre}}{100 - \text{Pre}}$$
* **Inter-Rater Reliability (IRR) Calibration Lab:** Computes Cohen's kappa ($\kappa$) alongside Gwet's $\text{AC}_1$ to resist the *prevalence paradox* in automated or human qualitative rubric coding.
* **Conversational Learning Analytics:**
  - Student/Bot Verbal Ratio ($R_{\text{vol}}$) and Mean Length of Utterance in words (MLU-w).
  - Normalized Latency: Disentangles estimated reading time (based on bot word count) from formulation latency (student typing speed).
  - Outlier Detection: Flags disengaged turns where tab inactivity exceeds 180 seconds.
  - Moving-Average Type-Token Ratio (MATTR, window $W=20$) and cognitive connector density (causal markers: *"porque"*, *"por lo tanto"*, *"sin embargo"*).

### 3. Scientific Interoperability & Export
* **Tidy Data Formats:** 1-click download of long-format CSV and JSON datasets structured for immediate ingestion in Python (`pandas`), R (`tidyverse`), and SPSS.
* **Codebook Generation:** Automatic machine-readable dictionary documenting column definitions, measurement scales, and valid value ranges.
* **LaTeX `booktabs` Export:** Generates clean, publication-ready LaTeX tables ready to paste directly into ACM / IEEE / LAK manuscripts.
* **Critical LAK Peer-Reviewer Copilot:** Specialized LLM reviewer prompt trained to stress-test sample sizes, statistical assumptions, and effect sizes with the rigor of an ACM senior program committee reviewer.

### 4. Blueprint / Sketchbook Design System (WCAG 2.2 AAA)
* **Zero AI Slop:** Strict linting rules reject Unicode emojis, blurred box shadows, gradients, and rounded borders.
* **Visual Identity:** 90% technical CAD drawing (orthographic grids, title blocks, crop marks, tabular JetBrains Mono numerals) + 10% human annotations (Architects Daughter marginalia).
* **Accessibility:** 42/42 color pairs pass WCAG 2.2 AAA contrast ($\ge 7:1$ for text, $\ge 3:1$ for controls). Includes 44px touch targets, visible 3px focus rings, keyboard `<Abbr/>` definitions, and accessible data table toggles for all chart visualizations.

---

## Quick Start (Zero-Setup Local Mode)

PromptSketch runs immediately out-of-the-box without requiring a database, cloud account, or API key:

```bash
# 1. Clone the repository
git clone https://github.com/rydozz/PromptSketch.git
cd PromptSketch/workshop-app

# 2. Run the automated setup and launch script
./run.sh
```

`./run.sh` will:
1. Detect or create a local `.env.local` configured with `DB_PROVIDER=memory`.
2. Seed the in-memory database with the **ISDDE Benchmark Dataset** (2 prompt versions, 2 workshops, 18 complete participant sessions, and 108 chat turns).
3. Start the Next.js server at `http://localhost:3000`.

Open `http://localhost:3000/admin` (password: `workshop2025` or custom) to explore the full analytics dashboard, drafting table, and campaign builder.

---

## Live Mobile & Conference Testing (`./run-demo.sh`)

When presenting a live workshop or conference demo (e.g. at LAK or ISDDE), university or venue Wi-Fi networks often block local peer-to-peer device discovery.

PromptSketch includes `./run-demo.sh` to provide an instant, secure public HTTPS tunnel with a terminal-rendered QR code:

```bash
./run-demo.sh
```

Features of `./run-demo.sh`:
* Starts the server with an isolated in-memory test database.
* Exposes a public HTTPS tunnel via `localtunnel` (or `cloudflared`).
* Generates a high-contrast ASCII QR code directly in the terminal for audience mobile phone scanning.
* Automatically updates `NEXT_PUBLIC_BASE_URL` so participant links and QR codes route seamlessly through the HTTPS tunnel.

---

## Manual Installation & Environment Setup

If you prefer running commands manually:

```bash
cd workshop-app
npm install
```

Create `.env.local` in the `workshop-app/` directory:

```env
# AI Providers (At least one recommended; fallback mock engine used if empty)
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Admin Dashboard Password (required for /admin access)
ADMIN_PASSWORD=workshop2025

# Database Provider: "memory" (zero-setup local) or "supabase" (production)
DB_PROVIDER=memory

# Base URL for participant links and QR codes
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Default AI Provider & Model (optional; can also be configured in /admin/settings)
DEFAULT_PROVIDER=groq
DEFAULT_MODEL=llama-3.3-70b-versatile
```

Run development server:
```bash
npm run dev
```

Run production build:
```bash
npm run build
npm start
```

---

## Production Deployment with Supabase (PostgreSQL)

For production deployments with multi-user concurrency and persistent cloud storage:

1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** in your Supabase dashboard and run the schema setup script located in:
   [`workshop-app/lib/db-supabase.js`](file:///home/rydozz/Documents/Proyectos/MT4/ISSDE/workshop-app/lib/db-supabase.js) (see commented SQL at bottom of file).
3. In your deployment platform (Vercel, Railway, or VPS), set the following environment variables:
   ```env
   DB_PROVIDER=supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOi...
   ADMIN_PASSWORD=your-secure-admin-password
   GROQ_API_KEY=gsk_...
   NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
   ```

---

## Verification & Test Suites

PromptSketch maintains rigorous automated quality gates:

```bash
# 1. Verify strict WCAG 2.2 AAA color contrast (42 token pairs)
npm run test:contrast

# 2. Verify Anti-AI-Slop compliance across all 44 UI components and routes
npm run test:slop

# 3. Run all unit test suites (Stats, Chat Analytics, Multi-Provider AI Engine) and E2E API tests
npm test
```

---

## Directory Structure

```
workshop-app/
├── app/
│   ├── layout.js                     # Root layout with CAD webfonts & skip link
│   ├── page.js                       # Public participant access & campaign finder
│   ├── glosario/page.js              # Dedicated interactive statistical glossary
│   ├── session/[code]/page.js        # Participant flow (Onboarding -> Chat -> Survey -> Journey)
│   ├── admin/
│   │   ├── layout.js                 # Admin navigation & breadcrumbs
│   │   ├── page.js                   # Live Experiment Overview & Quick Metrics
│   │   ├── versions/page.js          # Drafting Table A/B Prompt Comparator & Diff
│   │   ├── campaigns/page.js         # Kraft Experiment Gallery & Campaign Builder
│   │   ├── sessions/page.js          # Participant Session Table & Transcript Inspector
│   │   ├── analytics/page.js         # Assumption Gatekeeper, Holm-Bonferroni, IRR & Charts
│   │   └── settings/page.js          # 5-Provider AI Diagnostics & Benchmark Seed Loader
│   └── api/                          # REST API endpoints for sessions, chat, analytics, exports
├── components/ui/                    # Blueprint primitives (Panel, SplitButton, StatBadge, etc.)
├── lib/
│   ├── ai-engine.js                  # Multi-provider AI router with TTFT & cost telemetry
│   ├── stats.js                      # Welch t, Mann-Whitney U, Cliff delta, Shapiro-Wilk, Levene
│   ├── psychometrics.js              # Cronbach alpha, item-rest correlation, Hake gain
│   ├── irr.js                        # Cohen kappa & Gwet AC1 inter-rater reliability
│   ├── chat-analytics.js             # Conversational metrics, normalized latency, MATTR
│   ├── tidy-export.js                # Python/R/SPSS tidy data export transformer
│   ├── latex-generator.js            # Publication-grade LaTeX booktabs table generator
│   ├── codebook.js                   # Variable codebook dictionary builder
│   ├── lak-reviewer-prompt.js        # Senior LAK Reviewer System Prompt
│   ├── db.js                         # Database abstraction layer (memory vs supabase)
│   └── seeds/isdde-benchmark.js      # Canonical benchmark dataset generator
├── run.sh                            # 1-command zero-setup local launch script
├── run-demo.sh                       # 1-command HTTPS tunnel & terminal QR code demo script
└── scripts/                          # Automated contrast and anti-slop linters
```

---

## Citation & Academic Use

If you use PromptSketch in an academic publication, workshop, or research study, please cite our LAK27 companion paper:

```bibtex
@inproceedings{fuentes2027promptsketch,
  title={{PromptSketch}: An Open-Source Workbench for Pre-Registered A/B Experimentation and Learning Analytics on Educational Prompts},
  author={Fuentes-Abarca, Juan Pablo and Astudillo, Gabriel and Hilliger, Isabel and Baier, Jorge},
  booktitle={Companion Proceedings of the 17th International Conference on Learning Analytics and Knowledge (LAK27)},
  year={2027},
  address={Kyoto, Japan},
  publisher={Society for Learning Analytics Research (SoLAR)}
}
```

---

## License

PromptSketch is open-source software released under the [MIT License](LICENSE).
