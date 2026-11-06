'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BlueprintPanel,
  SplitButton,
  Field,
  MarginNote,
  LanguageSelector,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { useLanguage } from '@/lib/i18n/context';
import AssistantWidget from '@/components/admin/assistant-widget';

export default function AdminLayout({ children }) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/campaigns', label: t('nav.campaigns', 'Campañas'), icon: 'Layers', match: ['/admin/campaigns', '/admin/versions'] },
    { href: '/admin', label: t('nav.live', 'En vivo'), icon: 'Activity', match: ['/admin'], exact: true },
    { href: '/admin/results', label: t('nav.results', 'Resultados'), icon: 'BarChart2', match: ['/admin/results', '/admin/sessions', '/admin/analytics'] },
  ];
  const settingsItem = { href: '/admin/settings', label: t('nav.settings', 'Ajustes'), icon: 'Settings' };
  const isActiveItem = (item) =>
    item.exact ? pathname === item.href : (item.match || [item.href]).some((m) => pathname.startsWith(m));


  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [grainOff, setGrainOff] = useState(false);

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d.authed)))
      .catch(() => setAuthed(false));
    const savedGrain = localStorage.getItem('ps_grain_off') === '1';
    setGrainOff(savedGrain);
    if (savedGrain) {
      document.documentElement.dataset.grain = 'off';
    }
    const savedMotion = localStorage.getItem('ps_reduced_motion') === '1';
    if (savedMotion) {
      document.documentElement.dataset.motion = 'reduced';
    }
    setLoading(false);
  }, []);

  const toggleGrain = () => {
    const next = !grainOff;
    setGrainOff(next);
    if (next) {
      document.documentElement.dataset.grain = 'off';
      localStorage.setItem('ps_grain_off', '1');
    } else {
      delete document.documentElement.dataset.grain;
      localStorage.removeItem('ps_grain_off');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthed(true);
      } else if (res.status === 503) {
        setError('La administración aún no está configurada en este servidor.');
      } else {
        setError('Contraseña incorrecta. Inténtalo de nuevo.');
      }
    } catch {
      setError('Error de conexión al validar credenciales.');
    }
    setSubmitting(false);
  };

  const handleLogout = () => {
    fetch('/api/auth', { method: 'DELETE' }).catch(() => {});
    setAuthed(false);
    setPassword('');
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <BlueprintPanel codeTag="SYS_INIT" title="Inicializando mesa de trabajo…">
          <p className="font-ui-mono text-xs text-ink-2 m-0">Verificando sesión de investigador…</p>
        </BlueprintPanel>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 md:py-20">
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/"
            className="min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink inline-flex items-center gap-1.5"
          >
            <CadIcon name="ArrowLeft" size={14} />
            <span>Volver al inicio</span>
          </Link>
          <MarginNote tone="cobalt" rotate={-2}>
            Área docente
          </MarginNote>
        </div>

        <BlueprintPanel
          codeTag="AUTH"
          title="Ingresa la contraseña de administración"
          subtitle="Así podrás crear campañas, ver resultados y descargar los datos."
          headingLevel={2}
          titleBlock={{
            sheetNumber: 'SEC-01',
            status: 'PROTEGIDO',
            title: 'Acceso de administración',
          }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Hidden username input for WCAG password manager accessibility */}
            <input
              type="text"
              name="username"
              defaultValue="promptsketch-admin"
              autoComplete="username"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <Field
              label="Contraseña de administración"
              required={true}
              error={error}
              help="Es la contraseña que definiste al instalar PromptSketch."
            >
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña..."
                autoComplete="current-password"
                className="ps-field__control w-full font-ui-mono text-sm text-ink bg-paper border border-line-control px-3 py-2"
              />
            </Field>

            <div className="flex justify-end pt-2 border-t border-line-control">
              <SplitButton
                type="submit"
                variant="primary"
                iconBox="Lock"
                loading={submitting}
              >
                Desbloquear mesa de trabajo
              </SplitButton>
            </div>
          </form>
        </BlueprintPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Blueprint Navigation Island */}
      <header className="sticky top-0 z-40 bg-paper border-b border-line-control shadow-hard">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
          {/* Brand + Decorative CAD Coordinate Readout */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/admin"
              className="min-h-[44px] px-2.5 py-1.5 bg-ink text-paper font-ui-mono text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2"
            >
              <CadIcon name="Compass" size={14} />
              <span>PROMPTSKETCH</span>
            </Link>
          </div>

          {/* Desktop Primary Navigation */}
          <nav aria-label="Principal" className="hidden lg:flex items-center gap-1 flex-wrap">
            {navItems.map((item) => {
              const isActive = isActiveItem(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[44px] px-4 py-2 border font-body text-sm inline-flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-tint border-cobalt text-cobalt font-semibold'
                      : 'bg-paper border-transparent text-ink hover:border-line-control hover:bg-paper-subtle'
                  }`}
                >
                  <CadIcon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Quick Controls */}
          <div className="flex items-center gap-2">
            <LanguageSelector compact={true} />

            <Link
              href={settingsItem.href}
              aria-label={settingsItem.label}
              title={settingsItem.label}
              aria-current={pathname.startsWith(settingsItem.href) ? 'page' : undefined}
              className={`hidden sm:inline-flex min-h-[44px] min-w-[44px] border items-center justify-center ${
                pathname.startsWith(settingsItem.href) ? 'bg-cobalt-tint border-cobalt text-cobalt' : 'border-line-control bg-paper-subtle hover:bg-paper text-ink'
              }`}
            >
              <CadIcon name="Settings" size={18} />
            </Link>

            <button
              type="button"
              onClick={toggleGrain}
              aria-pressed={!grainOff}
              title="Alternar textura de papel"
              className="hidden sm:inline-flex min-h-[44px] px-2.5 py-1.5 border border-line-control bg-paper-subtle hover:bg-paper font-ui-mono text-xs text-ink items-center gap-1.5"
            >
              <CadIcon name="Layers" size={13} />
              <span>{grainOff ? t('nav.paper_smooth', 'Papel liso') : t('nav.paper_cad', 'Textura CAD')}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline-flex min-h-[44px] px-3 py-1.5 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink items-center gap-1.5"
            >
              <CadIcon name="LogOut" size={13} />
              <span>{t('nav.logout', 'Salir')}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Abrir menú de navegación"
              className="lg:hidden min-h-[44px] min-w-[44px] px-2.5 border border-line-control bg-paper-subtle text-ink inline-flex items-center justify-center"
            >
              <CadIcon name={mobileMenuOpen ? 'X' : 'Menu'} size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Collapsible Navigation Sheet */}
        {mobileMenuOpen && (
          <nav
            aria-label="Menú móvil de administración"
            className="lg:hidden border-t border-line-control bg-paper p-3 space-y-1.5"
          >
            {[...navItems, settingsItem].map((item) => {
              const isActive = item.href === settingsItem.href ? pathname.startsWith(item.href) : isActiveItem(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[44px] px-3 py-2 border font-body text-sm flex items-center justify-between ${
                    isActive
                      ? 'bg-cobalt-tint border-cobalt text-cobalt font-semibold'
                      : 'bg-paper-subtle border-line-control text-ink'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <CadIcon name={item.icon} size={14} />
                    <span>{item.label}</span>
                  </span>
                  <CadIcon name="ChevronRight" size={14} />
                </Link>
              );
            })}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <LanguageSelector className="w-full justify-center" />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] px-3 py-2 border border-vermilion-ink bg-vermilion-tint font-ui-mono text-xs text-vermilion-ink font-semibold"
              >
                {t('nav.logout', 'Cerrar sesión')}
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Workspace Container (Note: RootLayout already provides <main id="main-content">) */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 md:py-8">
        {children}
      </div>
      <AssistantWidget />
    </div>
  );
}
