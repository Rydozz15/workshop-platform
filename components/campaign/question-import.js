'use client';

import React, { useState } from 'react';
import CadIcon from '@/components/ui/cad-icon';
import { CSV_TEMPLATE, parseQuestionsCsv } from '@/lib/survey-csv';

const BTN = 'min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2 disabled:opacity-60';
const BTN_PRIMARY = 'min-h-[44px] px-3 py-2 border border-line-strong bg-cobalt hover:bg-cobalt-hover text-paper font-body text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60';

/**
 * Bulk import of survey questions from a CSV file or pasted text.
 * `onImport(questions, mode)` receives the parsed questions and 'append' or 'replace'.
 */
export default function QuestionImport({ tr, hasQuestions, onImport }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  const review = (value = text) => setResult(parseQuestionsCsv(value, tr));

  const readFile = async (file) => {
    if (!file) return;
    const content = await file.text();
    setText(content);
    review(content);
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_preguntas.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const apply = (mode) => {
    onImport(result.questions, mode);
    setOpen(false);
    setText('');
    setResult(null);
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={BTN}>
        <CadIcon name="Upload" size={16} />{' '}{tr('Importar preguntas (CSV)')}
      </button>
    );
  }

  return (
    <div className="border border-line-control p-3 space-y-3 bg-paper-subtle">
      <p className="font-body text-sm text-ink m-0">
        {tr('Carga muchas preguntas de una vez desde una planilla. Para generarla con una IA, descarga la plantilla y pídele que siga exactamente ese formato.')}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={downloadTemplate} className={BTN}>
          <CadIcon name="Download" size={16} />{' '}{tr('Descargar plantilla')}
        </button>
        <label className={BTN + ' cursor-pointer'}>
          <CadIcon name="Upload" size={16} />{' '}{tr('Subir archivo CSV')}
          <input type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => readFile(e.target.files?.[0])} />
        </label>
      </div>
      <label className="block font-body text-sm text-ink">
        {tr('O pega aquí el contenido del CSV')}
        <textarea
          rows={5}
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); }}
          className="mt-1 w-full font-ui-mono text-xs text-ink bg-paper border border-line-control px-3 py-2"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => review()} disabled={!text.trim()} className={BTN}>
          <CadIcon name="Check" size={16} />{' '}{tr('Revisar')}
        </button>
        <button type="button" onClick={() => { setOpen(false); setResult(null); }} className={BTN}>{tr('Cancelar')}</button>
      </div>

      {result && (
        <div className="space-y-2" role="status">
          {result.questions.length > 0 && (
            <p className="font-body text-sm text-ink m-0">{tr('Se leyeron {n} pregunta(s) válidas.', { n: result.questions.length })}</p>
          )}
          {result.errors.length > 0 && (
            <ul className="list-none m-0 p-3 border-2 border-vermilion-ink bg-vermilion-tint font-body text-sm text-vermilion-ink space-y-1">
              {result.errors.map((err, i) => (
                <li key={i}>{tr('Fila {row}: {message}', { row: err.row, message: err.message })}</li>
              ))}
            </ul>
          )}
          {result.questions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => apply('append')} className={BTN_PRIMARY}>
                <CadIcon name="Plus" size={16} />{' '}{tr('Agregar a las preguntas')}
              </button>
              {hasQuestions && (
                <button type="button" onClick={() => apply('replace')} className={BTN}>
                  <CadIcon name="RefreshCw" size={16} />{' '}{tr('Reemplazar las preguntas')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
