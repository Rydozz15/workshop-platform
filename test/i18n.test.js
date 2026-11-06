/**
 * Every Spanish UI string passed to tr()/t() must have non-empty English and Portuguese translations
 * with the same {placeholders}. Run with: node test/i18n.test.js
 */
import assert from 'node:assert/strict';
import { MESSAGES, translateText } from '../lib/i18n/messages.js';
import { scanTranslatableStrings } from '../lib/i18n/scan.js';
import { DYNAMIC_KEYS } from '../lib/i18n/dynamic-keys.js';

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const keys = new Set([...scanTranslatableStrings().keys(), ...DYNAMIC_KEYS]);

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
};

check(`all ${keys.size} UI strings have en and pt-BR translations`, () => {
  const missing = [];
  for (const k of keys) for (const loc of ['en', 'pt-BR']) if (!MESSAGES[loc][k]?.trim()) missing.push(`${loc}: ${k}`);
  assert.deepEqual(missing, [], `Missing translations:\n${missing.join('\n')}`);
});

check('translations keep the same {placeholders} as the Spanish source', () => {
  const bad = [];
  for (const loc of ['en', 'pt-BR']) for (const [k, v] of Object.entries(MESSAGES[loc])) if (placeholders(k) !== placeholders(v)) bad.push(`${loc}: ${k}`);
  assert.deepEqual(bad, []);
});

check('no stale entries: every dictionary key is still used', () => {
  const stale = Object.keys(MESSAGES.en).filter((k) => !keys.has(k));
  assert.deepEqual(stale, [], `Unused keys:\n${stale.join('\n')}`);
});

check('translateText interpolates and falls back to Spanish', () => {
  assert.equal(translateText('es', 'Paso {n} de {total}', { n: 2, total: 5 }), 'Paso 2 de 5');
  assert.equal(translateText('en', 'Paso {n} de {total}', { n: 2, total: 5 }), 'Step 2 of 5');
  assert.equal(translateText('pt-BR', 'Guardar campaña'), 'Salvar campanha');
  assert.equal(translateText('en', 'Texto sin traducir'), 'Texto sin traducir');
});

console.log(`\ni18n: ${passed} tests passed`);
