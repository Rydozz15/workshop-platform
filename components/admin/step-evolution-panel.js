'use client';

import React from 'react';
import { BlueprintPanel, Disclosure, InfoTip } from '@/components/ui/blueprint';

/**
 * Change between the steps of a campaign, question by question.
 * Renders nothing unless `evolution` exists (see lib/step-evolution.js: 2+ steps, a scale question
 * shared by them, and at least 3 people who answered it in every step), so it takes no room otherwise.
 */
export default function StepEvolutionPanel({ evolution, tr, fmt }) {
  if (!evolution) return null;
  const { questions } = evolution;
  const clear = questions.filter((q) => q.test?.significant).length;
  const stepNames = (q) => q.stepNames.map((n, i) => n || tr('Paso {n}', { n: i + 1 }));
  const signed = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmt(Math.abs(v))}`;
  const header = [...new Set(evolution.steps.map((s) => s.name))];
  const sameSteps = questions.every((q) => q.stepIds.length === evolution.steps.length);

  return (
    <BlueprintPanel title={tr('Cambio entre pasos')} subtitle={tr('Las mismas preguntas, respondidas por las mismas personas en cada paso.')}>
      <div className="space-y-4">
        <div className={`border-2 p-4 ${clear > 0 ? 'border-emerald bg-emerald-tint' : 'border-line-strong bg-paper-subtle'}`}>
          <p className="font-body text-base text-ink m-0">
            {tr('{n} de {m} preguntas cambiaron de forma clara entre pasos.', { n: clear, m: questions.length })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm text-left">
            <thead>
              <tr className="text-ink-2 border-b border-line-control">
                <th className="py-2 pr-4 font-semibold">{tr('Pregunta')}</th>
                {sameSteps
                  ? header.map((name, i) => <th key={i} className="py-2 pr-4 font-semibold text-right">{name || tr('Paso {n}', { n: i + 1 })}</th>)
                  : <th className="py-2 pr-4 font-semibold text-right">{tr('Promedio por paso')}</th>}
                <th className="py-2 pr-4 font-semibold text-right">{tr('Cambio')}</th>
                <th className="py-2 pr-4 font-semibold text-right">{tr('p ajustado')}</th>
                <th className="py-2 pr-4 font-semibold text-right">{tr('Personas')}</th>
                <th className="py-2 font-semibold">{tr('Lectura')}</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.key} className="border-b border-dotted border-rule hover:bg-cobalt-tint align-top">
                  <td className="py-2 pr-4 text-ink max-w-xs">{q.text}</td>
                  {sameSteps
                    ? q.means.map((m, i) => <td key={i} className="py-2 pr-4 text-right font-stat">{fmt(m)}</td>)
                    : <td className="py-2 pr-4 text-right font-stat">{q.means.map((m) => fmt(m)).join(' → ')}</td>}
                  <td className="py-2 pr-4 text-right font-stat font-semibold">{signed(q.change)}</td>
                  <td className="py-2 pr-4 text-right font-stat">{q.test ? fmt(q.test.pAdj, 3) : '–'}</td>
                  <td className="py-2 pr-4 text-right font-stat">{q.n}</td>
                  <td className={`py-2 font-semibold ${q.test?.significant ? 'text-emerald' : 'text-ink-2'}`}>
                    {q.test?.significant ? tr('Cambio claro') : tr('Sin cambio claro')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="ps-meta m-0 flex items-center gap-1">
          {tr('Solo cuentan las personas que respondieron la pregunta en todos los pasos donde aparece. Los valores p están ajustados por la cantidad de preguntas (Holm).')}
          <InfoTip label={tr('Qué es el valor p')}>{tr('Qué tan sorprendente sería ver esta diferencia si en realidad no la hubiera. Cuanto más bajo, menos probable que sea azar.')}</InfoTip>
        </p>

        <Disclosure title={tr('Ver detalle estadístico')} summary={tr('{n} pregunta(s)', { n: questions.length })}>
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.key} className="border-b border-dotted border-rule pb-3">
                <p className="font-body text-sm font-semibold text-ink m-0">{q.text}</p>
                {q.test && (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-body text-sm mt-2 mb-0">
                    <dt className="text-ink-2">{tr('Prueba usada')}</dt>
                    <dd className="m-0 text-ink">{q.test.kind === 'wilcoxon' ? tr('Wilcoxon de rangos con signo (pareada)') : tr('Friedman (medidas repetidas)')}</dd>
                    <dt className="text-ink-2">{tr('Valor p')}</dt>
                    <dd className="m-0 text-ink font-stat">{fmt(q.test.p, 4)}</dd>
                    <dt className="text-ink-2">{tr('Tamaño del efecto')}</dt>
                    <dd className="m-0 text-ink">
                      <span className="font-stat">{fmt(q.test.effect)}</span>{' '}
                      ({q.test.kind === 'wilcoxon' ? tr('d de Cohen pareada') : tr('W de Kendall')})
                    </dd>
                  </dl>
                )}
                {q.pairwise.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <p className="font-body text-sm font-semibold text-ink m-0">{tr('Cada paso contra el primero (ajustado con Holm)')}</p>
                    <table className="w-full font-body text-sm text-left">
                      <tbody>
                        {q.pairwise.map((p) => (
                          <tr key={p.stepName} className="border-b border-dotted border-rule">
                            <td className="py-2 pr-4 text-ink">{tr('{a} vs {b}', { a: p.stepName || '', b: stepNames(q)[0] })}</td>
                            <td className="py-2 pr-4 font-stat">{signed(p.change)}</td>
                            <td className="py-2 pr-4 font-stat">{tr('p ajustado = {p}', { p: fmt(p.pAdj, 3) })}</td>
                            <td className={`py-2 font-semibold ${p.significant ? 'text-emerald' : 'text-ink-2'}`}>{p.significant ? tr('Cambio claro') : tr('Sin cambio claro')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Disclosure>
      </div>
    </BlueprintPanel>
  );
}
