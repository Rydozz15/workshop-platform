'use client';

import React from 'react';
import Abbr from './abbr';
import CadIcon from '../cad-icon';

const VARIANT_CLASS_MAP = {
  default: 'ps-badge--default bg-paper-subtle border-line-control text-ink',
  neutral: 'ps-badge--neutral bg-paper-subtle border-line-control text-ink',
  cobalt: 'ps-badge--cobalt bg-cobalt-tint border-cobalt text-cobalt',
  verm: 'ps-badge--verm bg-vermilion-tint border-vermilion-ink text-vermilion-ink',
  warning: 'ps-badge--warning bg-vermilion-tint border-vermilion-ink text-vermilion-ink',
  em: 'ps-badge--em bg-emerald-tint border-emerald text-emerald',
  significant: 'ps-badge--significant bg-emerald-tint border-emerald text-emerald',
};

/**
 * StatBadge - High-contrast accessible inference badge.
 * Color is NEVER the sole indicator: uses state marks (·, CadIcon Check, !, ◆) and accessible labels.
 */
export function StatBadge({
  label,
  value,
  subtext,
  variant = 'default',
  status,
  statusLabel,
  abbr,
  className = '',
  ...props
}) {
  const resolvedVariant = status || variant || 'default';
  const variantClass = VARIANT_CLASS_MAP[resolvedVariant] || VARIANT_CLASS_MAP.default;

  const accessibleText = statusLabel || subtext;

  const renderLabel = () => {
    if (abbr && typeof abbr === 'string') {
      return <Abbr term={abbr}>{label}</Abbr>;
    }
    return label;
  };

  const renderMark = () => {
    if (resolvedVariant === 'em' || resolvedVariant === 'significant') {
      return <CadIcon name="Check" size={12} className="text-emerald" />;
    }
    if (resolvedVariant === 'verm' || resolvedVariant === 'warning') {
      return '!';
    }
    if (resolvedVariant === 'cobalt') {
      return '>';
    }
    return '·';
  };

  return (
    <span
      className={`ps-badge inline-flex items-center gap-1.5 px-2 py-0.5 border font-ui-mono text-xs font-medium ${variantClass} ${className}`}
      {...props}
    >
      <span aria-hidden="true" className="font-ui-mono font-bold shrink-0 flex items-center">
        {renderMark()}
      </span>
      <span className="ps-badge__label">
        {renderLabel()}:
      </span>
      <span className="ps-badge__value stat font-stat font-semibold">
        {value}
      </span>
      {subtext && (
        <span className="ps-badge__subtext text-xs opacity-90">
          ({subtext})
        </span>
      )}
      {accessibleText && (
        <span className="sr-only"> — {accessibleText}</span>
      )}
    </span>
  );
}

export default StatBadge;
