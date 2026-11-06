'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BlueprintPanel,
  SplitButton,
  StatBadge,
  DataTable,
  ChartFrame,
  Field,
  MarginNote,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState('');

  const fetchMetrics = useCallback(async () => {
    const url = selectedCampaign
      ? `/api/admin/dashboard?workshopId=${encodeURIComponent(selectedCampaign)}`
      : '/api/admin/dashboard';
    try {
      const res = await fetch(url);
      if (res.ok) {
        setMetrics(await res.json());
      }
    } catch {
      // Ignore transient poll errors
    }
  }, [selectedCampaign]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/workshops');
      if (res.ok) {
        setCampaigns(await res.json());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    fetchMetrics();
    const pauseLive = typeof window !== 'undefined' && localStorage.getItem('ps_pause_telemetry') === '1';
    if (pauseLive) return undefined;
    const interval = setInterval(fetchMetrics, 12000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const handleSeedBenchmark = async () => {
    setSeeding(true);
    setSeedFeedback('');
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setSeedFeedback(
          `[OK] Conjunto empírico ISDDE (N=9 pareado, 18 sesiones, 108 turnos) cargado: +${data.seeded.sessionsCount} sesiones nuevas.`
        );
        await Promise.all([fetchCampaigns(), fetchMetrics()]);
      } else {
        setSeedFeedback(`[AVISO] ${data.error || 'No se pudo cargar la semilla.'}`);
      }
    } catch (err) {
      setSeedFeedback(`[ERROR] ${err.message}`);
    }
    setSeeding(false);
  };

  if (!metrics) {
    return (
      <BlueprintPanel codeTag="MOD_01" title="Cargando tablero experimental…">
        <p className="font-ui-mono text-xs text-ink-2 m-0">Consultando métricas de sesiones activas…</p>
      </BlueprintPanel>
    );
  }

  const distEntries = Object.entries(metrics.versionDistribution || {});
  const valA = distEntries[0]?.[1] ?? 0;
  const valB = distEntries[1]?.[1] ?? 0;
  const labelA = distEntries[0]?.[0] || 'Condición / Escenario A';
  const labelB = distEntries[1]?.[0] || 'Condición / Escenario B';

  const distTableRows = distEntries.map(([label, count], idx) => ({
    id: idx + 1,
    version: label,
    sessions: count,
    share:
      metrics.totalSessions > 0
        ? `${((count / metrics.totalSessions) * 100).toFixed(1)}%`
        : '0.0%',
  }));

  const sessionColumns = [
    { key: 'participant_name', label: 'Participante', sortable: true },
    { key: 'version_title', label: 'Escenario / Condición', sortable: true },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      format: (val) => (
        <StatBadge
          label="Estado"
          value={val === 'completed' ? 'Completada' : 'En curso'}
          variant={val === 'completed' ? 'em' : 'cobalt'}
        />
      ),
    },
    { key: 'interaction_count', label: 'Turnos', align: 'right', sortable: true },
    {
      key: 'started_at',
      label: 'Inicio',
      sortable: true,
      format: (val) => (val ? new Date(val).toLocaleString('es-CL') : '—'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-line-control">
        <div>
          <span className="font-ui-mono text-xs uppercase tracking-wider text-cobalt font-semibold">
            MOD_01 // CENTRO DE OPERACIONES EXPERIMENTAL
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1 m-0">
            Tablero General de Campañas A/B
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MarginNote tone="cobalt" rotate={-1.5}>
            TELEMETRÍA EN VIVO
          </MarginNote>
          <Link
            href="/admin/analytics"
            className="min-h-[44px] px-3.5 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink inline-flex items-center gap-2"
          >
            <CadIcon name="BarChart2" size={14} />
            <span>Ver Análisis Estadístico</span>
          </Link>
          <Link
            href="/admin/campaigns"
            className="min-h-[44px] px-3.5 py-2 border border-cobalt bg-cobalt text-paper hover:bg-cobalt-hover font-ui-mono text-xs font-medium inline-flex items-center gap-2 shadow-hard"
          >
            <CadIcon name="Plus" size={14} />
            <span>Nuevo Experimento A/B</span>
          </Link>
        </div>
      </div>

      {/* Campaign Filter & Benchmark Seeder Strip */}
      <BlueprintPanel
        codeTag="FILTRO_ACTIVO"
        title="Selección de Serie Experimental"
        headerSlot={
          <button
            type="button"
            disabled={seeding}
            onClick={handleSeedBenchmark}
            className="min-h-[44px] px-3 py-1.5 border border-line-control bg-paper-subtle hover:bg-paper font-ui-mono text-xs text-ink-2 hover:text-ink inline-flex items-center gap-1.5"
            title="Carga 18 sesiones simuladas para explorar las gráficas y pruebas de hipótesis sin alumnos reales"
          >
            <CadIcon name="Database" size={13} />
            <span>{seeding ? 'Cargando muestra…' : 'Cargar datos de prueba (N=9)'}</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <Field label="Filtrar indicadores por campaña" className="mb-0">
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="ps-field__control w-full font-ui-mono text-xs text-ink bg-paper border border-line-control px-3 py-2"
              >
                <option value="">Todas las campañas registradas ({campaigns.length})</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} [{c.share_code}]
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="md:col-span-6 font-body text-xs text-ink-2 leading-relaxed">
            <strong>En palabras simples:</strong> Este tablero resume cuántas sesiones se han iniciado y
            completado en tus campañas activas, asegurando que el balance aleatorio entre condiciones A y B se
            mantenga equilibrado durante talleres presenciales o remotos.
          </div>
        </div>

        {seedFeedback && (
          <div
            role="status"
            className="mt-3 p-3 bg-paper-subtle border border-line-control font-ui-mono text-xs text-ink"
          >
            {seedFeedback}
          </div>
        )}
      </BlueprintPanel>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { code: 'KPI_01', label: 'Sesiones Totales', value: metrics.totalSessions, sub: 'Muestra acumulada' },
          { code: 'KPI_02', label: 'Completadas', value: metrics.completedSessions, sub: 'Con cierre registrado' },
          { code: 'KPI_03', label: 'Activas Ahora', value: metrics.activeSessions, sub: 'En diálogo abierto' },
          { code: 'KPI_04', label: 'Turnos Estudiante', value: metrics.totalInteractions, sub: 'Intervenciones totales' },
          { code: 'KPI_05', label: 'Turnos / Sesión', value: metrics.avgInteractions, sub: 'Promedio dialógico' },
        ].map((kpi) => (
          <BlueprintPanel key={kpi.code} codeTag={kpi.code} title={kpi.label}>
            <div className="font-stat text-3xl font-semibold text-ink stat">
              {kpi.value}
            </div>
            <div className="font-ui-mono text-xs text-ink-2 mt-1">
              {kpi.sub}
            </div>
          </BlueprintPanel>
        ))}
      </div>

      {/* Distribution ChartFrame */}
      {distEntries.length > 0 && (
        <ChartFrame
          title="Balance de Asignación por Escenario / Condición"
          subtitle="Comparación visual de sesiones asignadas (Trama diagonal vs. Cobalto sólido)"
          data={{
            conditionA: { mean: valA, sd: 0, ci: 0, label: labelA },
            conditionB: { mean: valB, sd: 0, ci: 0, label: labelB },
            diff: valB - valA,
          }}
          tableColumns={[
            { key: 'version', label: 'Escenario / Condición', sortable: true },
            { key: 'sessions', label: 'Sesiones (n)', align: 'right', sortable: true },
            { key: 'share', label: 'Proporción', align: 'right' },
          ]}
          tableData={distTableRows}
          trendSummary={`Se observan ${metrics.totalSessions} sesiones distribuidas en ${distEntries.length} variante(s) activas. El balanceador asigna cada nuevo participante a la condición con menor conteo acumulado.`}
        />
      )}

      {/* Recent Sessions DataTable */}
      <BlueprintPanel
        codeTag="BITACORA_SESIONES"
        title="Últimas Sesiones Registradas"
        subtitle="Muestra las 20 interacciones más recientes; consulta el módulo 04 Sesiones para ver transcripciones completas."
        headerSlot={
          <Link
            href="/admin/sessions"
            className="min-h-[44px] px-3 py-1.5 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-cobalt font-medium inline-flex items-center gap-1.5"
          >
            <span>Inspeccionar transcripciones</span>
            <CadIcon name="ArrowRight" size={13} />
          </Link>
        }
      >
        <DataTable
          caption="Registro cronológico de sesiones recientes"
          columns={sessionColumns}
          data={metrics.recentSessions || []}
          emptyText="Aún no hay sesiones registradas. Carga el Benchmark ISDDE (N=9) arriba o comparte un enlace desde 03 Experimentos."
        />
      </BlueprintPanel>
    </div>
  );
}
