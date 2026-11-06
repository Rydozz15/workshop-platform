'use client';

import React from 'react';

/**
 * TitleBlock - Engineering blueprint title block (cajetín de plano).
 * Rendered as an accessible definition list (<dl>) providing audit metadata.
 */
export function TitleBlock({
  title,
  subtitle,
  sheetNumber,
  status,
  expId,
  rev,
  n,
  analysis,
  updatedAt,
  owner,
  className = '',
  ...props
}) {
  const displaySheet = sheetNumber || expId || 'SHT-01';
  const displayStatus = status || (analysis ? analysis.toUpperCase() : 'PREREGISTRADO');
  const displayRev = rev || 'REV A';
  const displayTitle = title || (expId ? `EXP_${expId}` : 'ESPECIFICACIÓN EXPERIMENTAL');
  const displaySubtitle = subtitle || (updatedAt ? `ACTUALIZADO: ${updatedAt}` : 'PROMPTSKETCH WORKBENCH');
  const displaySample = n ? (typeof n === 'object' && n.a !== undefined ? `A: ${n.a} / B: ${n.b}` : String(n)) : null;

  return (
    <dl
      className={`ps-titleblock grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-px bg-line-control border-t-2 border-line-strong font-ui-mono text-xs m-0 ${className}`}
      {...props}
    >
      <div className="ps-titleblock__cell bg-paper-subtle p-2">
        <dt className="ps-titleblock__dt text-xs uppercase text-ink-2 font-normal">PLANO / EXP</dt>
        <dd className="ps-titleblock__dd text-xs font-semibold text-ink m-0 truncate">{displaySheet}</dd>
      </div>

      <div className="ps-titleblock__cell bg-paper-subtle p-2">
        <dt className="ps-titleblock__dt text-xs uppercase text-ink-2 font-normal">ESTADO</dt>
        <dd className="ps-titleblock__dd text-xs font-semibold text-ink m-0 truncate">
          <span className={displayStatus.includes('PREREG') ? 'text-cobalt' : 'text-emerald'}>
            {displayStatus}
          </span>
        </dd>
      </div>

      <div className="ps-titleblock__cell bg-paper-subtle p-2">
        <dt className="ps-titleblock__dt text-xs uppercase text-ink-2 font-normal">REVISIÓN</dt>
        <dd className="ps-titleblock__dd text-xs font-semibold text-ink m-0 truncate">{displayRev}</dd>
      </div>

      {displaySample && (
        <div className="ps-titleblock__cell bg-paper-subtle p-2">
          <dt className="ps-titleblock__dt text-xs uppercase text-ink-2 font-normal">MUESTRA (N)</dt>
          <dd className="ps-titleblock__dd text-xs font-semibold text-ink stat m-0 truncate">{displaySample}</dd>
        </div>
      )}

      <div className="ps-titleblock__cell bg-paper-subtle p-2 col-span-1 sm:col-span-2">
        <dt className="ps-titleblock__dt text-xs uppercase text-ink-2 font-normal">TÍTULO / DESCRIPCIÓN</dt>
        <dd className="ps-titleblock__dd text-xs font-semibold text-ink m-0 truncate" title={`${displayTitle} — ${displaySubtitle}`}>
          {displayTitle}
          <span className="font-normal text-ink-2 ml-1 text-xs">· {displaySubtitle}</span>
        </dd>
      </div>

      {owner && (
        <div className="ps-titleblock__cell bg-paper-subtle p-2">
          <dt className="ps-titleblock__dt text-xs uppercase text-ink-2 font-normal">RESPONSABLE</dt>
          <dd className="ps-titleblock__dd text-xs font-semibold text-ink m-0 truncate">{owner}</dd>
        </div>
      )}
    </dl>
  );
}

export default TitleBlock;
