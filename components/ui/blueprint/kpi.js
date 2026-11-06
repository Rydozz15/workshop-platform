'use client';

import React from 'react';
import CadIcon from '../cad-icon';
import InfoTip from './info-tip';

/**
 * Kpi - one headline number with its own icon, color and explanation.
 * tone: 'graphite' | 'cobalt' | 'emerald' | 'vermilion'. Color always accompanies an icon and a label.
 * `hint` becomes an InfoTip that says in plain words what the number means.
 */
export function Kpi({ label, value, icon = 'Activity', tone = 'graphite', hint, detail, className = '' }) {
  return (
    <div className={`ps-kpi ps-kpi--${tone} ${className}`}>
      <span className="ps-kpi__icon" aria-hidden="true">
        <CadIcon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 font-body text-sm font-medium text-ink-2">
          <span>{label}</span>
          {hint && <InfoTip label={`Qué significa: ${label}`}>{hint}</InfoTip>}
        </div>
        <div className="ps-kpi__value">{value}</div>
        {detail && <div className="ps-meta mt-0.5">{detail}</div>}
      </div>
    </div>
  );
}

export default Kpi;
