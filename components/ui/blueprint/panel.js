'use client';

import React, { useId } from 'react';
import TitleBlock from './title-block';

/**
 * BlueprintPanel - Sheet container with CAD registration crop marks.
 * Supports variants: 'card' | 'drawer' | 'canvas'.
 */
export function BlueprintPanel({
  title,
  subtitle,
  headingLevel = 3,
  codeTag,
  headerSlot,
  titleBlock,
  variant = 'card',
  paper = true,
  raised = false,
  children,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const headingId = title ? `bp-panel-${generatedId}` : undefined;

  const Tag = headingLevel === 2 ? 'h2' : headingLevel === 4 ? 'h4' : 'h3';
  const isRaised = raised || variant === 'card';
  const bgClass = variant === 'canvas' ? 'bg-blueprint-grid' : paper ? 'bg-paper' : 'bg-paper';

  return (
    <section
      aria-labelledby={headingId}
      className={`ps-sheet relative ${bgClass} border border-line-control text-ink ${
        isRaised ? 'ps-sheet--raised shadow-hard' : ''
      } ${variant === 'drawer' ? 'p-4 border-l-4 border-l-cobalt' : ''} ${className}`}
      {...props}
    >
      {/* CAD Registration Crop Marks */}
      <span aria-hidden="true" className="ps-crop ps-crop--tl" />
      <span aria-hidden="true" className="ps-crop ps-crop--tr" />
      <span aria-hidden="true" className="ps-crop ps-crop--bl" />
      <span aria-hidden="true" className="ps-crop ps-crop--br" />

      {/* Header Bar */}
      {(title || codeTag || headerSlot) && (
        <header className="ps-sheet__head flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-paper-muted border-b-2 border-line-strong">
          <div className="flex items-center gap-3">
            {codeTag && (
              <span className="ps-sheet__tag font-ui-mono text-xs font-medium px-1.5 py-0.5 border border-line-control bg-paper text-ink">
                {codeTag}
              </span>
            )}
            {title && (
              <div>
                <Tag id={headingId} className={`ps-sheet__title text-ink m-0 ${headingLevel === 2 ? 'text-xl' : 'text-lg'}`}>
                  {title}
                </Tag>
                {subtitle && (
                  <p className="font-body text-sm text-ink-2 mt-0.5 m-0">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
          {headerSlot && <div className="ps-sheet__slot flex items-center gap-2">{headerSlot}</div>}
        </header>
      )}

      {/* Body Content */}
      <div className="ps-sheet__body p-4">
        {children}
      </div>

      {/* Integrated TitleBlock (Cajetín de plano) */}
      {titleBlock && (
        typeof titleBlock === 'object' && React.isValidElement(titleBlock) ? (
          titleBlock
        ) : (
          <TitleBlock {...titleBlock} />
        )
      )}
    </section>
  );
}

export default BlueprintPanel;
