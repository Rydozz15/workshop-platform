'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BlueprintPanel,
  SplitButton,
  StatBadge,
  Field,
  MarginNote,
  HandMark,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';

const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq Cloud (LPU)',
    envVar: 'GROQ_API_KEY',
    recommendedModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen-qwq-32b'],
    notes: 'Inferencia ultrarrápida con telemetría TTFT sub-300 ms ideal para talleres síncronos en aula.',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    envVar: 'OPENROUTER_API_KEY',
    recommendedModels: ['deepseek/deepseek-chat', 'meta-llama/llama-3.3-70b-instruct', 'qwen/qwen-2.5-72b-instruct'],
    notes: 'Enrutador unificado para comparar familias de modelos abiertos y propietarios bajo una misma API.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    recommendedModels: ['gpt-4o-mini', 'gpt-4o'],
    notes: 'Soporte nativo de streaming SSE con conteo exacto de tokens vía stream_options.include_usage.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    envVar: 'ANTHROPIC_API_KEY',
    recommendedModels: ['claude-3-5-haiku-latest', 'claude-3-7-sonnet-latest'],
    notes: 'Adaptador nativo Messages API con separación estricta de system prompt y captura de input/output tokens.',
  },
  {
    id: 'ollama',
    name: 'Ollama / Local',
    envVar: 'OLLAMA_BASE_URL',
    recommendedModels: ['llama3.2:latest', 'qwen2.5:7b', 'mistral:latest'],
    notes: 'Ejecución 100% local sin salida de datos estudiantiles a terceros ni dependencia de internet externo.',
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    default_ai_provider: 'groq',
    default_ai_model: 'llama-3.3-70b-versatile',
    ollama_base_url: 'http://localhost:11434',
    db_provider: 'memory',
    env_keys: {},
    masked_keys: {},
  });

  const [keyInputs, setKeyInputs] = useState({
    groq: '',
    openrouter: '',
    openai: '',
    anthropic: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);

  // Per-provider connection diagnostics
  const [testStates, setTestStates] = useState({});

  // Accessibility preferences
  const [grainOff, setGrainOff] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pauseTelemetry, setPauseTelemetry] = useState(false);

  // Seed state
  const [seeding, setSeeding] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data && !data.error) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `No se pudo leer la configuración: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    if (typeof window !== 'undefined') {
      const gOff = window.localStorage.getItem('ps_grain_off') === 'true';
      const rMot = window.localStorage.getItem('ps_reduced_motion') === 'true';
      const pTel = window.localStorage.getItem('ps_pause_telemetry') === 'true';
      setGrainOff(gOff);
      setReducedMotion(rMot);
      setPauseTelemetry(pTel);
    }
  }, [loadSettings]);

  const applyAccessibilityPref = (key, value) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value ? 'true' : 'false');
    if (key === 'ps_grain_off') {
      setGrainOff(value);
      document.documentElement.dataset.grain = value ? 'off' : 'on';
    } else if (key === 'ps_reduced_motion') {
      setReducedMotion(value);
      document.documentElement.dataset.motion = value ? 'reduced' : 'normal';
    } else if (key === 'ps_pause_telemetry') {
      setPauseTelemetry(value);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        default_ai_provider: settings.default_ai_provider,
        default_ai_model: settings.default_ai_model,
        ollama_base_url: settings.ollama_base_url,
      };
      Object.entries(keyInputs).forEach(([prov, val]) => {
        if (val.trim()) {
          payload[`api_key_${prov}`] = val.trim();
        }
      });

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Error al guardar ajustes');

      setSettings((prev) => ({ ...prev, ...updated }));
      setKeyInputs({ groq: '', openrouter: '', openai: '', anthropic: '' });
      setStatusBanner({
        tone: 'em',
        text: 'Configuración multi-proveedor guardada correctamente.',
      });
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `Error al guardar configuración: ${err.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearStoredKey = async (provId) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`api_key_${provId}`]: '' }),
      });
      const updated = await res.json();
      if (res.ok) {
        setSettings((prev) => ({ ...prev, ...updated }));
        setStatusBanner({
          tone: 'cobalt',
          text: `Llave personalizada de ${provId.toUpperCase()} limpiada (se usará variable de entorno si existe).`,
        });
      }
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `No se pudo limpiar la llave: ${err.message}`,
      });
    }
  };

  const handleTestProvider = async (prov) => {
    setTestStates((prev) => ({
      ...prev,
      [prov.id]: { loading: true, result: null },
    }));
    try {
      const modelToTest =
        settings.default_ai_provider === prov.id && settings.default_ai_model
          ? settings.default_ai_model
          : prov.recommendedModels[0];

      const res = await fetch('/api/admin/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: prov.id,
          model: modelToTest,
          apiKey: keyInputs[prov.id] || undefined,
          baseUrl: prov.id === 'ollama' ? settings.ollama_base_url : undefined,
        }),
      });
      const result = await res.json();
      setTestStates((prev) => ({
        ...prev,
        [prov.id]: { loading: false, result },
      }));
    } catch (err) {
      setTestStates((prev) => ({
        ...prev,
        [prov.id]: {
          loading: false,
          result: { ok: false, error: err.message, latency_ms: 0 },
        },
      }));
    }
  };

  const handleSeedIsdde = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el dataset ISDDE');
      setStatusBanner({
        tone: 'em',
        text: `Dataset ISDDE sincronizado: +${data.inserted?.sessionsCount ?? 0} sesiones nuevas (${data.benchmark?.totalSessions ?? 18} totales).`,
      });
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: err.message,
      });
    } finally {
      setSeeding(false);
    }
  };

  const activeProviderMeta =
    PROVIDERS.find((p) => p.id === settings.default_ai_provider) || PROVIDERS[0];

  if (loading) {
    return (
      <BlueprintPanel codeTag="MOD_07" title="Cargando configuración del banco de pruebas">
        <p className="font-ui-mono text-xs text-ink-2 py-8 text-center">
          Verificando conectores de IA y variables del entorno...
        </p>
      </BlueprintPanel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line-control pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <span className="font-ui-mono text-xs uppercase tracking-wider px-2 py-0.5 border border-line-control bg-paper-subtle text-ink">
              MOD_07 // CONECTORES IA, TELEMETRÍA Y ACCESIBILIDAD
            </span>
            <MarginNote tone="cobalt" rotate={-1}>
              DIAGNÓSTICO EN TIEMPO REAL
            </MarginNote>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight m-0">
            Ajustes de{' '}
            <HandMark type="underline" tone="cobalt">
              Plataforma y Proveedores
            </HandMark>
          </h1>
          <p className="font-body text-sm text-ink-2 mt-1 max-w-3xl">
            Configure el motor multi-proveedor (Groq, OpenRouter, OpenAI, Anthropic u Ollama local), ejecute pruebas reales de latencia y ajuste preferencias cognitivas WCAG 2.2 AAA.
          </p>
        </div>

        <StatBadge
          label="Persistencia"
          value={(settings.db_provider || 'memory').toUpperCase()}
          variant={settings.db_provider === 'supabase' ? 'cobalt' : 'em'}
        />
      </header>

      {statusBanner && (
        <div
          role="status"
          className={`p-3 border flex items-center justify-between gap-3 font-ui-mono text-xs ${
            statusBanner.tone === 'verm'
              ? 'bg-vermilion-tint border-vermilion-ink text-vermilion-ink'
              : statusBanner.tone === 'em'
              ? 'bg-emerald-tint border-emerald text-emerald'
              : 'bg-cobalt-tint border-cobalt text-cobalt'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label="Cerrar notificación"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-current bg-paper text-ink"
          >
            <CadIcon name="X" size={14} />
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Global Defaults Panel */}
        <BlueprintPanel
          codeTag="CFG_01"
          title="Proveedor y Modelo Predeterminado"
          subtitle="Valores iniciales al crear experimentos y al ejecutar el asistente metodológico"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Proveedor IA por defecto" required>
              <select
                value={settings.default_ai_provider}
                onChange={(e) => {
                  const nextProv = e.target.value;
                  const meta = PROVIDERS.find((p) => p.id === nextProv);
                  setSettings((prev) => ({
                    ...prev,
                    default_ai_provider: nextProv,
                    default_ai_model: meta ? meta.recommendedModels[0] : prev.default_ai_model,
                  }));
                }}
                className="w-full px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Modelo predeterminado" required>
              <input
                value={settings.default_ai_model}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, default_ai_model: e.target.value }))
                }
                placeholder={activeProviderMeta.recommendedModels[0]}
                className="w-full px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1 mb-4">
            <span className="font-ui-mono text-xs text-ink-2">Modelos sugeridos:</span>
            {activeProviderMeta.recommendedModels.map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() =>
                  setSettings((prev) => ({ ...prev, default_ai_model: mod }))
                }
                className={`min-h-[44px] px-3 border font-ui-mono text-xs ${
                  settings.default_ai_model === mod
                    ? 'border-cobalt bg-cobalt-tint text-cobalt font-semibold'
                    : 'border-line-control bg-paper-subtle text-ink hover:bg-paper'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>

          <Field
            label="URL base de Ollama (Modo Taller Local / Sin Nube)"
            help="Endpoint local compatible con /api/chat y /v1/chat/completions."
          >
            <input
              value={settings.ollama_base_url || ''}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, ollama_base_url: e.target.value }))
              }
              placeholder="http://localhost:11434"
              className="w-full px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
            />
          </Field>

          <div className="flex justify-end pt-2 border-t border-line-control">
            <SplitButton
              type="submit"
              variant="primary"
              iconBox="Check"
              loading={saving}
              onClick={handleSave}
            >
              Guardar Ajustes Globales
            </SplitButton>
          </div>
        </BlueprintPanel>

        {/* Multi-Provider Matrix & Live Ping */}
        <BlueprintPanel
          codeTag="CFG_02"
          title="Matriz de Proveedores y Diagnóstico de Conectividad"
          subtitle="Sobrescriba llaves de forma opcional o verifique variables .env con medición real de latencia"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PROVIDERS.map((prov) => {
              const isConfigured = Boolean(settings.env_keys?.[prov.id]);
              const masked = settings.masked_keys?.[prov.id] || '';
              const diag = testStates[prov.id];

              return (
                <div
                  key={prov.id}
                  className="p-4 border border-line-control bg-paper-subtle space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CadIcon name="Cpu" size={16} className="text-cobalt" />
                        <span className="font-ui-mono text-xs font-bold uppercase text-ink">
                          {prov.name}
                        </span>
                      </div>
                      <StatBadge
                        label={prov.id === 'ollama' ? 'Modo' : 'Credencial'}
                        value={
                          prov.id === 'ollama'
                            ? 'LOCAL'
                            : isConfigured
                            ? 'ACTIVA'
                            : 'CONTINGENCIA'
                        }
                        variant={isConfigured ? 'em' : 'default'}
                      />
                    </div>

                    <p className="font-body text-xs text-ink-2 m-0 leading-relaxed">
                      {prov.notes}
                    </p>

                    {prov.id !== 'ollama' && (
                      <div className="space-y-1.5 pt-1">
                        <label
                          htmlFor={`api-key-${prov.id}`}
                          className="block font-ui-mono text-xs text-ink"
                        >
                          Variable <code>{prov.envVar}</code>{' '}
                          {masked ? `(actual: ${masked})` : '(no definida en servidor)'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            id={`api-key-${prov.id}`}
                            type="password"
                            autoComplete="off"
                            value={keyInputs[prov.id] || ''}
                            onChange={(e) =>
                              setKeyInputs((prev) => ({
                                ...prev,
                                [prov.id]: e.target.value,
                              }))
                            }
                            placeholder="Pegar nueva API key para sobrescribir..."
                            className="min-h-[44px] flex-1 px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                          />
                          {masked && (
                            <button
                              type="button"
                              onClick={() => handleClearStoredKey(prov.id)}
                              className="min-h-[44px] px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink-2 hover:text-vermilion-ink"
                              title="Limpiar llave guardada en UI"
                            >
                              Limpiar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-dotted border-rule space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={diag?.loading}
                        onClick={() => handleTestProvider(prov)}
                        className="min-h-[44px] px-3.5 inline-flex items-center gap-2 border border-line-control bg-paper hover:bg-paper-muted font-ui-mono text-xs font-semibold text-ink"
                      >
                        <CadIcon name="Activity" size={14} className="text-cobalt" />
                        <span>
                          {diag?.loading ? 'Verificando…' : 'Probar Conexión y Latencia'}
                        </span>
                      </button>
                    </div>

                    {diag?.result && (
                      <div
                        className={`p-2.5 border font-ui-mono text-xs ${
                          diag.result.ok
                            ? 'bg-emerald-tint border-emerald text-emerald'
                            : 'bg-vermilion-tint border-vermilion-ink text-vermilion-ink'
                        }`}
                      >
                        {diag.result.ok ? (
                          <span>
                            [OK] {diag.result.is_mock ? 'Modo Contingencia Determinista' : 'Conectado en vivo'} · Latencia:{' '}
                            <strong>{Math.round(diag.result.latency_ms || 0)} ms</strong> · Modelo:{' '}
                            {diag.result.model}
                          </span>
                        ) : (
                          <span>
                            [!] Fallo de conexión: {diag.result.error || 'Sin respuesta del proveedor'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </BlueprintPanel>
      </form>

      {/* Accessibility & Cognitive Ergonomics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlueprintPanel
          codeTag="CFG_03"
          title="Accesibilidad Visual y Cognitiva (WCAG 2.2 AAA)"
          subtitle="Ajustes persistentes en este navegador para proyectores de aula o fatiga visual"
        >
          <div className="space-y-3">
            <label className="min-h-[44px] p-3 border border-line-control bg-paper-subtle flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <div className="font-ui-mono text-xs font-semibold uppercase text-ink">
                  Ocultar textura de grano de papel
                </div>
                <div className="font-body text-xs text-ink-2">
                  Recomendado al proyectar la plataforma en cañones o pantallas de bajo contraste en auditorios.
                </div>
              </div>
              <input
                type="checkbox"
                checked={grainOff}
                onChange={(e) => applyAccessibilityPref('ps_grain_off', e.target.checked)}
                className="w-5 h-5 accent-cobalt shrink-0"
              />
            </label>

            <label className="min-h-[44px] p-3 border border-line-control bg-paper-subtle flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <div className="font-ui-mono text-xs font-semibold uppercase text-ink">
                  Reducir movimiento y desplazamiento animado
                </div>
                <div className="font-body text-xs text-ink-2">
                  Desactiva transiciones CSS no esenciales conforme a WCAG 2.3.3.
                </div>
              </div>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => applyAccessibilityPref('ps_reduced_motion', e.target.checked)}
                className="w-5 h-5 accent-cobalt shrink-0"
              />
            </label>

            <label className="min-h-[44px] p-3 border border-line-control bg-paper-subtle flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <div className="font-ui-mono text-xs font-semibold uppercase text-ink">
                  Pausar refresco automático de telemetría
                </div>
                <div className="font-body text-xs text-ink-2">
                  Evita actualizaciones en segundo plano durante la lectura detenida de tablas estadísticas (WCAG 2.2.2).
                </div>
              </div>
              <input
                type="checkbox"
                checked={pauseTelemetry}
                onChange={(e) => applyAccessibilityPref('ps_pause_telemetry', e.target.checked)}
                className="w-5 h-5 accent-cobalt shrink-0"
              />
            </label>
          </div>
        </BlueprintPanel>

        {/* Synthetic Benchmark Loader & Workshop Mode */}
        <BlueprintPanel
          codeTag="CFG_04"
          title="Modo demo: datos de ejemplo"
          subtitle="Protección automática de base de datos remota y carga idempotente en memoria local"
        >
          <div className="space-y-4">
            <p className="font-body text-xs text-ink leading-relaxed m-0">
              Para demostraciones o docencia de métodos cuantitativos, puede poblar la memoria local con el <strong>Benchmark Sintético Educativo (Cohorte Simulada de 20+ sesiones pareadas)</strong>, turnos sintéticos y pares de calibración Humano vs. LLM.
            </p>
            <div className="p-3 bg-paper-subtle border border-line-control font-ui-mono text-xs text-ink-2 space-y-1">
              <div>
                • Para talleres con internet móvil o red universitaria restringida, ejecute:{' '}
                <code className="text-ink font-semibold">./run-demo.sh</code>
              </div>
              <div>
                • El endpoint de semilla bloquea escrituras accidentales si <code>DB_PROVIDER=supabase</code>.
              </div>
            </div>
            <SplitButton
              variant="secondary"
              iconBox="Database"
              loading={seeding}
              disabled={settings.db_provider === 'supabase'}
              onClick={handleSeedIsdde}
            >
              {settings.db_provider === 'supabase'
                ? 'Semilla deshabilitada en Supabase activo'
                : 'Cargar Benchmark Sintético de Prueba'}
            </SplitButton>
          </div>
        </BlueprintPanel>
      </div>
    </div>
  );
}
