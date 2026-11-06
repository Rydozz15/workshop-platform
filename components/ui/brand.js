import React from 'react';

/**
 * PromptSketch mark: a square split on the diagonal. One half is hatched (the control condition),
 * the other is solid (the variant), echoing how conditions are drawn in the charts.
 */
export function LogoMark({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <clipPath id="ps-logo-hatch">
          <path d="M2 2 L30 2 L2 30 Z" />
        </clipPath>
      </defs>
      <path d="M30 2 L30 30 L2 30 Z" fill="var(--ps-cobalt)" />
      <g clipPath="url(#ps-logo-hatch)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <path d="M-4 12 L12 -4 M-4 20 L20 -4 M-4 28 L28 -4 M-4 36 L36 -4" />
      </g>
      <rect x="2" y="2" width="28" height="28" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="miter" />
      <path d="M30 2 L2 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}

export function Logo({ size = 28, withWordmark = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-ink ${className}`}>
      <LogoMark size={size} />
      {withWordmark && (
        <span className="font-display font-bold tracking-tight text-lg leading-none">PromptSketch</span>
      )}
      {!withWordmark && <span className="sr-only">PromptSketch</span>}
    </span>
  );
}

export default Logo;
