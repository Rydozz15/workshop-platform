#!/usr/bin/env node

/**
 * PromptSketch Anti-AI-Slop Static Audit Script
 * Enforces zero-tolerance invariants across UI code:
 * 1. Zero Unicode emojis.
 * 2. Zero prohibited Tailwind classes (rounded > 2px, blurred shadows, gradients, prohibited colors).
 * 3. Zero hardcoded hex color literals in UI components.
 * 4. Zero font sizes < 12px.
 * 5. Zero prohibited AI-cliché icons (Sparkles, Wand, Wand2, Bot, Brain, BrainCircuit).
 *
 * Exits with code 0 if all audited files pass, code 1 if violations are found.
 */

const fs = require('fs');
const path = require('path');

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
const PROHIBITED_CLASSES_REGEX = /\b(rounded-(sm|md|lg|xl|2xl|3xl|full)|shadow-(sm|md|lg|xl|2xl)|bg-gradient-(to-[trbl]{1,2})?|from-[a-z]+|to-(indigo|violet|purple)|(indigo|violet|purple|fuchsia|slate|gray|zinc|neutral|stone)-[0-9]+)\b/;
const HEX_REGEX = /#[0-9A-Fa-f]{3,8}\b/;
const SMALL_FONT_REGEX = /\btext-\[(8|9|10|11)px\]|\bfont-size:\s*['"]?(8|9|10|11)px\b/;
const PROHIBITED_ICONS_REGEX = /(?:<(?:\w+\.)?(Sparkles|Wand|Wand2|Bot|Brain|BrainCircuit)\b|from\s+['"]lucide-react['"].*\b(Sparkles|Wand|Wand2|Bot|Brain|BrainCircuit)\b|name=['"](Sparkles|Wand|Wand2|Bot|Brain|BrainCircuit)['"])/;

// Phase 1 rules
const HOVER_SHIFT_REGEX = /\bhover:(border-[lrtbxy]?-?\[?[1-9]|p[xytblr]?-[0-9]|m[xytblr]?-[0-9]|-?translate-[xy]|scale-|w-|h-)/;
const PRODUCT_JARGON_REGEX = /\b(LAK|AIED)(27)?\b/;

const args = process.argv.slice(2);
const isStrictAll = !args.includes('--legacy');
const explicitTargets = args.filter((a) => !a.startsWith('--'));

// Root directories
const rootDir = path.resolve(__dirname, '..');
const componentsDir = path.join(rootDir, 'components');
const appDir = path.join(rootDir, 'app');

/**
 * Determine if a file in app/ has been migrated to PromptSketch or is legacy pre-M4.
 */
function isMigratedPromptSketchFile(filePath, content) {
  // Only the root app/layout.js is part of M1 foundation; admin/layout.js is M4
  if (filePath.endsWith('/app/layout.js') || filePath.endsWith('/app/globals.css')) return true;
  // If it imports blueprint primitives or cad-icon, it is migrated
  if (/from\s+['"].*blueprint['"]/.test(content)) return true;
  if (/from\s+['"].*cad-icon['"]/.test(content)) return true;
  if (content.includes('BlueprintPanel') || content.includes('SplitButton') || content.includes('CadIcon')) return true;
  return false;
}

function collectFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(collectFiles(fullPath));
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      results.push(fullPath);
    }
  }
  return results;
}

let filesToScan = [];

if (explicitTargets.length > 0) {
  for (const t of explicitTargets) {
    const targetPath = path.resolve(rootDir, t);
    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        filesToScan = filesToScan.concat(collectFiles(targetPath));
      } else {
        filesToScan.push(targetPath);
      }
    }
  }
} else {
  // Default scan set: all components and app files
  const componentFiles = collectFiles(componentsDir);
  const appFiles = collectFiles(appDir);
  filesToScan = [...componentFiles, ...appFiles];
}

console.log('='.repeat(70));
console.log('PromptSketch Anti-AI-Slop Static Linter');
console.log(`Auditing target files for design system compliance...`);
console.log('='.repeat(70));

let totalViolations = 0;
let scannedCount = 0;
let pendingM4Count = 0;

for (const filePath of filesToScan) {
  const relPath = path.relative(rootDir, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if unmigrated legacy view (only when not in strict full-app mode)
  if (!isStrictAll && filePath.includes('/app/') && !isMigratedPromptSketchFile(filePath, content)) {
    pendingM4Count++;
    console.log(`  [PENDING M4] ${relPath} (scheduled for M4 view migration)`);
    continue;
  }

  scannedCount++;
  const lines = content.split('\n');
  const fileViolations = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    // 1. Emoji check
    if (EMOJI_REGEX.test(line)) {
      const match = line.match(EMOJI_REGEX);
      fileViolations.push(`Line ${lineNum}: Unicode emoji detected [${match[0]}]`);
    }

    // 2. Prohibited Tailwind classes
    if (PROHIBITED_CLASSES_REGEX.test(line)) {
      const match = line.match(PROHIBITED_CLASSES_REGEX);
      fileViolations.push(`Line ${lineNum}: Prohibited SaaS Tailwind class "${match[0]}"`);
    }

    // 3. Hardcoded Hex Colors (ignore cad-icon prohibition list definitions)
    if (!filePath.endsWith('cad-icon.js') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
      if (HEX_REGEX.test(line)) {
        // Exclude SVG pattern or standard XML comments if any
        const match = line.match(HEX_REGEX);
        fileViolations.push(`Line ${lineNum}: Hardcoded hex color "${match[0]}" in UI component (use design tokens)`);
      }
    }

    // 4. Small font size (< 12px)
    if (SMALL_FONT_REGEX.test(line)) {
      const match = line.match(SMALL_FONT_REGEX);
      fileViolations.push(`Line ${lineNum}: Font size < 12px detected "${match[0]}"`);
    }

    // 6. Hover must not move layout (change color only)
    if (HOVER_SHIFT_REGEX.test(line)) {
      const match = line.match(HOVER_SHIFT_REGEX);
      fileViolations.push(`Line ${lineNum}: hover effect changes layout "${match[0]}" (change color only)`);
    }

    // 7. Product must stay general-purpose: no conference-specific naming in UI code
    if (PRODUCT_JARGON_REGEX.test(line)) {
      const match = line.match(PRODUCT_JARGON_REGEX);
      fileViolations.push(`Line ${lineNum}: conference-specific term "${match[0]}" (the product is general-purpose)`);
    }

    // 5. Prohibited AI cliché icons
    if (!filePath.endsWith('cad-icon.js')) {
      if (PROHIBITED_ICONS_REGEX.test(line)) {
        const match = line.match(PROHIBITED_ICONS_REGEX);
        fileViolations.push(`Line ${lineNum}: Prohibited AI-cliché icon "${match[1] || match[2] || match[3]}"`);
      }
    }
  }

  if (fileViolations.length > 0) {
    totalViolations += fileViolations.length;
    console.error(`\n  [FAIL] ${relPath} (${fileViolations.length} violation${fileViolations.length > 1 ? 's' : ''}):`);
    for (const v of fileViolations) {
      console.error(`    - ${v}`);
    }
  } else {
    console.log(`  [PASS] ${relPath}`);
  }
}

console.log('='.repeat(70));
console.log(`Audit Summary: ${scannedCount} files verified, ${pendingM4Count} legacy views pending M4.`);

if (totalViolations > 0) {
  console.error(`FAILED: ${totalViolations} anti-slop violation(s) detected.`);
  process.exit(1);
} else {
  console.log(`SUCCESS: Zero anti-slop violations found across audited PromptSketch files.`);
  process.exit(0);
}
