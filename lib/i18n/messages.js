/**
 * UI text translations, keyed by the Spanish source text.
 *   tr('Guardar campaña')            -> 'Save campaign' when the locale is en
 *   tr('Parte {n} de {total}', {n})  -> placeholders in {braces} are replaced
 * Spanish is the source language, so 'es' needs no entries. test/i18n.test.js checks that every
 * literal passed to tr()/t() in the app has an entry for en and pt-BR.
 */
import { MESSAGES_PART_1 } from './messages-1.js';
import { MESSAGES_PART_2 } from './messages-2.js';
import { MESSAGES_PART_3 } from './messages-3.js';
import { MESSAGES_PART_4 } from './messages-4.js';
import { MESSAGES_PART_5 } from './messages-5.js';
import { MESSAGES_PART_6 } from './messages-6.js';
import { MESSAGES_PART_7 } from './messages-7.js';
import { MESSAGES_PART_8 } from './messages-8.js';
import { MESSAGES_PART_9 } from './messages-9.js';
import { MESSAGES_PART_10 } from './messages-10.js';

const merge = (...parts) => ({
  en: Object.assign({}, ...parts.map((p) => p.en)),
  'pt-BR': Object.assign({}, ...parts.map((p) => p['pt-BR'])),
});

export const MESSAGES = merge(MESSAGES_PART_1, MESSAGES_PART_2, MESSAGES_PART_3, MESSAGES_PART_4, MESSAGES_PART_5, MESSAGES_PART_6, MESSAGES_PART_7, MESSAGES_PART_8, MESSAGES_PART_9, MESSAGES_PART_10);

export function translateText(locale, text, vars) {
  const base = locale === 'es' ? text : MESSAGES[locale]?.[text] ?? text;
  if (!vars) return base;
  return base.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
