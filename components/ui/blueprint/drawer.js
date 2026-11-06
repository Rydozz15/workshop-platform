'use client';

import React, { useEffect, useRef, useId } from 'react';
import CadIcon from '../cad-icon';

/**
 * Drawer - panel that slides over the page from the right (or left). Closes with Escape, the close
 * button or a click on the backdrop; focus moves in on open and returns to the opener on close.
 * DrawerHandle is the edge tab that opens it (useful on phones, e.g. "Ver caso").
 */
export function Drawer({ open, onClose, title, side = 'right', children, closeLabel = 'Cerrar' }) {
  const panelRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      openerRef.current?.focus?.();
    };
  }, [open, onClose]);

  const hidden = side === 'left' ? '-translate-x-full' : 'translate-x-full';
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink transition-opacity ${open ? 'opacity-40' : 'opacity-0'}`}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`ps-drawer absolute top-0 bottom-0 ${side === 'left' ? 'left-0 border-r-2' : 'right-0 border-l-2'} w-[min(92vw,28rem)] bg-paper border-line-strong flex flex-col transform ${
          open ? 'translate-x-0' : hidden
        }`}
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3 bg-paper-muted border-b-2 border-line-strong">
          <h2 id={titleId} className="ps-h3">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-ink hover:bg-paper"
          >
            <CadIcon name="X" size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{open && children}</div>
      </aside>
    </div>
  );
}

export function DrawerHandle({ onClick, label, side = 'right', icon = 'BookOpen', className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed top-1/2 -translate-y-1/2 z-40 min-h-[44px] px-3 py-3 flex items-center gap-2 bg-cobalt text-paper border border-line-strong font-body text-sm font-medium hover:bg-cobalt-hover ${
        side === 'left' ? 'left-0 border-l-0' : 'right-0 border-r-0'
      } ${className}`}
    >
      <CadIcon name={icon} size={16} />
      <span>{label}</span>
    </button>
  );
}

export default Drawer;
