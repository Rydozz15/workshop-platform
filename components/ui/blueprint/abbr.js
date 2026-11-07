'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import Link from 'next/link';
import CadIcon from '../cad-icon';
import { useTr } from '@/lib/i18n/context';

export const GLOSSARY_TERMS = {
  p: {
    symbol: 'p',
    name: 'p-valor',
    definition: 'Probabilidad de observar los datos obtenidos (o más extremos) si la hipótesis nula fuera cierta.',
    interpretation: 'Umbral alfa típico: p < 0.05 indica significancia estadística.',
    link: '/glosario#p',
  },
  'p-holm': {
    symbol: 'p (Holm)',
    name: 'p-valor ajustado por Holm-Bonferroni',
    definition: 'Corrección secuencial descendente que controla la tasa de error familiar (FWER) al evaluar múltiples hipótesis.',
    interpretation: 'Ajuste monótono: p_adj,i >= p_adj,i-1.',
    link: '/glosario#p-holm',
  },
  u: {
    symbol: 'U',
    name: 'Estadístico U de Mann-Whitney',
    definition: 'Prueba no paramétrica para contrastar si dos muestras independientes provienen de poblaciones con la misma distribución.',
    interpretation: 'Robusto ante no-normalidad y datos ordinales tipo Likert.',
    link: '/glosario#u',
  },
  d: {
    symbol: 'd',
    name: 'd de Cohen',
    definition: 'Diferencia estandarizada de medias entre dos condiciones.',
    interpretation: '0.2 pequeño, 0.5 mediano, 0.8 grande.',
    link: '/glosario#d',
  },
  'cliff-delta': {
    symbol: 'δ',
    name: 'δ de Cliff (Cliff\'s Delta)',
    definition: 'Medida no paramétrica del tamaño del efecto: δ = 1 - 2U / (n_A * n_B).',
    interpretation: '< 0.147 insignificante, < 0.33 pequeño, < 0.474 mediano, >= 0.474 grande (Romano et al., 2006).',
    link: '/glosario#cliff-delta',
  },
  delta: {
    symbol: 'δ',
    name: 'δ de Cliff (Cliff\'s Delta)',
    definition: 'Medida no paramétrica del tamaño del efecto: δ = 1 - 2U / (n_A * n_B).',
    interpretation: '< 0.147 insignificante, < 0.33 pequeño, < 0.474 mediano, >= 0.474 grande (Romano et al., 2006).',
    link: '/glosario#cliff-delta',
  },
  alpha: {
    symbol: 'α',
    name: 'Alfa de Cronbach',
    definition: 'Coeficiente de fiabilidad y consistencia interna para escalas multi-ítem.',
    interpretation: 'α >= 0.70 aceptable, α >= 0.80 bueno para instrumentos de investigación.',
    link: '/glosario#alpha',
  },
  'gwet-ac1': {
    symbol: 'AC₁',
    name: 'AC₁ de Gwet',
    definition: 'Coeficiente de fiabilidad inter-juez robusto ante la paradoja de prevalencia (alta concordancia con kappa baja).',
    interpretation: 'Complementa a Cohen\'s kappa ante distribuciones desbalanceadas.',
    link: '/glosario#gwet-ac1',
  },
  ac1: {
    symbol: 'AC₁',
    name: 'AC₁ de Gwet',
    definition: 'Coeficiente de fiabilidad inter-juez robusto ante la paradoja de prevalencia.',
    interpretation: 'Complementa a Cohen\'s kappa ante distribuciones desbalanceadas.',
    link: '/glosario#gwet-ac1',
  },
  mattr: {
    symbol: 'MATTR',
    name: 'Moving-Average Type-Token Ratio',
    definition: 'Medida de diversidad léxica independiente de la longitud del texto usando ventanas deslizantes (W=25, 50).',
    interpretation: 'Valores mayores reflejan mayor riqueza de vocabulario en el diálogo.',
    link: '/glosario#mattr',
  },
  'ic-95': {
    symbol: 'IC 95%',
    name: 'Intervalo de Confianza al 95%',
    definition: 'Rango de valores que contiene el parámetro poblacional verdadero con 95% de confianza bajo muestreo repetido.',
    interpretation: 'Si el IC para una diferencia incluye 0, no hay evidencia suficiente de efecto.',
    link: '/glosario#ic-95',
  },
  'hake-g': {
    symbol: 'g',
    name: 'Ganancia normalizada de Hake',
    definition: 'Fracción de la ganancia máxima posible alcanzada entre pre-test y post-test: g = (post - pre) / (max - pre).',
    interpretation: '< 0.3 baja, 0.3-0.7 media, > 0.7 alta ganancia de aprendizaje.',
    link: '/glosario#hake-g',
  },
  'mlu-w': {
    symbol: 'MLU-w',
    name: 'Mean Length of Utterance in words',
    definition: 'Longitud media de los enunciados del estudiante medida en palabras.',
    interpretation: 'Indicador de elaboración conceptual y profundidad conversacional.',
    link: '/glosario#mlu-w',
  },
  'r-vol': {
    symbol: 'R_vol',
    name: 'Verbal Volume Ratio',
    definition: 'Proporción del volumen verbal total generado por el estudiante respecto al chatbot.',
    interpretation: 'R_vol > 1.0 indica mayor protagonismo discursivo del estudiante.',
    link: '/glosario#r-vol',
  },
};

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
    name: term || 'Término estadístico',
    definition: text || 'Definición detallada disponible en el glosario de investigación.',
    interpretation: '',
    link: `/glosario#${termKey}`,
  };

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
        title={termData.name}
        className={`ps-abbr cursor-help underline decoration-dotted decoration-rule underline-offset-4 text-ink hover:text-cobalt ${className}`}
      >
        {displayText}
      </abbr>

      {isOpen && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={termData.name}
          className="absolute left-0 bottom-full mb-2 z-50 w-72 p-3 bg-paper border border-line-control shadow-hard text-left"
        >
          <div className="flex items-baseline justify-between gap-2 border-b border-line-control pb-1.5 mb-2">
            <span className="font-ui-mono text-xs font-semibold text-cobalt uppercase">
              {termData.symbol} · {termData.name}
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
            {termData.definition}
          </p>
          {termData.interpretation && (
            <p className="font-ui-mono text-xs text-ink-2 leading-tight mb-2 border-l-2 border-cobalt pl-1.5">
              {termData.interpretation}
            </p>
          )}
          <div className="pt-1 border-t border-paper-subtle">
            <Link
              href={termData.link}
              className="font-ui-mono text-xs text-cobalt hover:underline flex items-center gap-1"
            >
              Consultar en el glosario completo →
            </Link>
          </div>
        </div>
      )}
    </span>
  );
}

export default Abbr;
