'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CadIcon from '@/components/ui/cad-icon';
import { useTr } from '@/lib/i18n/context';

/** Shown on every admin page while sample data is loaded, so nobody mistakes it for real results. */
export default function DemoBanner() {
  const tr = useTr();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/seed')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setLoaded(Boolean(d?.loaded)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) return null;
  return (
    <div role="status" className="bg-cobalt-tint border-b-2 border-cobalt">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-sm text-ink">
        <CadIcon name="Info" size={16} className="text-cobalt shrink-0" />
        <span>{tr('Estás en modo demo: ves datos de ejemplo, no resultados reales.')}</span>
        <Link href="/admin/settings" className="font-semibold text-cobalt underline min-h-[44px] inline-flex items-center">
          {tr('Salir del modo demo')}
        </Link>
      </div>
    </div>
  );
}
