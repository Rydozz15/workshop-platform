'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BlueprintPanel, Field, Disclosure, InfoTip } from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';

const INPUT = 'w-full font-body text-sm text-ink bg-paper border border-line-control px-3 py-2';
const BTN = 'min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2';
const BTN_PRIMARY = 'min-h-[44px] px-4 py-2 border border-line-strong bg-cobalt hover:bg-cobalt-hover text-paper font-body text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60';
const PROVIDERS = ['openrouter', 'groq', 'openai', 'anthropic', 'ollama'];

let keyCounter = 0;
const nextKey = () => `k${++keyCounter}`;

const newCondition = (over = {}) => ({ key: nextKey(), id: undefined, title: '', case_content: '', system_prompt: '', ...over });
const newQuestion = (over = {}) => ({ key: nextKey(), id: `q_${Date.now().toString(36)}_${keyCounter}`, text: '', type: 'likert', required: true, ...over });
const newStep = (n, over = {}) => ({
  key: nextKey(),
  id: undefined,
  name: `Paso ${n}`,
  onboarding_instructions: '',
  system_prompt: '',
  ai_provider: 'openrouter',
  openrouter_model: '',
  maintain_version: false,
  questions: [],
  conditions: [newCondition()],
  ...over,
});

function fromDetail(detail) {
  return {
    meta: {
      name: detail.name || '',
      description: detail.description || '',
      consent_required: Boolean(detail.consent_required),
      consent_url: detail.consent_url || '',
    },
    steps: detail.steps.map((s) => ({
      key: nextKey(),
      id: s.id,
      name: s.name || '',
      onboarding_instructions: s.onboarding_instructions || '',
      system_prompt: s.system_prompt || '',
      ai_provider: s.ai_provider || 'openrouter',
      openrouter_model: s.openrouter_model || '',
      maintain_version: Boolean(s.maintain_version),
      questions: (s.survey_config || []).map((q) => ({ key: nextKey(), required: false, ...q })),
      conditions: (s.conditions || []).map((c) => ({
        key: nextKey(),
        id: c.id,
        title: c.title || '',
        case_content: c.case_content || '',
        system_prompt: c.system_prompt || '',
      })),
    })),
  };
}

function toPayload(meta, steps) {
  return {
    ...meta,
    steps: steps.map((s) => ({
      id: s.id,
      name: s.name,
      onboarding_instructions: s.onboarding_instructions,
      system_prompt: s.system_prompt,
      ai_provider: s.ai_provider,
      openrouter_model: s.openrouter_model,
      maintain_version: s.maintain_version,
      survey_config: s.questions
        .filter((q) => q.text.trim())
        .map(({ id, text, type, required }) => ({ id, text: text.trim(), type, required })),
      conditions: s.conditions.map(({ id, title, case_content, system_prompt }) => ({ id, title, case_content, system_prompt })),
    })),
  };
}

function move(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export default function CampaignEditor({ campaignId = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(Boolean(campaignId));
  const [meta, setMeta] = useState({ name: '', description: '', consent_required: false, consent_url: '' });
  const [steps, setSteps] = useState(() => [newStep(1)]);
  const [openKey, setOpenKey] = useState(() => steps[0]?.key ?? null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null);
  const [shareCode, setShareCode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    fetch(`/api/admin/campaigns/${encodeURIComponent(campaignId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No encontramos esta campaña.'))))
      .then((detail) => {
        if (cancelled) return;
        const loaded = fromDetail(detail);
        setMeta(loaded.meta);
        setSteps(loaded.steps);
        setOpenKey(loaded.steps[0]?.key || null);
        setShareCode(detail.share_code);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const patchStep = (key, patch) => setSteps((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const patchCondition = (stepKey, ckey, patch) =>
    setSteps((list) =>
      list.map((s) => (s.key === stepKey ? { ...s, conditions: s.conditions.map((c) => (c.key === ckey ? { ...c, ...patch } : c)) } : s))
    );
  const patchQuestion = (stepKey, qkey, patch) =>
    setSteps((list) =>
      list.map((s) => (s.key === stepKey ? { ...s, questions: s.questions.map((q) => (q.key === qkey ? { ...q, ...patch } : q)) } : s))
    );

  const addStep = () => {
    const step = newStep(steps.length + 1);
    setSteps((list) => [...list, step]);
    setOpenKey(step.key);
  };
  const duplicateStep = (index) => {
    const src = steps[index];
    const copy = {
      ...src,
      key: nextKey(),
      id: undefined,
      name: `${src.name} (copia)`,
      conditions: src.conditions.map((c) => ({ ...c, key: nextKey(), id: undefined })),
      questions: src.questions.map((q) => ({ ...q, key: nextKey() })),
    };
    setSteps((list) => [...list.slice(0, index + 1), copy, ...list.slice(index + 1)]);
    setOpenKey(copy.key);
  };
  const removeStep = (key) => {
    setSteps((list) => list.filter((s) => s.key !== key));
    setConfirmDeleteKey(null);
  };

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await fetch(campaignId ? `/api/admin/campaigns/${encodeURIComponent(campaignId)}` : '/api/admin/campaigns', {
        method: campaignId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(meta, steps)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la campaña.');
      router.push('/admin/campaigns');
    } catch (e) {
      setError(e.message);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <p className="ps-lead" role="status">Cargando campaña…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/campaigns" className="ps-meta inline-flex items-center gap-1 hover:text-cobalt">
            <CadIcon name="ArrowLeft" size={14} /> Volver a campañas
          </Link>
          <h1 className="ps-h1 mt-1">{campaignId ? 'Editar campaña' : 'Crear campaña'}</h1>
          <p className="ps-lead mt-1">
            {campaignId
              ? 'Cambia lo que necesites; los participantes que ya empezaron no se ven afectados.'
              : 'Empieza con el nombre y arma los pasos que vivirán tus participantes.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {shareCode && (
            <a href={`/session/${shareCode}`} target="_blank" rel="noopener noreferrer" className={BTN}>
              <CadIcon name="ExternalLink" size={16} /> Ver como participante
            </a>
          )}
          <button type="button" onClick={save} disabled={saving} className={BTN_PRIMARY}>
            <CadIcon name="Save" size={16} /> {saving ? 'Guardando…' : 'Guardar campaña'}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="border-2 border-vermilion-ink bg-vermilion-tint text-vermilion-ink p-3 font-body text-sm">
          {error}
        </div>
      )}

      <BlueprintPanel title="1. Datos de la campaña" subtitle="Lo básico para identificarla.">
        <Field label="Nombre de la campaña" required>
          <input
            className={INPUT}
            value={meta.name}
            onChange={(e) => setMeta({ ...meta, name: e.target.value })}
            placeholder="Ej.: Tutoría con IA, primer semestre"
          />
        </Field>
        <Field label="Descripción" help="Opcional. Solo la verás tú.">
          <textarea
            className={INPUT}
            rows={2}
            value={meta.description}
            onChange={(e) => setMeta({ ...meta, description: e.target.value })}
          />
        </Field>
        <Disclosure title="Consentimiento informado" summary={meta.consent_required ? 'Se pedirá antes de comenzar' : 'No se pide'}>
          <label className="flex items-center gap-2 font-body text-sm text-ink min-h-[44px]">
            <input
              type="checkbox"
              checked={meta.consent_required}
              onChange={(e) => setMeta({ ...meta, consent_required: e.target.checked })}
              className="w-5 h-5"
            />
            Pedir que los participantes acepten antes de comenzar
          </label>
          {meta.consent_required && (
            <Field label="Enlace al documento de consentimiento" help="Los participantes podrán abrirlo desde la casilla de aceptación.">
              <input
                className={INPUT}
                type="url"
                value={meta.consent_url}
                onChange={(e) => setMeta({ ...meta, consent_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
          )}
        </Disclosure>
      </BlueprintPanel>

      <BlueprintPanel
        title="2. Pasos de la campaña"
        subtitle="Los participantes los recorren en este orden."
        headerSlot={<span className="ps-meta">{steps.length} {steps.length === 1 ? 'paso' : 'pasos'}</span>}
      >
        <ol className="list-none m-0 p-0 space-y-3">
          {steps.map((step, index) => {
            const open = openKey === step.key;
            const questionCount = step.questions.filter((q) => q.text.trim()).length;
            return (
              <li key={step.key} className="border border-line-control bg-paper">
                <div className="flex flex-wrap items-center gap-2 bg-paper-subtle border-b border-line-control pr-2">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenKey(open ? null : step.key)}
                    className="flex-1 min-w-0 min-h-[56px] px-3 py-2 flex items-center gap-3 text-left hover:bg-paper-muted"
                  >
                    <span className="ps-step__dot">{index + 1}</span>
                    <span className="min-w-0">
                      <span className="ps-h3 block truncate">{step.name || `Paso ${index + 1}`}</span>
                      <span className="ps-meta block">
                        {step.conditions.length} {step.conditions.length === 1 ? 'condición' : 'condiciones'} · {questionCount}{' '}
                        {questionCount === 1 ? 'pregunta' : 'preguntas'}
                      </span>
                    </span>
                    <CadIcon name={open ? 'ChevronUp' : 'ChevronDown'} size={18} className="ml-auto shrink-0" />
                  </button>
                  <div className="flex items-center">
                    <button type="button" aria-label="Subir paso" disabled={index === 0} onClick={() => setSteps((l) => move(l, index, index - 1))} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-paper-muted disabled:opacity-40">
                      <CadIcon name="ArrowUp" size={16} />
                    </button>
                    <button type="button" aria-label="Bajar paso" disabled={index === steps.length - 1} onClick={() => setSteps((l) => move(l, index, index + 1))} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-paper-muted disabled:opacity-40">
                      <CadIcon name="ArrowDown" size={16} />
                    </button>
                    <button type="button" aria-label="Duplicar paso" onClick={() => duplicateStep(index)} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-paper-muted">
                      <CadIcon name="Copy" size={16} />
                    </button>
                    {steps.length > 1 &&
                      (confirmDeleteKey === step.key ? (
                        <span className="inline-flex items-center gap-1">
                          <button type="button" onClick={() => removeStep(step.key)} className="min-h-[44px] px-2 bg-vermilion-tint border border-vermilion-ink text-vermilion-ink font-body text-sm font-semibold">
                            Sí, eliminar
                          </button>
                          <button type="button" onClick={() => setConfirmDeleteKey(null)} className="min-h-[44px] px-2 font-body text-sm hover:bg-paper-muted">
                            Cancelar
                          </button>
                        </span>
                      ) : (
                        <button type="button" aria-label="Eliminar paso" onClick={() => setConfirmDeleteKey(step.key)} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-vermilion-ink hover:bg-paper-muted">
                          <CadIcon name="Trash2" size={16} />
                        </button>
                      ))}
                  </div>
                </div>

                {open && (
                  <div className="p-4 space-y-5">
                    <Field label="Nombre del paso" required>
                      <input className={INPUT} value={step.name} onChange={(e) => patchStep(step.key, { name: e.target.value })} />
                    </Field>
                    <Field label="Mensaje de bienvenida" help="Opcional. Se muestra antes de empezar este paso.">
                      <textarea className={INPUT} rows={2} value={step.onboarding_instructions} onChange={(e) => patchStep(step.key, { onboarding_instructions: e.target.value })} />
                    </Field>

                    <section aria-label="Condiciones" className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="ps-h3">Condiciones</h3>
                        <InfoTip label="Qué es una condición">
                          Una condición es una versión de la experiencia: un caso y, si quieres, instrucciones propias para el asistente. Con dos o más, cada participante recibe una al azar y se reparten de forma equilibrada.
                        </InfoTip>
                      </div>
                      {step.conditions.length > 1 && (
                        <p className="ps-lead">Cada participante verá solo una de estas condiciones, asignada al azar y equilibrada.</p>
                      )}
                      {step.conditions.map((cond, ci) => (
                        <div key={cond.key} className={`border border-line-control border-l-4 p-3 space-y-3 ps-cond-${(ci % 6) + 1}`} style={{ borderLeftColor: 'var(--cond)' }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <Field label={`Condición ${ci + 1}`} required>
                                <input className={INPUT} value={cond.title} placeholder="Ej.: Asistente socrático" onChange={(e) => patchCondition(step.key, cond.key, { title: e.target.value })} />
                              </Field>
                            </div>
                            {step.conditions.length > 1 && (
                              <button type="button" aria-label={`Quitar condición ${ci + 1}`} onClick={() => patchStep(step.key, { conditions: step.conditions.filter((c) => c.key !== cond.key) })} className="min-h-[44px] min-w-[44px] mt-6 inline-flex items-center justify-center text-vermilion-ink hover:bg-paper-subtle">
                                <CadIcon name="Trash2" size={16} />
                              </button>
                            )}
                          </div>
                          <Field label="Caso o escenario que verá el participante" required help="Admite formato Markdown.">
                            <textarea className={INPUT} rows={5} value={cond.case_content} onChange={(e) => patchCondition(step.key, cond.key, { case_content: e.target.value })} />
                          </Field>
                          <Disclosure title="Instrucciones propias del asistente" summary={cond.system_prompt.trim() ? 'Definidas' : 'Opcional: si no las defines se usan las del paso'}>
                            <textarea className={INPUT} rows={6} value={cond.system_prompt} placeholder="Cómo debe comportarse el asistente en esta condición" onChange={(e) => patchCondition(step.key, cond.key, { system_prompt: e.target.value })} />
                          </Disclosure>
                        </div>
                      ))}
                      <button type="button" onClick={() => patchStep(step.key, { conditions: [...step.conditions, newCondition()] })} className={BTN}>
                        <CadIcon name="Plus" size={16} /> Agregar condición
                      </button>
                    </section>

                    <Disclosure title="Instrucciones del asistente para todo el paso" summary="Se usan en las condiciones que no tienen instrucciones propias">
                      <textarea className={INPUT} rows={6} value={step.system_prompt} onChange={(e) => patchStep(step.key, { system_prompt: e.target.value })} />
                    </Disclosure>

                    <Disclosure title="Preguntas al terminar" summary={questionCount ? `${questionCount} ${questionCount === 1 ? 'pregunta' : 'preguntas'}` : 'Sin preguntas'}>
                      <div className="space-y-3">
                        {step.questions.map((q, qi) => (
                          <div key={q.key} className="border border-line-control p-3 space-y-2">
                            <Field label={`Pregunta ${qi + 1}`}>
                              <input className={INPUT} value={q.text} onChange={(e) => patchQuestion(step.key, q.key, { text: e.target.value })} />
                            </Field>
                            <div className="flex flex-wrap items-center gap-4">
                              <label className="flex items-center gap-2 font-body text-sm">
                                Tipo
                                <select className={INPUT + ' w-auto'} value={q.type} onChange={(e) => patchQuestion(step.key, q.key, { type: e.target.value })}>
                                  <option value="likert">Escala de 1 a 5</option>
                                  <option value="text">Respuesta abierta</option>
                                </select>
                              </label>
                              <label className="flex items-center gap-2 font-body text-sm min-h-[44px]">
                                <input type="checkbox" className="w-5 h-5" checked={q.required} onChange={(e) => patchQuestion(step.key, q.key, { required: e.target.checked })} />
                                Obligatoria
                              </label>
                              <button type="button" onClick={() => patchStep(step.key, { questions: step.questions.filter((x) => x.key !== q.key) })} className={BTN + ' text-vermilion-ink ml-auto'}>
                                <CadIcon name="Trash2" size={16} /> Quitar
                              </button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => patchStep(step.key, { questions: [...step.questions, newQuestion()] })} className={BTN}>
                          <CadIcon name="Plus" size={16} /> Agregar pregunta
                        </button>
                      </div>
                    </Disclosure>

                    <Disclosure title="Modelo de IA" summary={`${step.ai_provider}${step.openrouter_model ? ` · ${step.openrouter_model}` : ' · modelo por defecto'}`}>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="Proveedor">
                          <select className={INPUT} value={step.ai_provider} onChange={(e) => patchStep(step.key, { ai_provider: e.target.value })}>
                            {PROVIDERS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Modelo" help="Vacío = el modelo por defecto de Ajustes.">
                          <input className={INPUT} value={step.openrouter_model} onChange={(e) => patchStep(step.key, { openrouter_model: e.target.value })} />
                        </Field>
                      </div>
                    </Disclosure>

                    {index > 0 && step.conditions.length > 1 && (
                      <label className="flex items-start gap-2 font-body text-sm text-ink min-h-[44px]">
                        <input type="checkbox" className="w-5 h-5 mt-0.5" checked={step.maintain_version} onChange={(e) => patchStep(step.key, { maintain_version: e.target.checked })} />
                        <span>Mantener la condición que cada participante tuvo en el paso anterior, cuando exista en este paso</span>
                      </label>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-4">
          <button type="button" onClick={addStep} className={BTN}>
            <CadIcon name="Plus" size={16} /> Agregar paso
          </button>
        </div>
      </BlueprintPanel>

      <div className="flex flex-wrap justify-end gap-2">
        <Link href="/admin/campaigns" className={BTN}>Cancelar</Link>
        <button type="button" onClick={save} disabled={saving} className={BTN_PRIMARY}>
          <CadIcon name="Save" size={16} /> {saving ? 'Guardando…' : 'Guardar campaña'}
        </button>
      </div>
    </div>
  );
}
