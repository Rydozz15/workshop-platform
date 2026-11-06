#!/usr/bin/env node

/**
 * PromptSketch WCAG 2.2 Relative Luminance & Contrast Ratio Verifier
 * Verifies all 31+ design token pairs meet WCAG 2.2 AAA (>= 7:1 text, >= 3:1 controls/graphics).
 * Exits with code 0 on success, code 1 on failure.
 */

const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const L = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};

const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// Design system tokens (PromptSketch Design System v2 with mandatory overrides)
const T = {
  canvas: '#EFE6D2',
  kraft: '#D8C39B',
  paper: '#FFFDF7',
  subtle: '#F6F0E1',
  muted: '#E4D9C0',
  ink: '#1F1D1A',
  ink2: '#46413A', // Token override for guaranteed >= 7:1 across soft tints
  inkDeco: '#6B6558',
  cobalt: '#1A3FA8',
  cobaltHover: '#142F80',
  cobaltTint: '#DDE5F5',
  graphite: '#5B574F',
  graphiteTint: '#EAE4D6',
  verm: '#E04E26',
  vermBlock: '#9E3217',
  vermInk: '#86280F',
  vermTint: '#F7E3D8',
  crimson: '#B72A2E',
  emerald: '#0F4F33',
  emTint: '#E4EFE3',
  lineCtl: '#7F7869',
  lineStrong: '#46413A',
  rule: '#8F8670',
  focus: '#1A3FA8',
  white: '#FFFFFF',
  cond: ['#5B574F', '#1A3FA8', '#0F4F33', '#86280F', '#6B4F00', '#0B5563'],
};

// [Foreground, Background, Required Minimum, Label]
const pairs = [
  // --- Text Contrast: WCAG 2.2 AAA >= 7.0:1 ---
  [T.ink, T.canvas, 7.0, 'ink on canvas'],
  [T.ink, T.paper, 7.0, 'ink on paper'],
  [T.ink, T.kraft, 7.0, 'ink on kraft'],
  [T.ink, T.subtle, 7.0, 'ink on paper-subtle'],
  [T.ink, T.cobaltTint, 7.0, 'ink on cobalt-tint'],
  [T.ink, T.vermTint, 7.0, 'ink on vermilion-tint'],
  [T.ink, T.emTint, 7.0, 'ink on emerald-tint'],
  [T.ink, T.graphiteTint, 7.0, 'ink on graphite-tint'],

  // Secondary text (ink-2 override #46413A)
  [T.ink2, T.paper, 7.0, 'ink-2 on paper'],
  [T.ink2, T.subtle, 7.0, 'ink-2 on paper-subtle'],
  [T.ink2, T.canvas, 7.0, 'ink-2 on canvas'],
  [T.ink2, T.cobaltTint, 7.0, 'ink-2 on cobalt-tint'],
  [T.ink2, T.vermTint, 7.0, 'ink-2 on vermilion-tint'],
  [T.ink2, T.emTint, 7.0, 'ink-2 on emerald-tint'],
  [T.ink2, T.graphiteTint, 7.0, 'ink-2 on graphite-tint'],

  // Cobalt accent text
  [T.cobalt, T.canvas, 7.0, 'cobalt on canvas'],
  [T.cobalt, T.paper, 7.0, 'cobalt on paper'],
  [T.cobalt, T.cobaltTint, 7.0, 'cobalt on cobalt-tint'],
  [T.cobalt, T.subtle, 7.0, 'cobalt on paper-subtle'],

  // Inverted text on dark blocks
  [T.paper, T.cobalt, 7.0, 'paper on cobalt'],
  [T.paper, T.cobaltHover, 7.0, 'paper on cobalt-hover'],
  [T.paper, T.vermBlock, 7.0, 'paper on vermilion-block'],

  // Vermilion text
  [T.vermInk, T.canvas, 7.0, 'vermilion-ink on canvas'],
  [T.vermInk, T.paper, 7.0, 'vermilion-ink on paper'],
  [T.vermInk, T.vermTint, 7.0, 'vermilion-ink on vermilion-tint'],
  [T.vermInk, T.subtle, 7.0, 'vermilion-ink on paper-subtle'],

  // Emerald text
  [T.emerald, T.canvas, 7.0, 'emerald on canvas'],
  [T.emerald, T.paper, 7.0, 'emerald on paper'],
  [T.emerald, T.emTint, 7.0, 'emerald on emerald-tint'],
  [T.emerald, T.subtle, 7.0, 'emerald on paper-subtle'],

  // Graphite text on paper
  [T.graphite, T.paper, 7.0, 'graphite on paper'],

  // Panel headers & title blocks sit on paper-muted (Phase 1)
  [T.ink, T.muted, 7.0, 'ink on paper-muted (panel header)'],
  [T.ink2, T.muted, 7.0, 'ink-2 on paper-muted (title block)'],
  [T.paper, T.emerald, 7.0, 'paper on emerald (completed step)'],
  [T.ink, T.cobaltTint, 7.0, 'ink on cobalt-tint (table row hover)'],
  ...T.cond.map((c, i) => [c, T.paper, 7.0, `condition ${i + 1} on paper (use only on paper surfaces)`]),

  // --- Non-Text / Control Contrast: WCAG 2.2 >= 3.0:1 ---
  [T.lineCtl, T.canvas, 3.0, 'line-control on canvas'],
  [T.lineCtl, T.paper, 3.0, 'line-control on paper'],
  [T.lineCtl, T.subtle, 3.0, 'line-control on paper-subtle'],
  [T.lineStrong, T.paper, 3.0, 'line-strong on paper'],
  [T.lineStrong, T.canvas, 3.0, 'line-strong on canvas'],
  [T.cobalt, T.paper, 3.0, 'cobalt graphic on paper'],
  [T.white, T.verm, 3.0, 'white icon on vermilion box'],
  [T.white, T.crimson, 3.0, 'white icon on crimson box'],
  [T.vermInk, T.subtle, 3.0, 'vermilion-ink icon on paper-subtle box'],
  [T.focus, T.paper, 3.0, 'focus ring on paper'],
  [T.focus, T.canvas, 3.0, 'focus ring on canvas'],
];

console.log('='.repeat(70));
console.log('PromptSketch WCAG 2.2 AAA Contrast Verification Suite');
console.log(`Checking ${pairs.length} token pairs...`);
console.log('='.repeat(70));

let failed = 0;
for (const [fg, bg, min, label] of pairs) {
  const r = ratio(fg, bg);
  const passed = r >= min;
  const status = passed ? 'PASS' : 'FAIL';
  const formattedRatio = `${r.toFixed(2)}:1`;

  if (!passed) {
    failed++;
    console.error(`  [${status}] ${label.padEnd(40)} ${fg} on ${bg} -> ${formattedRatio} (min ${min}:1)`);
  } else {
    console.log(`  [${status}] ${label.padEnd(40)} ${fg} on ${bg} -> ${formattedRatio} >= ${min}:1`);
  }
}

console.log('='.repeat(70));
if (failed > 0) {
  console.error(`FAILED: ${failed} contrast check(s) did not meet WCAG criteria.`);
  process.exit(1);
} else {
  console.log(`SUCCESS: All ${pairs.length} token pairs pass WCAG AAA contrast criteria.`);
  process.exit(0);
}
