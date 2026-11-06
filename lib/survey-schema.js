/**
 * Survey question model shared by the campaign editor, the participant page and the survey API.
 * Pure functions, no I/O.
 *
 * Question types (the canonical names; `checkbox` and `open` are accepted as old aliases):
 *   likert     scale of numbers (default 1-5) with optional end labels (minLabel / maxLabel)
 *   multiple   one answer out of `options` (radio buttons), optional "Otro"
 *   dropdown   one answer out of `options` (select), optional "Otro"
 *   checklist  several answers out of `options` (checkboxes), optional "Otro", min/max selections
 *   text       free text, optional min/max characters
 *
 * Answers are stored under the question id: a string (likert, multiple, dropdown, text) or an
 * array of strings (checklist). When the participant picks "Otro", the stored value is OTHER_VALUE
 * and what they typed goes in a separate string under otherKey(id), so exports stay flat.
 */

export const QUESTION_TYPES = ['likert', 'multiple', 'dropdown', 'checklist', 'text'];
export const CHOICE_TYPES = ['multiple', 'dropdown', 'checklist'];
export const OTHER_VALUE = '__other__';
export const DEFAULT_SCALE = [1, 2, 3, 4, 5];

const TYPE_ALIASES = { checkbox: 'checklist', open: 'text' };

export const otherKey = (id) => `${id}__other`;

export function canonicalType(type) {
  const t = String(type || 'likert').toLowerCase();
  const resolved = TYPE_ALIASES[t] || t;
  return QUESTION_TYPES.includes(resolved) ? resolved : 'likert';
}

const toCount = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

export const parseOptions = (value) =>
  (Array.isArray(value) ? value : String(value || '').split('\n'))
    .map((o) => String(o).trim())
    .filter(Boolean);

/** Fills defaults and drops fields that do not apply to the question's type. Keeps `id` and `text`. */
export function normalizeQuestion(q = {}) {
  const type = canonicalType(q.type);
  const out = {
    id: q.id,
    text: q.text || '',
    type,
    required: q.required !== false,
  };
  if (type === 'likert') {
    out.scale = Array.isArray(q.scale) && q.scale.length ? q.scale.map(Number) : DEFAULT_SCALE;
    if (q.minLabel) out.minLabel = String(q.minLabel);
    if (q.maxLabel) out.maxLabel = String(q.maxLabel);
    if (q.reverse) out.reverse = true;
  }
  if (CHOICE_TYPES.includes(type)) {
    out.options = parseOptions(q.options);
    out.allowOther = Boolean(q.allowOther);
    if (type !== 'dropdown') {
      if (q.minLabel) out.minLabel = String(q.minLabel);
      if (q.maxLabel) out.maxLabel = String(q.maxLabel);
    }
  }
  if (type === 'checklist') {
    const min = toCount(q.minSelections);
    const max = toCount(q.maxSelections);
    if (min !== null) out.minSelections = min;
    if (max !== null) out.maxSelections = max;
  }
  if (type === 'text') {
    const min = toCount(q.minChars);
    const max = toCount(q.maxChars);
    if (min !== null) out.minChars = min;
    if (max !== null) out.maxChars = max;
  }
  return out;
}

const isEmpty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

/**
 * Checks one answer against its question. Returns an error message (through tr) or null.
 * `tr` is the translation function of the caller; pass nothing to get the Spanish text.
 */
export function validateAnswer(rawQuestion, answers, { tr = (s, vars) => fill(s, vars), enforceRequired = true } = {}) {
  const q = normalizeQuestion(rawQuestion);
  const value = answers?.[q.id];
  const other = String(answers?.[otherKey(q.id)] ?? '').trim();

  if (isEmpty(value)) return enforceRequired && q.required ? tr('Responde esta pregunta.') : null;

  if (q.type === 'likert') {
    return q.scale.map(String).includes(String(value)) ? null : tr('Elige un valor de la escala.');
  }

  if (q.type === 'text') {
    const len = String(value).trim().length;
    if (q.minChars && len < q.minChars) return tr('Escribe al menos {n} caracteres.', { n: q.minChars });
    if (q.maxChars && len > q.maxChars) return tr('Escribe como máximo {n} caracteres.', { n: q.maxChars });
    return null;
  }

  const picked = q.type === 'checklist' ? (Array.isArray(value) ? value : [value]) : [value];
  if (q.type !== 'checklist' && Array.isArray(value)) return tr('Elige solo una opción.');
  const allowed = new Set(q.options);
  for (const v of picked) {
    if (v === OTHER_VALUE) {
      if (!q.allowOther) return tr('Elige una de las opciones.');
      if (!other) return tr('Escribe tu respuesta en “Otro”.');
    } else if (!allowed.has(String(v))) {
      return tr('Elige una de las opciones.');
    }
  }
  if (q.type === 'checklist') {
    if (q.minSelections && picked.length < q.minSelections) return tr('Elige al menos {n} opciones.', { n: q.minSelections });
    if (q.maxSelections && picked.length > q.maxSelections) return tr('Elige como máximo {n} opciones.', { n: q.maxSelections });
  }
  return null;
}

/** Validates every question of a survey. Returns { ok, errors: { [questionId]: message } }. */
export function validateAnswers(config, answers, options = {}) {
  const errors = {};
  for (const q of Array.isArray(config) ? config : []) {
    if (!q || !q.id) continue;
    const message = validateAnswer(q, answers || {}, options);
    if (message) errors[q.id] = message;
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

/** Text to show for a stored answer: replaces the __other__ marker with what the participant typed. */
export function displayAnswer(value, otherText, otherLabel = 'Otro') {
  const fmt = (v) => (v === OTHER_VALUE ? `${otherLabel}: ${otherText || '—'}` : String(v));
  return Array.isArray(value) ? value.map(fmt) : fmt(value);
}

function fill(text, vars) {
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text;
}
