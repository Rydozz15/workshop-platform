import React from 'react';
import * as LucideIcons from 'lucide-react';

export const PROHIBITED_ICONS = new Set([
  'Sparkles',
  'Wand',
  'Wand2',
  'Bot',
  'Brain',
  'BrainCircuit',
  'sparkles',
  'wand',
  'wand2',
  'bot',
  'brain',
  'braincircuit',
]);

const BANNED_ICON_NAMES = ['sparkles', 'wand', 'wand2', 'bot', 'brain', 'braincircuit'];

/**
 * CadIcon - Wraps Lucide icons applying CAD technical styling:
 * stroke-linecap: square; stroke-linejoin: miter; stroke-width: 1.75; width: 16px; height: 16px.
 * Strictly enforces PromptSketch Design System v2 anti-AI-slop invariants.
 */
export function CadIcon({
  name,
  icon: IconComponent,
  size = 16,
  strokeWidth = 1.75,
  className = '',
  style = {},
  'aria-hidden': ariaHidden = true,
  ...props
}) {
  let ResolvedIcon = IconComponent;

  if (name) {
    const lower = String(name || '').toLowerCase();
    if (BANNED_ICON_NAMES.includes(lower) || PROHIBITED_ICONS.has(name)) {
      throw new Error(
        `[PromptSketch CAD] Prohibited AI-cliché icon "${name}" rejected per PromptSketch Design System v2.`
      );
    }
    ResolvedIcon = LucideIcons[name];
    if (!ResolvedIcon) {
      console.warn(`[PromptSketch CAD] Icon "${name}" not found in lucide-react. Using Square fallback.`);
      ResolvedIcon = LucideIcons.Square;
    }
  }

  if (ResolvedIcon) {
    const iconName = ResolvedIcon.displayName || ResolvedIcon.name;
    const lowerIconName = String(iconName || '').toLowerCase();
    if (BANNED_ICON_NAMES.includes(lowerIconName) || (iconName && PROHIBITED_ICONS.has(iconName))) {
      throw new Error(
        `[PromptSketch CAD] Prohibited AI-cliché icon "${iconName}" rejected per PromptSketch Design System v2.`
      );
    }
  }

  if (!ResolvedIcon) {
    return null;
  }

  return (
    <ResolvedIcon
      size={size}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden={ariaHidden}
      className={`ps-icon inline-block shrink-0 ${className}`}
      style={{
        strokeLinecap: 'square',
        strokeLinejoin: 'miter',
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        ...style,
      }}
      {...props}
    />
  );
}

export default CadIcon;
