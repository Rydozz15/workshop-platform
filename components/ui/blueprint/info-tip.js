'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import CadIcon from '../cad-icon';
import { useTr } from '@/lib/i18n/context';

/**
 * InfoTip - small "i" button that explains a term or metric in plain words.
 * Opens on hover, keyboard focus or tap; Escape closes it. Keep `children` to 1-2 sentences:
 * what it is and why the user should care.
 */
export function InfoTip({ children, label, side = 'bottom', className = '' }) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const tipId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className={`relative inline-flex align-middle ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label || tr('Más información')}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center p-3.5 -m-3.5 text-ink-2 hover:text-cobalt"
      >
        <CadIcon name="Info" size={16} />
      </button>
      {open && (
        <span
          id={tipId}
          role="tooltip"
          className={`absolute z-50 left-1/2 -translate-x-1/2 w-64 p-3 bg-paper border border-line-strong shadow-hard text-left font-body text-sm text-ink leading-snug ${
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {children}
        </span>
      )}
    </span>
  );
}

export default InfoTip;
