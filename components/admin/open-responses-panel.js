'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { BlueprintPanel, Disclosure } from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { AI_CONSENT_KEY } from '@/lib/ai-consent';

const BTN = 'min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2 disabled:opacity-60';
const BTN_PRIMARY = 'min-h-[44px] px-4 py-2 border border-line-strong bg-cobalt hover:bg-cobalt-hover text-paper font-body text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60';
// The API routes read only the most recent answers (30 per step to compare steps, 50 for one step):
// the preview shows exactly those.
const sentLimit = (group) => (group.mode === 'change' ? 30 : 50);
const sentTexts = (group) => group.steps.map((s) => ({ ...s, responses: s.responses.slice(-sentLimit(group)) }));

/**
 * Warning shown before the open answers leave the platform. Accepting records the decision (the parent
 * saves it, so it is asked only once); declining closes it and nothing is sent or saved.
 */
function ConsentDialog({ group, tr, busy, error, onAccept, onDecline }) {
  const titleId = useId();
  const ref = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onDecline();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, [onDecline]);

  const shown = sentTexts(group);
  const total = shown.reduce((acc, s) => acc + s.responses.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="presentation">
      <div className="absolute inset-0 bg-ink/65" onClick={onDecline} />
      <div ref={ref} tabIndex={-1} role="alertdialog" aria-modal="true" aria-labelledby={titleId} className="relative w-full max-w-2xl max-h-full overflow-y-auto bg-paper border-2 border-ink shadow-hard">
        <header className="flex items-center gap-3 px-4 py-3 bg-vermilion-tint border-b-2 border-vermilion-ink">
          <CadIcon name="AlertTriangle" size={20} className="text-vermilion-ink shrink-0" />
          <h2 id={titleId} className="ps-h3 m-0 text-vermilion-ink">{tr('Antes de enviar las respuestas a una IA')}</h2>
        </header>
        <div className="p-4 sm:p-6 space-y-4 font-body text-sm text-ink">
          <p className="m-0">
            {tr('Para resumir las respuestas abiertas, lo que escribieron tus participantes se enviará al proveedor de IA configurado (OpenRouter o Groq). Sale de esta plataforma y queda sujeto a las políticas de ese proveedor.')}
          </p>
          <ul className="list-disc pl-5 space-y-1 m-0">
            <li>{tr('Las respuestas pueden contener temas sensibles o datos personales que el participante escribió, aunque no enviamos nombres ni códigos.')}</li>
            <li>{tr('Revisa lo que se enviará y confirma que tienes permiso para hacerlo (por ejemplo, el consentimiento de los participantes y la aprobación de tu comité de ética).')}</li>
            <li>{tr('Si aceptas, guardaremos tu decisión y no volveremos a preguntarlo. Si no estás de acuerdo, no se envía nada.')}</li>
          </ul>
          <Disclosure title={tr('Ver exactamente lo que se enviará')} summary={tr('{n} respuesta(s)', { n: total })}>
            <div className="max-h-64 overflow-y-auto space-y-3">
              {shown.map((s) => (
                <div key={s.id}>
                  <p className="font-semibold m-0">{s.name}</p>
                  <ol className="list-decimal pl-5 m-0 space-y-1">
                    {s.responses.map((r, i) => <li key={i} className="whitespace-pre-wrap">{r}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </Disclosure>
          {error && <p role="alert" className="m-0 text-vermilion-ink font-semibold">{error}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" disabled={busy} onClick={onAccept} className={BTN_PRIMARY}>
              <CadIcon name="Check" size={16} />{' '}{tr('Acepto y enviar')}
            </button>
            <button type="button" disabled={busy} onClick={onDecline} className={BTN}>{tr('No acepto')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupCard({ group, tr, askConsent, consent }) {
  const [state, setState] = useState({ status: 'idle', summary: '', error: '' });
  const counts = group.steps.map((s) => `${s.name || '–'}: ${s.responses.length}`).join(' · ');

  const run = async () => {
    setState({ status: 'loading', summary: '', error: '' });
    try {
      const sent = sentTexts(group);
      // One step: the main themes. Several steps: how the answers changed between them.
      const res = await fetch(group.mode === 'change' ? '/api/admin/analytics/evolution' : '/api/admin/analytics/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          group.mode === 'change'
            ? { question: group.text, stepsData: sent.map((s) => ({ step: s.name, responses: s.responses })) }
            : { question: group.text, texts: sent[0].responses }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 && data.error === 'consent_required') {
        // The saved consent is gone (revoked): ask again instead of failing.
        consent.forget();
        setState({ status: 'idle', summary: '', error: '' });
        askConsent(run, group);
        return;
      }
      if (!res.ok || data.error) throw new Error(tr('No pudimos generar el resumen. Intenta de nuevo.'));
      setState({ status: 'done', summary: data.summary || '', error: '' });
    } catch (e) {
      setState({ status: 'error', summary: '', error: e.message });
    }
  };

  const onClick = () => (consent.given ? run() : askConsent(run, group));

  return (
    <div className="border border-line-control p-3 space-y-3">
      <p className="font-body text-sm font-semibold text-ink m-0">{group.text}</p>
      <p className="ps-meta m-0">{tr('Respuestas por paso')}{' — '}{counts}</p>
      <button type="button" onClick={onClick} disabled={state.status === 'loading'} className={BTN}>
        <CadIcon name="FileText" size={16} />{' '}{state.status === 'loading' ? tr('Generando resumen…') : group.mode === 'change' ? tr('Resumir los cambios con IA') : tr('Resumir los temas con IA')}
      </button>
      {state.error && <p role="alert" className="font-body text-sm text-vermilion-ink m-0">{state.error}</p>}
      {state.status === 'done' && (
        <div className="border-2 border-line-strong bg-paper-subtle p-4 space-y-2">
          <p className="font-body text-sm text-ink m-0 whitespace-pre-wrap">{state.summary}</p>
          <p className="ps-meta m-0">{tr('Resumen generado por una IA: puede tener errores. Contrástalo con las respuestas.')}</p>
        </div>
      )}
    </div>
  );
}

/**
 * AI summary of open-ended answers: the main themes (one step) or how they changed (2+ steps). Renders
 * nothing until some open question has an answer (lib/step-evolution.js buildOpenResponses). The first
 * use asks for consent; the acceptance is stored in the settings table and not asked again, and it can be
 * revoked in Settings.
 */
export default function OpenResponsesPanel({ groups, tr }) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [dialog, setDialog] = useState(null); // { group, run }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!groups || groups.length === 0) return undefined;
    let cancelled = false;
    fetch('/api/admin/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => !cancelled && setConsentGiven(Boolean(s?.[AI_CONSENT_KEY])))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [groups]);

  if (!groups || groups.length === 0) return null;

  const accept = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [AI_CONSENT_KEY]: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error();
      setConsentGiven(true);
      const run = dialog?.run;
      setDialog(null);
      setBusy(false);
      run?.();
    } catch {
      // If the decision cannot be saved, nothing is sent.
      setError(tr('No pudimos guardar tu decisión, así que no se envió nada. Intenta de nuevo.'));
      setBusy(false);
    }
  };

  const decline = () => {
    setDialog(null);
    setError('');
  };

  return (
    <BlueprintPanel title={tr('Respuestas abiertas')} subtitle={tr('Un resumen con IA de lo que escribieron los participantes en las preguntas abiertas.')}>
      <div className="space-y-3">
        {groups.map((g) => (
          <GroupCard
            key={g.key}
            group={g}
            tr={tr}
            consent={{ given: consentGiven, forget: () => setConsentGiven(false) }}
            askConsent={(run, group) => setDialog({ run, group })}
          />
        ))}
      </div>
      {dialog && <ConsentDialog group={dialog.group} tr={tr} busy={busy} error={error} onAccept={accept} onDecline={decline} />}
    </BlueprintPanel>
  );
}
