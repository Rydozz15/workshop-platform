'use client';

import React from 'react';
import { Field } from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { CHOICE_TYPES } from '@/lib/survey-schema';

const INPUT = 'w-full font-body text-sm text-ink bg-paper border border-line-control px-3 py-2';
const BTN = 'min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2';

/**
 * Editor for one survey question. Controlled: `q` is the editor state of the question
 * (options are kept as a multi-line string in `optionsText` while editing) and `onChange(patch)`
 * merges changes into it.
 */
export default function QuestionEditor({ q, index, onChange, onRemove, tr }) {
  const isChoice = CHOICE_TYPES.includes(q.type);
  const numberInput = (field) => (
    <input
      type="number"
      min="0"
      inputMode="numeric"
      className={INPUT}
      value={q[field] ?? ''}
      onChange={(e) => onChange({ [field]: e.target.value })}
    />
  );

  return (
    <div className="border border-line-control p-3 space-y-2">
      <Field label={tr('Pregunta {n}', { n: index + 1 })} showOptional={false}>
        <input className={INPUT} value={q.text} onChange={(e) => onChange({ text: e.target.value })} />
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 font-body text-sm">
          {tr('Tipo')}
          <select className={INPUT + ' w-auto'} value={q.type} onChange={(e) => onChange({ type: e.target.value })}>
            <option value="likert">{tr('Escala de 1 a 5')}</option>
            <option value="multiple">{tr('Alternativas (una respuesta)')}</option>
            <option value="checklist">{tr('Selección múltiple')}</option>
            <option value="dropdown">{tr('Desplegable')}</option>
            <option value="text">{tr('Respuesta abierta')}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 font-body text-sm min-h-[44px]">
          <input type="checkbox" className="w-5 h-5" checked={q.required} onChange={(e) => onChange({ required: e.target.checked })} />
          {tr('Obligatoria')}
        </label>
        <button type="button" onClick={onRemove} className={BTN + ' text-vermilion-ink ml-auto'}>
          <CadIcon name="Trash2" size={16} />{' '}{tr('Quitar')}
        </button>
      </div>

      {isChoice && (
        <Field label={tr('Alternativas')} help={tr('Una por línea. Puedes pegar la lista completa.')} showOptional={false}>
          <textarea className={INPUT} rows={4} value={q.optionsText ?? ''} onChange={(e) => onChange({ optionsText: e.target.value })} />
        </Field>
      )}

      {isChoice && (
        <label className="flex items-center gap-2 font-body text-sm min-h-[44px]">
          <input type="checkbox" className="w-5 h-5" checked={Boolean(q.allowOther)} onChange={(e) => onChange({ allowOther: e.target.checked })} />
          {tr('Permitir la opción “Otro” con texto libre')}
        </label>
      )}

      {q.type === 'checklist' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label={tr('Mínimo de selecciones')} help={tr('Vacío = sin mínimo.')} showOptional={false}>{numberInput('minSelections')}</Field>
          <Field label={tr('Máximo de selecciones')} help={tr('Vacío = sin límite.')} showOptional={false}>{numberInput('maxSelections')}</Field>
        </div>
      )}

      {q.type === 'text' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label={tr('Mínimo de caracteres')} help={tr('Vacío = sin mínimo.')} showOptional={false}>{numberInput('minChars')}</Field>
          <Field label={tr('Máximo de caracteres')} help={tr('Vacío = sin límite.')} showOptional={false}>{numberInput('maxChars')}</Field>
        </div>
      )}

      {(q.type === 'likert' || q.type === 'multiple' || q.type === 'checklist') && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label={tr('Texto del extremo bajo')} help={tr('Opcional. Orienta la respuesta, por ejemplo “Nada de acuerdo”.')} showOptional={false}>
            <input className={INPUT} value={q.minLabel ?? ''} onChange={(e) => onChange({ minLabel: e.target.value })} />
          </Field>
          <Field label={tr('Texto del extremo alto')} help={tr('Opcional. Por ejemplo “Totalmente de acuerdo”.')} showOptional={false}>
            <input className={INPUT} value={q.maxLabel ?? ''} onChange={(e) => onChange({ maxLabel: e.target.value })} />
          </Field>
        </div>
      )}
    </div>
  );
}
