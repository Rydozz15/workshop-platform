'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import Link from 'next/link';
import CadIcon from '../cad-icon';
import { useTr } from '@/lib/i18n/context';
import { GLOSSARY_TERMS, ABBR_FALLBACKS } from '@/lib/abbr-data';

/**
 * Abbr - Interactive keyboard-accessible glossary abbreviation component.
 * Displays definition popover on click or Enter/Space, closes on Escape.
 */
export function Abbr({ term, text, children, className = '' }) {
  const tr = useTr();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const popoverId = useId();

  const termKey = (term || '').toLowerCase().trim();
  const termData = GLOSSARY_TERMS[termKey] || {
    symbol: term,
    name: term || ABBR_FALLBACKS.name,
    definition: text || ABBR_FALLBACKS.definition,
    interpretation: '',
    link: `/glosario#${termKey}`,
  };

  // Glossary entries are Spanish source text: translate them for the current language.
  const name = tr(termData.name);
  const definition = tr(termData.definition);
  const interpretation = termData.interpretation ? tr(termData.interpretation) : '';

  const displayText = children || text || termData.symbol || term;

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggle = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <span ref={containerRef} className="relative inline-block">
      <abbr
        tabIndex={0}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        onClick={toggle}
        onKeyDown={onKeyDown}
        title={name}
        className={`ps-abbr cursor-help underline decoration-dotted decoration-rule underline-offset-4 text-ink hover:text-cobalt ${className}`}
      >
        {displayText}
      </abbr>

      {isOpen && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={name}
          className="absolute left-0 bottom-full mb-2 z-50 w-72 p-3 bg-paper border border-line-control shadow-hard text-left"
        >
          <div className="flex items-baseline justify-between gap-2 border-b border-line-control pb-1.5 mb-2">
            <span className="font-ui-mono text-xs font-semibold text-cobalt uppercase">
              {termData.symbol} · {name}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={tr('Cerrar definición')}
              className="font-ui-mono text-xs text-ink-2 hover:text-ink min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <CadIcon name="X" size={14} />
            </button>
          </div>
          <p className="font-body text-xs text-ink leading-relaxed mb-2">
            {definition}
          </p>
          {interpretation && (
            <p className="font-ui-mono text-xs text-ink-2 leading-tight mb-2 border-l-2 border-cobalt pl-1.5">
              {interpretation}
            </p>
          )}
          <div className="pt-1 border-t border-paper-subtle">
            <Link
              href={termData.link}
              className="font-ui-mono text-xs text-cobalt hover:underline flex items-center gap-1"
            >
              {tr(ABBR_FALLBACKS.link)}
            </Link>
          </div>
        </div>
      )}
    </span>
  );
}

export default Abbr;
