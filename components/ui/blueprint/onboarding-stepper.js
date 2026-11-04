'use client';

import React, { useState } from 'react';
import BlueprintPanel from './panel';
import SplitButton from './split-button';
import Field from './field';
import MarginNote from './margin-note';
import LanguageSelector from './language-selector';
import CadIcon from '../cad-icon';

const STEPS = [
  {
    num: '01',
    key: 'context',
    title: 'Propósito e Identificación',
  },
  {
    num: '02',
    key: 'expectations',
    title: 'Expectativas del Diálogo',
  },
  {
    num: '03',
    key: 'guide',
    title: 'Guía del Plano y Privacidad',
  },
];

/**
 * OnboardingStepper - 3-step integrated participant orientation module.
 * Addresses in-situ empirical workshop findings (ISDDE 2026) by clarifying
 * session purpose, dialogic expectations, interface zones, and research telemetry
 * before the first message is sent.
 */
export function OnboardingStepper({
  code,
  workshopName,
  chainOrder = 1,
  onboardingInstructions = null,
  initialName = '',
  joining = false,
  error = '',
  onStartSession,
}) {
  const skipStorageKey = 'ps_skip_onboarding_guide';
  const [stepIndex, setStepIndex] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(skipStorageKey) === '1') {
      return 2;
    }
    return 0;
  });
  const [participantName, setParticipantName] = useState(initialName || '');
  const [priorExperience, setPriorExperience] = useState('intermedia');
  const [skipNextTime, setSkipNextTime] = useState(false);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (typeof window !== 'undefined') {
      if (skipNextTime) {
        localStorage.setItem(skipStorageKey, '1');
      } else {
        localStorage.removeItem(skipStorageKey);
      }
    }
    if (onStartSession) {
      onStartSession({
        participantName: participantName.trim() || 'Anónimo',
        onboardingAnswers: {
          prior_ai_experience: priorExperience,
          oriented_at: new Date().toISOString(),
        },
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="font-ui-mono text-xs uppercase tracking-wider text-ink-2">
          PROTOCOLO DE INGRESO · CÓDIGO <span className="text-ink font-semibold">{code}</span>
          {chainOrder > 1 ? ` · ETAPA ${chainOrder}` : ''}
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector compact={true} />
          <MarginNote tone="cobalt" rotate={-1.5}>
            LEER ANTES DE INICIAR
          </MarginNote>
        </div>
      </div>

      <BlueprintPanel
        codeTag={`PASO [${stepIndex + 1}/3]`}
        title={workshopName ? ` Orientación: ${workshopName}` : 'Orientación de la Sesión Experimental'}
        subtitle="Revise brevemente cómo funciona el espacio de trabajo antes de interactuar con el asistente."
        headingLevel={2}
        titleBlock={{
          sheetNumber: `ONB-${String(stepIndex + 1).padStart(2, '0')}`,
          status: chainOrder > 1 ? `SECUENCIA #${chainOrder}` : 'ACTIVO',
          rev: 'PROTOCOLO v2',
          title: workshopName || `Sesión ${code}`,
          subtitle: ' Orientación integrada del participante',
        }}
      >
        {/* Step Progress Strip */}
        <nav aria-label="Pasos de orientación" className="mb-6">
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2 list-none p-0 m-0">
            {STEPS.map((st, idx) => {
              const isCurrent = idx === stepIndex;
              const isDone = idx < stepIndex;
              return (
                <li key={st.key}>
                  <button
                    type="button"
                    onClick={() => setStepIndex(idx)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`w-full min-h-[44px] px-3 py-2 text-left border font-ui-mono text-xs flex items-center gap-2 transition-colors ${
                      isCurrent
                        ? 'bg-cobalt-tint border-cobalt text-cobalt font-semibold'
                        : isDone
                        ? 'bg-emerald-tint border-emerald text-emerald'
                        : 'bg-paper-subtle border-line-control text-ink-2 hover:text-ink'
                    }`}
                  >
                    <span className="font-stat font-semibold shrink-0">
                      {isDone ? '[OK]' : `[${st.num}]`}
                    </span>
                    <span className="truncate">{st.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3 border-2 border-vermilion-ink bg-vermilion-tint font-ui-mono text-xs text-vermilion-ink flex items-center gap-2"
          >
            <CadIcon name="AlertTriangle" size={16} />
            <span>Error al iniciar sesión: {error}</span>
          </div>
        )}

        {/* STEP 1: Identification & Study Context */}
        {stepIndex === 0 && (
          <div className="space-y-4">
            <div className="p-4 bg-paper-subtle border border-line-control space-y-2">
              <h3 className="font-ui-mono text-xs uppercase tracking-wider font-semibold text-ink m-0">
                1. ¿Qué harás en esta actividad?
              </h3>
              <p className="font-body text-sm text-ink leading-relaxed m-0">
                Participarás en un ejercicio práctico de resolución o análisis de un caso apoyado por un
                asistente conversacional. El objetivo no es evaluar tus conocimientos personales, sino estudiar
                cómo distintas configuraciones pedagógicas del asistente apoyan la reflexión en situaciones reales.
              </p>
              {onboardingInstructions && (
                <div className="mt-3 pt-3 border-t border-dotted border-rule">
                  <div className="font-ui-mono text-xs uppercase font-semibold text-cobalt mb-1">
                    Instrucciones específicas del equipo docente / investigador:
                  </div>
                  <p className="font-body text-sm text-ink leading-relaxed m-0 whitespace-pre-line">
                    {onboardingInstructions}
                  </p>
                </div>
              )}
            </div>

            <Field
              label="Seudónimo o nombre para tu bitácora"
              required={false}
              help="Puedes usar un seudónimo. Permite vincular tus etapas si la sesión tiene más de una parte."
            >
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Ej. Catalina, Participante 04..."
                autoComplete="nickname"
                className="ps-field__control w-full font-body text-sm text-ink bg-paper border border-line-control px-3 py-2"
              />
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line-control">
              <span className="font-ui-mono text-xs text-ink-2">Paso 1 de 3 · Configuración inicial</span>
              <SplitButton
                variant="primary"
                iconBox="ArrowRight"
                onClick={() => setStepIndex(1)}
              >
                Continuar a expectativas
              </SplitButton>
            </div>
          </div>
        )}

        {/* STEP 2: Dialogic Expectations */}
        {stepIndex === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-paper border border-line-control">
                <div className="flex items-center gap-2 font-ui-mono text-xs font-semibold uppercase text-cobalt mb-1.5">
                  <CadIcon name="FileText" size={15} />
                  <span>A. Revisa el caso</span>
                </div>
                <p className="font-body text-xs text-ink leading-relaxed m-0">
                  A la derecha (o en el botón superior en pantallas móviles) encontrarás la{' '}
                  <strong>Hoja de Caso</strong> con el contexto o dilema sobre el cual conversar.
                </p>
              </div>

              <div className="p-3.5 bg-paper border border-line-control">
                <div className="flex items-center gap-2 font-ui-mono text-xs font-semibold uppercase text-cobalt mb-1.5">
                  <CadIcon name="MessageSquare" size={15} />
                  <span>B. Profundiza en turnos</span>
                </div>
                <p className="font-body text-xs text-ink leading-relaxed m-0">
                  Evita quedarte en una sola consulta breve. Comparte matices, restricciones institucionales o
                  dudas durante <strong>3 a 5 intercambios</strong> como en una conversación real.
                </p>
              </div>

              <div className="p-3.5 bg-paper border border-line-control">
                <div className="flex items-center gap-2 font-ui-mono text-xs font-semibold uppercase text-cobalt mb-1.5">
                  <CadIcon name="CheckSquare" size={15} />
                  <span>C. Mirada crítica</span>
                </div>
                <p className="font-body text-xs text-ink leading-relaxed m-0">
                  Si una respuesta del asistente te parece demasiado genérica o asume cosas que no dijiste,
                  cuestiónalo en el chat y regístralo en la encuesta final.
                </p>
              </div>
            </div>

            <fieldset className="p-3.5 bg-paper-subtle border border-line-control m-0">
              <legend className="font-ui-mono text-xs font-semibold uppercase tracking-wider text-ink px-1">
                Familiaridad previa con asistentes generativos (opcional)
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                {[
                  { id: 'baja', label: 'Ocasional (pocas veces al mes)' },
                  { id: 'intermedia', label: 'Regular (uso semanal)' },
                  { id: 'alta', label: 'Frecuente (uso diario / técnico)' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`min-h-[44px] px-3 py-2 border font-ui-mono text-xs flex items-center gap-2 cursor-pointer ${
                      priorExperience === opt.id
                        ? 'bg-cobalt-tint border-cobalt text-cobalt font-semibold'
                        : 'bg-paper border-line-control text-ink'
                    }`}
                  >
                    <input
                      type="radio"
                      name="prior_experience"
                      value={opt.id}
                      checked={priorExperience === opt.id}
                      onChange={(e) => setPriorExperience(e.target.value)}
                      className="w-4 h-4 accent-cobalt"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line-control">
              <button
                type="button"
                onClick={() => setStepIndex(0)}
                className="min-h-[44px] px-4 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink inline-flex items-center gap-2"
              >
                <CadIcon name="ArrowLeft" size={14} />
                <span>Paso anterior</span>
              </button>
              <SplitButton
                variant="primary"
                iconBox="ArrowRight"
                onClick={() => setStepIndex(2)}
              >
                Ver guía de interfaz
              </SplitButton>
            </div>
          </div>
        )}

        {/* STEP 3: Workspace Map & Launch */}
        {stepIndex === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-paper-subtle border border-line-control space-y-3">
              <h3 className="font-ui-mono text-xs uppercase tracking-wider font-semibold text-ink m-0">
                3. Mapa rápido de tu pantalla y registro ético
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 m-0">
                <div className="p-3 bg-paper border border-line-control">
                  <dt className="font-ui-mono text-xs font-semibold uppercase text-ink">
                    [01] Panel de Diálogo + Hoja de Caso
                  </dt>
                  <dd className="font-body text-xs text-ink-2 mt-1 m-0 leading-relaxed">
                    Escribe con <kbd className="px-1 border border-line-control bg-paper-subtle">Enter</kbd>{' '}
                    (usa <kbd className="px-1 border border-line-control bg-paper-subtle">Shift+Enter</kbd> para
                    salto de línea). Puedes consultar el escenario en todo momento.
                  </dd>
                </div>
                <div className="p-3 bg-paper border border-line-control">
                  <dt className="font-ui-mono text-xs font-semibold uppercase text-ink">
                    [02] Cierre, Encuesta y Bitácora Formativa
                  </dt>
                  <dd className="font-body text-xs text-ink-2 mt-1 m-0 leading-relaxed">
                    Cuando concluyas tu análisis, pulsa <strong>Finalizar diálogo</strong> para responder la
                    evaluación breve y recibir tu reporte personal de analítica conversacional.
                  </dd>
                </div>
              </dl>

              <p className="font-ui-mono text-xs text-ink-2 border-l-2 border-cobalt pl-2.5 m-0 leading-relaxed">
                <strong>Nota de transparencia científica:</strong> La plataforma registra únicamente el texto de la
                conversación, tiempos de lectura/escritura por turno y tus respuestas a la encuesta con fines de
                investigación educativa. No ingreses datos personales sensibles de terceros.
              </p>
            </div>

            <label className="min-h-[44px] px-3 py-2 bg-paper border border-line-control flex items-center gap-2.5 cursor-pointer font-ui-mono text-xs text-ink">
              <input
                type="checkbox"
                checked={skipNextTime}
                onChange={(e) => setSkipNextTime(e.target.checked)}
                className="w-4 h-4 accent-cobalt"
              />
              <span>Ir directamente al paso final de ingreso en próximas sesiones desde este navegador</span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line-control">
              <button
                type="button"
                onClick={() => setStepIndex(1)}
                className="min-h-[44px] px-4 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink inline-flex items-center gap-2"
              >
                <CadIcon name="ArrowLeft" size={14} />
                <span>Paso anterior</span>
              </button>

              <SplitButton
                type="submit"
                variant="primary"
                iconBox="Play"
                loading={joining}
              >
                Iniciar sesión experimental
              </SplitButton>
            </div>
          </form>
        )}
      </BlueprintPanel>
    </div>
  );
}

export default OnboardingStepper;
