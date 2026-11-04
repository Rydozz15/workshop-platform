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

export default function AdminLayout({ children }) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { num: '01', href: '/admin', label: t('nav.dashboard', 'Tablero'), icon: 'LayoutGrid' },
    { num: '02', href: '/admin/versions', label: t('nav.versions', 'Bocetos A/B'), icon: 'GitCompare' },
    { num: '03', href: '/admin/campaigns', label: t('nav.campaigns', 'Experimentos'), icon: 'Layers' },
    { num: '04', href: '/admin/sessions', label: t('nav.sessions', 'Sesiones'), icon: 'MessageSquare' },
    { num: '05', href: '/admin/analytics', label: t('nav.analytics', 'Estadística'), icon: 'BarChart2' },
    { num: '06', href: '/glosario', label: t('nav.glossary', 'Glosario'), icon: 'BookOpen' },
    { num: '07', href: '/admin/settings', label: t('nav.settings', 'Ajustes'), icon: 'Sliders' },
  ];

  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollYCoord, setScrollYCoord] = useState(0);
  const [grainOff, setGrainOff] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_authed');
    if (stored === 'true') setAuthed(true);
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

  useEffect(() => {
    const onScroll = () => {
      setScrollYCoord(Math.round(window.scrollY || 0));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
        sessionStorage.setItem('admin_authed', 'true');
        setAuthed(true);
      } else {
        setError('Credencial inválida. Verifica ADMIN_PASSWORD en tu entorno.');
      }
    } catch {
      setError('Error de conexión al validar credenciales.');
    }
    setSubmitting(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authed');
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
            ÁREA DOCENTE / LAK
          </MarginNote>
        </div>

        <BlueprintPanel
          codeTag="AUTH // INVESTIGADOR"
          title="Acceso a Mesa de Investigación PromptSketch"
          subtitle="Ingresa la clave administrativa para gestionar experimentos, sesiones y análisis estadístico."
          headingLevel={2}
          titleBlock={{
            sheetNumber: 'SEC-01',
            status: 'PROTEGIDO',
            rev: 'AUTH v2',
            title: 'Control de Acceso Investigador',
            subtitle: 'Clave local por defecto: workshop2025',
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
              help="Definida en ADMIN_PASSWORD (.env.local) o 'workshop2025' en modo local."
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
            <span
              aria-hidden="true"
              className="hidden xl:inline-block font-ui-mono text-xs text-ink-2 stat"
            >
              Y:{String(scrollYCoord).padStart(4, '0')}
            </span>
          </div>

          {/* Desktop Primary Navigation */}
          <nav aria-label="Principal" className="hidden lg:flex items-center gap-1 flex-wrap">
            {navItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[44px] px-3 py-2 border font-ui-mono text-xs inline-flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-cobalt-tint border-cobalt text-cobalt font-semibold'
                      : 'bg-paper border-transparent text-ink hover:border-line-control hover:bg-paper-subtle'
                  }`}
                >
                  <span className="text-ink-2 stat">{item.num}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Quick Controls */}
          <div className="flex items-center gap-2">
            <LanguageSelector compact={true} />

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
            {navItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[44px] px-3 py-2 border font-ui-mono text-xs flex items-center justify-between ${
                    isActive
                      ? 'bg-cobalt-tint border-cobalt text-cobalt font-semibold'
                      : 'bg-paper-subtle border-line-control text-ink'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <CadIcon name={item.icon} size={14} />
                    <span>
                      {item.num} · {item.label}
                    </span>
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
    </div>
  );
}
