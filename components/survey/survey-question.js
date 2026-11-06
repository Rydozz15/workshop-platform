'use client';

import React from 'react';
import { normalizeQuestion, validateAnswer, OTHER_VALUE, otherKey } from '@/lib/survey-schema';

const OPTION_BASE = 'min-h-[44px] px-3 py-2 border flex items-center gap-2.5 cursor-pointer font-body text-sm';
const TEXT_INPUT = 'w-full p-3 bg-paper border border-line-control font-body text-base text-ink';

/**
 * One survey question as the participant sees it. Controlled by the parent: `answers` is the whole
 * answers object (question id -> value) and `setAnswers` replaces it.
 */
export default function SurveyQuestion({ question, answers, setAnswers, tr }) {
  const q = normalizeQuestion(question);
  const value = answers[q.id];
  const other = answers[otherKey(q.id)] ?? '';
  const set = (patch) => setAnswers({ ...answers, ...patch });
  const error = validateAnswer(q, answers, { tr, enforceRequired: false });
  const hintId = `${q.id}-hint`;

  const endLabels = (q.minLabel || q.maxLabel) && q.type !== 'likert' && q.type !== 'dropdown' && (
    <div className="flex items-center justify-between gap-3 font-body text-sm text-ink-2">
      <span>{q.minLabel}</span>
      <span className="text-right">{q.maxLabel}</span>
    </div>
  );

  const otherInput = (disabled) => (
    <input
      type="text"
      aria-label={tr('Otro')}
      placeholder={tr('Escribe tu respuesta')}
      value={other}
      disabled={disabled}
      onChange={(e) => set({ [otherKey(q.id)]: e.target.value })}
      className="flex-1 min-w-0 px-2 py-1 bg-paper border border-line-control font-body text-sm text-ink disabled:opacity-50"
    />
  );

  let body = null;
  let hint = null;

  if (q.type === 'likert') {
    const first = q.scale[0];
    const last = q.scale[q.scale.length - 1];
    body = (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 font-body text-sm text-ink-2">
          <span>{q.minLabel || `${first} · ${tr('Nada de acuerdo')}`}</span>
          <span className="text-right">{q.maxLabel || `${last} · ${tr('Totalmente de acuerdo')}`}</span>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${q.scale.length}, minmax(0, 1fr))` }}>
          {q.scale.map((num) => {
            const strVal = String(num);
            const isSelected = String(value ?? '') === strVal;
            return (
              <label
                key={strVal}
                className={`min-h-[52px] border-2 flex items-center justify-center cursor-pointer font-stat text-base font-semibold ${
                  isSelected ? 'bg-cobalt text-paper border-cobalt' : 'bg-paper text-ink border-line-control hover:bg-cobalt-tint'
                }`}
              >
                <input
                  type="radio"
                  name={`survey_${q.id}`}
                  value={strVal}
                  checked={isSelected}
                  onChange={(e) => set({ [q.id]: e.target.value })}
                  className="sr-only"
                />
                <span>{num}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (q.type === 'multiple') {
    body = (
      <div className="space-y-2">
        {endLabels}
        {q.options.map((opt) => {
          const isSelected = value === opt;
          return (
            <label key={opt} className={`${OPTION_BASE} ${isSelected ? 'bg-cobalt-tint border-cobalt text-cobalt font-medium' : 'bg-paper border-line-control text-ink'}`}>
              <input type="radio" name={`survey_${q.id}`} value={opt} checked={isSelected} onChange={() => set({ [q.id]: opt })} className="w-4 h-4 accent-cobalt" />
              <span>{opt}</span>
            </label>
          );
        })}
        {q.allowOther && (
          <label className={`${OPTION_BASE} ${value === OTHER_VALUE ? 'bg-cobalt-tint border-cobalt' : 'bg-paper border-line-control'}`}>
            <input type="radio" name={`survey_${q.id}`} checked={value === OTHER_VALUE} onChange={() => set({ [q.id]: OTHER_VALUE })} className="w-4 h-4 accent-cobalt" />
            <span>{tr('Otro')}</span>
            {otherInput(value !== OTHER_VALUE)}
          </label>
        )}
      </div>
    );
  }

  if (q.type === 'dropdown') {
    body = (
      <div className="space-y-2">
        <select
          aria-label={q.text}
          value={value ?? ''}
          onChange={(e) => set({ [q.id]: e.target.value })}
          className={TEXT_INPUT}
        >
          <option value="">{tr('Elige una opción')}</option>
          {q.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
          {q.allowOther && <option value={OTHER_VALUE}>{tr('Otro')}</option>}
        </select>
        {q.allowOther && value === OTHER_VALUE && otherInput(false)}
      </div>
    );
  }

  if (q.type === 'checklist') {
    const picked = Array.isArray(value) ? value : [];
    const atMax = q.maxSelections ? picked.length >= q.maxSelections : false;
    const toggle = (opt, on) => set({ [q.id]: on ? [...picked, opt] : picked.filter((v) => v !== opt) });
    const row = (opt, label, extra) => {
      const isChecked = picked.includes(opt);
      return (
        <label key={opt} className={`${OPTION_BASE} ${isChecked ? 'bg-cobalt-tint border-cobalt text-ink font-medium' : 'bg-paper border-line-control text-ink'}`}>
          <input
            type="checkbox"
            checked={isChecked}
            disabled={!isChecked && atMax}
            onChange={(e) => toggle(opt, e.target.checked)}
            className="w-4 h-4 accent-cobalt shrink-0"
          />
          <span>{label}</span>
          {extra}
        </label>
      );
    };
    body = (
      <div className="space-y-2">
        {endLabels}
        {q.options.map((opt) => row(opt, opt))}
        {q.allowOther && row(OTHER_VALUE, tr('Otro'), otherInput(!picked.includes(OTHER_VALUE)))}
      </div>
    );
    if (q.minSelections && q.maxSelections) hint = tr('Elige entre {min} y {max} opciones.', { min: q.minSelections, max: q.maxSelections });
    else if (q.minSelections) hint = tr('Elige al menos {n} opciones.', { n: q.minSelections });
    else if (q.maxSelections) hint = tr('Elige como máximo {n} opciones.', { n: q.maxSelections });
  }

  if (q.type === 'text') {
    const text = typeof value === 'string' ? value : '';
    body = (
      <div className="space-y-1">
        <textarea
          rows={3}
          aria-label={q.text}
          aria-describedby={hintId}
          value={text}
          maxLength={q.maxChars || undefined}
          onChange={(e) => set({ [q.id]: e.target.value })}
          placeholder={tr('Escribe aquí tu respuesta')}
          className={TEXT_INPUT}
        />
        {q.maxChars ? <p className="font-stat text-xs text-ink-2 m-0 text-right">{text.length} / {q.maxChars}</p> : null}
      </div>
    );
    if (q.minChars) hint = tr('Escribe al menos {n} caracteres.', { n: q.minChars });
  }

  return (
    <fieldset className="p-4 bg-paper-subtle border border-line-control m-0 space-y-3 min-w-0">
      <legend className="w-full max-w-full float-left font-body text-base font-semibold text-ink leading-snug break-words mb-2">
        {q.text}
        {q.required ? (
          <span className="text-vermilion-ink ml-1" aria-hidden="true">*</span>
        ) : (
          <span className="ml-2 font-normal text-ink-2 text-sm">{tr('(opcional)')}</span>
        )}
        {q.required && <span className="sr-only">{' '}{tr('(obligatoria)')}</span>}
      </legend>
      <div className="clear-both" />
      {body}
      <p id={hintId} className="font-body text-sm text-ink-2 m-0" hidden={!hint || Boolean(error)}>{hint}</p>
      {error && <p role="alert" className="font-body text-sm text-vermilion-ink m-0">{error}</p>}
    </fieldset>
  );
}
