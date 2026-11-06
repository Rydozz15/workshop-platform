'use client';

import React, { useEffect, useRef, useId } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import CadIcon from '@/components/ui/cad-icon';

const BTN = 'min-h-[44px] px-4 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2';
const BTN_PRIMARY = 'min-h-[44px] px-4 py-2 border border-line-strong bg-cobalt hover:bg-cobalt-hover text-paper font-body text-sm font-semibold inline-flex items-center gap-2';

/**
 * Full-size view of a campaign's QR and join code, meant to be projected as is. The QR can be
 * downloaded as a PNG for slides. Closes with Escape, the close button or a click outside.
 * `colors` are resolved from the design tokens at download time (the canvas cannot use CSS variables).
 */
export default function QrProjector({ open, onClose, name, code, link, tr }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const canvasWrap = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
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
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const css = typeof window === 'undefined' ? null : getComputedStyle(document.documentElement);
  const ink = css?.getPropertyValue('--ps-ink').trim() || 'currentColor';
  const paper = css?.getPropertyValue('--ps-paper').trim() || 'transparent';

  const download = () => {
    const canvas = canvasWrap.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `qr-${code}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="presentation">
      <div className="absolute inset-0 bg-ink/65" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-3xl max-h-full overflow-y-auto bg-paper border-2 border-ink shadow-hard"
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3 bg-paper-muted border-b-2 border-line-strong">
          <h2 id={titleId} className="ps-h3 m-0">{name}</h2>
          <button type="button" onClick={onClose} aria-label={tr('Cerrar')} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-ink hover:bg-paper">
            <CadIcon name="X" size={18} />
          </button>
        </header>

        <div className="p-4 sm:p-6 space-y-5 text-center">
          <p className="font-body text-sm text-ink m-0 max-w-xl mx-auto">
            {tr('Puedes proyectar esta pantalla tal cual: los participantes pueden escanear el QR o escribir el código.')}
          </p>
          <div ref={canvasWrap} className="flex justify-center">
            <QRCodeCanvas
              value={link}
              size={512}
              marginSize={2}
              bgColor={paper}
              fgColor={ink}
              style={{ width: 'min(60vh, 80vw, 28rem)', height: 'auto' }}
              aria-label={tr('Código QR de {name}', { name })}
            />
          </div>
          <div>
            <p className="ps-meta m-0">{tr('Código')}</p>
            <p className="font-stat text-5xl sm:text-6xl font-bold tracking-widest text-ink m-0">{code}</p>
          </div>
          <p className="ps-meta m-0 break-all">{link}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={download} className={BTN_PRIMARY}>
              <CadIcon name="Download" size={16} />{' '}{tr('Descargar QR (PNG)')}
            </button>
            <button type="button" onClick={onClose} className={BTN}>{tr('Cerrar')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
