'use client';

import React from 'react';
import Link from 'next/link';
import CadIcon from '@/components/ui/cad-icon';
import useSelectedCampaign, { withCampaign } from '@/lib/use-selected-campaign';

/**
 * Orientation strip for the pages that hang off Resultados (Sesiones, Análisis completo): a
 * breadcrumb, a way back that keeps the selected campaign, and one line on how the page relates
 * to Resultados.
 */
export default function SectionTrail({ current, description, tr }) {
  const [campaignId] = useSelectedCampaign();
  const back = withCampaign('/admin/results', campaignId);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-3 border border-line-control bg-paper">
      <div className="min-w-0">
        <nav aria-label={tr('Ruta de navegación')} className="flex flex-wrap items-center gap-1 font-body text-sm text-ink">
          <Link href={back} className="font-semibold text-cobalt underline">{tr('Resultados')}</Link>
          <CadIcon name="ChevronRight" size={14} className="text-ink-2" />
          <span aria-current="page" className="font-semibold">{current}</span>
        </nav>
        <p className="font-body text-sm text-ink-2 m-0 mt-1">{description}</p>
      </div>
      <Link href={back} className="min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2">
        <CadIcon name="ArrowLeft" size={16} />{' '}{tr('Volver a Resultados')}
      </Link>
    </div>
  );
}
