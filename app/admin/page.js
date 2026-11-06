'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlueprintPanel, Kpi } from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { useTr } from '@/lib/i18n/context';
import useSelectedCampaign from '@/lib/use-selected-campaign';
import StepProgressChart from '@/components/admin/step-progress-chart';
import QrProjector from '@/components/admin/qr-projector';

const BTN = 'min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2';
const REFRESH_MS = 8000;
const SEVERITY = {
  warning: { box: 'border-vermilion-ink bg-vermilion-tint', icon: 'AlertTriangle', text: 'text-vermilion-ink' },
  error: { box: 'border-vermilion-ink bg-vermilion-tint', icon: 'XCircle', text: 'text-vermilion-ink' },
  info: { box: 'border-cobalt bg-cobalt-tint', icon: 'Info', text: 'text-cobalt' },
};

function timeAgo(iso) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}

export default function LivePage() {
  const tr = useTr();
  const [campaignId, setCampaignId] = useSelectedCampaign();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [view, setView] = useState('bars');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [alertsHidden, setAlertsHidden] = useState(() => {
    try { return typeof window !== 'undefined' && localStorage.getItem('ps_alerts_hidden') === '1'; } catch { return false; }
  });
  const toggleAlerts = () => {
    const next = !alertsHidden;
    setAlertsHidden(next);
    try { next ? localStorage.setItem('ps_alerts_hidden', '1') : localStorage.removeItem('ps_alerts_hidden'); } catch { /* storage unavailable */ }
  };

  useEffect(() => {
    let cancelled = false;
    const tick = () =>
      fetch(`/api/admin/live${campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : ''}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(tr('No pudimos actualizar los datos.')))))
        .then((json) => {
          if (cancelled) return;
          setData(json);
          setUpdatedAt(new Date());
          setError('');
        })
        .catch((e) => !cancelled && setError(e.message));
    tick();
    if (paused) return () => { cancelled = true; };
    const id = setInterval(tick, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [campaignId, paused]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const sel = data?.selected;
  const st = data?.status;
  const link = sel ? `${origin}/session/${sel.share_code}` : '';

  if (data && !sel) {
    return (
      <BlueprintPanel title={tr('Aún no hay campañas')} subtitle={tr('Crea una para empezar a ver a tus participantes en vivo.')}>
        <Link href="/admin/campaigns/new" className="min-h-[44px] px-4 py-2 border border-line-strong bg-cobalt hover:bg-cobalt-hover text-paper font-body text-sm font-semibold inline-flex items-center gap-2">
          <CadIcon name="Plus" size={16} />{' '}{tr('Crear campaña')}</Link>
      </BlueprintPanel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="ps-h1">{tr('En vivo')}</h1>
          <p className="ps-lead mt-1">{sel ? tr('Qué está pasando ahora en “{name}”.', { name: sel.name }) : tr('Cargando…')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data && data.campaigns.length > 1 && (
            <label className="flex items-center gap-2 font-body text-sm text-ink">
              <span className="sr-only sm:not-sr-only">{tr('Campaña')}</span>
              <select
                value={sel?.id || ''}
                onChange={(e) => setCampaignId(e.target.value)}
                className="min-h-[44px] font-body text-sm text-ink bg-paper border border-line-control px-3 py-2 max-w-[16rem]"
              >
                {data.campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          )}
          <button type="button" onClick={() => setQrOpen(true)} className={BTN} disabled={!sel}>
            <CadIcon name="QrCode" size={16} />{' '}{tr('Proyectar QR')}</button>
          <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} className={BTN}>
            <CadIcon name={paused ? 'Play' : 'Pause'} size={16} /> {paused ? tr('Reanudar actualización') : tr('Pausar actualización')}</button>
        </div>
      </div>

      {error && <div role="alert" className="border-2 border-vermilion-ink bg-vermilion-tint text-vermilion-ink p-3 font-body text-sm">{error}</div>}

      {st && (
        <>
          <section aria-label={tr('Resumen')} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Kpi label={tr('En curso ahora')} value={st.totals.active} icon="Activity" tone="cobalt" hint={tr('Personas que están dentro de la actividad en este momento.')} />
            <Kpi label={tr('Terminaron')} value={st.totals.completed} icon="CheckCircle" tone="emerald" hint={tr('Sesiones que llegaron hasta el final, incluida la encuesta.')} />
            <Kpi label={tr('Participantes')} value={st.totals.participants} icon="Users" tone="graphite" hint={tr('Personas distintas que comenzaron la campaña.')} />
            <Kpi label={tr('Mensajes por sesión')} value={st.totals.avgMessages} icon="MessageSquare" tone="graphite" hint={tr('Promedio de mensajes que escribe cada participante. Si es muy bajo, quizá no están entendiendo la tarea.')} />
          </section>

          <BlueprintPanel
            title={st.alerts.length ? tr('Requiere tu atención') : tr('Todo en orden')}
            subtitle={st.alerts.length ? tr('Lo más importante primero.') : tr('No detectamos problemas en este momento.')}
            headerSlot={
              <div className="flex flex-wrap items-center gap-3">
                {updatedAt && <span className="ps-meta">{tr('Actualizado')}{' '}{updatedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
                <button type="button" onClick={toggleAlerts} aria-pressed={!alertsHidden} className={BTN}>
                  <CadIcon name={alertsHidden ? 'Eye' : 'EyeOff'} size={16} />{' '}{alertsHidden ? tr('Mostrar') : tr('Ocultar')}
                </button>
              </div>
            }
          >
            {alertsHidden ? (
              st.alerts.length > 0 && <p className="ps-meta m-0">{tr('{n} alerta(s) oculta(s).', { n: st.alerts.length })}</p>
            ) : st.alerts.length === 0 ? (
              <p className="flex items-center gap-2 font-body text-sm text-emerald"><CadIcon name="CheckCircle" size={18} />{' '}{tr('Sin alertas.')}</p>
            ) : (
              <ul className="list-none m-0 p-0 space-y-3">
                {st.alerts.map((a) => {
                  const sev = SEVERITY[a.severity] || SEVERITY.info;
                  return (
                    <li key={a.id} className={`border-2 p-3 flex gap-3 ${sev.box}`}>
                      <CadIcon name={sev.icon} size={20} className={`${sev.text} shrink-0 mt-0.5`} />
                      <div className="min-w-0">
                        <p className={`font-body text-sm font-semibold m-0 ${sev.text}`}>{a.title}</p>
                        <p className="font-body text-sm text-ink m-0 mt-0.5">{a.detail}</p>
                        {a.action && <Link href={a.action.href} className="font-body text-sm font-semibold text-cobalt underline mt-1 inline-block min-h-[44px] leading-[44px]">{a.action.label}</Link>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </BlueprintPanel>

          <BlueprintPanel
            title={tr('Avance por paso')}
            subtitle={tr('Cuántas personas hay en cada paso y cómo se reparten las condiciones.')}
            headerSlot={
              <div role="group" aria-label={tr('Ver como')} className="inline-flex border border-line-control bg-paper">
                {[['bars', 'Barras'], ['share', 'Proporción'], ['table', 'Tabla']].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={view === id}
                    onClick={() => setView(id)}
                    className={`min-h-[44px] px-3 font-body text-sm ${view === id ? 'bg-ink text-paper font-semibold' : 'bg-paper text-ink hover:bg-paper-subtle'}`}
                  >
                    {tr(label)}
                  </button>
                ))}
              </div>
            }
          >
            {view === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full font-body text-sm text-left">
                  <thead>
                    <tr className="text-ink-2 border-b border-line-control">
                      <th className="py-2 pr-4 font-semibold">{tr('Paso')}</th>
                      {(st.steps[0]?.conditions || []).map((c) => (
                        <th key={c.id} className="py-2 pr-4 font-semibold text-right">{c.title}</th>
                      ))}
                      <th className="py-2 font-semibold text-right">{tr('Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {st.steps.map((s) => (
                      <tr key={s.id} className="border-b border-dotted border-rule hover:bg-cobalt-tint">
                        <td className="py-2 pr-4 text-ink">{s.order}. {s.name}</td>
                        {s.conditions.map((c) => (
                          <td key={c.id} className="py-2 pr-4 text-right font-stat">{c.count}</td>
                        ))}
                        <td className="py-2 text-right font-stat font-semibold">{s.started}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <StepProgressChart steps={st.steps} view={view} tr={tr} />
            )}
          </BlueprintPanel>

          <BlueprintPanel
            title={tr('Últimas sesiones')}
            headerSlot={<Link href="/admin/sessions" className="font-body text-sm font-semibold text-cobalt underline">{tr('Ver todas')}</Link>}
          >
            {st.recent.length === 0 ? (
              <p className="ps-lead">{tr('Cuando alguien entre, lo verás aquí.')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full font-body text-sm text-left">
                  <thead>
                    <tr className="text-ink-2 border-b border-line-control">
                      <th className="py-2 pr-4 font-semibold">{tr('Participante')}</th>
                      <th className="py-2 pr-4 font-semibold">{tr('Paso')}</th>
                      <th className="py-2 pr-4 font-semibold">{tr('Estado')}</th>
                      <th className="py-2 pr-4 font-semibold text-right">{tr('Mensajes')}</th>
                      <th className="py-2 font-semibold">{tr('Inicio')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {st.recent.map((r) => (
                      <tr key={r.id} className="border-b border-dotted border-rule hover:bg-cobalt-tint">
                        <td className="py-2 pr-4 text-ink">{r.participant_name}</td>
                        <td className="py-2 pr-4 text-ink">{r.step_name}</td>
                        <td className="py-2 pr-4">
                          <span className={r.status === 'completed' ? 'text-emerald font-semibold' : 'text-cobalt font-semibold'}>
                            {r.status === 'completed' ? tr('Terminó') : tr('En curso')}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right font-stat">{r.interaction_count}</td>
                        <td className="py-2 text-ink-2">{timeAgo(r.started_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BlueprintPanel>
        </>
      )}

      {sel && <QrProjector open={qrOpen} onClose={() => setQrOpen(false)} name={sel.name} code={sel.share_code} link={link} tr={tr} />}
    </div>
  );
}
