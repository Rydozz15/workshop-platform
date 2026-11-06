/**
 * Finds every literal Spanish UI string passed to tr('...') / t('key', '...') under app/ and components/.
 * Used by test/i18n.test.js to prove each one has an English and Portuguese translation.
 */
import fs from 'node:fs';
import path from 'node:path';

const unescape = (s) => s.replace(/\\'/g, "'").replace(/\\n/g, '\n').replace(/\\\\/g, '\\');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.js$/.test(entry.name)) out.push(full);
  }
  return out;
}

export function scanTranslatableStrings(root = process.cwd()) {
  const found = new Map(); // text -> first file
  const patterns = [
    /\btr\(\s*'((?:[^'\\]|\\.)*)'/g,
    /\bt\(\s*'[^']*'\s*,\s*'((?:[^'\\]|\\.)*)'/g,
  ];
  for (const dir of ['app', 'components']) {
    const base = path.join(root, dir);
    if (!fs.existsSync(base)) continue;
    for (const file of walk(base)) {
      const src = fs.readFileSync(file, 'utf8');
      for (const re of patterns) {
        for (const m of src.matchAll(re)) {
          const text = unescape(m[1]);
          if (!found.has(text)) found.set(text, path.relative(root, file));
        }
      }
    }
  }
  return found;
}
