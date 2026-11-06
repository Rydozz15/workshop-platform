'use client';

import React, { useState } from 'react';
import CadIcon from '@/components/ui/cad-icon';

const BTN = 'min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2 disabled:opacity-60';
const BTN_PRIMARY = 'min-h-[44px] px-3 py-2 border border-line-strong bg-cobalt hover:bg-cobalt-hover text-paper font-body text-sm font-semibold inline-flex items-center gap-2';

/**
 * Copies the survey questions of the previous step into this one, keeping each question's id so the
 * answers stay comparable across steps (the evolution analysis groups responses by question id).
 * `onCopy(mode)` receives 'replace' or 'append'. If this step already has questions it asks first.
 */
export default function QuestionCopy({ tr, sourceCount, hasQuestions, onCopy }) {
  const [asking, setAsking] = useState(false);

  if (sourceCount === 0) return null;

  const apply = (mode) => {
    onCopy(mode);
    setAsking(false);
  };

  if (asking) {
    return (
      <div role="group" aria-label={tr('Copiar preguntas del paso anterior')} className="border border-line-control p-3 space-y-2 bg-paper-subtle">
        <p className="font-body text-sm text-ink m-0">
          {tr('Este paso ya tiene preguntas. ¿Qué hacemos con las {n} del paso anterior?', { n: sourceCount })}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => apply('replace')} className={BTN_PRIMARY}>{tr('Reemplazar las actuales')}</button>
          <button type="button" onClick={() => apply('append')} className={BTN}>{tr('Agregar al final')}</button>
          <button type="button" onClick={() => setAsking(false)} className={BTN}>{tr('Cancelar')}</button>
        </div>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => (hasQuestions ? setAsking(true) : apply('replace'))} className={BTN}>
      <CadIcon name="Copy" size={16} />{' '}{tr('Copiar preguntas del paso anterior')}
    </button>
  );
}
