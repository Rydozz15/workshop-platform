import React from 'react';

/**
 * PromptSketch logo. The wordmark pairs a pixel "PROMPT" with a hand-sketched "SKETCH":
 * the digital prompt and the human drawing. The square mark (pixel P over sketched S) is for tight spaces.
 * `size` is the rendered height in px of the mark; the wordmark is about 1.9x wider than tall.
 */
export function Logo({ size = 28, withWordmark = true, className = '' }) {
  const height = withWordmark ? Math.round(size * 1.5) : size;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={withWordmark ? '/logo.png' : '/logo-mark.png'}
      alt="PromptSketch"
      height={height}
      width={withWordmark ? Math.round(height * 2.02) : height}
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ height, width: 'auto' }}
      draggable={false}
    />
  );
}

export default Logo;
