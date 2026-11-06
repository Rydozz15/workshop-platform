'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SplitButton, LanguageSelector, Logo } from '@/components/ui/blueprint';
import { useLanguage } from '@/lib/i18n/context';

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [sessionCode, setSessionCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const cleaned = sessionCode.trim().toLowerCase();
    if (!cleaned) {
      setCodeError(t('home.join_err_empty', 'Escribe el código que te dieron para poder entrar.'));
      return;
    }
    setCodeError('');
    router.push(`/session/${encodeURIComponent(cleaned)}`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl mx-auto px-4 sm:px-6 py-5">
      <header className="flex items-center justify-between gap-3">
        <Logo />
        <LanguageSelector compact={true} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12">
        <form onSubmit={handleJoinSubmit} className="w-full max-w-xl text-center space-y-6">
          <h1 className="ps-h1">
            {t('home.join_title', 'Ingresa el código para comenzar con el taller o actividad')}
          </h1>

          <div className="space-y-2">
            <label htmlFor="join-session-input" className="sr-only">
              {t('home.join_label', 'Código de la actividad')}
            </label>
            <input
              id="join-session-input"
              type="text"
              autoFocus
              value={sessionCode}
              onChange={(e) => {
                setSessionCode(e.target.value);
                if (codeError) setCodeError('');
              }}
              placeholder={t('home.join_placeholder', 'Código')}
              autoComplete="off"
              spellCheck="false"
              aria-describedby={codeError ? 'join-error-text' : undefined}
              aria-invalid={Boolean(codeError)}
              className={`w-full min-h-[64px] px-4 text-center font-stat text-2xl font-bold tracking-widest uppercase text-ink bg-paper border-2 ${
                codeError ? 'border-vermilion-ink' : 'border-line-strong focus:border-cobalt'
              } outline-none shadow-hard`}
            />
            {codeError && (
              <p id="join-error-text" role="alert" className="font-body text-sm text-vermilion-ink m-0">
                {codeError}
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <SplitButton type="submit" variant="primary" iconBox="ArrowRight" className="text-base">
              {t('home.join_btn', 'Entrar')}
            </SplitButton>
          </div>
        </form>
      </main>

      <footer className="text-center pb-2">
        <Link href="/admin" className="font-body text-sm text-ink-2 hover:text-cobalt underline underline-offset-4 inline-flex items-center min-h-[44px]">
          {t('home.admin_link', '¿Diriges el taller? Ingresa aquí')}
        </Link>
      </footer>
    </div>
  );
}
