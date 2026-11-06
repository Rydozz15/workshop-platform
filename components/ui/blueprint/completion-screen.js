'use client';

import React from 'react';
import Link from 'next/link';
import BlueprintPanel from './panel';
import Disclosure from './disclosure';
import JourneyHub from './journey-hub';
import Logo from '../brand';
import CadIcon from '../cad-icon';

/**
 * CompletionScreen - what the participant sees at the end: thanks, what they did, and what comes next.
 * The detailed conversation analytics stay available on demand under a disclosure.
 */
export function CompletionScreen({ name = '', historyData = [], loading = false, nextHref = null }) {
  const steps = historyData.map((s, i) => ({
    key: s.id || i,
    title: s.workshops?.name || s.workshop_name || `Parte ${s.workshops?.chain_order || i + 1}`,
    messages: (s.messages || []).filter((m) => m.role === 'user').length,
    status: s.status,
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-6">
      <Logo />
      <div>
        <h1 className="ps-h1">{name ? `¡Gracias, ${name}!` : '¡Gracias por participar!'}</h1>
        <p className="ps-lead mt-2">Tus respuestas quedaron guardadas.</p>
      </div>

      <BlueprintPanel title="Lo que hiciste" headingLevel={2}>
        {loading && <p className="ps-lead" role="status">Cargando…</p>}
        {!loading && steps.length === 0 && <p className="ps-lead">Completaste la actividad.</p>}
        <ol className="list-none m-0 p-0 space-y-2">
          {steps.map((s) => (
            <li key={s.key} className="flex items-center gap-3 p-3 bg-paper-subtle border border-line-control">
              <CadIcon name={s.status === 'completed' ? 'CheckCircle' : 'Circle'} size={20} className={s.status === 'completed' ? 'text-emerald' : 'text-ink-2'} />
              <div className="min-w-0">
                <p className="font-body text-base font-semibold text-ink m-0 truncate">{s.title}</p>
                <p className="ps-meta m-0">{s.messages} {s.messages === 1 ? 'mensaje enviado' : 'mensajes enviados'}</p>
              </div>
            </li>
          ))}
        </ol>
      </BlueprintPanel>

      <BlueprintPanel title="Qué sigue" headingLevel={2}>
        {nextHref ? (
          <Link href={nextHref} className="min-h-[44px] px-4 py-2 border border-line-strong bg-cobalt hover:bg-cobalt-hover text-paper font-body text-sm font-semibold inline-flex items-center gap-2">
            Continuar con la siguiente parte <CadIcon name="ArrowRight" size={16} />
          </Link>
        ) : (
          <p className="font-body text-base text-ink m-0">No tienes nada más que hacer. Ya puedes cerrar esta ventana.</p>
        )}
      </BlueprintPanel>

      {historyData.length > 0 && (
        <Disclosure title="Ver el análisis de mi conversación" summary="Opcional: cómo fue tu forma de conversar">
          <JourneyHub historyData={historyData} loading={loading} />
        </Disclosure>
      )}
    </div>
  );
}

export default CompletionScreen;
