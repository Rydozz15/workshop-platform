'use client';

import React from 'react';

const TONE_CLASSES = {
  ink: 'text-ink',
  cobalt: 'text-cobalt',
  vermilion: 'text-vermilion-ink',
  verm: 'text-vermilion-ink',
};

/**
 * MarginNote - Human marginalia annotation adhering to the 10% rule.
 * Bounds: <= 5 words, rotated [-3deg, +3deg], uppercase.
 */
export function MarginNote({
  children,
  tone = 'cobalt',
  rotate = -2,
  arrow = 'none',
  informative = false,
  className = '',
  ...props
}) {
  // Validate word count invariant in development
  if (typeof children === 'string') {
    const wordCount = children.trim().split(/\s+/).length;
    if (wordCount > 5 && process.env.NODE_ENV !== 'production') {
      console.warn(
        `[PromptSketch Invariant] MarginNote exceeds 5 words constraint (${wordCount} words): "${children}".`
      );
    }
  }

  // Clamp rotation strictly to [-3, 3] degrees
  const clampedRotate = Math.max(-3, Math.min(3, rotate));
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.cobalt;

  const renderArrow = () => {
    if (arrow === 'left') {
      return (
        <svg
          viewBox="0 0 24 16"
          className="w-5 h-4 inline-block mr-1 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          aria-hidden="true"
        >
          <path d="M22 8H3M9 2L2 8l7 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (arrow === 'right') {
      return (
        <svg
          viewBox="0 0 24 16"
          className="w-5 h-4 inline-block ml-1 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          aria-hidden="true"
        >
          <path d="M2 8h19M15 2l7 6-7 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (arrow === 'down') {
      return (
        <svg
          viewBox="0 0 16 24"
          className="w-4 h-5 inline-block shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          aria-hidden="true"
        >
          <path d="M8 2v19M2 15l6 7 6-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return null;
  };

  return (
    <span
      role={informative ? 'note' : undefined}
      aria-hidden={!informative || undefined}
      style={{
        transform: `rotate(${clampedRotate}deg)`,
        display: 'inline-flex',
        alignItems: 'center',
      }}
      className={`ps-margin-note font-note text-sm uppercase tracking-wider font-normal select-none ${toneClass} ${className}`}
      {...props}
    >
      {arrow === 'left' && renderArrow()}
      <span>{children}</span>
      {arrow === 'right' && renderArrow()}
      {arrow === 'down' && renderArrow()}
    </span>
  );
}

/**
 * HandMark - Hand-drawn pencil annotation mark (circle, check, underline, bracket).
 */
export function HandMark({
  type = 'circle',
  tone = 'vermilion',
  className = '',
  children,
  ...props
}) {
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.vermilion;

  return (
    <span
      aria-hidden="true"
      className={`ps-handmark relative inline-block select-none ${toneClass} ${className}`}
      {...props}
    >
      {children}
      {type === 'circle' && (
        <svg
          viewBox="0 0 80 40"
          className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        >
          <path
            d="M 10,20 C 12,6 68,4 72,18 C 76,32 18,36 8,24 C 5,20 12,12 25,8"
            strokeLinecap="round"
          />
        </svg>
      )}
      {type === 'underline' && (
        <svg
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
          className="absolute left-0 -bottom-1.5 w-full h-3 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        >
          <path
            d="M 2,8 C 25,4 65,10 98,6"
            strokeLinecap="round"
          />
        </svg>
      )}
      {type === 'check' && (
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 inline-block pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M4 13l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {type === 'bracket' && (
        <svg
          viewBox="0 0 20 60"
          className="absolute -left-2 top-0 h-full w-3 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M 14,2 C 4,2 6,24 2,30 C 6,36 4,58 14,58" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

export default MarginNote;
