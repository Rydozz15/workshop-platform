'use client';

import React, { useState, useId } from 'react';
import CadIcon from '../cad-icon';

/**
 * Disclosure - progressive disclosure block. Shows a title (and optional summary) and reveals the
 * detail on demand, so a page can lead with the answer and keep the rest one click away.
 */
export function Disclosure({ title, summary, defaultOpen = false, children, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();
  return (
    <div className={`border border-line-control bg-paper ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[44px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-paper-subtle"
      >
        <span>
          <span className="ps-h3 block">{title}</span>
          {summary && <span className="font-body text-sm text-ink-2 block mt-0.5">{summary}</span>}
        </span>
        <CadIcon name={open ? 'ChevronUp' : 'ChevronDown'} size={18} />
      </button>
      {open && (
        <div id={regionId} className="px-4 pb-4 pt-3 border-t border-line-control">
          {children}
        </div>
      )}
    </div>
  );
}

export default Disclosure;
