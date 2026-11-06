'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, SUPPORTED_LOCALES } from './translations';
import { MESSAGES, translateText } from './messages';

const LanguageContext = createContext({
  locale: 'es',
  setLocale: () => {},
  t: (path, fallback) => fallback || path,
  tr: (text, vars) => translateText('es', text, vars),
  locales: SUPPORTED_LOCALES,
});

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      return undefined;
    }
  }
  return curr;
}

export function LanguageProvider({ children, initialLocale = 'es' }) {
  const [locale, setLocaleState] = useState(initialLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Deferred so the state updates do not run inside the effect body itself.
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem('ps_locale');
        if (stored && translations[stored]) {
          setLocaleState(stored);
          if (typeof document !== 'undefined') {
            document.documentElement.lang = stored;
          }
        }
      } catch {
        // Ignore localStorage errors (e.g. private browsing)
      }
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const setLocale = useCallback((newLocale) => {
    if (!translations[newLocale]) return;
    setLocaleState(newLocale);
    try {
      localStorage.setItem('ps_locale', newLocale);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const t = useCallback(
    (path, fallback = '') => {
      // 1. Try active locale
      const activeDict = translations[locale];
      const val = getNestedValue(activeDict, path);
      if (typeof val === 'string') return val;

      // 2. A Spanish fallback text that has a translation in messages.js
      if (fallback && locale !== 'es') {
        const translated = MESSAGES[locale]?.[fallback];
        if (translated) return translated;
      }

      // 3. Fall back to Spanish ('es')
      const esDict = translations['es'];
      const esVal = getNestedValue(esDict, path);
      if (typeof esVal === 'string') return esVal;

      // 4. Fall back to provided fallback or path
      return fallback || path;
    },
    [locale]
  );

  const tr = useCallback((text, vars) => translateText(locale, text, vars), [locale]);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        tr,
        locales: SUPPORTED_LOCALES,
        mounted,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Shortcut for components that only need to translate literal Spanish UI text: tr('Guardar', {n: 2}). */
export function useTr() {
  return useContext(LanguageContext).tr;
}
