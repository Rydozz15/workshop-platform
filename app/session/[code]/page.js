'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BlueprintPanel,
  SplitButton,
  StatBadge,
  OnboardingStepper,
  JourneyHub,
  MarginNote,
  LanguageSelector,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { useLanguage } from '@/lib/i18n/context';

function stripThinkingTags(text) {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '')
    .trim();
}

export default function SessionPage({ params }) {
  const { code } = use(params);
  const { t } = useLanguage();


  const [phase, setPhase] = useState('welcome'); // 'welcome' | 'chat' | 'survey' | 'completed'
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [version, setVersion] = useState(null);
  const [workshopName, setWorkshopName] = useState('');
  const [onboardingInstructions, setOnboardingInstructions] = useState(null);
  const [chainOrder, setChainOrder] = useState(1);
  const [surveyConfig, setSurveyConfig] = useState([]);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [surveyError, setSurveyError] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [caseOpenMobile, setCaseOpenMobile] = useState(false);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [submittingSurvey, setSubmittingSurvey] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previousFirstMessage, setPreviousFirstMessage] = useState(null);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [pauseLiveTelemetry, setPauseLiveTelemetry] = useState(false);

  // Client-side Learning Analytics timing & tab-inactivity instrumentation
  const lastBotFinishTimeRef = useRef(null);
  const firstKeyTimeRef = useRef(null);
  const turnTabBlurredRef = useRef(false);
  const tabSwitchCountRef = useRef(0);
  const blurStartRef = useRef(null);
  const inactiveMsRef = useRef(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPauseLiveTelemetry(localStorage.getItem('ps_pause_telemetry') === '1');
    }
  }, []);

  // Track browser tab visibility changes to flag inactivity outliers accurately
  useEffect(() => {
    if (phase !== 'chat') return;
    const handleVisibility = () => {
      if (document.hidden) {
        turnTabBlurredRef.current = true;
        tabSwitchCountRef.current += 1;
        blurStartRef.current = Date.now();
      } else if (blurStartRef.current) {
        inactiveMsRef.current += Math.max(0, Date.now() - blurStartRef.current);
        blurStartRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [phase]);

  // Close confirmation modal on Escape
  useEffect(() => {
    if (!confirmCompleteOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirmCompleteOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmCompleteOpen]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      (document.documentElement.dataset.motion === 'reduced' ||
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  }, [messages]);

  const joinWorkshop = async ({
    participantName: overrideName = null,
    overrideCuid = null,
    onboardingAnswers = null,
  } = {}) => {
    setJoining(true);
    setError('');

    const finalName = overrideName || name || 'Anónimo';
    const urlParams = new URLSearchParams(window.location.search);
    let chainUserId =
      overrideCuid || urlParams.get('cuid') || localStorage.getItem('chain_user_id');

    if (!chainUserId) {
      chainUserId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    }

    localStorage.setItem('chain_user_id', chainUserId);
    localStorage.setItem('participant_name', finalName);
    setName(finalName);

    try {
      const res = await fetch('/api/session/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          participant_name: finalName,
          chain_user_id: chainUserId,
          onboarding_answers: onboardingAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo iniciar la sesión.');
        setJoining(false);
        return;
      }

      localStorage.setItem(`workshop_${code}_session`, data.session_id);
      setSessionId(data.session_id);
      setVersion(data.version);
      setWorkshopName(data.workshop_name || '');
      setOnboardingInstructions(data.onboarding_instructions || null);
      setChainOrder(data.chain_order || 1);
      setSurveyConfig(data.survey_config || []);
      if (data.previous_first_message) {
        setPreviousFirstMessage(data.previous_first_message);
      }
      lastBotFinishTimeRef.current = Date.now();
      firstKeyTimeRef.current = null;
      setJoining(false);
      setPhase('chat');
    } catch {
      setError('Error de conexión con el servidor.');
      setJoining(false);
    }
  };

  // Pre-fetch campaign metadata for OnboardingStepper & check saved/chained session
  useEffect(() => {
    fetch(`/api/session/join?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((info) => {
        if (info) {
          setWorkshopName(info.name || '');
          setOnboardingInstructions(info.onboarding_instructions || null);
          setChainOrder(info.chain_order || 1);
        }
      })
      .catch(() => {});

    const savedSessionId = localStorage.getItem(`workshop_${code}_session`);
    if (savedSessionId) {
      fetch(`/api/session/${savedSessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error && data.status === 'active') {
            setSessionId(data.id);
            setVersion(data.version);
            setWorkshopName(data.workshop_name || '');
            setOnboardingInstructions(data.onboarding_instructions || null);
            setChainOrder(data.chain_order || 1);
            setSurveyConfig(data.survey_config || []);
            setMessages(data.messages || []);
            if (data.previous_first_message) {
              setPreviousFirstMessage(data.previous_first_message);
            }
            lastBotFinishTimeRef.current = Date.now();
            setPhase('chat');
          } else {
            localStorage.removeItem(`workshop_${code}_session`);
            checkAutoJoin();
          }
        })
        .catch(() => {});
    } else {
      checkAutoJoin();
    }

    function checkAutoJoin() {
      const urlParams = new URLSearchParams(window.location.search);
      const cuid = urlParams.get('cuid');
      const savedName = localStorage.getItem('participant_name');
      if (cuid && savedName) {
        setName(savedName);
        joinWorkshop({ participantName: savedName, overrideCuid: cuid });
      } else if (savedName) {
        setName(savedName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Load JourneyHub history upon completion
  useEffect(() => {
    if (phase !== 'completed') return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      const cuid = localStorage.getItem('chain_user_id');
      const query = cuid ? `cuid=${encodeURIComponent(cuid)}` : `sessionId=${encodeURIComponent(sessionId || '')}`;
      try {
        const res = await fetch(`/api/session/history?${query}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setHistoryData(data);
        }
      } catch (err) {
        console.error(err);
      }
      setLoadingHistory(false);
    };
    fetchHistory();
  }, [phase, sessionId]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length > 0 && firstKeyTimeRef.current === null) {
      firstKeyTimeRef.current = Date.now();
    } else if (val.length === 0) {
      firstKeyTimeRef.current = null;
    }
    setInput(val);
  };

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    const nowSend = Date.now();
    const clientTelemetry = {
      t_bot: lastBotFinishTimeRef.current || nowSend,
      t_first_key: firstKeyTimeRef.current || nowSend,
      t_send: nowSend,
      is_tab_blurred: turnTabBlurredRef.current,
      tab_switches: tabSwitchCountRef.current,
      inactive_ms: inactiveMsRef.current,
    };

    // Reset turn telemetry trackers
    firstKeyTimeRef.current = null;
    turnTabBlurredRef.current = false;
    inactiveMsRef.current = 0;

    setInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMsg, telemetry: clientTelemetry },
    ]);
    setStreaming(true);

    try {
      const res = await fetch(`/api/session/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, client_telemetry: clientTelemetry }),
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Aviso del sistema: no se pudo obtener respuesta en este turno. Intenta nuevamente.',
          },
        ]);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';
      let trailingTelemetry = null;
      let buffer = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        let newContent = '';
        for (const evt of events) {
          const lines = evt.split('\n');
          let isTelemetryEvt = false;
          for (const line of lines) {
            if (line.startsWith('event: telemetry')) {
              isTelemetryEvt = true;
            } else if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                if (isTelemetryEvt || json.telemetry) {
                  trailingTelemetry = json.telemetry || json;
                } else {
                  newContent += json.choices?.[0]?.delta?.content || json.chunk || '';
                }
              } catch {
                // Ignore partial JSON
              }
            }
          }
        }

        if (newContent || trailingTelemetry) {
          assistantMsg += newContent;
          const displayMsg = stripThinkingTags(assistantMsg);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: displayMsg,
              telemetry: trailingTelemetry || updated[updated.length - 1]?.telemetry || null,
            };
            return updated;
          });
        }
      }
      lastBotFinishTimeRef.current = Date.now();
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error de red: conexión interrumpida.' },
      ]);
    }

    setStreaming(false);
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const confirmAndAdvance = async () => {
    setConfirmCompleteOpen(false);
    if (surveyConfig.length > 0) {
      setPhase('survey');
    } else {
      await finalizeSession();
    }
  };

  const finalizeSession = async (nextShareCode = null) => {
    const res = await fetch(`/api/session/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    const data = await res.json();
    localStorage.removeItem(`workshop_${code}_session`);

    const finalNextCode = nextShareCode || data.next_share_code;
    if (finalNextCode) {
      const chainUserId = localStorage.getItem('chain_user_id') || '';
      window.location.href = `/session/${finalNextCode}?cuid=${encodeURIComponent(chainUserId)}`;
    } else {
      setPhase('completed');
    }
  };

  const submitSurvey = async (e) => {
    e.preventDefault();
    setSurveyError('');
    setSubmittingSurvey(true);

    try {
      const res = await fetch(`/api/session/${sessionId}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_answers: surveyAnswers,
          chain_user_id: localStorage.getItem('chain_user_id'),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await finalizeSession(data.next_share_code);
      } else {
        setSurveyError(data.error || 'No se pudo guardar la encuesta.');
        setSubmittingSurvey(false);
      }
    } catch {
      setSurveyError('Error de conexión al enviar tus respuestas.');
      setSubmittingSurvey(false);
    }
  };

  // ============================================================
  // PHASE 1: INTEGRATED 3-STEP ONBOARDING STEPPER
  // ============================================================
  if (phase === 'welcome') {
    return (
      <OnboardingStepper
        code={code}
        workshopName={workshopName}
        chainOrder={chainOrder}
        onboardingInstructions={onboardingInstructions}
        initialName={name}
        joining={joining}
        error={error}
        onStartSession={joinWorkshop}
      />
    );
  }

  // ============================================================
  // PHASE 3: POST-SESSION SCIENTIFIC SURVEY
  // ============================================================
  if (phase === 'survey') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <BlueprintPanel
          codeTag="MOD_EVAL // CUESTIONARIO"
          title="Evaluación Posterior al Diálogo"
          subtitle={`Sesión: ${workshopName || code} · Tus respuestas alimentan el análisis psicométrico y formativo.`}
          headingLevel={2}
          titleBlock={{
            sheetNumber: 'SRV-01',
            status: 'EVALUACIÓN',
            rev: `${surveyConfig.length} ÍTEMS`,
            title: workshopName || 'Cuestionario Post-Sesión',
            subtitle: 'Escalas ordinales y observación conductual',
          }}
        >
          {surveyError && (
            <div
              role="alert"
              className="mb-5 p-3 border-2 border-vermilion-ink bg-vermilion-tint font-ui-mono text-xs text-vermilion-ink flex items-center gap-2"
            >
              <CadIcon name="AlertTriangle" size={16} />
              <span>{surveyError}</span>
            </div>
          )}

          <form onSubmit={submitSurvey} className="space-y-5">
            {surveyConfig.map((q, idx) => {
              const qType = q.type || 'likert';
              const scaleValues = Array.isArray(q.scale) && q.scale.length > 0 ? q.scale : [1, 2, 3, 4, 5];

              return (
                <fieldset
                  key={q.id || idx}
                  className="p-4 bg-paper-subtle border border-line-control m-0 space-y-3"
                >
                  <legend className="font-body text-sm font-semibold text-ink px-1 leading-snug">
                    <span className="font-ui-mono text-xs text-cobalt mr-1.5">[{idx + 1}]</span>
                    {q.text}
                  </legend>

                  {/* Likert Ordinal Scale */}
                  {qType === 'likert' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between font-ui-mono text-xs text-ink-2">
                        <span>{q.minLabel || '1 · Totalmente en desacuerdo'}</span>
                        <span>{q.maxLabel || `${scaleValues[scaleValues.length - 1]} · Totalmente de acuerdo`}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {scaleValues.map((num) => {
                          const strVal = String(num);
                          const isSelected = String(surveyAnswers[q.id] ?? '') === strVal;
                          return (
                            <label
                              key={strVal}
                              className={`min-h-[48px] border flex flex-col items-center justify-center cursor-pointer font-stat text-sm font-semibold transition-colors ${
                                isSelected
                                  ? 'bg-cobalt text-paper border-cobalt'
                                  : 'bg-paper text-ink border-line-control hover:bg-paper-subtle'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`survey_${q.id}`}
                                value={strVal}
                                checked={isSelected}
                                onChange={(e) =>
                                  setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })
                                }
                                required
                                className="sr-only"
                              />
                              <span>{num}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Single-choice Multiple */}
                  {qType === 'multiple' && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt) => {
                        const isSelected = surveyAnswers[q.id] === opt;
                        return (
                          <label
                            key={opt}
                            className={`min-h-[44px] px-3 py-2 border flex items-center gap-2.5 cursor-pointer font-body text-sm ${
                              isSelected
                                ? 'bg-cobalt-tint border-cobalt text-cobalt font-medium'
                                : 'bg-paper border-line-control text-ink'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`survey_${q.id}`}
                              value={opt}
                              checked={isSelected}
                              onChange={(e) =>
                                setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })
                              }
                              required
                              className="w-4 h-4 accent-cobalt"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Behavioral Checklist / Checkbox */}
                  {(qType === 'checklist' || qType === 'checkbox') && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt) => {
                        const currentArr = Array.isArray(surveyAnswers[q.id]) ? surveyAnswers[q.id] : [];
                        const isChecked = currentArr.includes(opt);
                        return (
                          <label
                            key={opt}
                            className={`min-h-[44px] px-3 py-2 border flex items-center gap-2.5 cursor-pointer font-body text-sm ${
                              isChecked
                                ? 'bg-cobalt-tint border-cobalt text-ink font-medium'
                                : 'bg-paper border-line-control text-ink'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...currentArr, opt]
                                  : currentArr.filter((item) => item !== opt);
                                setSurveyAnswers({ ...surveyAnswers, [q.id]: next });
                              }}
                              className="w-4 h-4 accent-cobalt shrink-0"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Open-ended Qualitative Response */}
                  {(qType === 'text' || qType === 'open') && (
                    <div>
                      <textarea
                        rows={3}
                        value={surveyAnswers[q.id] || ''}
                        onChange={(e) =>
                          setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })
                        }
                        required
                        placeholder="Describe brevemente tu apreciación y por qué..."
                        className="w-full p-3 bg-paper border border-line-control font-body text-sm text-ink"
                      />
                    </div>
                  )}
                </fieldset>
              );
            })}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line-control">
              <button
                type="button"
                onClick={() => setPhase('chat')}
                className="min-h-[44px] px-4 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink inline-flex items-center gap-2"
              >
                <CadIcon name="ArrowLeft" size={14} />
                <span>Volver al diálogo</span>
              </button>

              <SplitButton
                type="submit"
                variant="primary"
                iconBox="Check"
                loading={submittingSurvey}
              >
                Enviar evaluación y ver bitácora
              </SplitButton>
            </div>
          </form>
        </BlueprintPanel>
      </div>
    );
  }

  // ============================================================
  // PHASE 4: FORMATIVE STUDENT JOURNEY HUB
  // ============================================================
  if (phase === 'completed') {
    return <JourneyHub historyData={historyData} loading={loadingHistory} />;
  }

  // ============================================================
  // PHASE 2: ACTIVE DIALOGIC WORKSPACE (BLUEPRINT CAD SHEET)
  // ============================================================
  const studentTurnCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 md:py-6">
      {/* Top Status Strip */}
      <header className="mb-4 bg-paper border border-line-control shadow-hard px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="w-2 h-2 bg-emerald inline-block border border-ink"
          />
          <div>
            <h1 className="font-ui-mono text-xs sm:text-sm uppercase tracking-wider font-semibold text-ink m-0">
              {workshopName || `Sesión Experimental · ${code}`}
            </h1>
            <p className="font-ui-mono text-xs text-ink-2 m-0">
              Participante: <span className="text-ink font-medium">{name || 'Anónimo'}</span> · Turnos enviados:{' '}
              <span className="stat font-semibold text-ink">{studentTurnCount}</span>
              {chainOrder > 1 ? ` · Etapa #${chainOrder}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LanguageSelector compact={true} />
          <button
            type="button"
            onClick={() => setCaseOpenMobile(!caseOpenMobile)}
            aria-expanded={caseOpenMobile}
            className={`lg:hidden min-h-[44px] px-3 py-2 border font-ui-mono text-xs inline-flex items-center gap-1.5 transition-colors ${
              caseOpenMobile
                ? 'bg-cobalt text-paper border-cobalt font-semibold'
                : 'border-line-control bg-paper-subtle hover:bg-paper text-ink'
            }`}
          >
            <CadIcon name="FileText" size={14} />
            <span>{caseOpenMobile ? 'Ocultar caso' : 'Ver caso'}</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmCompleteOpen(true)}
            disabled={streaming}
            className="min-h-[44px] px-3.5 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink-2 hover:text-ink inline-flex items-center gap-1.5 transition-colors"
          >
            <CadIcon name="CheckSquare" size={14} />
            <span>{studentTurnCount > 0 ? 'Concluir actividad' : 'Pasar a evaluación'}</span>
          </button>
        </div>
      </header>

      {/* Main 2-Column Blueprint Layout: Chat Log (Left 8 cols) + Case Sheet (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Mobile Collapsible Case Sheet (Compact & Scrollable) */}
        {caseOpenMobile && (
          <div className="lg:hidden col-span-1 mb-2">
            <div className="p-3.5 bg-paper border-2 border-cobalt shadow-hard space-y-2">
              <div className="flex items-center justify-between border-b border-line-control pb-2">
                <span className="font-ui-mono text-xs uppercase tracking-wider font-semibold text-cobalt flex items-center gap-1.5">
                  <CadIcon name="FileText" size={14} />
                  <span>{version?.title || 'Escenario de Caso'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCaseOpenMobile(false)}
                  aria-label="Cerrar hoja de caso"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center border border-line-control bg-paper text-ink"
                >
                  <CadIcon name="X" size={14} />
                </button>
              </div>
              <div className="font-body text-xs text-ink leading-relaxed prose max-w-none max-h-52 overflow-y-auto pr-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {version?.case_content || 'Sin descripción de escenario registrada.'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Dialogue Column */}
        <div className="lg:col-span-8">
          <BlueprintPanel
            codeTag="REG_DIALOGO"
            title="Registro de Interacción Estudiante — Asistente"
            subtitle="Plantea tu situación, responde preguntas de contexto y evalúa la pertinencia de las propuestas."
            headingLevel={2}
          >
            {/* Accessible Live Transcript Region */}
            <div
              role="log"
              aria-live="polite"
              aria-label="Mensajes de la conversación"
              className="min-h-[380px] max-h-[540px] overflow-y-auto p-3 sm:p-4 bg-paper-subtle border border-line-control space-y-4 mb-4"
            >
              {messages.length === 0 && (
                <div className="p-6 bg-paper border border-dashed border-line-control text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 border border-line-control bg-paper-subtle text-cobalt">
                    <CadIcon name="MessageSquare" size={18} />
                  </div>
                  <h3 className="font-ui-mono text-xs uppercase tracking-wider font-semibold text-ink m-0">
                    Inicia la conversación experimental
                  </h3>
                  <p className="font-body text-xs text-ink-2 max-w-md mx-auto leading-relaxed m-0">
                    Revisa la Hoja de Caso a la derecha y escribe tu primer mensaje describiendo el problema o
                    consulta con tus propias palabras.
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const wordCount = (msg.content || '').trim().split(/\s+/).filter(Boolean).length;
                return (
                  <article
                    key={msg.id || idx}
                    className={`p-3.5 border ${
                      isUser
                        ? 'bg-paper border-line-control ml-0 sm:ml-8'
                        : 'bg-cobalt-tint border-cobalt mr-0 sm:mr-8'
                    }`}
                  >
                    <header className="flex flex-wrap items-center justify-between gap-2 pb-1.5 mb-2 border-b border-dotted border-rule">
                      <span className="font-ui-mono text-xs font-semibold uppercase tracking-wider text-ink inline-flex items-center gap-1.5">
                        <CadIcon name={isUser ? 'User' : 'Terminal'} size={13} />
                        <span>{isUser ? 'ESTUDIANTE' : 'ASISTENTE'}</span>
                      </span>
                      <div className="flex items-center gap-2 font-ui-mono text-xs text-ink-2 stat">
                        <span>{wordCount} pal.</span>
                        {!pauseLiveTelemetry && !isUser && msg.telemetry?.ttft_ms !== undefined && (
                          <span>· TTFT {msg.telemetry.ttft_ms} ms</span>
                        )}
                      </div>
                    </header>

                    <div className="font-body text-sm text-ink leading-relaxed prose max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {stripThinkingTags(msg.content)}
                      </ReactMarkdown>
                    </div>

                    {streaming && idx === messages.length - 1 && !isUser && (
                      <div className="mt-2 font-ui-mono text-xs text-cobalt">
                        [Generando respuesta…]
                      </div>
                    )}
                  </article>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chained Step > 1 Previous Opening Prompt Reuse Card */}
            {previousFirstMessage && !suggestionDismissed && messages.length === 0 && (
              <div className="mb-4 p-3.5 bg-cobalt-tint border border-cobalt space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-ui-mono text-xs font-semibold uppercase text-cobalt">
                    Continuidad experimental · Tu primer mensaje en la Etapa anterior:
                  </span>
                </div>
                <blockquote className="p-2.5 bg-paper border-l-2 border-cobalt font-body text-xs text-ink italic m-0">
                  “{previousFirstMessage}”
                </blockquote>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInput(previousFirstMessage);
                      firstKeyTimeRef.current = Date.now();
                      setSuggestionDismissed(true);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="min-h-[44px] px-3 py-1.5 bg-cobalt text-paper border border-cobalt font-ui-mono text-xs font-medium"
                  >
                    Reutilizar el mismo mensaje inicial
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSuggestionDismissed(true);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="min-h-[44px] px-3 py-1.5 bg-paper text-ink border border-line-control font-ui-mono text-xs"
                  >
                    Redactar uno nuevo
                  </button>
                </div>
              </div>
            )}

            {/* Message Composer */}
            <div className="space-y-2">
              <label htmlFor="session-chat-input" className="font-ui-mono text-xs uppercase font-semibold text-ink block">
                Tu intervención (Enter para enviar · Shift+Enter para nueva línea)
              </label>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                <textarea
                  id="session-chat-input"
                  ref={inputRef}
                  rows={2}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe aquí tu planteamiento o respuesta al asistente..."
                  disabled={streaming}
                  className="flex-1 p-3 bg-paper border border-line-control font-body text-sm text-ink min-h-[56px]"
                />
                <SplitButton
                  variant="primary"
                  iconBox="Send"
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  loading={streaming}
                >
                  Enviar turno
                </SplitButton>
              </div>
            </div>
          </BlueprintPanel>
        </div>

        {/* Desktop Persistent Case Sheet */}
        <aside aria-label="Hoja de caso experimental" className="hidden lg:block lg:col-span-4 space-y-4">
          <BlueprintPanel
            codeTag="HOJA_CASO"
            title={version?.title || 'Escenario Asignado'}
            subtitle="Referencia permanente durante la sesión"
            headingLevel={2}
          >
            <div className="mb-3 flex items-center justify-between">
              <StatBadge label="Documento" value="Referencia activa" variant="cobalt" />
              <MarginNote tone="vermilion" rotate={2}>
                CONTEXTO BASE
              </MarginNote>
            </div>
            <div className="font-body text-sm text-ink leading-relaxed prose max-w-none max-h-[480px] overflow-y-auto pr-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {version?.case_content || 'Escenario de conversación abierta.'}
              </ReactMarkdown>
            </div>
          </BlueprintPanel>
        </aside>
      </div>

      {/* Accessible Confirmation Dialog before completing session */}
      {confirmCompleteOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-complete-title"
        >
          <div className="max-w-md w-full">
            <BlueprintPanel
              codeTag="CONFIRMACIÓN"
              title="¿Finalizar el diálogo y pasar a la evaluación?"
              headingLevel={2}
            >
              <p id="confirm-complete-title" className="font-body text-sm text-ink leading-relaxed mb-4">
                Una vez cerrada la conversación pasarás al cuestionario breve de cierre y ya no podrás enviar más
                turnos en esta etapa ({studentTurnCount} turno{studentTurnCount === 1 ? '' : 's'} registrado
                {studentTurnCount === 1 ? '' : 's'}).
              </p>
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-line-control">
                <button
                  type="button"
                  onClick={() => setConfirmCompleteOpen(false)}
                  className="min-h-[44px] px-4 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink"
                >
                  Seguir conversando
                </button>
                <SplitButton
                  variant="primary"
                  iconBox="Check"
                  onClick={confirmAndAdvance}
                >
                  Confirmar y continuar
                </SplitButton>
              </div>
            </BlueprintPanel>
          </div>
        </div>
      )}
    </div>
  );
}
