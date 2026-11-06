'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BlueprintPanel, Field, Disclosure, InfoTip } from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { useTr } from '@/lib/i18n/context';
import { normalizeQuestion, canonicalType, parseOptions } from '@/lib/survey-schema';
import QuestionEditor from './question-editor';
import QuestionImport from './question-import';
import QuestionCopy from './question-copy';

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
      randomize_order: Boolean(detail.randomize_order),
      final_message: detail.final_message || '',
      show_condition: Boolean(detail.show_condition),
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
      questions: (s.survey_config || []).map((q) => ({
        ...q,
        key: nextKey(),
        type: canonicalType(q.type),
        required: q.required !== false,
        optionsText: (q.options || []).join('\n'),
      })),
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
        .map(({ key, optionsText, ...q }) => normalizeQuestion({ ...q, text: q.text.trim(), options: parseOptions(optionsText) })),
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
  const tr = useTr();
  const router = useRouter();
  const [loading, setLoading] = useState(Boolean(campaignId));
  const [meta, setMeta] = useState({ name: '', description: '', consent_required: false, consent_url: '', randomize_order: false, final_message: '', show_condition: false });
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
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(tr('No encontramos esta campaña.')))))
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
  // Keeps each question's id, so the same question can be compared across steps.
  const copyQuestionsFromPrevious = (index, mode) => {
    const source = steps[index - 1]?.questions || [];
    setSteps((list) =>
      list.map((s, i) => {
        if (i !== index) return s;
        const base = mode === 'replace' ? [] : s.questions;
        const taken = new Set(base.map((q) => q.id));
        const copied = source.filter((q) => !taken.has(q.id)).map((q) => ({ ...q, key: nextKey() }));
        return { ...s, questions: [...base, ...copied] };
      })
    );
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
      if (!res.ok) throw new Error(data.error || tr('No se pudo guardar la campaña.'));
      router.push('/admin/campaigns');
    } catch (e) {
      setError(e.message);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <p className="ps-lead" role="status">{tr('Cargando campaña…')}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/campaigns" className="ps-meta inline-flex items-center gap-1 hover:text-cobalt">
            <CadIcon name="ArrowLeft" size={14} />{' '}{tr('Volver a campañas')}</Link>
          <h1 className="ps-h1 mt-1">{campaignId ? tr('Editar campaña') : tr('Crear campaña')}</h1>
          <p className="ps-lead mt-1">
            {campaignId
              ? tr('Cambia lo que necesites; los participantes que ya empezaron no se ven afectados.')
              : tr('Empieza con el nombre y arma los pasos que vivirán tus participantes.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {shareCode && (
            <a href={`/session/${shareCode}`} target="_blank" rel="noopener noreferrer" className={BTN}>
              <CadIcon name="ExternalLink" size={16} />{' '}{tr('Ver como participante')}</a>
          )}
          <button type="button" onClick={save} disabled={saving} className={BTN_PRIMARY}>
            <CadIcon name="Save" size={16} /> {saving ? tr('Guardando…') : tr('Guardar campaña')}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="border-2 border-vermilion-ink bg-vermilion-tint text-vermilion-ink p-3 font-body text-sm">
          {error}
        </div>
      )}

      <BlueprintPanel title={tr('1. Datos de la campaña')} subtitle={tr('Lo básico para identificarla.')}>
        <Field label={tr('Nombre de la campaña')} required>
          <input
            className={INPUT}
            value={meta.name}
            onChange={(e) => setMeta({ ...meta, name: e.target.value })}
            placeholder={tr('Ej.: Tutoría con IA, primer semestre')}
          />
        </Field>
        <Field label={tr('Descripción')} help={tr('Opcional. Solo la verás tú.')}>
          <textarea
            className={INPUT}
            rows={2}
            value={meta.description}
            onChange={(e) => setMeta({ ...meta, description: e.target.value })}
          />
        </Field>
        <Field label={tr('Mensaje final para los participantes')} help={tr('Se muestra al terminar, para que nadie quede sin saber qué hacer (por ejemplo: "Quédate en tu asiento, comenzamos el plenario en 5 minutos"). Opcional.')}>
          <textarea
            className={INPUT}
            rows={3}
            value={meta.final_message}
            onChange={(e) => setMeta({ ...meta, final_message: e.target.value })}
            placeholder={tr('Ej.: Gracias por participar. Cuando todos terminen, comentaremos la experiencia en grupo.')}
          />
        </Field>
        <label className="flex items-start gap-2 font-body text-sm text-ink min-h-[44px]">
          <input type="checkbox" className="w-5 h-5 mt-0.5" checked={meta.show_condition} onChange={(e) => setMeta({ ...meta, show_condition: e.target.checked })} />
          <span>
            <span className="font-semibold">{tr('Mostrar a los participantes qué caso o condición les tocó')}</span>
            <span className="block text-ink-2">{tr('Si lo desactivas, el resumen final solo dice "Paso 1", "Paso 2"… y no revela la condición.')}</span>
          </span>
        </label>
        <Disclosure title={tr('Consentimiento informado')} summary={meta.consent_required ? tr('Se pedirá antes de comenzar') : tr('No se pide')}>
          <label className="flex items-center gap-2 font-body text-sm text-ink min-h-[44px]">
            <input
              type="checkbox"
              checked={meta.consent_required}
              onChange={(e) => setMeta({ ...meta, consent_required: e.target.checked })}
              className="w-5 h-5"
            />{tr('Pedir que los participantes acepten antes de comenzar')}</label>
          {meta.consent_required && (
            <Field label={tr('Enlace al documento de consentimiento')} help={tr('Los participantes podrán abrirlo desde la casilla de aceptación.')}>
              <input
                className={INPUT}
                type="url"
                value={meta.consent_url}
                onChange={(e) => setMeta({ ...meta, consent_url: e.target.value })}
                placeholder={tr('https://…')}
              />
            </Field>
          )}
        </Disclosure>
      </BlueprintPanel>

      <BlueprintPanel
        title={tr('2. Pasos de la campaña')}
        subtitle={meta.randomize_order ? tr('Cada participante los recorre en un orden distinto.') : tr('Los participantes los recorren en este orden.')}
        headerSlot={<span className="ps-meta">{tr('{n} paso(s)', { n: steps.length })}</span>}
      >
        {steps.length > 1 && (
          <label className="flex items-start gap-2 font-body text-sm text-ink min-h-[44px] mb-3">
            <input type="checkbox" className="w-5 h-5 mt-0.5" checked={meta.randomize_order} onChange={(e) => setMeta({ ...meta, randomize_order: e.target.checked })} />
            <span>
              <span className="font-semibold">{tr('Orden aleatorio de los pasos')}</span>
              <span className="block text-ink-2">{tr('Cada participante recorre los pasos en un orden distinto, repartido de forma equilibrada. Útil para comparar control y tratamiento sin efecto de orden.')}</span>
            </span>
          </label>
        )}
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
                      <span className="ps-h3 block truncate">{step.name || tr('Paso {n}', { n: index + 1 })}</span>
                      <span className="ps-meta block">
                        {tr('{c} condición(es) · {q} pregunta(s)', { c: step.conditions.length, q: questionCount })}
                      </span>
                    </span>
                    <CadIcon name={open ? 'ChevronUp' : 'ChevronDown'} size={18} className="ml-auto shrink-0" />
                  </button>
                  <div className="flex items-center">
                    <button type="button" aria-label={tr('Subir paso')} disabled={index === 0} onClick={() => setSteps((l) => move(l, index, index - 1))} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-paper-muted disabled:opacity-40">
                      <CadIcon name="ArrowUp" size={16} />
                    </button>
                    <button type="button" aria-label={tr('Bajar paso')} disabled={index === steps.length - 1} onClick={() => setSteps((l) => move(l, index, index + 1))} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-paper-muted disabled:opacity-40">
                      <CadIcon name="ArrowDown" size={16} />
                    </button>
                    <button type="button" aria-label={tr('Duplicar paso')} onClick={() => duplicateStep(index)} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-paper-muted">
                      <CadIcon name="Copy" size={16} />
                    </button>
                    {steps.length > 1 &&
                      (confirmDeleteKey === step.key ? (
                        <span className="inline-flex items-center gap-1">
                          <button type="button" onClick={() => removeStep(step.key)} className="min-h-[44px] px-2 bg-vermilion-tint border border-vermilion-ink text-vermilion-ink font-body text-sm font-semibold">{tr('Sí, eliminar')}</button>
                          <button type="button" onClick={() => setConfirmDeleteKey(null)} className="min-h-[44px] px-2 font-body text-sm hover:bg-paper-muted">{tr('Cancelar')}</button>
                        </span>
                      ) : (
                        <button type="button" aria-label={tr('Eliminar paso')} onClick={() => setConfirmDeleteKey(step.key)} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-vermilion-ink hover:bg-paper-muted">
                          <CadIcon name="Trash2" size={16} />
                        </button>
                      ))}
                  </div>
                </div>

                {open && (
                  <div className="p-4 space-y-5">
                    <Field label={tr('Nombre del paso')} required>
                      <input className={INPUT} value={step.name} onChange={(e) => patchStep(step.key, { name: e.target.value })} />
                    </Field>
                    <Field label={tr('Mensaje de bienvenida')} help={tr('Opcional. Se muestra antes de empezar este paso.')}>
                      <textarea className={INPUT} rows={2} value={step.onboarding_instructions} onChange={(e) => patchStep(step.key, { onboarding_instructions: e.target.value })} />
                    </Field>

                    <section aria-label={tr('Condiciones')} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="ps-h3">{tr('Condiciones')}</h3>
                        <InfoTip label={tr('Qué es una condición')}>{tr('Una condición es una versión de la experiencia: un caso y, si quieres, un prompt propio para el asistente. Con dos o más, cada participante recibe una al azar y se reparten de forma equilibrada.')}</InfoTip>
                      </div>
                      {step.conditions.length > 1 && (
                        <p className="ps-lead">{tr('Cada participante verá solo una de estas condiciones, asignada al azar y equilibrada.')}</p>
                      )}
                      {step.conditions.map((cond, ci) => (
                        <div key={cond.key} className={`border border-line-control border-l-4 p-3 space-y-3 ps-cond-${(ci % 6) + 1}`} style={{ borderLeftColor: 'var(--cond)' }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <Field label={tr('Condición {n}', { n: ci + 1 })} required>
                                <input className={INPUT} value={cond.title} placeholder={tr('Ej.: Asistente socrático')} onChange={(e) => patchCondition(step.key, cond.key, { title: e.target.value })} />
                              </Field>
                            </div>
                            {step.conditions.length > 1 && (
                              <button type="button" aria-label={tr('Quitar condición {n}', { n: ci + 1 })} onClick={() => patchStep(step.key, { conditions: step.conditions.filter((c) => c.key !== cond.key) })} className="min-h-[44px] min-w-[44px] mt-6 inline-flex items-center justify-center text-vermilion-ink hover:bg-paper-subtle">
                                <CadIcon name="Trash2" size={16} />
                              </button>
                            )}
                          </div>
                          <Field label={tr('Caso o escenario que verá el participante')} required help={tr('Admite formato Markdown.')}>
                            <textarea className={INPUT} rows={5} value={cond.case_content} onChange={(e) => patchCondition(step.key, cond.key, { case_content: e.target.value })} />
                          </Field>
                          <Disclosure title={tr('Prompt propio del asistente')} summary={cond.system_prompt.trim() ? tr('Definidas') : tr('Opcional: si no lo defines se usa el del paso')}>
                            <textarea className={INPUT} rows={6} value={cond.system_prompt} placeholder={tr('Cómo debe comportarse el asistente en esta condición')} onChange={(e) => patchCondition(step.key, cond.key, { system_prompt: e.target.value })} />
                          </Disclosure>
                        </div>
                      ))}
                      <button type="button" onClick={() => patchStep(step.key, { conditions: [...step.conditions, newCondition()] })} className={BTN}>
                        <CadIcon name="Plus" size={16} />{' '}{tr('Agregar condición')}</button>
                    </section>

                    <Disclosure title={tr('Prompt del asistente para todo el paso')} summary={tr('Se usa en las condiciones que no tienen prompt propio')}>
                      <textarea className={INPUT} rows={6} value={step.system_prompt} onChange={(e) => patchStep(step.key, { system_prompt: e.target.value })} />
                    </Disclosure>

                    <Disclosure title={tr('Preguntas al terminar')} summary={questionCount ? tr('{q} pregunta(s)', { q: questionCount }) : tr('Sin preguntas')}>
                      <div className="space-y-3">
                        {step.questions.map((q, qi) => (
                          <QuestionEditor
                            key={q.key}
                            q={q}
                            index={qi}
                            tr={tr}
                            onChange={(patch) => patchQuestion(step.key, q.key, patch)}
                            onRemove={() => patchStep(step.key, { questions: step.questions.filter((x) => x.key !== q.key) })}
                          />
                        ))}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => patchStep(step.key, { questions: [...step.questions, newQuestion()] })} className={BTN}>
                            <CadIcon name="Plus" size={16} />{' '}{tr('Agregar pregunta')}</button>
                          {index > 0 && (
                            <QuestionCopy
                              tr={tr}
                              sourceCount={steps[index - 1].questions.length}
                              hasQuestions={step.questions.length > 0}
                              onCopy={(mode) => copyQuestionsFromPrevious(index, mode)}
                            />
                          )}
                        </div>
                        <QuestionImport
                          tr={tr}
                          hasQuestions={step.questions.length > 0}
                          onImport={(imported, mode) =>
                            patchStep(step.key, {
                              questions: [...(mode === 'replace' ? [] : step.questions), ...imported.map((q) => newQuestion(q))],
                            })
                          }
                        />
                      </div>
                    </Disclosure>

                    <Disclosure title={tr('Modelo de IA')} summary={`${step.ai_provider} · ${step.openrouter_model || tr('modelo por defecto')}`}>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Field label={tr('Proveedor')}>
                          <select className={INPUT} value={step.ai_provider} onChange={(e) => patchStep(step.key, { ai_provider: e.target.value })}>
                            {PROVIDERS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label={tr('Modelo')} help={tr('Vacío = el modelo por defecto de Ajustes.')}>
                          <input className={INPUT} value={step.openrouter_model} onChange={(e) => patchStep(step.key, { openrouter_model: e.target.value })} />
                        </Field>
                      </div>
                    </Disclosure>

                    {index > 0 && step.conditions.length > 1 && (
                      <label className="flex items-start gap-2 font-body text-sm text-ink min-h-[44px]">
                        <input type="checkbox" className="w-5 h-5 mt-0.5" checked={step.maintain_version} onChange={(e) => patchStep(step.key, { maintain_version: e.target.checked })} />
                        <span>{tr('Mantener la condición que cada participante tuvo en el paso anterior, cuando exista en este paso')}</span>
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
            <CadIcon name="Plus" size={16} />{' '}{tr('Agregar paso')}</button>
        </div>
      </BlueprintPanel>

      <div className="flex flex-wrap justify-end gap-2">
        <Link href="/admin/campaigns" className={BTN}>{tr('Cancelar')}</Link>
        <button type="button" onClick={save} disabled={saving} className={BTN_PRIMARY}>
          <CadIcon name="Save" size={16} /> {saving ? tr('Guardando…') : tr('Guardar campaña')}
        </button>
      </div>
    </div>
  );
}
