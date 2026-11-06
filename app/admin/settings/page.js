'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BlueprintPanel, Field, Disclosure, InfoTip } from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { useTr } from '@/lib/i18n/context';

const SELECT = 'w-full min-h-[44px] font-body text-sm text-ink bg-paper border border-line-control px-3 py-2';
const BTN = 'min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2 disabled:opacity-60';
const BTN_PRIMARY = 'min-h-[44px] px-4 py-2 border border-line-strong bg-cobalt hover:bg-cobalt-hover text-paper font-body text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60';

const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'groq', name: 'Groq' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'ollama', name: 'Ollama (local)' },
];
const CUSTOM = '__custom__';

const price = (v) => (v === null || v === undefined ? '–' : v === 0 ? '0' : `$${v}`);

function Toggle({ id, checked, onChange, label, hint }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 min-h-[44px] font-body text-sm text-ink cursor-pointer">
      <input id={id} type="checkbox" className="w-5 h-5 mt-0.5 accent-cobalt" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && <span className="block text-ink-2">{hint}</span>}
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const tr = useTr();
  const [loaded, setLoaded] = useState(false);
  const [provider, setProvider] = useState('openrouter');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [configured, setConfigured] = useState({});
  const [masked, setMasked] = useState({});
  const [keyInputs, setKeyInputs] = useState({});
  const [catalog, setCatalog] = useState({ models: [], source: 'curated', loading: true });
  const [tests, setTests] = useState({});
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);
  const [demo, setDemo] = useState({ loaded: false, busy: false, available: true });
  const [plano, setPlano] = useState(() => {
    try { return typeof window !== 'undefined' && localStorage.getItem('ps_theme') === 'plano'; } catch { return false; }
  });
  const [reduced, setReduced] = useState(() => {
    try { return typeof window !== 'undefined' && localStorage.getItem('ps_reduced_motion') === '1'; } catch { return false; }
  });

  const applySettings = (s) => {
    setProvider(s.default_ai_provider || 'openrouter');
    setModel(s.default_ai_model || '');
    setOllamaUrl(s.ollama_base_url || '');
    setConfigured(s.env_keys || {});
    setMasked(s.masked_keys || {});
  };

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((s) => { applySettings(s); setLoaded(true); })
      .catch(() => setLoaded(true));
    fetch('/api/admin/seed')
      .then((r) => r.json())
      .then((d) => setDemo((x) => ({ ...x, loaded: Boolean(d.loaded) })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/models?provider=${encodeURIComponent(provider)}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setCatalog({ models: d.models || [], source: d.source, loading: false }))
      .catch(() => !cancelled && setCatalog({ models: [], source: 'curated', loading: false }));
    return () => { cancelled = true; };
  }, [provider]);

  const selected = useMemo(() => catalog.models.find((m) => m.id === model), [catalog, model]);
  const inList = Boolean(selected);

  const flash = (ok, text) => {
    setBanner({ ok, text });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = { default_ai_provider: provider, default_ai_model: model };
      if (provider === 'ollama') body.ollama_base_url = ollamaUrl;
      for (const [p, v] of Object.entries(keyInputs)) if (v) body[`api_key_${p}`] = v;
      const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      applySettings(data);
      setKeyInputs({});
      flash(true, tr('Cambios guardados.'));
    } catch (e) {
      flash(false, e.message || tr('No pudimos guardar los cambios.'));
    }
    setSaving(false);
  };

  const testProvider = async (p) => {
    setTests((t) => ({ ...t, [p]: { loading: true } }));
    try {
      const res = await fetch('/api/admin/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: p, model: p === provider ? model || undefined : undefined, apiKey: keyInputs[p] || undefined, baseUrl: p === 'ollama' ? ollamaUrl : undefined }),
      });
      const result = await res.json();
      setTests((t) => ({ ...t, [p]: { loading: false, result } }));
    } catch (e) {
      setTests((t) => ({ ...t, [p]: { loading: false, result: { ok: false, error: e.message } } }));
    }
  };

  const togglePlano = (on) => {
    setPlano(on);
    try { on ? localStorage.setItem('ps_theme', 'plano') : localStorage.removeItem('ps_theme'); } catch { /* storage unavailable */ }
    if (on) document.documentElement.dataset.theme = 'plano'; else delete document.documentElement.dataset.theme;
  };
  const toggleReduced = (on) => {
    setReduced(on);
    try { on ? localStorage.setItem('ps_reduced_motion', '1') : localStorage.removeItem('ps_reduced_motion'); } catch { /* storage unavailable */ }
    if (on) document.documentElement.dataset.motion = 'reduced'; else delete document.documentElement.dataset.motion;
  };

  const changeDemo = async (enable) => {
    setDemo((d) => ({ ...d, busy: true }));
    try {
      const res = await fetch('/api/admin/seed', { method: enable ? 'POST' : 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDemo((d) => ({ ...d, loaded: enable, busy: false }));
      flash(true, enable ? tr('Datos de ejemplo cargados.') : tr('Saliste del modo demo: se quitaron los datos de ejemplo.'));
    } catch (e) {
      setDemo((d) => ({ ...d, busy: false }));
      flash(false, e.message);
    }
  };

  if (!loaded) return <p className="ps-lead" role="status">{tr('Cargando…')}</p>;

  const recommended = catalog.models.filter((m) => m.recommended);
  const others = catalog.models.filter((m) => !m.recommended);
  const label = (m) => `${m.name} · ${price(m.inputPer1M)} / ${price(m.outputPer1M)}`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="ps-h1">{tr('Ajustes')}</h1>
          <p className="ps-lead mt-1">{tr('Elige el asistente de IA que usarán tus actividades.')}</p>
        </div>
        <button type="button" onClick={save} disabled={saving} className={BTN_PRIMARY}>
          <CadIcon name="Save" size={16} /> {saving ? tr('Guardando…') : tr('Guardar cambios')}
        </button>
      </div>

      {banner && (
        <div role="status" className={`border-2 p-3 font-body text-sm ${banner.ok ? 'border-emerald bg-emerald-tint text-emerald' : 'border-vermilion-ink bg-vermilion-tint text-vermilion-ink'}`}>
          {banner.text}
        </div>
      )}

      <BlueprintPanel title={tr('Asistente de IA')} subtitle={tr('Proveedor y modelo que se usan por defecto.')}>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <Field label={tr('Proveedor')}>
            <select className={SELECT} value={provider} onChange={(e) => { setProvider(e.target.value); setModel(''); setCustomModel(false); }}>
              {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label={tr('Modelo')} help={catalog.loading ? tr('Cargando modelos…') : catalog.source === 'live' ? tr('Lista actualizada desde el proveedor. Precio en USD por millón de tokens (entrada / salida).') : tr('Lista de modelos frecuentes. Precio en USD por millón de tokens (entrada / salida).')}>
            <select
              className={SELECT}
              value={customModel || (model && !inList) ? CUSTOM : model}
              onChange={(e) => {
                if (e.target.value === CUSTOM) { setCustomModel(true); } else { setCustomModel(false); setModel(e.target.value); }
              }}
            >
              <option value="">{tr('Elige un modelo')}</option>
              {recommended.length > 0 && (
                <optgroup label={tr('Más usados')}>
                  {recommended.map((m) => <option key={m.id} value={m.id}>{label(m)}</option>)}
                </optgroup>
              )}
              {others.length > 0 && (
                <optgroup label={tr('Otros modelos')}>
                  {others.map((m) => <option key={m.id} value={m.id}>{label(m)}</option>)}
                </optgroup>
              )}
              <option value={CUSTOM}>{tr('Otro modelo (escribir el nombre)…')}</option>
            </select>
          </Field>
        </div>

        {(customModel || (model && !inList)) && (
          <Field label={tr('Nombre del modelo')} help={tr('Tal como lo indica el proveedor.')}>
            <input className={SELECT} value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
        )}

        {selected && (
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 m-0 font-body text-sm">
            <div><dt className="ps-meta">{tr('Entrada')}</dt><dd className="m-0 font-stat font-semibold">{price(selected.inputPer1M)}</dd></div>
            <div><dt className="ps-meta">{tr('Salida')}</dt><dd className="m-0 font-stat font-semibold">{price(selected.outputPer1M)}</dd></div>
            <div>
              <dt className="ps-meta flex items-center gap-1">{tr('Razonamiento')} <InfoTip label={tr('Qué es el razonamiento')}>{tr('Los modelos que razonan piensan paso a paso antes de responder: suelen ser más lentos y caros, y su razonamiento interno no se muestra a los participantes.')}</InfoTip></dt>
              <dd className="m-0 font-semibold">{selected.reasoning ? tr('Sí') : tr('No')}</dd>
            </div>
            {selected.context && <div><dt className="ps-meta">{tr('Contexto')}</dt><dd className="m-0 font-stat font-semibold">{Math.round(selected.context / 1000)}k</dd></div>}
          </dl>
        )}

        {provider === 'ollama' && (
          <Field label={tr('Dirección de Ollama')} help={tr('Ollama corre en tu propio equipo: las conversaciones no salen de ahí.')}>
            <input className={SELECT} value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} placeholder="http://localhost:11434" />
          </Field>
        )}

        <div className="mt-4 p-3 border-2 border-vermilion-ink bg-vermilion-tint font-body text-sm text-ink flex gap-3">
          <CadIcon name="ShieldAlert" size={20} className="text-vermilion-ink shrink-0 mt-0.5" />
          <p className="m-0">
            <strong>{tr('Antes de usarlo con participantes:')}</strong>{' '}
            {tr('las conversaciones se envían al proveedor que elijas. Revisa cómo trata los datos y, si la actividad es una investigación, consulta a tu comité de ética.')}
          </p>
        </div>
      </BlueprintPanel>

      <Disclosure title={tr('Claves de acceso y prueba de conexión')} summary={tr('Opcional si el servidor ya tiene las claves configuradas')}>
        <ul className="list-none m-0 p-0 space-y-4">
          {PROVIDERS.filter((p) => p.id !== 'ollama').map((p) => {
            const t = tests[p.id];
            return (
              <li key={p.id} className="border border-line-control p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-body text-base font-semibold text-ink m-0">{p.name}</p>
                  <span className={`font-body text-sm font-semibold ${configured[p.id] ? 'text-emerald' : 'text-ink-2'}`}>
                    {configured[p.id] ? `${tr('Configurada')} ${masked[p.id] || ''}` : tr('Sin clave')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[12rem]">
                    <label htmlFor={`key-${p.id}`} className="sr-only">{tr('Nueva clave de {name}', { name: p.name })}</label>
                    <input id={`key-${p.id}`} type="password" autoComplete="off" className={SELECT} placeholder={tr('Pegar una clave nueva')} value={keyInputs[p.id] || ''} onChange={(e) => setKeyInputs({ ...keyInputs, [p.id]: e.target.value })} />
                  </div>
                  <button type="button" onClick={() => testProvider(p.id)} disabled={t?.loading} className={BTN}>
                    <CadIcon name="Activity" size={16} /> {t?.loading ? tr('Probando…') : tr('Probar conexión')}
                  </button>
                </div>
                {t?.result && (
                  <p role="status" className={`font-body text-sm m-0 ${t.result.ok ? 'text-emerald' : 'text-vermilion-ink'}`}>
                    {t.result.ok ? tr('Funciona: respondió en {ms} ms.', { ms: t.result.latency_ms }) : `${tr('No funcionó')}: ${t.result.error || ''}`}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Disclosure>

      <Disclosure title={tr('Apariencia y accesibilidad')} summary={tr('Se guarda solo en este navegador')}>
        <Toggle id="theme" checked={plano} onChange={togglePlano} label={tr('Tema “Plano azul” (prueba)')} hint={tr('Fondo azul claro como papel de planos, con acento ocre. Solo cambia los colores.')} />
        <Toggle id="motion" checked={reduced} onChange={toggleReduced} label={tr('Reducir el movimiento')} hint={tr('Quita animaciones y transiciones.')} />
      </Disclosure>

      <BlueprintPanel title={tr('Modo demo')} subtitle={demo.loaded ? tr('Estás viendo datos de ejemplo.') : tr('Carga datos de ejemplo para explorar la plataforma.')}>
        <p className="font-body text-sm text-ink m-0 mb-3">
          {tr('El modo demo agrega una campaña de ejemplo con participantes ficticios para que pruebes los resultados. Al salir, se quitan solo esos datos: lo que tú creaste no se toca.')}
        </p>
        <button type="button" disabled={demo.busy} onClick={() => changeDemo(!demo.loaded)} className={demo.loaded ? BTN : BTN_PRIMARY}>
          <CadIcon name={demo.loaded ? 'LogOut' : 'Play'} size={16} />
          {demo.busy ? tr('Un momento…') : demo.loaded ? tr('Salir del modo demo') : tr('Activar modo demo')}
        </button>
      </BlueprintPanel>
    </div>
  );
}
