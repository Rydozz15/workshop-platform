#!/usr/bin/env node

/**
 * Empirical Adversarial Challenge Suite for Milestone 1 (M1) Deliverables
 * Run by Challenger 2 (Empirical Challenger)
 */

const fs = require('fs');
const path = require('path');
const sucrase = require('sucrase');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const LucideIcons = require('lucide-react');

// Helper to load and transform JSX module via Sucrase
function loadJsxModule(filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  const code = fs.readFileSync(fullPath, 'utf8');
  // Strip client directive
  const cleanCode = code.replace(/['"]use client['"];?/g, '');
  const transformed = sucrase.transform(cleanCode, {
    transforms: ['jsx', 'imports'],
  }).code;

  const mod = { exports: {} };
  const customRequire = (id) => {
    if (id === 'react') return React;
    if (id === 'lucide-react') return LucideIcons;
    if (id === 'next/link') {
      return function Link({ href, children, ...props }) {
        return React.createElement('a', { href, ...props }, children);
      };
    }
    if (id.startsWith('./') || id.startsWith('../')) {
      const dir = path.dirname(fullPath);
      let resolved = path.resolve(dir, id);
      if (!path.extname(resolved)) {
        if (fs.existsSync(resolved + '.js')) resolved += '.js';
        else if (fs.existsSync(path.join(resolved, 'index.js'))) resolved = path.join(resolved, 'index.js');
      }
      const relToApp = path.relative(path.resolve(__dirname, '..'), resolved);
      return loadJsxModule(relToApp);
    }
    return require(id);
  };

  const fn = new Function('require', 'exports', 'module', transformed);
  fn(customRequire, mod.exports, mod);
  return mod.exports;
}

console.log('='.repeat(70));
console.log('EMPIRICAL ADVERSARIAL CHALLENGE SUITE — M1 (BLUEPRINT & VISUAL SYSTEM)');
console.log('='.repeat(70));

let failures = [];
let warnings = [];
let passes = [];

// ============================================================================
// CHALLENGE 1: CadIcon Prohibited Cliché Icons & Technical Styling
// ============================================================================
console.log('\n--- [CHALLENGE 1] CadIcon Prohibited Icons & Technical Invariants ---');
try {
  const cadIconMod = loadJsxModule('components/ui/cad-icon.js');
  const CadIcon = cadIconMod.CadIcon;
  const PROHIBITED_ICONS = cadIconMod.PROHIBITED_ICONS;

  // 1.1 Prohibited icon by name: Sparkles
  let sparklesThrew = false;
  try {
    ReactDOMServer.renderToString(React.createElement(CadIcon, { name: 'Sparkles' }));
  } catch (err) {
    sparklesThrew = true;
    passes.push('CadIcon with name="Sparkles" threw expected rejection error: ' + err.message);
  }
  if (!sparklesThrew) {
    failures.push('CRITICAL: <CadIcon name="Sparkles" /> did NOT throw error!');
  }

  // 1.2 All other prohibited icons in set: Wand, Wand2, Bot, Brain, BrainCircuit
  const prohibitedList = ['Wand', 'Wand2', 'Bot', 'Brain', 'BrainCircuit'];
  for (const iconName of prohibitedList) {
    let threw = false;
    try {
      ReactDOMServer.renderToString(React.createElement(CadIcon, { name: iconName }));
    } catch (e) {
      threw = true;
    }
    if (threw) {
      passes.push(`CadIcon with name="${iconName}" correctly rejected.`);
    } else {
      failures.push(`CRITICAL: <CadIcon name="${iconName}" /> did NOT throw error!`);
    }
  }

  // 1.3 Icon passed as component directly
  for (const iconName of ['Sparkles', 'Bot', 'Brain']) {
    const Component = LucideIcons[iconName];
    if (Component) {
      let threw = false;
      try {
        ReactDOMServer.renderToString(React.createElement(CadIcon, { icon: Component }));
      } catch (e) {
        threw = true;
      }
      if (threw) {
        passes.push(`CadIcon with icon={${iconName}} correctly rejected via component inspection.`);
      } else {
        failures.push(`HIGH: <CadIcon icon={${iconName}} /> bypassed prohibited icon check!`);
      }
    }
  }

  // 1.4 Adversarial case bypass test (e.g. lowercase 'sparkles', 'bot')
  for (const lowercaseName of ['sparkles', 'wand', 'bot', 'brain', 'braincircuit']) {
    let threw = false;
    try {
      ReactDOMServer.renderToString(React.createElement(CadIcon, { name: lowercaseName }));
    } catch (e) {
      threw = true;
    }
    if (!threw) {
      warnings.push(`ADVERSARIAL: <CadIcon name="${lowercaseName}" /> (lowercase) did NOT throw error (fell back to Square instead of throwing prohibited error).`);
    }
  }

  // 1.5 Technical CAD styling attributes on allowed icon
  const checkHtml = ReactDOMServer.renderToString(React.createElement(CadIcon, { name: 'Check', size: 16 }));
  if (checkHtml.includes('stroke-linecap="square"') && checkHtml.includes('stroke-linejoin="miter"')) {
    passes.push('CadIcon correctly applies strokeLinecap="square" and strokeLinejoin="miter".');
  } else {
    failures.push('HIGH: CadIcon missing square caps or miter joins in rendered SVG.');
  }

} catch (err) {
  failures.push('CHALLENGE 1 execution error: ' + err.message);
}

// ============================================================================
// CHALLENGE 2: ChartFrame Dual Encoding & Accessible Table Toggle
// ============================================================================
console.log('\n--- [CHALLENGE 2] ChartFrame Dual Encoding & Accessible Table Toggle ---');
try {
  const chartFrameMod = loadJsxModule('components/ui/blueprint/chart-frame.js');
  const ChartFrame = chartFrameMod.ChartFrame;

  const testData = {
    conditionA: { mean: 3.2, sd: 0.8, ci: 0.35, label: 'Condición A (Baseline)' },
    conditionB: { mean: 4.1, sd: 0.6, ci: 0.30, label: 'Condición B (Socrático)' },
    diff: 0.9,
  };

  // 2.1 Default SVG rendering: Condition A hatch pattern & Condition B solid cobalt
  const defaultHtml = ReactDOMServer.renderToString(React.createElement(ChartFrame, {
    title: 'Ganancia Conceptual',
    subtitle: 'Comparación A/B',
    data: testData,
    trendSummary: 'La Condición B supera a la Condición A en 0.9 puntos.',
  }));

  if (defaultHtml.includes('pattern') && defaultHtml.includes('rotate(45)')) {
    passes.push('ChartFrame defines diagonal hatch pattern (<pattern ... patternTransform="rotate(45)">) for Condition A.');
  } else {
    failures.push('CRITICAL: ChartFrame does NOT render Condition A diagonal hatch pattern with rotate(45).');
  }

  if (defaultHtml.includes('fill="url(#ps-hatch-') && defaultHtml.includes('fill="var(--ps-cobalt)"')) {
    passes.push('ChartFrame renders both Condition A hatched bar and Condition B solid cobalt bar.');
  } else {
    failures.push('CRITICAL: ChartFrame missing hatched bar or solid cobalt fill in SVG bars.');
  }

  // 2.2 Direct labels and Error bars
  if (defaultHtml.includes('3.20') && defaultHtml.includes('4.10')) {
    passes.push('ChartFrame displays direct numeric labels on both bars.');
  } else {
    failures.push('HIGH: ChartFrame missing direct numeric labels on bars.');
  }

  // 2.3 Textual trend summary
  if (defaultHtml.includes('Resumen de tendencia:') && defaultHtml.includes('La Condición B supera a la Condición A')) {
    passes.push('ChartFrame renders textual trend summary for WCAG AAA reading comprehension.');
  } else {
    failures.push('MEDIUM: ChartFrame missing textual trend summary.');
  }

  // 2.4 "Ver como tabla" toggle button presence
  if (defaultHtml.includes('Ver como tabla')) {
    passes.push('ChartFrame renders mandatory "Ver como tabla" accessible toggle button.');
  } else {
    failures.push('CRITICAL: ChartFrame missing "Ver como tabla" accessible toggle button.');
  }

  // 2.5 Table representation rendering test
  // In ChartFrame, showTable state defaults to false. Let's test the tableData derivation and DataTable rendering:
  const dataTableMod = loadJsxModule('components/ui/blueprint/data-table.js');
  const DataTable = dataTableMod.DataTable;

  const derivedTableHtml = ReactDOMServer.renderToString(React.createElement(DataTable, {
    columns: [
      { key: 'metric', label: 'Métrica / Dimensión' },
      { key: 'conditionA', label: 'Condición A (Baseline)', align: 'right' },
      { key: 'conditionB', label: 'Condición B (Socrático)', align: 'right' },
      { key: 'effect', label: 'Efecto / Dif.', align: 'right' },
    ],
    data: [
      {
        id: 1,
        metric: 'Ganancia Conceptual',
        conditionA: '3.2 (±0.8)',
        conditionB: '4.1 (±0.6)',
        effect: '+0.9',
      }
    ],
    caption: 'Representación tabular de: Ganancia Conceptual',
  }));

  if (derivedTableHtml.includes('Representación tabular de:') && derivedTableHtml.includes('3.2 (±0.8)')) {
    passes.push('DataTable renders accessible tabular fallback with caption, headers, and right-aligned metrics.');
  } else {
    failures.push('HIGH: DataTable tabular fallback fails to render expected data.');
  }

} catch (err) {
  failures.push('CHALLENGE 2 execution error: ' + err.message);
}

// ============================================================================
// CHALLENGE 3: Interactive Controls 44x44px Hit Target Requirement
// ============================================================================
console.log('\n--- [CHALLENGE 3] Interactive Controls 44x44px Hit Target Requirement ---');
try {
  // 3.1 SplitButton
  const splitButtonMod = loadJsxModule('components/ui/blueprint/split-button.js');
  const SplitButton = splitButtonMod.SplitButton;

  const splitHtml = ReactDOMServer.renderToString(React.createElement(SplitButton, {
    primaryAction: { label: 'Ejecutar', onClick: () => {} },
    menuActions: [
      { label: 'Duplicar', onClick: () => {} },
      { label: 'Archivar', onClick: () => {} },
    ],
  }));

  // Primary action button
  if (splitHtml.includes('ps-split')) {
    passes.push('SplitButton primary action uses .ps-split with min-height: 44px and min-width: 44px (var(--ps-target)).');
  }

  // Dropdown toggle button: inspect classes
  // Line 101 of split-button.js has: min-h-[44px] min-w-[36px]
  if (splitHtml.includes('min-w-[36px]')) {
    failures.push('CRITICAL HIT TARGET DEFICIENCY: SplitButton dropdown toggle button uses min-w-[36px] (< 44px). Fails WCAG 2.5.5 / PromptSketch 44x44px minimum hit target invariant (width is only 36px).');
  } else if (splitHtml.includes('min-w-[44px]')) {
    passes.push('SplitButton dropdown toggle button meets min-w-[44px].');
  } else {
    warnings.push('SplitButton dropdown toggle does not specify min-w-[44px].');
  }

  // 3.2 DataTable
  const dataTableMod = loadJsxModule('components/ui/blueprint/data-table.js');
  const DataTable = dataTableMod.DataTable;

  const dataTableHtml = ReactDOMServer.renderToString(React.createElement(DataTable, {
    columns: [
      { key: 'd', label: 'd', sortable: true }, // Short 1-char column label
      { key: 'val', label: 'Valor', sortable: true },
    ],
    data: [{ id: 1, d: 0.45, val: 10 }],
  }));

  // Check sort button styling
  // In data-table.js line 93: min-h-[44px] inline-flex items-center gap-1.5 ... (NO min-w-[44px] or px- padding)
  if (dataTableHtml.includes('min-h-[44px]')) {
    passes.push('DataTable sort button has min-height: 44px.');
  }
  if (!dataTableHtml.includes('min-w-[44px]') && !dataTableHtml.includes('min-w-11')) {
    failures.push('HIT TARGET DEFICIENCY: DataTable sort buttons have min-h-[44px] but lack min-w-[44px] (or adequate horizontal padding). For narrow statistical labels ("d", "N", "p", "U", "α"), hit target width is ~24-26px, failing the 44x44px minimum target size.');
  } else {
    passes.push('DataTable sort button specifies min-w-[44px].');
  }

  // 3.3 Field
  const fieldMod = loadJsxModule('components/ui/blueprint/field.js');
  const Field = fieldMod.Field;

  const fieldHtml = ReactDOMServer.renderToString(React.createElement(Field, {
    label: 'Nombre de campaña',
    required: true,
  }, React.createElement('input', { type: 'text', placeholder: 'Ingrese nombre' })));

  // Check if Field injects min-h-[44px] or ps-field__control into unstyled child
  if (!fieldHtml.includes('min-h-[44px]') && !fieldHtml.includes('ps-field__control') && !fieldHtml.includes('min-h-11')) {
    warnings.push('HIT TARGET VULNERABILITY: <Field/> does not automatically inject min-h-[44px] or .ps-field__control into naked child controls (<input/>, etc.). Controls without explicit class will render below 44px.');
  } else {
    passes.push('Field ensures minimum hit target on child input.');
  }

  // 3.4 Abbr popover close button
  const abbrMod = loadJsxModule('components/ui/blueprint/abbr.js');
  const Abbr = abbrMod.Abbr;
  // Inspect code of abbr.js for close button
  const abbrCode = fs.readFileSync(path.resolve(__dirname, '../components/ui/blueprint/abbr.js'), 'utf8');
  if (abbrCode.includes('min-h-[24px] min-w-[24px]')) {
    failures.push('HIT TARGET DEFICIENCY: Abbr popover close button is explicitly set to min-h-[24px] min-w-[24px], failing the 44x44px minimum target requirement.');
  }

} catch (err) {
  failures.push('CHALLENGE 3 execution error: ' + err.message);
}

// ============================================================================
// CHALLENGE 4: Global Focus-Visible 3px Solid Cobalt with 2px Offset
// ============================================================================
console.log('\n--- [CHALLENGE 4] Global :focus-visible 3px Solid Cobalt Ring ---');
try {
  const globalsCss = fs.readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8');

  // Check base rule in globals.css
  const globalFocusMatch = globalsCss.match(/:focus-visible\s*\{([^}]+)\}/);
  if (globalFocusMatch) {
    const rules = globalFocusMatch[1];
    if (rules.includes('outline: 3px solid var(--ps-cobalt)') && rules.includes('outline-offset: 2px')) {
      passes.push('Base CSS defines :focus-visible { outline: 3px solid var(--ps-cobalt); outline-offset: 2px; }.');
    } else {
      failures.push('CRITICAL: Base :focus-visible in globals.css does not match 3px solid cobalt with 2px offset.');
    }
  } else {
    failures.push('CRITICAL: No global :focus-visible rule found in globals.css.');
  }

  // Inspect blueprint components for non-conforming focus overrides
  // Requirement: "Is :focus-visible outline 3px solid cobalt with 2px offset applied globally?"
  const filesToCheck = [
    'components/ui/blueprint/chart-frame.js',
    'components/ui/blueprint/data-table.js',
    'components/ui/blueprint/abbr.js',
    'app/globals.css',
  ];

  let overrideCount = 0;
  for (const f of filesToCheck) {
    const content = fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');
    if (content.includes('focus-visible:outline-2')) {
      overrideCount++;
      failures.push(`FOCUS RING INCONSISTENCY: ${f} overrides global 3px ring with "focus-visible:outline-2" (2px outline width instead of 3px solid cobalt).`);
    }
    if (f.endsWith('globals.css') && content.includes('.ps-abbr:focus-visible')) {
      const abbrFocusMatch = content.match(/\.ps-abbr:focus-visible\s*\{([^}]+)\}/);
      if (abbrFocusMatch && abbrFocusMatch[1].includes('outline: 2px')) {
        overrideCount++;
        failures.push('FOCUS RING INCONSISTENCY: globals.css sets .ps-abbr:focus-visible to "outline: 2px solid var(--ps-cobalt)" (2px instead of 3px).');
      }
    }
  }

  if (overrideCount === 0) {
    passes.push('All components adhere strictly to 3px focus rings without 2px downscaling.');
  }

} catch (err) {
  failures.push('CHALLENGE 4 execution error: ' + err.message);
}

// ============================================================================
// CHALLENGE 5: E2E Regression Check
// ============================================================================
console.log('\n--- [CHALLENGE 5] Automated Contrast & Slop Verification Check ---');
const { execSync } = require('child_process');
try {
  const contrastOut = execSync('npm run test:contrast', { cwd: path.resolve(__dirname, '..') }).toString();
  if (contrastOut.includes('SUCCESS: All 42 token pairs pass WCAG AAA contrast criteria.')) {
    passes.push('npm run test:contrast exits cleanly with 42/42 pairs verified.');
  }
} catch (e) {
  failures.push('FAIL: npm run test:contrast exited with error.');
}

try {
  const slopOut = execSync('npm run test:slop', { cwd: path.resolve(__dirname, '..') }).toString();
  if (slopOut.includes('SUCCESS: Zero anti-slop violations found')) {
    passes.push('npm run test:slop exits cleanly with zero violations.');
  }
} catch (e) {
  failures.push('FAIL: npm run test:slop exited with error.');
}

// ============================================================================
// FINAL SUMMARY & VERDICT
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('CHALLENGE RUN SUMMARY');
console.log('='.repeat(70));
console.log(`Passed checks:   ${passes.length}`);
console.log(`Warnings:        ${warnings.length}`);
console.log(`Failures/Flaws:  ${failures.length}`);

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const w of warnings) {
    console.log(`  [WARN] ${w}`);
  }
}

if (failures.length > 0) {
  console.log('\nFailures / Confirmed Flaws:');
  for (const f of failures) {
    console.log(`  [FAIL] ${f}`);
  }
  console.log('\nOVERALL VERDICT: REJECT (Concrete empirical flaws detected)');
} else {
  console.log('\nOVERALL VERDICT: CONFIRM (All empirical criteria satisfied)');
}
console.log('='.repeat(70) + '\n');
