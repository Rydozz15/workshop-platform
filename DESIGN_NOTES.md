# PromptSketch — Design System & Architectural Notes (Milestone 1)

**Version:** 2.0.0-M1  
**Author:** Visual Foundation & Blueprint Primitives Worker (teamwork_preview_worker_m1_1)  
**Date:** 2026-11-04  
**Target:** `workshop-app/`  
**Standards:** WCAG 2.2 Level AAA, PromptSketch Design System v2  

---

## 1. Executive Summary & Aesthetic Metaphor

PromptSketch transitions the workshop platform from a generic, consumer-grade SaaS dark glassmorphism theme (`#0a0e1a` purple/indigo glows, rounded pills, and emojis) into a rigorous, publication-grade scientific instrument for educational prompt A/B experimentation and Learning Analytics (LA).

The visual identity is anchored on the **Sketchbook / Workbench** metaphor:
- Every experiment is a clean sheet of drafting paper (`paper #FFFDF7`) resting upon a warm parchment workbench (`canvas #EFE6D2` with subtle blueprint coordinate grid).
- Secondary sections (archives, sidebars, empty states) evoke warm textured drafting paper (`kraft #D8C39B`).
- **The Golden Ratio of Precision:** **90% technical CAD precision** (tabular data, sharp coordinates, mono labels, 0px border radius, solid projections) + **<=10% human marginalia** (handwritten notes, pencil annotations, paper grain). Marginalia is never the sole carrier of meaning.

---

## 2. Design Token Overrides & Contrast Rationale

To achieve strict **WCAG 2.2 AAA** compliance across all interactive surfaces, the following mandatory overrides and calibrations were established:

### 2.1 The `--ps-ink-2` Token Override
- **Draft Value in v2:** `#4A453D`
- **Mandatory Override:** `--ps-ink-2: #46413A;`
- **Mathematical Rationale:** The draft value `#4A453D` produced contrast ratios hovering between 7.50:1 and 8.03:1 on light tints, leaving almost zero safety margin under varying display calibrations. Shifting the secondary ink to `#46413A` lowers its relative luminance ($L = 0.0524$), guaranteeing **7.97:1 to 9.94:1** across all paper and soft tint surfaces:
  - `ink-2` on `paper (#FFFDF7)`: **9.94:1** (AAA >= 7:1)
  - `ink-2` on `paper-subtle (#F6F0E1)`: **8.89:1** (AAA >= 7:1)
  - `ink-2` on `canvas (#EFE6D2)`: **8.14:1** (AAA >= 7:1)
  - `ink-2` on `cobalt-tint (#DDE5F5)`: **7.99:1** (AAA >= 7:1)
  - `ink-2` on `vermilion-tint (#F7E3D8)`: **8.15:1** (AAA >= 7:1)
  - `ink-2` on `emerald-tint (#E4EFE3)`: **8.55:1** (AAA >= 7:1)
  - `ink-2` on `graphite-tint (#EAE4D6)`: **7.97:1** (AAA >= 7:1)
- **Constraint on Kraft:** `--ps-ink-2` is strictly forbidden on `--ps-kraft` (`#D8C39B`) because the ratio is 5.87:1 (< 7:1). Text on kraft surfaces must use `--ps-ink` (`#1F1D1A`, yielding 9.77:1).

### 2.2 Drafting Surfaces & Lines
- `--ps-canvas: #EFE6D2;`: Warm cream workbench background with 24px minor / 120px major drafting grid.
- `--ps-kraft: #D8C39B;`: Kraft textured paper with procedural grain filter.
- `--ps-paper: #FFFDF7;`: Clean white work sheet for panels, cards, editors, and tables.
- `--ps-paper-subtle: #F6F0E1;`: Background for table headers, title blocks, and code blocks.
- `--ps-paper-muted: #E4D9C0;`: Disabled controls and container track bars.
- `--ps-line-control: #7F7869;`: Control borders meeting WCAG 2.2 non-text contrast >= 3:1 (**3.53:1 on canvas, 4.31:1 on paper**).
- `--ps-line-strong: #46413A;`: Hover states and active panel frames (**8.14:1 on canvas, 9.94:1 on paper**).
- `--ps-rule: #8F8670;`: Dotted decorative dividers.

### 2.3 Vermilion Invariant Rules
- Raw vermilion (`#E04E26`) has a luminance that yields only ~3.97:1 against pure white, failing the 7:1 text requirement.
- **Rules:**
  1. Raw `--ps-vermilion (#E04E26)` is restricted exclusively to icon box fills and decorative filetes/markers. It is NEVER used for text or text backgrounds.
  2. Text blocks with solid fill must use `--ps-vermilion-block (#9E3217)`, which achieves **7.06:1** against paper text.
  3. Alert and warning text on light surfaces must use `--ps-vermilion-ink (#86280F)`, achieving **7.28:1 on canvas and 8.88:1 on paper**.

---

## 3. WCAG 2.2 AAA Contrast Verification Matrix

All 42 token pairs tested programmatically via `npm run test:contrast` (`workshop-app/scripts/check-contrast.js`):

| Pair Index | Foreground Token | Background Token | Measured Contrast Ratio | WCAG 2.2 Minimum | Status |
|:---:|:---|:---|:---:|:---:|:---:|
| 1 | `ink` (`#1F1D1A`) | `canvas` (`#EFE6D2`) | **13.55:1** | >= 7.0:1 | PASS (AAA) |
| 2 | `ink` (`#1F1D1A`) | `paper` (`#FFFDF7`) | **16.53:1** | >= 7.0:1 | PASS (AAA) |
| 3 | `ink` (`#1F1D1A`) | `kraft` (`#D8C39B`) | **9.77:1** | >= 7.0:1 | PASS (AAA) |
| 4 | `ink` (`#1F1D1A`) | `paper-subtle` (`#F6F0E1`) | **14.79:1** | >= 7.0:1 | PASS (AAA) |
| 5 | `ink` (`#1F1D1A`) | `cobalt-tint` (`#DDE5F5`) | **13.29:1** | >= 7.0:1 | PASS (AAA) |
| 6 | `ink` (`#1F1D1A`) | `vermilion-tint` (`#F7E3D8`) | **13.56:1** | >= 7.0:1 | PASS (AAA) |
| 7 | `ink` (`#1F1D1A`) | `emerald-tint` (`#E4EFE3`) | **14.22:1** | >= 7.0:1 | PASS (AAA) |
| 8 | `ink` (`#1F1D1A`) | `graphite-tint` (`#EAE4D6`) | **13.26:1** | >= 7.0:1 | PASS (AAA) |
| 9 | `ink-2` (`#46413A`) | `paper` (`#FFFDF7`) | **9.94:1** | >= 7.0:1 | PASS (AAA) |
| 10 | `ink-2` (`#46413A`) | `paper-subtle` (`#F6F0E1`) | **8.89:1** | >= 7.0:1 | PASS (AAA) |
| 11 | `ink-2` (`#46413A`) | `canvas` (`#EFE6D2`) | **8.14:1** | >= 7.0:1 | PASS (AAA) |
| 12 | `ink-2` (`#46413A`) | `cobalt-tint` (`#DDE5F5`) | **7.99:1** | >= 7.0:1 | PASS (AAA) |
| 13 | `ink-2` (`#46413A`) | `vermilion-tint` (`#F7E3D8`) | **8.15:1** | >= 7.0:1 | PASS (AAA) |
| 14 | `ink-2` (`#46413A`) | `emerald-tint` (`#E4EFE3`) | **8.55:1** | >= 7.0:1 | PASS (AAA) |
| 15 | `ink-2` (`#46413A`) | `graphite-tint` (`#EAE4D6`) | **7.97:1** | >= 7.0:1 | PASS (AAA) |
| 16 | `cobalt` (`#1A3FA8`) | `canvas` (`#EFE6D2`) | **7.29:1** | >= 7.0:1 | PASS (AAA) |
| 17 | `cobalt` (`#1A3FA8`) | `paper` (`#FFFDF7`) | **8.90:1** | >= 7.0:1 | PASS (AAA) |
| 18 | `cobalt` (`#1A3FA8`) | `cobalt-tint` (`#DDE5F5`) | **7.15:1** | >= 7.0:1 | PASS (AAA) |
| 19 | `cobalt` (`#1A3FA8`) | `paper-subtle` (`#F6F0E1`) | **7.96:1** | >= 7.0:1 | PASS (AAA) |
| 20 | `paper` (`#FFFDF7`) | `cobalt` (`#1A3FA8`) | **8.90:1** | >= 7.0:1 | PASS (AAA) |
| 21 | `paper` (`#FFFDF7`) | `cobalt-hover` (`#142F80`) | **11.81:1** | >= 7.0:1 | PASS (AAA) |
| 22 | `paper` (`#FFFDF7`) | `vermilion-block` (`#9E3217`) | **7.06:1** | >= 7.0:1 | PASS (AAA) |
| 23 | `vermilion-ink` (`#86280F`) | `canvas` (`#EFE6D2`) | **7.28:1** | >= 7.0:1 | PASS (AAA) |
| 24 | `vermilion-ink` (`#86280F`) | `paper` (`#FFFDF7`) | **8.88:1** | >= 7.0:1 | PASS (AAA) |
| 25 | `vermilion-ink` (`#86280F`) | `vermilion-tint` (`#F7E3D8`) | **7.29:1** | >= 7.0:1 | PASS (AAA) |
| 26 | `vermilion-ink` (`#86280F`) | `paper-subtle` (`#F6F0E1`) | **7.95:1** | >= 7.0:1 | PASS (AAA) |
| 27 | `emerald` (`#0F4F33`) | `canvas` (`#EFE6D2`) | **7.74:1** | >= 7.0:1 | PASS (AAA) |
| 28 | `emerald` (`#0F4F33`) | `paper` (`#FFFDF7`) | **9.44:1** | >= 7.0:1 | PASS (AAA) |
| 29 | `emerald` (`#0F4F33`) | `emerald-tint` (`#E4EFE3`) | **8.12:1** | >= 7.0:1 | PASS (AAA) |
| 30 | `emerald` (`#0F4F33`) | `paper-subtle` (`#F6F0E1`) | **8.45:1** | >= 7.0:1 | PASS (AAA) |
| 31 | `graphite` (`#5B574F`) | `paper` (`#FFFDF7`) | **7.07:1** | >= 7.0:1 | PASS (AAA) |
| 32 | `line-control` (`#7F7869`) | `canvas` (`#EFE6D2`) | **3.53:1** | >= 3.0:1 | PASS (Non-text) |
| 33 | `line-control` (`#7F7869`) | `paper` (`#FFFDF7`) | **4.31:1** | >= 3.0:1 | PASS (Non-text) |
| 34 | `line-control` (`#7F7869`) | `paper-subtle` (`#F6F0E1`) | **3.85:1** | >= 3.0:1 | PASS (Non-text) |
| 35 | `line-strong` (`#46413A`) | `paper` (`#FFFDF7`) | **9.94:1** | >= 3.0:1 | PASS (Non-text) |
| 36 | `line-strong` (`#46413A`) | `canvas` (`#EFE6D2`) | **8.14:1** | >= 3.0:1 | PASS (Non-text) |
| 37 | `cobalt` (`#1A3FA8`) | `paper` (`#FFFDF7`) | **8.90:1** | >= 3.0:1 | PASS (Non-text) |
| 38 | `white` (`#FFFFFF`) | `vermilion` (`#E04E26`) | **3.97:1** | >= 3.0:1 | PASS (Non-text) |
| 39 | `white` (`#FFFFFF`) | `crimson` (`#B72A2E`) | **6.21:1** | >= 3.0:1 | PASS (Non-text) |
| 40 | `vermilion-ink` (`#86280F`) | `paper-subtle` (`#F6F0E1`) | **7.95:1** | >= 3.0:1 | PASS (Non-text) |
| 41 | `focus` (`#1A3FA8`) | `paper` (`#FFFDF7`) | **8.90:1** | >= 3.0:1 | PASS (Non-text) |
| 42 | `focus` (`#1A3FA8`) | `canvas` (`#EFE6D2`) | **7.29:1** | >= 3.0:1 | PASS (Non-text) |

---

## 4. CAD Technical Iconography & Anti-AI-Slop Architecture

### 4.1 Square Caps & Miter Joins (`CadIcon`)
Every icon rendered in PromptSketch is processed through `components/ui/cad-icon.js` or global CSS rules:
```css
.lucide, svg.ps-icon {
  stroke-linecap: square !important;
  stroke-linejoin: miter !important;
  stroke-width: 1.75px;
  width: 16px;
  height: 16px;
}
```
This produces crisp, geometric vector paths evoking architectural ink drawings, rejecting the default rounded consumer SVG styling.

### 4.2 Prohibited AI Clichés
`CadIcon` enforces an invariant rejection set against generic generative AI clichés:
- Banned: `Sparkles`, `Wand`, `Wand2`, `Bot`, `Brain`, `BrainCircuit`.
- If an attempt is made to instantiate a prohibited icon, `CadIcon` raises a runtime error:
  `[PromptSketch CAD] Prohibited AI-cliché icon "${name}" rejected per PromptSketch Design System v2.`
- Approved engineering replacements:
  - AI reasoning / engine: `Cpu`, `Sliders`, `Layers`, `Terminal`
  - Diff / Comparator: `GitCompare`, `Split`, `Diff`
  - Analytics / Data: `BarChart2`, `Activity`, `Table`, `FileSpreadsheet`
  - Validation / Check: `CheckSquare`, `Check`, `AlertTriangle`

---

## 5. Blueprint Primitives Architectural Choices

### 5.1 `<BlueprintPanel/>`
- **Metaphor:** Physical drafting sheet with 4 corner registration crop marks (`.ps-crop--tl/tr/bl/br`).
- **Semantics:** Configurable semantic heading (`h2`, `h3`, or `h4`) bound to the container via `aria-labelledby`.
- **Auditing Integration:** Footer automatically hosts `<TitleBlock/>`.

### 5.2 `<SplitButton/>`
- **Hit Target:** 44×44px minimum target height and width.
- **Icon Box:** 36px wide left icon container with `aria-hidden="true"`, styled with high-contrast icon-box pairs (white on vermilion/crimson, vermilion-ink on paper-subtle).
- **Secondary Actions:** Expandable menu supporting keyboard traversal and Escape dismissal.

### 5.3 `<StatBadge/>`
- **Multi-Modal Signaling:** Uses distinct state marks (`·` neutral, `✓` via CadIcon Check for significance, `!` warning, `>` cobalt) ensuring color is NEVER the sole carrier of status.
- **Screen Reader Support:** Renders `<span className="sr-only"> — {statusLabel}</span>`.
- **Tabular Numerals:** Formats values in `.stat` with JetBrains Mono tabular numbers.

### 5.4 `<TitleBlock/>` (Cajetín de Plano)
- Replaces uncalibrated decorative telemetry with an authentic engineering audit block rendered as a semantic `<dl>` grid:
  `PLANO / EXP`, `ESTADO` (`PREREGISTRADO` vs `EXPLORATORIO`), `REVISIÓN`, `MUESTRA (N)`, and `TÍTULO`.

### 5.5 `<Field/>`
- **Permanent Label:** Label stays visible above the control; mandatory state explicitly declared as `(obligatorio)` in text.
- **ARIA Error Binding:** Binds `aria-invalid="true"` and `aria-describedby` to the error and helper paragraphs.

### 5.6 `<DataTable/>`
- Operable inside a focusable overflow container (`tabindex="0"`) with descriptive caption.
- Sortable headers with 44px min-target buttons and dynamic `aria-sort="ascending|descending|none"`.
- Row hover indicated by a 3px solid ink left border without disruptive font color changes.

### 5.7 `<ChartFrame/>`
- **Dual Visual Encoding:**
  - **Condition A (Baseline):** Diagonal hatch pattern (`<pattern id="ps-hatch" width="8" height="8" patternTransform="rotate(45)">`) with 1.5px lines + graphite border.
  - **Condition B (Intervention):** Solid cobalt fill (`#1A3FA8`) + ink border.
- **Direct Labeling:** Data values rendered directly over bars.
- **Error Bars:** 1.5px ink lines with 6px end caps representing 95% CI.
- **Mandatory Table Toggle:** Includes visible button `"Ver como tabla"` that replaces the SVG with an accessible `<DataTable/>`.
- **Trend Summary:** Plain-text pedagogical explanation in `aria-describedby` and visible summary block.

### 5.8 `<Abbr/>` & Glossary Popover
- Keyboard-accessible `<abbr tabIndex={0}>` with dotted underline.
- Activates on click, Enter, or Space; closes on Escape or outside click.
- Built-in scientific glossary covering all essential metrics: $p$, $p_{\text{Holm}}$, $U$, $d$, $\delta$, $\alpha$, $\text{AC}_1$, $\text{MATTR}$, $\text{IC}_{95}$, $g$, $\text{MLU-w}$, $R_{\text{vol}}$.

### 5.9 `<MarginNote/>` & `<HandMark/>` (The 10% Rule)
- Clamped strictly to $\le 5$ words and rotated between $-3^\circ$ and $+3^\circ$.
- Set in Architects Daughter (`--font-note`).
- Default `aria-hidden="true"`; if `informative={true}`, rendered with `role="note"`.

---

## 6. Next.js Font Pipeline & WCAG AAA Operability

### 6.1 Server-Side Font Optimization
Configured in `workshop-app/app/layout.js`:
- `Geist` (Display & Body, normal width, tight tracking)
- `Geist_Mono` (500 weight for buttons, labels, titleblocks)
- `JetBrains_Mono` loaded with `latin` and **`greek`** subsets for statistical symbols ($\alpha$, $\delta$, $\Delta$, $\sum$)
- `Architects_Daughter` for hand-drawn marginalia

### 6.2 Focus Appearance & Keyboard Operability
- Unconditional 3px focus ring with 2px offset:
  `outline: 3px solid var(--ps-cobalt); outline-offset: 2px;`
- In dark regions (`.on-dark`):
  `outline-color: var(--ps-paper);`
- Visible skip link: `<a href="#main-content" className="skip-link">Saltar al contenido principal</a>`.
- `html` scroll padding (`scroll-padding-top: 112px; scroll-padding-bottom: 96px;`) preventing sticky header/footer focus obstruction.

### 6.3 Anti-Slop Static Linter
Enforced via `workshop-app/scripts/lint-slop.js` (`npm run test:slop` / `npm run lint:design`):
- 0 emojis in active UI.
- 0 prohibited SaaS Tailwind classes (`rounded > 2px`, `shadow-sm/md/lg`, `bg-gradient`, prohibited color palettes).
- 0 hardcoded hex literals in UI components.
- 0 font sizes < 12px.
- 0 prohibited AI-cliché Lucide icons.

---

## 7. Milestone 1 Remediation & Adversarial Hardening (Iteration 2)

Following gate evaluation by Reviewer 2, Challenger 1, and Challenger 2, seven architectural and accessibility remediations were implemented and empirically confirmed:

### 7.1 Skip Link DOM Target (WCAG 2.4.1 Bypass Blocks)
- **Deficiency:** `<a href="#main-content" className="skip-link">` lacked a matching DOM element.
- **Remediation:** In `workshop-app/app/layout.js`, `{children}` is wrapped inside `<main id="main-content" tabIndex={-1} className="w-full">`, enabling seamless keyboard focus transfer.

### 7.2 Webfont CSS Pipeline Binding
- **Deficiency:** Next.js preloaded `Architects_Daughter` into `--font-note-src`, but `globals.css` declared `--font-note` without referencing the CSS variable.
- **Remediation:** In `workshop-app/app/globals.css`, `--font-note` binds `var(--font-note-src), var(--font-architects-daughter), 'Architects Daughter', 'JetBrains Mono', monospace;`, ensuring handwritten marginalia renders faithfully on all client machines.

### 7.3 Uniform 3px Solid Cobalt Focus Ring
- **Deficiency:** Several components (`chart-frame.js`, `data-table.js`, `abbr.js`, and `.ps-abbr:focus-visible` in `globals.css`) injected `focus-visible:outline-2`, overriding the global 3px solid cobalt ring.
- **Remediation:** Removed local `focus-visible:outline-2` declarations. All interactive elements now inherit the universal `:focus-visible { outline: 3px solid var(--ps-cobalt); outline-offset: 2px; }`.

### 7.4 WCAG 2.2 AAA SC 2.5.5 Interactive Target Sizing (>= 44x44px)
- **Deficiency:** Dropdown toggle in `<SplitButton/>` was 36px wide; sort buttons in `<DataTable/>` lacked minimum width for short labels; popover close button in `<Abbr/>` was 24x24px.
- **Remediation:**
  - `<SplitButton/>`: Dropdown button updated to `min-h-[44px] min-w-[44px]`.
  - `<DataTable/>`: Column sort headers upgraded to `min-h-[44px] min-w-[44px] px-2`.
  - `<Abbr/>`: Close button upgraded to `min-h-[44px] min-w-[44px]` with `<CadIcon name="X" size={14} />`.
  - `<Field/>`: Injects `min-h-[44px]` into naked child controls and cleanly binds `inputId` to child `id` for `<label htmlFor={inputId}>`.

### 7.5 Case-Insensitive CAD Icon Anti-Slop Enforcement
- **Deficiency:** Lowercase icon invocations (e.g. `name="sparkles"`) could bypass exact-case Set matching and fall back to Square without throwing.
- **Remediation:** In `workshop-app/components/ui/cad-icon.js`, normalized icon names to lowercase before checking against banned clichés (`sparkles`, `wand`, `wand2`, `bot`, `brain`, `braincircuit`), actively throwing rejection errors regardless of casing.

### 7.6 Static Linter Regex Boundary Hardening
- **Deficiency:** In `scripts/lint-slop.js`, `SMALL_FONT_REGEX` had a trailing `\b` after `]`, which failed to match when followed by quotes.
- **Remediation:** Updated regex to `/\btext-\[(8|9|10|11)px\]|\bfont-size:\s*['"]?(8|9|10|11)px\b/`.

### 7.7 Empirical Verification
- Executed `workshop-app/scripts/adversarial-m1-challenge.js`: 25 passed checks, 0 warnings, 0 failures. Verdict: **`CONFIRM`**.
- Executed `npm run test:contrast`: 42/42 token pairs pass WCAG AAA (Code 0).
- Executed `npm run test:slop`: 0 slop violations (Code 0).
- Executed `npm run build`: Turbopack compiles 22/22 routes successfully (Code 0).


---

## 8. Full-Platform Architecture & View Migration (Milestones 2–4)

**Completed:** 2026-11-04  
**Scope:** Complete frontend migration across all 11 routes, multi-provider AI engine, assumption-first analytical backend, and publication artifacts.

### 8.1 Multi-Provider AI Architecture (`lib/ai-engine.js`)
* **Unified Stream & Fallback Protocol:** Standardized response structure (`{ content, role, model, usage: { promptTokens, completionTokens, totalTokens }, telemetry: { latencyMs, timeToFirstTokenMs, estimatedCostUsd } }`).
* **Provider Adapters:**
  - **Groq Cloud:** Ultra-fast streaming using official endpoints, native token telemetry parsing, Llama 3.3 70B & Llama 3.1 8B support.
  - **OpenRouter:** Dynamic model routing across open-source and proprietary foundation models.
  - **OpenAI:** GPT-4o and GPT-4o-mini structured completions.
  - **Anthropic:** Messages API integration for Claude 3.5 Sonnet.
  - **Ollama:** Offline local inference via `http://localhost:11434/api/generate` with zero data leakage for strict institutional privacy.
  - **Deterministic Mock Engine:** Built-in fallback ensuring continuous test execution and offline demonstrations without API keys.
* **Reasoning Model Sanitation:** Intercepts `<think>...</think>` tags generated by reasoning models (e.g. DeepSeek R1), hiding raw reasoning traces from student participants while preserving them for post-hoc qualitative audit in researcher sessions.

### 8.2 Analytical & Psychometric Backend
* **Assumption Testing Gatekeeper (`lib/stats.js`):**
  - Shapiro-Wilk test for normality ($W$, $p$) implemented with Royston's polynomial approximation.
  - Levene's test for equality of variances across conditions ($F$, $p$) using median-centered deviations (Brown-Forsythe variant).
  - Explicit algorithmic decision tree directing researchers to Welch's $t$ or Mann-Whitney $U$ based on empirical test results.
* **Inferential Statistics & Effect Sizes:**
  - Welch's $t$-test with Satterthwaite degrees of freedom and Cohen's $d$.
  - Mann-Whitney $U$ with rank-biserial correlation and Cliff's delta ($\delta$) calculated directly from $U$: $\delta = \frac{2U}{n_1 n_2} - 1$.
  - Step-down Holm-Bonferroni correction ($p_{\text{Holm}}$) protecting against family-wise error inflation across multiple comparisons.
* **Psychometrics & Learning Gains (`lib/psychometrics.js`):**
  - Cronbach's alpha ($\alpha$) for internal survey scale consistency with item-rest correlation diagnostics.
  - Paired Hake's normalized learning gain ($g$) for pre/post diagnostic assessments with Bayesian category classification (Low $< 0.3$, Medium $0.3 \le g < 0.7$, High $\ge 0.7$).
* **Inter-Rater Reliability Calibration Lab (`lib/irr.js`):**
  - Cohen's kappa ($\kappa$) with standard error and Fleiss benchmark interpretation.
  - Gwet's $\text{AC}_1$ statistic to safeguard against the prevalence paradox when high agreement coincides with imbalanced categorical distribution.
  - Interactive calibration simulator allowing custom 2-coder contingency matrices and CSV uploads.
* **Conversational Learning Analytics (`lib/chat-analytics.js`):**
  - Student/Bot Verbal Ratio ($R_{\text{vol}}$) and Mean Length of Utterance in words (MLU-w).
  - Normalized Latency: Decoupled into Estimated Reading Time (based on bot word count at 200 WPM) and Formulation Latency (student typing time).
  - Disengagement Outliers: Flags turns where student inactivity exceeds 180 seconds.
  - Lexical Diversity: Moving-Average Type-Token Ratio (MATTR) with fixed window size $W=20$.
  - Cognitive Connectors: Lexical pattern matching for causal, contrastive, and metacognitive markers in student discourse.

### 8.3 Scientific Interoperability & Publication Deliverables
* **Tidy Data Exporters (`lib/tidy-export.js`, `lib/codebook.js`):** Generates RFC-4180 compliant long and wide format CSV/JSON exports with accompanying data dictionary.
* **LaTeX `booktabs` Generator (`lib/latex-generator.js`):** Produces publication-ready LaTeX tables with proper mathematical notation, alignment, and footnote citations.
* **Senior LAK Reviewer Assistant (`lib/lak-reviewer-prompt.js`):** Specialized persona for interactive methodological critiques, sample size warnings, and instructional design recommendations.

### 8.4 UI Route Migration & Verification
* **Migrated Views (11/11):**
  - Public Participant: `/` (Campaign Finder), `/glosario` (Glossary), `/session/[code]` (3-Step Onboarding Stepper, Live Chat with Drawer, Post-Session Survey, Participant Journey Hub).
  - Admin Workbench: `/admin` (Live Overview), `/admin/versions` (Drafting Table & Diff Comparator), `/admin/campaigns` (Kraft Gallery, Chained Campaign Builder, Copilot Modal), `/admin/sessions` (DataTable, Transcript Inspector Modal, Exports), `/admin/analytics` (Assumption Gatekeeper, Holm-Bonferroni Table, ChartFrame, Psychometrics, IRR Lab, LaTeX Modal, Reviewer Copilot), `/admin/settings` (Multi-Provider Diagnostics, Benchmark Seeder).
* **Automated Quality Gates:**
  - `npm run test:slop`: 44/44 files verified, 0 violations (Strict All mode).
  - `npm run test:contrast`: 42/42 token pairs pass WCAG 2.2 AAA.
  - `npm test`: 126/126 unit and E2E tests passing.
  - `npm run build`: Turbopack compiles 26/26 routes cleanly with 0 errors.
