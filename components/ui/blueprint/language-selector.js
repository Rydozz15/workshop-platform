'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import CadIcon from '@/components/ui/cad-icon';

export default function LanguageSelector({ className = '', compact = false }) {
  const { locale, setLocale, locales } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Seleccionar idioma de la plataforma / Select platform language"
      className={`inline-flex items-center border border-line-control bg-paper-subtle p-0.5 ${className}`}
    >
      <span className="sr-only">Idioma / Language:</span>
      <span className="hidden sm:inline-flex items-center pl-2 pr-1 text-ink-2" aria-hidden="true">
        <CadIcon name="Globe" size={13} />
      </span>
      {locales.map((loc) => {
        const isActive = locale === loc.code;
        return (
          <button
            key={loc.code}
            type="button"
            onClick={() => setLocale(loc.code)}
            aria-pressed={isActive}
            title={loc.name}
            className={`min-h-[44px] min-w-[40px] px-2.5 py-1.5 font-ui-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
              isActive
                ? 'bg-cobalt text-paper border border-cobalt'
                : 'bg-transparent text-ink hover:bg-paper hover:text-ink'
            }`}
          >
            {compact ? loc.label : loc.label}
          </button>
        );
      })}
    </div>
  );
}
