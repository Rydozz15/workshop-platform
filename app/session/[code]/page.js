'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BlueprintPanel,
  SplitButton,
  OnboardingStepper,
  CompletionScreen,
  Stepper,
  Drawer,
  LanguageSelector,
  Logo,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { useLanguage, useTr } from '@/lib/i18n/context';
import SurveyQuestion from '@/components/survey/survey-question';
import { validateAnswers } from '@/lib/survey-schema';

function stripThinkingTags(text) {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '')
    .trim();
}

export default function SessionPage({ params }) {
  const tr = useTr();
  const { code } = use(params);
  const { t, locale } = useLanguage();


  const [phase, setPhase] = useState('welcome'); // 'welcome' | 'chat' | 'survey' | 'completed'
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [version, setVersion] = useState(null);
  const [workshopName, setWorkshopName] = useState('');
  const [onboardingInstructions, setOnboardingInstructions] = useState(null);
  const [chainOrder, setChainOrder] = useState(1);
  const [stepCount, setStepCount] = useState(1);
  const [consentRequired, setConsentRequired] = useState(false);
  const [consentUrl, setConsentUrl] = useState(null);
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

  // Client-side Learning Analytics timing & tab-inactivity instrumentation
  const lastBotFinishTimeRef = useRef(null);
  const firstKeyTimeRef = useRef(null);
  const turnTabBlurredRef = useRef(false);
  const tabSwitchCountRef = useRef(0);
  const blurStartRef = useRef(null);
  const inactiveMsRef = useRef(0);

  const logRef = useRef(null);
  const inputRef = useRef(null);

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
    // Scroll only the message list: scrollIntoView would also move the whole page and make it jump.
    const log = logRef.current;
    log?.scrollTo({ top: log.scrollHeight, behavior: prefersReduced ? 'auto' : 'smooth' });
  }, [messages]);

  // Grow the message box with what is typed (up to ~5 lines), like other chat apps.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

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
        setError(
          data.code === 'campaign_closed'
            ? tr('Esta campaña ya terminó: ya no se aceptan nuevos participantes.')
            : data.code === 'workshop_not_found'
              ? tr('No encontramos una actividad con ese código. Revisa que esté bien escrito.')
              : data.code === 'no_versions'
                ? tr('Esta actividad todavía no está lista. Avisa a quien la dirige.')
                : data.code === 'code_required'
                  ? tr('Escribe el código que te dieron para poder entrar.')
                  : tr('No se pudo iniciar la sesión.')
        );
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
      setError(tr('Error de conexión con el servidor.'));
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
          setStepCount(info.step_count || 1);
          setConsentRequired(Boolean(info.consent_required));
          setConsentUrl(info.consent_url || null);
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

  // Load the participant's history (recap screen) upon completion
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
        body: JSON.stringify({ message: userMsg, client_telemetry: clientTelemetry, locale }),
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: tr('Aviso del sistema: no se pudo obtener respuesta en este turno. Intenta nuevamente.'),
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
        { role: 'assistant', content: tr('Error de red: conexión interrumpida.') },
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
        setSurveyError(tr('No se pudo guardar la encuesta.'));
        setSubmittingSurvey(false);
      }
    } catch {
      setSurveyError(tr('Error de conexión al enviar tus respuestas.'));
      setSubmittingSurvey(false);
    }
  };

  const phases = [
    { id: 'chat', label: tr('Conversación') },
    ...(surveyConfig.length > 0 ? [{ id: 'survey', label: tr('Preguntas finales') }] : []),
    { id: 'done', label: tr('Listo') },
  ];
  const phaseIndex = Math.max(0, phases.findIndex((p) => p.id === phase));

  // ============================================================
  // PHASE 1: INTEGRATED 3-STEP ONBOARDING STEPPER
  // ============================================================
  if (phase === 'welcome') {
    return (
      <OnboardingStepper
        code={code}
        workshopName={workshopName}
        chainOrder={chainOrder}
        stepCount={stepCount}
        consentRequired={consentRequired}
        consentUrl={consentUrl}
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
    const surveyCheck = validateAnswers(surveyConfig, surveyAnswers, { tr });
    const unanswered = surveyConfig.filter((q) => {
      if (q.required === false) return false;
      const v = surveyAnswers[q.id];
      return v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
    });
    const invalidCount = Object.keys(surveyCheck.errors).length - unanswered.length;
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <LanguageSelector compact={true} />
        </div>
        <Stepper steps={phases} current={phaseIndex} label={tr('Progreso de la actividad')} />

        <BlueprintPanel
          title={tr('Cuéntanos cómo te fue')}
          subtitle={`${workshopName || tr('Actividad')} · ${tr('Las preguntas marcadas con * son obligatorias.')}`}
          headingLevel={2}
        >
          {surveyError && (
            <div role="alert" className="mb-5 p-3 border-2 border-vermilion-ink bg-vermilion-tint font-body text-sm text-vermilion-ink flex items-center gap-2">
              <CadIcon name="AlertTriangle" size={16} />
              <span>{surveyError}</span>
            </div>
          )}

          <form onSubmit={submitSurvey} className="space-y-5">
            {surveyConfig.map((q, idx) => (
              <SurveyQuestion key={q.id || idx} question={q} answers={surveyAnswers} setAnswers={setSurveyAnswers} tr={tr} />
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line-control">
              <button
                type="button"
                onClick={() => setPhase('chat')}
                className="min-h-[44px] px-4 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2"
              >
                <CadIcon name="ArrowLeft" size={14} />
                <span>{tr('Volver a la conversación')}</span>
              </button>
              <div className="flex flex-col items-end gap-1">
                {unanswered.length > 0 && (
                  <span className="font-body text-sm text-ink-2">{tr('Faltan {n} pregunta(s) obligatoria(s)', { n: unanswered.length })}
                  </span>
                )}
                {invalidCount > 0 && (
                  <span className="font-body text-sm text-vermilion-ink">{tr('Revisa las respuestas marcadas.')}</span>
                )}
                <SplitButton type="submit" variant="primary" iconBox="Check" loading={submittingSurvey} disabled={!surveyCheck.ok}>{tr('Enviar y terminar')}</SplitButton>
              </div>
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
    return <CompletionScreen name={name} historyData={historyData} loading={loadingHistory} />;
  }

  // ============================================================
  // PHASE 2: ACTIVE DIALOGIC WORKSPACE (BLUEPRINT CAD SHEET)
  // ============================================================
  const studentTurnCount = messages.filter((m) => m.role === 'user').length;
  const hasSurvey = surveyConfig.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 md:py-6 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <Logo withWordmark={false} size={30} />
          <div className="min-w-0">
            <h1 className="ps-h3 truncate">{workshopName || tr('Actividad')}</h1>
            <p className="ps-meta m-0">
              {name || tr('Participante')}
              {stepCount > 1 ? ` · ${tr('Parte {n} de {total}', { n: chainOrder, total: stepCount })}` : ''}
            </p>
          </div>
        </div>
        <LanguageSelector compact={true} />
      </header>

      <Stepper steps={phases} current={phaseIndex} label={tr('Progreso de la actividad')} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <BlueprintPanel title={tr('Conversación')} subtitle={tr('Escribe con tus palabras. El asistente te responderá.')} headingLevel={2}>
            <div className="lg:hidden mb-3">
              <button
                type="button"
                onClick={() => setCaseOpenMobile(true)}
                className="min-h-[44px] px-3 py-2 border border-line-strong bg-paper hover:bg-paper-subtle font-body text-sm font-semibold text-ink inline-flex items-center gap-2"
              >
                <CadIcon name="FileText" size={16} />{' '}{tr('Ver caso')}
              </button>
            </div>
            <div
              role="log"
              aria-live="polite"
              aria-label={tr('Mensajes de la conversación')}
              ref={logRef}
              className="min-h-[200px] max-h-[calc(100dvh-22rem)] lg:min-h-[340px] lg:max-h-[540px] overflow-y-auto overscroll-contain scroll-smooth p-3 sm:p-4 bg-paper-subtle border border-line-control space-y-4 mb-4"
            >
              {messages.length === 0 && (
                <div className="p-6 bg-paper border border-dashed border-line-control text-center space-y-2">
                  <h3 className="ps-h3">{tr('Empieza cuando quieras')}</h3>
                  <p className="font-body text-sm text-ink-2 max-w-md mx-auto m-0">{tr('Lee el caso y escribe tu primer mensaje abajo.')}</p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <article
                    key={msg.id || idx}
                    className={`p-3.5 border ${isUser ? 'bg-paper border-line-control ml-0 sm:ml-8' : 'bg-cobalt-tint border-cobalt mr-0 sm:mr-8'}`}
                  >
                    <p className="font-body text-sm font-semibold text-ink m-0 mb-1.5 flex items-center gap-1.5">
                      <CadIcon name={isUser ? 'User' : 'MessageCircle'} size={14} />
                      {isUser ? tr('Tú') : tr('Asistente')}
                    </p>
                    <div className="font-body text-base text-ink leading-relaxed prose max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{stripThinkingTags(msg.content)}</ReactMarkdown>
                    </div>
                    {streaming && idx === messages.length - 1 && !isUser && (
                      <p className="ps-meta m-0 mt-2" role="status">{tr('Escribiendo…')}</p>
                    )}
                  </article>
                );
              })}
            </div>

            {previousFirstMessage && !suggestionDismissed && messages.length === 0 && (
              <div className="mb-4 p-3.5 bg-cobalt-tint border border-cobalt space-y-2.5">
                <p className="font-body text-sm font-semibold text-cobalt m-0">{tr('Tu primer mensaje en la parte anterior fue:')}</p>
                <blockquote className="p-2.5 bg-paper border-l-2 border-cobalt font-body text-sm text-ink italic m-0">“{previousFirstMessage}”</blockquote>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInput(previousFirstMessage);
                      firstKeyTimeRef.current = Date.now();
                      setSuggestionDismissed(true);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="min-h-[44px] px-3 py-1.5 bg-cobalt text-paper border border-cobalt font-body text-sm font-medium"
                  >{tr('Usar el mismo mensaje')}</button>
                  <button
                    type="button"
                    onClick={() => {
                      setSuggestionDismissed(true);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="min-h-[44px] px-3 py-1.5 bg-paper text-ink border border-line-control font-body text-sm"
                  >{tr('Escribir uno nuevo')}</button>
                </div>
              </div>
            )}

            <div className="space-y-2 sticky bottom-0 z-10 bg-paper pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:static lg:pt-0 lg:pb-0">
              <label htmlFor="session-chat-input" className="font-body text-sm font-semibold text-ink block">{tr('Tu mensaje')}{' '}<span className="hidden sm:inline font-normal text-ink-2">{tr('(Enter envía · Shift + Enter salto de línea)')}</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                <textarea
                  id="session-chat-input"
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onFocus={() => setTimeout(() => {
                    const log = logRef.current;
                    log?.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
                  }, 250)}
                  onKeyDown={handleKeyDown}
                  placeholder={tr('Escribe aquí…')}
                  disabled={streaming}
                  className="flex-1 p-3 bg-paper border border-line-control font-body text-base text-ink min-h-[48px] max-h-[140px] resize-none"
                />
                <SplitButton variant="primary" iconBox="Send" onClick={sendMessage} disabled={!input.trim() || streaming} loading={streaming} aria-label={tr('Enviar mensaje')}>{tr('Enviar')}</SplitButton>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t-2 border-line-strong flex flex-wrap items-center justify-between gap-3">
              <p className="font-body text-sm text-ink-2 m-0 max-w-md">
                {studentTurnCount === 0
                  ? tr('Cuando termines de conversar, podrás pasar al siguiente paso.')
                  : hasSurvey
                  ? tr('Cuando hayas terminado de conversar, pasa a las preguntas finales.')
                  : tr('Cuando hayas terminado de conversar, finaliza la actividad.')}
              </p>
              <SplitButton
                variant={studentTurnCount > 0 ? 'primary' : 'secondary'}
                iconBox="ArrowRight"
                onClick={() => setConfirmCompleteOpen(true)}
                disabled={streaming}
              >{tr('Terminar conversación')}</SplitButton>
            </div>
          </BlueprintPanel>
        </div>

        <aside aria-label={tr('Tu caso')} className="hidden lg:block lg:col-span-4">
          <BlueprintPanel title={version?.title || tr('Tu caso')} subtitle={tr('Puedes volver a leerlo cuando quieras.')} headingLevel={2}>
            <div className="font-body text-sm text-ink leading-relaxed prose max-w-none max-h-[480px] overflow-y-auto pr-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{version?.case_content || tr('Conversación abierta.')}</ReactMarkdown>
            </div>
          </BlueprintPanel>
        </aside>
      </div>

      <div className="lg:hidden">
        <Drawer open={caseOpenMobile} onClose={() => setCaseOpenMobile(false)} title={version?.title || tr('Tu caso')} closeLabel={tr('Cerrar caso')}>
          <div className="font-body text-base text-ink leading-relaxed prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{version?.case_content || tr('Conversación abierta.')}</ReactMarkdown>
          </div>
        </Drawer>
      </div>

      {confirmCompleteOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-complete-title">
          <div className="max-w-md w-full">
            <BlueprintPanel title={tr('¿Terminar la conversación?')} headingLevel={2}>
              <p id="confirm-complete-title" className="font-body text-base text-ink leading-relaxed mb-4">
                {hasSurvey ? tr('Pasarás a unas preguntas finales y ya no podrás enviar más mensajes en esta parte.') : tr('Se cerrará la actividad y ya no podrás enviar más mensajes en esta parte.')}{' '}{studentTurnCount > 0 ? tr('Enviaste {n} mensaje(s).', { n: studentTurnCount }) : tr('Todavía no has enviado ningún mensaje.')}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-line-control">
                <button type="button" onClick={() => setConfirmCompleteOpen(false)} className="min-h-[44px] px-4 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink">{tr('Seguir conversando')}</button>
                <SplitButton variant="primary" iconBox="Check" onClick={confirmAndAdvance}>{tr('Sí, terminar')}</SplitButton>
              </div>
            </BlueprintPanel>
          </div>
        </div>
      )}
    </div>
  );
}
