'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { BlueprintPanel, Kpi, Drawer } from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { useLanguage, useTr } from '@/lib/i18n/context';

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
  const { t } = useLanguage();
  const [campaignId, setCampaignId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

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
          <h1 className="ps-h1">{t('live.title', 'En vivo')}</h1>
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
            headerSlot={updatedAt && <span className="ps-meta">{tr('Actualizado')}{' '}{updatedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
          >
            {st.alerts.length === 0 ? (
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

          <BlueprintPanel title={tr('Avance por paso')} subtitle={tr('Cuántas personas hay en cada paso y cómo se reparten las condiciones.')}>
            <ol className="list-none m-0 p-0 space-y-5">
              {st.steps.map((s) => {
                const max = Math.max(1, ...s.conditions.map((c) => c.count));
                return (
                  <li key={s.id}>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h3 className="ps-h3">{s.order}. {s.name}</h3>
                      <span className="ps-meta">{tr('{started} iniciaron · {active} en curso · {completed} terminaron', { started: s.started, active: s.active, completed: s.completed })}</span>
                    </div>
                    <ul className="list-none m-0 p-0 mt-2 space-y-1.5">
                      {s.conditions.map((c, i) => (
                        <li key={c.id} className={`ps-cond-${(i % 6) + 1} grid grid-cols-[minmax(6rem,12rem)_1fr_2.5rem] items-center gap-3 font-body text-sm`}>
                          <span className="truncate text-ink" title={c.title}>{c.title}</span>
                          <span className="h-3 bg-paper-muted border border-line-control">
                            <span className="block h-full" style={{ width: `${(c.count / max) * 100}%`, backgroundColor: 'var(--cond)' }} />
                          </span>
                          <span className="font-stat font-semibold text-ink text-right">{c.count}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
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

      <Drawer open={qrOpen} onClose={() => setQrOpen(false)} title={tr('Código para participantes')} closeLabel={tr('Cerrar')}>
        {sel && (
          <div className="text-center space-y-4">
            <QRCodeSVG value={link} size={256} bgColor="transparent" fgColor="currentColor" className="text-ink mx-auto max-w-full h-auto" aria-label={tr('Código QR de {name}', { name: sel.name })} />
            <p className="font-stat text-4xl font-bold tracking-widest text-ink m-0">{sel.share_code}</p>
            <p className="ps-meta m-0 break-all">{link}</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
