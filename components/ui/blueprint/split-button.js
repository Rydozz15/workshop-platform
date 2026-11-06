'use client';

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import CadIcon from '../cad-icon';

/**
 * SplitButton - PromptSketch signature interactive control.
 * Supports primaryAction + menuActions OR direct props (variant, iconBox, children).
 */
export const SplitButton = forwardRef(function SplitButton(
  {
    variant = 'secondary',
    primaryAction,
    menuActions,
    iconBox,
    loading = false,
    disabled = false,
    children,
    className = '',
    onClick,
    ...props
  },
  ref
) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);

  // Close menu on click outside or Esc
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const resolvedLabel = primaryAction?.label || children;
  const resolvedClick = primaryAction?.onClick || onClick;
  const rawIcon = primaryAction?.icon || iconBox;

  const renderIcon = () => {
    if (loading) {
      return <span aria-hidden="true" className="font-ui-mono text-xs">…</span>;
    }
    if (!rawIcon) return null;
    if (typeof rawIcon === 'string') {
      return <CadIcon name={rawIcon} />;
    }
    if (React.isValidElement(rawIcon)) {
      return rawIcon;
    }
    if (typeof rawIcon === 'function') {
      const IconComponent = rawIcon;
      return <CadIcon icon={IconComponent} />;
    }
    return rawIcon;
  };

  const hasMenu = Array.isArray(menuActions) && menuActions.length > 0;

  return (
    <div ref={containerRef} className="relative inline-flex items-stretch">
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        onClick={resolvedClick}
        className={`ps-split ps-split--${variant} ${className}`}
        {...props}
      >
        <span aria-hidden="true" className="ps-split__box">
          {renderIcon()}
        </span>
        <span className="ps-split__label">
          {loading ? 'Procesando…' : resolvedLabel}
        </span>
      </button>

      {hasMenu && (
        <>
          <button
            type="button"
            disabled={disabled || loading}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Más acciones"
            title="Más acciones"
            onClick={() => setMenuOpen(!menuOpen)}
            className={`min-h-[44px] min-w-[44px] px-2 flex items-center justify-center border border-line-control bg-paper hover:bg-paper-subtle active:translate-y-px ${
              variant === 'primary' ? 'bg-cobalt text-paper border-cobalt border-l-paper/40 hover:bg-cobalt-hover' : 'text-ink'
            }`}
          >
            <CadIcon name="ChevronDown" size={18} strokeWidth={2.25} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full mt-1 z-50 min-w-[180px] bg-paper border border-line-control shadow-hard py-1"
            >
              {menuActions.map((action, idx) => (
                <button
                  key={idx}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (action.onClick) action.onClick();
                  }}
                  className="w-full min-h-[44px] px-4 py-2 text-left font-ui-mono text-xs text-ink hover:bg-paper-subtle flex items-center gap-2"
                >
                  {action.icon && (
                    <span aria-hidden="true" className="shrink-0">
                      {typeof action.icon === 'string' ? (
                        <CadIcon name={action.icon} size={14} />
                      ) : (
                        action.icon
                      )}
                    </span>
                  )}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});

SplitButton.displayName = 'SplitButton';
export default SplitButton;
