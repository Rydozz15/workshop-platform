'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BlueprintPanel, Field, Disclosure, InfoTip } from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { extractMeasures, analyzeMeasure } from '@/lib/quick-analysis';
import { useLanguage, useTr } from '@/lib/i18n/context';

const SELECT = 'w-full min-h-[44px] font-body text-sm text-ink bg-paper border border-line-control px-3 py-2';
const BTN = 'min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2';
const BTN_PRIMARY = 'min-h-[44px] px-4 py-2 border border-line-strong bg-cobalt hover:bg-cobalt-hover text-paper font-body text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60';

const DATASETS = [
  { id: 'session', label: 'Una fila por sesión', hint: 'Una fila por persona y paso: condición, duración, respuestas de la encuesta y métricas.', file: 'sesiones' },
  { id: 'turn', label: 'Una fila por mensaje', hint: 'Cada mensaje de la conversación, con tiempos y métricas del texto.', file: 'mensajes' },
  { id: 'longitudinal', label: 'Seguimiento de cada participante entre pasos', hint: 'Una fila por participante con sus resultados en cada paso (útil para comparar antes y después).', file: 'seguimiento' },
];

function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toFixed(d).replace('.', ',') : '–');

function ResultsInner() {
  const tr = useTr();
  const { t } = useLanguage();
  const params = useSearchParams();
  const [campaigns, setCampaigns] = useState(null);
  const [campaignId, setCampaignId] = useState(params.get('campaign') || '');
  const [detail, setDetail] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [dataset, setDataset] = useState('session');
  const [stepId, setStepId] = useState('');
  const [withDictionary, setWithDictionary] = useState(true);
  const [measureId, setMeasureId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetch('/api/admin/campaigns')
      .then((r) => r.json())
      .then((list) => {
        setCampaigns(list);
        setCampaignId((current) => current || list[0]?.id || '');
      })
      .catch(() => setCampaigns([]));
  }, []);

  useEffect(() => {
    if (!campaignId) return undefined;
    let cancelled = false;
    Promise.all([
      fetch(`/api/admin/campaigns/${encodeURIComponent(campaignId)}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/admin/analytics?campaignId=${encodeURIComponent(campaignId)}`).then((r) => (r.ok ? r.json() : null)),
    ]).then(([d, a]) => {
      if (cancelled) return;
      setDetail(d);
      setAnalytics(a);
      setStepId('');
      setMeasureId('');
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const measures = useMemo(
    () => (analytics ? extractMeasures({ sessions: analytics.sessions, workshops: analytics.workshops, versions: analytics.versions }) : []),
    [analytics]
  );
  const measure = measures.find((m) => m.id === measureId) || measures[0];
  const result = useMemo(() => (measure ? analyzeMeasure(measure.groups, { ordinal: measure.ordinal }) : null), [measure]);
  const sessionCount = analytics?.sessions?.length ?? 0;

  const runDownload = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const ds = DATASETS.find((d) => d.id === dataset);
      const q = new URLSearchParams({ campaignId, format: 'csv', level: dataset });
      if (stepId) q.set('workshopId', stepId);
      const res = await fetch(`/api/admin/export?${q}`);
      if (!res.ok) throw new Error(tr('No pudimos preparar el archivo.'));
      const stamp = new Date().toISOString().slice(0, 10);
      const name = (detail?.name || 'campana').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      download(await res.text(), `${name}_${ds.file}_${stamp}.csv`, 'text/csv;charset=utf-8');
      if (withDictionary) {
        const dict = await fetch('/api/admin/export?format=codebook');
        if (dict.ok) download(await dict.text(), `${name}_diccionario-de-variables.md`, 'text/markdown;charset=utf-8');
      }
      setNotice({ ok: true, text: withDictionary ? tr('Listo: descargamos los datos y el diccionario de variables.') : tr('Listo: descargamos los datos.') });
    } catch (e) {
      setNotice({ ok: false, text: e.message });
    }
    setBusy(false);
  };

  if (campaigns && campaigns.length === 0) {
    return (
      <BlueprintPanel title={tr('Aún no hay resultados')} subtitle={tr('Cuando tengas una campaña con participantes, sus datos aparecerán aquí.')}>
        <Link href="/admin/campaigns/new" className={BTN_PRIMARY}><CadIcon name="Plus" size={16} />{' '}{tr('Crear campaña')}</Link>
      </BlueprintPanel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="ps-h1">{t('results.title', 'Resultados')}</h1>
          <p className="ps-lead mt-1">{tr('Descarga los datos, revisa qué pasó y mira una primera lectura.')}</p>
        </div>
        {campaigns && campaigns.length > 1 && (
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <span>{tr('Campaña')}</span>
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className={SELECT + ' w-auto max-w-[18rem]'}>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
      </div>

      <BlueprintPanel title={tr('Descargar datos')} subtitle={tr('Archivos CSV que se abren en Excel, R, Python o SPSS.')}>
        <div className="grid md:grid-cols-2 gap-x-6">
          <Field label={tr('¿Qué quieres descargar?')} help={tr(DATASETS.find((d) => d.id === dataset).hint)}>
            <select className={SELECT} value={dataset} onChange={(e) => setDataset(e.target.value)}>
              {DATASETS.map((d) => <option key={d.id} value={d.id}>{tr(d.label)}</option>)}
            </select>
          </Field>
          <Field label={tr('¿De qué parte?')}>
            <select className={SELECT} value={stepId} onChange={(e) => setStepId(e.target.value)} disabled={!detail}>
              <option value="">{tr('Toda la campaña')}</option>
              {detail?.steps.map((s) => <option key={s.id} value={s.id}>{tr('Solo “{name}”', { name: s.name })}</option>)}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 font-body text-sm text-ink min-h-[44px]">
          <input type="checkbox" className="w-5 h-5" checked={withDictionary} onChange={(e) => setWithDictionary(e.target.checked)} />{tr('Incluir el diccionario de variables')}<InfoTip label={tr('Qué es el diccionario de variables')}>{tr('Un documento que explica qué significa cada columna del archivo y qué valores puede tener.')}</InfoTip>
        </label>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="button" onClick={runDownload} disabled={busy || !campaignId || sessionCount === 0} className={BTN_PRIMARY}>
            <CadIcon name="Download" size={16} /> {busy ? 'Preparando…' : 'Descargar'}
          </button>
          {analytics && sessionCount === 0 && <span className="ps-meta">{tr('Todavía no hay sesiones para descargar.')}</span>}
          {notice && <span role="status" className={`font-body text-sm ${notice.ok ? 'text-emerald' : 'text-vermilion-ink'}`}>{notice.text}</span>}
        </div>
      </BlueprintPanel>

      <BlueprintPanel
        title={tr('Primera lectura')}
        subtitle={tr('Compara las condiciones en una medida a la vez.')}
        headerSlot={<Link href="/admin/analytics" className="font-body text-sm font-semibold text-cobalt underline">{tr('Abrir análisis completo')}</Link>}
      >
        {!analytics && <p className="ps-lead" role="status">{tr('Cargando…')}</p>}
        {analytics && measures.length === 0 && <p className="ps-lead">{tr('Cuando haya respuestas de la encuesta o conversaciones, podrás compararlas aquí.')}</p>}
        {measure && result && (
          <div className="space-y-4">
            <Field label={tr('¿Qué quieres comparar?')}>
              <select className={SELECT} value={measure.id} onChange={(e) => setMeasureId(e.target.value)}>
                {measures.map((m) => <option key={m.id} value={m.id}>{m.id === 'messages' ? tr(m.label) : m.label}</option>)}
              </select>
            </Field>

            <div className={`border-2 p-4 ${result.status === 'ok' ? (result.significant ? 'border-emerald bg-emerald-tint' : 'border-line-strong bg-paper-subtle') : 'border-line-control bg-paper-subtle'}`}>
              <p className="font-body text-base text-ink m-0">{result.summary}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-body text-sm text-left">
                <thead>
                  <tr className="text-ink-2 border-b border-line-control">
                    <th className="py-2 pr-4 font-semibold">{tr('Condición')}</th>
                    <th className="py-2 pr-4 font-semibold text-right">{tr('Personas')}</th>
                    <th className="py-2 pr-4 font-semibold text-right">{tr('Promedio')}</th>
                    <th className="py-2 pr-4 font-semibold text-right">{tr('Mediana')}</th>
                    <th className="py-2 font-semibold text-right">{tr('Variación')}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.descriptives.map((d, i) => (
                    <tr key={d.label} className={`ps-cond-${(i % 6) + 1} border-b border-dotted border-rule hover:bg-cobalt-tint`}>
                      <td className="py-2 pr-4 text-ink"><span aria-hidden="true" className="inline-block w-3 h-3 mr-2 align-middle" style={{ backgroundColor: 'var(--cond)' }} />{d.label}</td>
                      <td className="py-2 pr-4 text-right font-stat">{d.n}</td>
                      <td className="py-2 pr-4 text-right font-stat font-semibold">{fmt(d.mean)}</td>
                      <td className="py-2 pr-4 text-right font-stat">{fmt(d.median)}</td>
                      <td className="py-2 text-right font-stat">{fmt(d.sd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.status === 'ok' && (
              <Disclosure title={tr('Ver detalle estadístico')} summary={`${result.testLabel} · p = ${fmt(result.pValue, 3)}`}>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 font-body text-sm m-0">
                  <dt className="text-ink-2">{tr('Prueba usada')}</dt>
                  <dd className="m-0 text-ink">{result.testLabel}</dd>
                  <dt className="text-ink-2">{tr('Valor p')}{' '}<InfoTip label={tr('Qué es el valor p')}>{tr('Qué tan sorprendente sería ver esta diferencia si en realidad no la hubiera. Cuanto más bajo, menos probable que sea azar.')}</InfoTip></dt>
                  <dd className="m-0 text-ink font-stat">{fmt(result.pValue, 4)}</dd>
                  <dt className="text-ink-2">{tr('Tamaño del efecto')}{' '}<InfoTip label={tr('Qué es el tamaño del efecto')}>{tr('Cuánta diferencia hay, no solo si existe. Un efecto grande importa más que uno diminuto aunque ambos sean “significativos”.')}</InfoTip></dt>
                  <dd className="m-0 text-ink"><span className="font-stat">{fmt(result.effectValue)}</span> ({result.effectLabel})</dd>
                </dl>
                {result.posthoc?.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <p className="font-body text-sm font-semibold text-ink">{tr('Comparaciones por pares (ajustadas con Holm)')}</p>
                    <table className="w-full font-body text-sm text-left">
                      <tbody>
                        {result.posthoc.map((p) => (
                          <tr key={`${p.a}-${p.b}`} className="border-b border-dotted border-rule">
                            <td className="py-2 pr-4 text-ink">{tr('{a} vs {b}', { a: p.a, b: p.b })}</td>
                            <td className="py-2 pr-4 font-stat">{tr('p ajustado = {p}', { p: fmt(p.adjustedP, 3) })}</td>
                            <td className={`py-2 font-semibold ${p.significant ? 'text-emerald' : 'text-ink-2'}`}>{p.significant ? 'Se distinguen' : 'No se distinguen'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-4 mb-0"><Link href={`/glosario#${result.glossary || 'p'}`} className="font-body text-sm font-semibold text-cobalt underline">{tr('¿Qué significan estos términos?')}</Link></p>
              </Disclosure>
            )}
          </div>
        )}
      </BlueprintPanel>

      <BlueprintPanel title={tr('Revisar las conversaciones')} subtitle={tr('Lee cada sesión mensaje a mensaje y corrige lo que haga falta.')}>
        <Link href="/admin/sessions" className={BTN}><CadIcon name="MessageSquare" size={16} />{' '}{tr('Ver sesiones')}{analytics ? ` (${sessionCount})` : ''}</Link>
      </BlueprintPanel>
    </div>
  );
}

export default function ResultsPage() {
  const tr = useTr();
  return (
    <Suspense fallback={<p className="ps-lead" role="status">{tr('Cargando…')}</p>}>
      <ResultsInner />
    </Suspense>
  );
}
