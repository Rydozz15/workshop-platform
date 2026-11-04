'use client';

import React, { useId } from 'react';

/**
 * Field - Accessible form field wrapper.
 * Label is permanently visible, includes "(obligatorio)" text, and links error/help via ARIA.
 */
export function Field({
  label,
  error,
  help,
  helperText,
  required = false,
  id: customId,
  children,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const inputId = customId || (React.isValidElement(children) && children.props?.id) || `field-${generatedId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helpId = (help || helperText) ? `${inputId}-help` : undefined;

  const resolvedHelp = help || helperText;

  // Pass accessible IDs and error state to child control if it's a single React element
  const enhancedChildren = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: inputId,
        'aria-invalid': error ? 'true' : children.props['aria-invalid'],
        'aria-describedby':
          [errorId, helpId, children.props['aria-describedby']]
            .filter(Boolean)
            .join(' ') || undefined,
        required: required || children.props.required,
        className: `${children.props.className || ''} min-h-[44px] ${
          error ? 'border-2 border-vermilion-ink bg-vermilion-tint' : ''
        }`.trim(),
      })
    : children;

  return (
    <div className={`ps-field flex flex-col gap-1.5 mb-4 ${className}`} {...props}>
      {label && (
        <label
          htmlFor={inputId}
          className="ps-field__label font-ui-mono text-xs font-semibold uppercase tracking-wider text-ink flex items-center justify-between"
        >
          <span>{label}</span>
          {required ? (
            <span className="text-vermilion-ink font-normal text-xs lowercase">
              (obligatorio)
            </span>
          ) : (
            <span className="text-ink-2 font-normal text-xs lowercase">
              (opcional)
            </span>
          )}
        </label>
      )}

      {enhancedChildren}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="ps-field__error font-ui-mono text-xs font-semibold text-vermilion-ink flex items-center gap-1.5 mt-0.5 m-0"
        >
          <span aria-hidden="true" className="shrink-0 font-bold">[!]</span>
          <span>Error: {error}</span>
        </p>
      )}

      {resolvedHelp && !error && (
        <p
          id={helpId}
          className="ps-field__help font-ui-mono text-xs text-ink-2 mt-0.5 m-0"
        >
          {resolvedHelp}
        </p>
      )}
    </div>
  );
}

export default Field;
