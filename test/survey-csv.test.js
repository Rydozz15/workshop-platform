/**
 * Unit tests: CSV import of survey questions.
 * Run with: node test/survey-csv.test.js
 */
import assert from 'node:assert/strict';
import { CSV_TEMPLATE, parseCsvRows, parseQuestionsCsv } from '../lib/survey-csv.js';

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
};

check('parses quotes, doubled quotes, CRLF and a BOM', () => {
  const rows = parseCsvRows('﻿a,b\r\n"x, y","say ""hi"""\r\n');
  assert.deepEqual(rows, [['a', 'b'], ['x, y', 'say "hi"']]);
});

check('detects the semicolon delimiter used by Spanish spreadsheets', () => {
  assert.deepEqual(parseCsvRows('a;b\n1;2'), [['a', 'b'], ['1', '2']]);
});

check('the downloadable template parses with no errors and covers every type', () => {
  const { questions, errors } = parseQuestionsCsv(CSV_TEMPLATE);
  assert.deepEqual(errors, []);
  assert.deepEqual(questions.map((q) => q.type), ['likert', 'multiple', 'checklist', 'dropdown', 'text']);
  const checklist = questions.find((q) => q.type === 'checklist');
  assert.equal(checklist.minSelections, 1);
  assert.equal(checklist.maxSelections, 3);
  assert.equal(checklist.allowOther, true);
  assert.equal(checklist.required, false);
  assert.equal(checklist.optionsText, 'Estudiar\nEscribir\nProgramar\nTraducir');
  const text = questions.find((q) => q.type === 'text');
  assert.equal(text.minChars, 10);
  assert.equal(text.maxChars, 500);
  const likert = questions[0];
  assert.equal(likert.minLabel, 'Nada de acuerdo');
});

check('header names ignore case and accents; type aliases work', () => {
  const { questions, errors } = parseQuestionsCsv('Tipo,Pregunta,Obligatoria\nescala,"¿Útil?",SÍ\nabierta,"¿Por qué?",no');
  assert.deepEqual(errors, []);
  assert.deepEqual(questions.map((q) => [q.type, q.required]), [['likert', true], ['text', false]]);
});

check('reports problems per row and keeps the valid rows', () => {
  const csv = [
    'tipo,pregunta,opciones,min,max',
    'alternativas,"Solo una",uno,,',
    'raro,"Tipo malo",,,',
    'abierta,,,,',
    'seleccion_multiple,"Mal rango","a|b",3,1',
    'abierta,"Bien",,,',
  ].join('\n');
  const { questions, errors } = parseQuestionsCsv(csv);
  assert.equal(questions.length, 1);
  assert.deepEqual(errors.map((e) => e.row), [2, 3, 4, 5]);
});

check('rejects empty files and files without the required columns', () => {
  assert.equal(parseQuestionsCsv('').errors.length, 1);
  assert.equal(parseQuestionsCsv('a,b\n1,2').errors[0].row, 1);
  assert.equal(parseQuestionsCsv('tipo,pregunta\n').errors.length, 1);
});

console.log(`\nsurvey-csv: ${passed} tests passed`);
