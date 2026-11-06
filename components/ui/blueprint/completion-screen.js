'use client';

import React from 'react';
import Link from 'next/link';
import BlueprintPanel from './panel';
import Disclosure from './disclosure';
import Logo from '../brand';
import CadIcon from '../cad-icon';
import { displayAnswer, otherKey } from '@/lib/survey-schema';
import { useTr } from '@/lib/i18n/context';

const stripThinking = (text) => String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/gi, '').trim();

/** The answers a participant gave in the survey of one step, as { question, answer } pairs. */
function surveyAnswersOf(step, otherLabel) {
  const answers = step.survey_answers || step.survey_responses || {};
  const config = step.workshops?.survey_config || [];
  return config
    .map((q) => {
      const raw = answers[q.id] ?? answers[q.text];
      if (raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0)) return null;
      const shown = displayAnswer(raw, answers[otherKey(q.id)], otherLabel);
      return { question: q.text, answer: Array.isArray(shown) ? shown.join(', ') : shown };
    })
    .filter(Boolean);
}

/**
 * CompletionScreen - what the participant sees at the end: thanks, what to do now (as the person who
 * created the campaign set it up), and a short, collapsed recap of each step they went through
 * (useful for the group discussion that usually follows). No analysis: just what they did.
 */
export function CompletionScreen({ name = '', historyData = [], loading = false, nextHref = null }) {
  const tr = useTr();
  // The creator decides whether participants may see which condition they were given.
  const showCondition = historyData.some((s) => s.workshops?.show_condition);
  const steps = historyData.map((s, i) => ({
    key: s.id || i,
    title: showCondition ? s.workshops?.name || s.workshop_name || tr('Paso {n}', { n: s.workshops?.chain_order || i + 1 }) : tr('Paso {n}', { n: s.workshops?.chain_order || i + 1 }),
    condition: showCondition ? s.versions?.title || s.version?.title || '' : '',
    instructions: s.workshops?.onboarding_instructions || '',
    messages: (s.messages || []).map((m) => ({ role: m.role, content: stripThinking(m.content) })).filter((m) => m.content),
    answers: surveyAnswersOf(s, tr('Otro')),
    status: s.status,
  }));
  const finalMessage = historyData.map((s) => s.workshops?.final_message).find(Boolean) || '';

  const downloadLog = () => {
    const lines = [`# ${tr('Mi bitácora')}`, `${tr('Fecha')}: ${new Date().toISOString().slice(0, 10)}`, ''];
    steps.forEach((st, i) => {
      lines.push(`## ${i + 1}. ${st.title}`);
      if (st.condition) lines.push(`${tr('Caso')}: ${st.condition}`);
      if (st.answers.length > 0) {
        lines.push('', `### ${tr('Mis respuestas')}`);
        st.answers.forEach((a) => lines.push(`- ${a.question}: ${a.answer}`));
      }
      lines.push('', `### ${tr('Mi conversación')}`);
      st.messages.forEach((m) => lines.push(`**${m.role === 'user' ? tr('Tú') : tr('Asistente')}:** ${m.content}`, ''));
    });
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi-bitacora.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-6">
      <Logo />
      <div>
        <h1 className="ps-h1">{name ? tr('¡Gracias, {name}!', { name }) : tr('¡Gracias por participar!')}</h1>
        <p className="ps-lead mt-2">{tr('Tus respuestas quedaron guardadas.')}</p>
      </div>

      <BlueprintPanel title={tr('Qué sigue')} headingLevel={2}>
        {nextHref ? (
          <Link href={nextHref} className="min-h-[44px] px-4 py-2 border border-line-strong bg-cobalt hover:bg-cobalt-hover text-paper font-body text-sm font-semibold inline-flex items-center gap-2">{tr('Continuar con la siguiente parte')}{' '}<CadIcon name="ArrowRight" size={16} />
          </Link>
        ) : (
          <div className="space-y-3">
            {finalMessage ? (
              <p className="font-body text-base text-ink m-0 whitespace-pre-wrap">{finalMessage}</p>
            ) : (
              <p className="font-body text-base text-ink m-0">{tr('No tienes nada más que hacer en esta pantalla. Puedes cerrarla o quedarte para el plenario.')}</p>
            )}
          </div>
        )}
      </BlueprintPanel>

      <section aria-labelledby="recap-title" className="space-y-3">
        <h2 id="recap-title" className="ps-h2">{tr('Lo que hiciste')}</h2>
        {loading && <p className="ps-lead" role="status">{tr('Cargando…')}</p>}
        {!loading && steps.length === 0 && <p className="ps-lead">{tr('Completaste la actividad.')}</p>}
        {steps.map((s) => {
          const sent = s.messages.filter((m) => m.role === 'user').length;
          return (
            <Disclosure
              key={s.key}
              title={s.title}
              summary={`${s.status === 'completed' ? tr('Completado') : tr('En curso')} · ${sent} ${sent === 1 ? tr('mensaje enviado') : tr('mensajes enviados')}`}
            >
              <div className="space-y-4">
                {s.condition && <p className="font-body text-sm text-ink m-0"><span className="font-semibold">{tr('Caso')}:</span> {s.condition}</p>}
                {s.instructions && (
                  <div>
                    <p className="font-body text-sm font-semibold text-ink m-0 mb-1">{tr('Indicaciones de este paso')}</p>
                    <p className="font-body text-sm text-ink m-0 whitespace-pre-wrap">{s.instructions}</p>
                  </div>
                )}
                {s.answers.length > 0 && (
                  <div>
                    <p className="font-body text-sm font-semibold text-ink m-0 mb-1">{tr('Tus respuestas')}</p>
                    <dl className="m-0 space-y-2 font-body text-sm text-ink">
                      {s.answers.map((a) => (
                        <div key={a.question}>
                          <dt className="text-ink-2">{a.question}</dt>
                          <dd className="m-0 font-semibold">{a.answer}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                {s.messages.length > 0 && (
                  <Disclosure title={tr('Tu conversación')} summary={tr('Léela de nuevo si la necesitas')}>
                    <ol className="list-none m-0 p-0 space-y-3 font-body text-sm text-ink">
                      {s.messages.map((m, i) => (
                        <li key={i}>
                          <span className="font-semibold">{m.role === 'user' ? tr('Tú') : tr('Asistente')}:</span>{' '}
                          <span className="whitespace-pre-wrap">{m.content}</span>
                        </li>
                      ))}
                    </ol>
                  </Disclosure>
                )}
              </div>
            </Disclosure>
          );
        })}
      </section>

      {steps.length > 0 && (
        <BlueprintPanel title={tr('Tu bitácora')} headingLevel={2}>
          <p className="font-body text-sm text-ink mt-0 mb-3">{tr('Es un archivo de texto con tus conversaciones y respuestas de cada paso. Descárgalo para conservarlo o tenerlo a mano en el plenario.')}</p>
          <button type="button" onClick={downloadLog} className="min-h-[44px] px-4 py-2 border border-line-strong bg-paper hover:bg-paper-subtle font-body text-sm font-semibold text-ink inline-flex items-center gap-2">
            <CadIcon name="Download" size={16} />{' '}{tr('Descargar bitácora (.md)')}
          </button>
        </BlueprintPanel>
      )}
    </div>
  );
}

export default CompletionScreen;
