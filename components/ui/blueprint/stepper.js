'use client';

import React from 'react';
import CadIcon from '../cad-icon';

/**
 * Stepper - progress through the phases of a flow.
 * steps: [{ id, label }]; current: index of the active step (0-based).
 * Completed steps show a check, the active one pulses, pending ones stay neutral.
 * On narrow screens only the active label is shown, plus "Paso X de N".
 */
export function Stepper({ steps = [], current = 0, label = 'Progreso', stepWord = 'Paso', ofWord = 'de', className = '' }) {
  if (!steps.length) return null;
  return (
    <nav aria-label={label} className={className}>
      <p className="ps-meta m-0 mb-2 sm:hidden">
        {stepWord} {Math.min(current + 1, steps.length)} {ofWord} {steps.length}: {steps[Math.min(current, steps.length - 1)].label}
      </p>
      <ol className="flex items-center m-0 p-0 list-none">
        {steps.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'todo';
          return (
            <li
              key={step.id ?? i}
              className={`ps-step--${state} flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="flex items-center gap-2">
                <span className="ps-step__dot">
                  {state === 'done' ? <CadIcon name="Check" size={16} /> : i + 1}
                </span>
                <span
                  className={`font-body text-sm ${
                    state === 'current' ? 'font-semibold text-ink' : 'text-ink-2'
                  } ${state === 'current' ? 'inline' : 'hidden sm:inline'}`}
                >
                  {step.label}
                  <span className="sr-only">
                    {state === 'done' ? ' (completado)' : state === 'current' ? ' (paso actual)' : ' (pendiente)'}
                  </span>
                </span>
              </span>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`flex-1 h-0.5 mx-3 min-w-4 ${i < current ? 'bg-emerald' : 'bg-line-control'}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Stepper;
