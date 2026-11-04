'use client';

import React, { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BlueprintPanel from './panel';
import StatBadge from './stat-badge';
import SplitButton from './split-button';
import Abbr from './abbr';
import DataTable from './data-table';
import MarginNote from './margin-note';
import CadIcon from '../cad-icon';
import { analyzeConversation } from '@/lib/chat-analytics';

function stripThinkingTags(text) {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '')
    .trim();
}

/**
 * JourneyHub - Formative Student-Facing Learning Analytics Hub.
 * Provides participants with transparent dialogic feedback on their own interaction
 * (verbal agency R_vol, utterance elaboration MLU-w, lexical diversity MATTR,
 * epistemic connectors), longitudinal step comparison, reflective notes, and Markdown export.
 */
export function JourneyHub({ historyData = [], loading = false }) {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [innerTab, setInnerTab] = useState('analytics'); // 'analytics' | 'transcript' | 'survey'
  const [reflectionNote, setReflectionNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (historyData.length > 0 && !activeSessionId) {
      setActiveSessionId(historyData[historyData.length - 1].id);
    }
  }, [historyData, activeSessionId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ps_student_reflection_note');
      if (saved) setReflectionNote(saved);
    }
  }, []);

  // Compute real conversational learning analytics for each step in history
  const enrichedSteps = useMemo(() => {
    return historyData.map((step, index) => {
      const msgs = step.messages || [];
      const metrics = analyzeConversation(msgs);
      const stepNum = step.workshops?.chain_order || index + 1;
      const stepName = step.workshops?.name || step.workshop_name || `Etapa ${stepNum}`;
      const caseTitle = step.versions?.title || step.version?.title || 'Escenario asignado';
      return {
        ...step,
        stepNum,
        stepName,
        caseTitle,
        metrics,
      };
    });
  }, [historyData]);

  const currentStep = useMemo(() => {
    if (enrichedSteps.length === 0) return null;
    return enrichedSteps.find((s) => s.id === activeSessionId) || enrichedSteps[enrichedSteps.length - 1];
  }, [enrichedSteps, activeSessionId]);

  const saveReflection = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_student_reflection_note', reflectionNote);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
    }
  };

  const downloadPersonalReport = () => {
    const lines = [
      '# Bitácora Personal de Aprendizaje — PromptSketch',
      `Fecha de exportación: ${new Date().toISOString()}`,
      '',
    ];

    enrichedSteps.forEach((st) => {
      const m = st.metrics;
      lines.push(`## Etapa ${st.stepNum}: ${st.stepName}`);
      lines.push(`- Escenario: ${st.caseTitle}`);
      lines.push(`- Turnos del participante: ${m.studentTurns} (${m.studentWords} palabras)`);
      lines.push(`- Protagonismo verbal (R_vol): ${m.verbalVolumeRatio.toFixed(2)}`);
      lines.push(`- Longitud media por intervención (MLU-w): ${m.studentMluW.toFixed(1)} palabras`);
      lines.push(`- Diversidad léxica (MATTR-25): ${m.mattr25.toFixed(3)}`);
      lines.push(
        `- Marcadores epistémicos detectados: Causales (${m.epistemicConnectors.causalCount}), Adversativos (${m.epistemicConnectors.adversativeCount}), Metacognitivos (${m.epistemicConnectors.metacognitiveCount})`
      );
      lines.push('\n### Transcripción');
      (st.messages || []).forEach((msg) => {
        const speaker = msg.role === 'user' ? 'PARTICIPANTE' : 'ASISTENTE';
        lines.push(`**${speaker}:** ${stripThinkingTags(msg.content)}\n`);
      });
      lines.push('');
    });

    if (reflectionNote.trim()) {
      lines.push('## Síntesis y Reflexión Personal');
      lines.push(reflectionNote.trim());
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bitacora_personal_promptsketch.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <BlueprintPanel codeTag="MOD_JRN" title="Calculando bitácora formativa…">
          <p className="font-ui-mono text-xs text-ink-2 m-0">
            Procesando métricas léxicas y turnos de conversación…
          </p>
        </BlueprintPanel>
      </div>
    );
  }

  const buildPlainSummary = (m) => {
    if (!m || m.studentTurns === 0) {
      return 'Aún no hay intervenciones registradas en esta etapa para calcular indicadores conversacionales.';
    }
    const agencyText =
      m.verbalVolumeRatio >= 0.45
        ? 'mantuviste una participación activa aportando contexto sustantivo frente a las respuestas del asistente'
        : 'el asistente concentró la mayor parte de las palabras; en futuras consultas, detallar restricciones concretas ayuda a obtener orientación menos genérica';
    const markersTotal =
      m.epistemicConnectors.causalCount +
      m.epistemicConnectors.adversativeCount +
      m.epistemicConnectors.metacognitiveCount;
    const markersText =
      markersTotal > 0
        ? `Se identificaron ${markersTotal} conectores argumentativos o metacognitivos ("porque", "pero", "creo que"), señal de justificación explícita.`
        : 'Incluir conectores causales o de contraste ("porque", "sin embargo") suele enriquecer el razonamiento conjunto con sistemas de IA.';
    return `Realizaste ${m.studentTurns} intervenciones con un promedio de ${m.studentMluW.toFixed(
      1
    )} palabras por turno: ${agencyText}. ${markersText}`;
  };

  const longitudinalRows = enrichedSteps.map((st) => ({
    id: st.id,
    step: `Etapa ${st.stepNum}: ${st.stepName}`,
    turns: st.metrics.studentTurns,
    words: st.metrics.studentWords,
    rVol: Number(st.metrics.verbalVolumeRatio.toFixed(2)),
    mluW: Number(st.metrics.studentMluW.toFixed(1)),
    mattr: Number(st.metrics.mattr25.toFixed(3)),
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <BlueprintPanel
        codeTag="MOD_JRN // SF-LA"
        title="Sesión Completada · Tu Bitácora Formativa de Diálogo"
        subtitle="Gracias por participar. Aquí puedes revisar tus indicadores conversacionales, comparar etapas y exportar tu registro."
        headingLevel={2}
        headerSlot={
          <SplitButton
            variant="secondary"
            iconBox="Download"
            onClick={downloadPersonalReport}
            disabled={enrichedSteps.length === 0}
          >
            Descargar bitácora (.md)
          </SplitButton>
        }
        titleBlock={{
          sheetNumber: 'JRN-01',
          status: 'REGISTRADO',
          rev: `${enrichedSteps.length} ETAPA(S)`,
          title: 'Retroalimentación Formativa al Estudiante',
          subtitle: 'Métricas calculadas en tiempo real sobre tu diálogo',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-sm text-ink leading-relaxed m-0 max-w-3xl">
            En Learning Analytics centrada en el estudiante, transparentar cómo interactuaste con la IA te
            permite observar tu propio nivel de indagación, elaboración de argumentos y revisión crítica.
          </p>
          <MarginNote tone="cobalt" rotate={-1.5}>
            ESPEJO METACOGNITIVO
          </MarginNote>
        </div>
      </BlueprintPanel>

      {/* Longitudinal Multi-Step Comparison Table (when chained study has >= 2 steps) */}
      {enrichedSteps.length >= 2 && (
        <BlueprintPanel
          codeTag="COMP_PRE_POST"
          title="Evolución entre Etapas de la Secuencia"
          subtitle="Comparación directa de tu agencia verbal y riqueza léxica a lo largo de las sesiones encadenadas."
        >
          <DataTable
            caption="Comparativa longitudinal de tus etapas"
            columns={[
              { key: 'step', label: 'Etapa / Sesión', sortable: true },
              { key: 'turns', label: 'Turnos', align: 'right', sortable: true },
              { key: 'words', label: 'Palabras', align: 'right', sortable: true },
              { key: 'rVol', label: 'Ratio Verbal (R_vol)', align: 'right', sortable: true },
              { key: 'mluW', label: 'Palabras/Turno (MLU-w)', align: 'right', sortable: true },
              { key: 'mattr', label: 'Diversidad (MATTR)', align: 'right', sortable: true },
            ]}
            data={longitudinalRows}
          />
        </BlueprintPanel>
      )}

      {/* Step Selector + Detailed View */}
      {currentStep && (
        <BlueprintPanel
          codeTag={`ETAPA_0${currentStep.stepNum}`}
          title={currentStep.stepName}
          subtitle={currentStep.caseTitle}
        >
          {enrichedSteps.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-line-control" role="tablist" aria-label="Seleccionar etapa">
              {enrichedSteps.map((st) => {
                const selected = st.id === currentStep.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveSessionId(st.id)}
                    className={`min-h-[44px] px-4 py-2 border font-ui-mono text-xs ${
                      selected
                        ? 'bg-cobalt text-paper border-cobalt font-semibold'
                        : 'bg-paper-subtle text-ink border-line-control hover:bg-paper'
                    }`}
                  >
                    Etapa {st.stepNum}: {st.stepName}
                  </button>
                );
              })}
            </div>
          )}

          {/* Inner Sub-tabs: Analytics | Transcript | Survey */}
          <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Secciones de la etapa">
            {[
              { id: 'analytics', label: 'Perfil Dialógico', icon: 'Activity' },
              { id: 'transcript', label: `Transcripción (${(currentStep.messages || []).length})`, icon: 'MessageSquare' },
              { id: 'survey', label: 'Respuestas de Encuesta', icon: 'ClipboardCheck' },
            ].map((tb) => {
              const active = innerTab === tb.id;
              return (
                <button
                  key={tb.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setInnerTab(tb.id)}
                  className={`min-h-[44px] px-3.5 py-2 border font-ui-mono text-xs inline-flex items-center gap-2 ${
                    active
                      ? 'bg-cobalt-tint border-cobalt text-cobalt font-semibold'
                      : 'bg-paper border-line-control text-ink hover:bg-paper-subtle'
                  }`}
                >
                  <CadIcon name={tb.icon} size={14} />
                  <span>{tb.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-tab 1: Formative Analytics */}
          {innerTab === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-paper-subtle border border-line-control">
                  <div className="font-ui-mono text-xs text-ink-2 uppercase">
                    Protagonismo (<Abbr term="r-vol">R_vol</Abbr>)
                  </div>
                  <div className="font-stat text-2xl font-semibold text-ink stat mt-1">
                    {currentStep.metrics.verbalVolumeRatio.toFixed(2)}
                  </div>
                  <div className="font-ui-mono text-xs text-ink-2 mt-1">
                    {currentStep.metrics.studentWords} tuyas / {currentStep.metrics.botWords} IA
                  </div>
                </div>

                <div className="p-3.5 bg-paper-subtle border border-line-control">
                  <div className="font-ui-mono text-xs text-ink-2 uppercase">
                    Elaboración (<Abbr term="mlu-w">MLU-w</Abbr>)
                  </div>
                  <div className="font-stat text-2xl font-semibold text-ink stat mt-1">
                    {currentStep.metrics.studentMluW.toFixed(1)}
                  </div>
                  <div className="font-ui-mono text-xs text-ink-2 mt-1">
                    Palabras promedio por turno ({currentStep.metrics.studentTurns} turnos)
                  </div>
                </div>

                <div className="p-3.5 bg-paper-subtle border border-line-control">
                  <div className="font-ui-mono text-xs text-ink-2 uppercase">
                    Riqueza Léxica (<Abbr term="mattr">MATTR</Abbr>)
                  </div>
                  <div className="font-stat text-2xl font-semibold text-ink stat mt-1">
                    {currentStep.metrics.mattr25.toFixed(3)}
                  </div>
                  <div className="font-ui-mono text-xs text-ink-2 mt-1">
                    Ventana móvil W=25 palabras
                  </div>
                </div>

                <div className="p-3.5 bg-paper-subtle border border-line-control">
                  <div className="font-ui-mono text-xs text-ink-2 uppercase">
                    Marcadores Epistémicos
                  </div>
                  <div className="font-stat text-2xl font-semibold text-ink stat mt-1">
                    {currentStep.metrics.epistemicConnectors.causalCount +
                      currentStep.metrics.epistemicConnectors.adversativeCount +
                      currentStep.metrics.epistemicConnectors.metacognitiveCount}
                  </div>
                  <div className="font-ui-mono text-xs text-ink-2 mt-1">
                    Causales: {currentStep.metrics.epistemicConnectors.causalCount} · Contraste:{' '}
                    {currentStep.metrics.epistemicConnectors.adversativeCount} · Meta:{' '}
                    {currentStep.metrics.epistemicConnectors.metacognitiveCount}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatBadge
                  label="Turnos de indagación"
                  value={currentStep.metrics.studentTurns}
                  variant={currentStep.metrics.studentTurns >= 3 ? 'em' : 'cobalt'}
                  subtext={currentStep.metrics.studentTurns >= 3 ? 'Diálogo sostenido' : 'Exploración breve'}
                />
                {currentStep.metrics.avgReadingLatency > 0 && (
                  <StatBadge
                    label="Ritmo de lectura"
                    value={`${Math.round(currentStep.metrics.avgReadingLatency)} ms/palabra`}
                    variant={currentStep.metrics.skippedReadingRatio > 0.3 ? 'verm' : 'em'}
                    subtext={
                      currentStep.metrics.skippedReadingRatio > 0.3
                        ? 'Lectura rápida detectada'
                        : 'Lectura detenida'
                    }
                  />
                )}
              </div>

              <div className="p-3.5 bg-paper-subtle border-l-4 border-cobalt">
                <p className="font-body text-sm text-ink leading-relaxed m-0">
                  <strong className="font-ui-mono text-xs uppercase tracking-wider text-cobalt mr-1.5">
                    En palabras simples:
                  </strong>
                  {buildPlainSummary(currentStep.metrics)}
                </p>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Transcript */}
          {innerTab === 'transcript' && (
            <div
              role="log"
              aria-label="Transcripción de la etapa"
              className="space-y-3 max-h-[480px] overflow-y-auto p-3 bg-paper-subtle border border-line-control"
            >
              {(!currentStep.messages || currentStep.messages.length === 0) ? (
                <p className="font-ui-mono text-xs text-ink-2 m-0">No se registraron mensajes en esta sesión.</p>
              ) : (
                currentStep.messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <article
                      key={msg.id || idx}
                      className={`p-3.5 border ${
                        isUser
                          ? 'bg-paper border-line-control ml-0 sm:ml-8'
                          : 'bg-cobalt-tint border-cobalt mr-0 sm:mr-8'
                      }`}
                    >
                      <header className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-dotted border-rule">
                        <span className="font-ui-mono text-xs font-semibold uppercase tracking-wider text-ink">
                          {isUser ? 'ESTUDIANTE · TÚ' : 'ASISTENTE · IA'}
                        </span>
                        <span className="font-ui-mono text-xs text-ink-2 stat">
                          Turno #{idx + 1}
                        </span>
                      </header>
                      <div className="font-body text-sm text-ink leading-relaxed prose max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {stripThinkingTags(msg.content)}
                        </ReactMarkdown>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* Sub-tab 3: Survey Answers */}
          {innerTab === 'survey' && (
            <div className="space-y-3">
              {!currentStep.survey_answers || Object.keys(currentStep.survey_answers).length === 0 ? (
                <p className="font-ui-mono text-xs text-ink-2 m-0">
                  No hay respuestas de encuesta asociadas a esta etapa.
                </p>
              ) : (
                Object.entries(currentStep.survey_answers).map(([qKey, ans]) => {
                  const cfgList = currentStep.workshops?.survey_config || currentStep.survey_config || [];
                  const matchedQ = cfgList.find((q) => q.id === qKey || q.text === qKey);
                  const labelText = matchedQ ? matchedQ.text : qKey;
                  return (
                    <div key={qKey} className="p-3.5 bg-paper-subtle border border-line-control">
                      <div className="font-ui-mono text-xs font-semibold text-ink mb-1">
                        {labelText}
                      </div>
                      <div className="font-body text-sm text-ink">
                        {Array.isArray(ans) ? (
                          <ul className="list-disc pl-5 m-0 space-y-1">
                            {ans.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <span>{String(ans)}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </BlueprintPanel>
      )}

      {/* Personal Reflection Pad */}
      <BlueprintPanel
        codeTag="NOTAS_PERSONALES"
        title="Apuntes de Cierre para tu Práctica"
        subtitle="Opcional · Se guarda localmente en tu navegador e incluye en la descarga .md."
      >
        <div className="space-y-3">
          <label htmlFor="personal-reflection-textarea" className="font-ui-mono text-xs uppercase font-semibold text-ink block">
            ¿Qué estrategia o pregunta surgida en el diálogo aplicarías o descartarías en tu contexto real?
          </label>
          <textarea
            id="personal-reflection-textarea"
            rows={3}
            value={reflectionNote}
            onChange={(e) => setReflectionNote(e.target.value)}
            placeholder="Escribe aquí tus conclusiones personales antes de descargar tu bitácora..."
            className="w-full p-3 bg-paper border border-line-control font-body text-sm text-ink"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-ui-mono text-xs text-emerald">
              {noteSaved ? '[OK] Nota guardada en este navegador.' : ''}
            </span>
            <SplitButton variant="secondary" iconBox="Save" onClick={saveReflection}>
              Guardar nota en bitácora
            </SplitButton>
          </div>
        </div>
      </BlueprintPanel>
    </div>
  );
}

export default JourneyHub;
