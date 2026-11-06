'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { BlueprintPanel, InfoTip } from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { useLanguage } from '@/lib/i18n/context';

const BTN = 'min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2';
const BTN_PRIMARY = 'min-h-[44px] px-4 py-2 border border-line-strong bg-cobalt hover:bg-cobalt-hover text-paper font-body text-sm font-semibold inline-flex items-center gap-2';

function CampaignCard({ campaign, origin, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const link = `${origin}/session/${campaign.share_code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt?.('Copia el enlace', link);
    }
  };

  const remove = async () => {
    setBusy(true);
    const res = await fetch(`/api/admin/campaigns/${encodeURIComponent(campaign.id)}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) onDeleted();
  };

  const conditions = campaign.condition_ids.length;
  return (
    <article className="border border-line-control bg-paper shadow-hard flex flex-col sm:flex-row">
      <div className="flex-1 min-w-0 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="ps-h3">{campaign.name}</h2>
          <span
            className={`px-2 py-0.5 border font-body text-xs font-semibold ${
              campaign.is_active ? 'border-emerald bg-emerald-tint text-emerald' : 'border-line-control bg-paper-subtle text-ink-2'
            }`}
          >
            {campaign.is_active ? 'Activa' : 'Pausada'}
          </span>
        </div>
        {campaign.description && <p className="ps-lead">{campaign.description}</p>}
        <dl className="flex flex-wrap gap-x-6 gap-y-1 m-0 font-body text-sm text-ink">
          <div><dt className="inline text-ink-2">Pasos: </dt><dd className="inline font-semibold m-0">{campaign.step_count}</dd></div>
          <div><dt className="inline text-ink-2">Condiciones: </dt><dd className="inline font-semibold m-0">{conditions}</dd></div>
          <div><dt className="inline text-ink-2">Participantes: </dt><dd className="inline font-semibold m-0">{campaign.participants}</dd></div>
          <div><dt className="inline text-ink-2">Sesiones completas: </dt><dd className="inline font-semibold m-0">{campaign.sessions_completed}/{campaign.sessions_total}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/admin/campaigns/${encodeURIComponent(campaign.id)}`} className={BTN}>
            <CadIcon name="Pencil" size={16} /> Editar
          </Link>
          <Link href={`/admin/sessions?campaign=${encodeURIComponent(campaign.id)}`} className={BTN}>
            <CadIcon name="BarChart2" size={16} /> Ver resultados
          </Link>
          {confirming ? (
            <span className="inline-flex items-center gap-1">
              <button type="button" disabled={busy} onClick={remove} className="min-h-[44px] px-3 bg-vermilion-tint border border-vermilion-ink text-vermilion-ink font-body text-sm font-semibold">
                {busy ? 'Eliminando…' : 'Sí, eliminar campaña y sus datos'}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={BTN}>Cancelar</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className={BTN + ' text-vermilion-ink'}>
              <CadIcon name="Trash2" size={16} /> Eliminar
            </button>
          )}
        </div>
      </div>
      <div className="sm:w-56 shrink-0 p-4 border-t sm:border-t-0 sm:border-l border-line-control bg-paper-subtle flex sm:flex-col items-center gap-3">
        {origin && <QRCodeSVG value={link} size={96} bgColor="transparent" fgColor="currentColor" className="text-ink shrink-0" aria-label={`Código QR de ${campaign.name}`} />}
        <div className="min-w-0 text-center sm:w-full">
          <p className="ps-meta m-0">Código</p>
          <p className="font-stat text-lg font-bold text-ink m-0 tracking-wider">{campaign.share_code}</p>
          <button type="button" onClick={copy} className={BTN + ' mt-1 w-full justify-center'}>
            <CadIcon name={copied ? 'Check' : 'Link'} size={16} /> {copied ? 'Copiado' : 'Copiar enlace'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CampaignsPage() {
  const { t } = useLanguage();
  const [campaigns, setCampaigns] = useState(null);
  const [error, setError] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const load = useCallback(() => {
    fetch('/api/admin/campaigns')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No pudimos cargar las campañas.'))))
      .then(setCampaigns)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="ps-h1">{t('campaigns.title', 'Campañas')}</h1>
          <p className="ps-lead mt-1">{t('campaigns.subtitle', 'Crea y administra las actividades que tus participantes van a realizar.')}</p>
        </div>
        <Link href="/admin/campaigns/new" className={BTN_PRIMARY}>
          <CadIcon name="Plus" size={16} /> {t('campaigns.create', 'Crear campaña')}
        </Link>
      </div>

      {error && <div role="alert" className="border-2 border-vermilion-ink bg-vermilion-tint text-vermilion-ink p-3 font-body text-sm">{error}</div>}

      {campaigns === null && !error && <p className="ps-lead" role="status">Cargando campañas…</p>}

      {campaigns && campaigns.length === 0 && (
        <BlueprintPanel title="Aún no tienes campañas" subtitle="Una campaña reúne los pasos que vivirá cada participante.">
          <Link href="/admin/campaigns/new" className={BTN_PRIMARY}>
            <CadIcon name="Plus" size={16} /> Crear mi primera campaña
          </Link>
        </BlueprintPanel>
      )}

      <div className="space-y-4">
        {campaigns?.map((c) => (
          <CampaignCard key={c.id} campaign={c} origin={origin} onDeleted={load} />
        ))}
      </div>

      {campaigns && campaigns.length > 0 && (
        <p className="ps-meta flex items-center gap-1">
          Cada campaña tiene un único código y QR para todos sus pasos.
          <InfoTip label="Cómo avanzan los participantes">
            Los participantes entran con el código de la campaña y avanzan de un paso al siguiente sin volver a escanear.
          </InfoTip>
          <Link href="/admin/campaigns/classic" className="ml-3 underline hover:text-cobalt">Editor clásico</Link>
        </p>
      )}
    </div>
  );
}
