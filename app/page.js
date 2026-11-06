'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BlueprintPanel,
  SplitButton,
  StatBadge,
  Field,
  MarginNote,
  HandMark,
  LanguageSelector,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { useLanguage } from '@/lib/i18n/context';

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [sessionCode, setSessionCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [showTechDetails, setShowTechDetails] = useState(false);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const cleaned = sessionCode.trim().toLowerCase();
    if (!cleaned) {
      setCodeError(t('home.join_err_empty', 'Ingresa el código de campaña proporcionado por el equipo docente.'));
      return;
    }
    setCodeError('');
    router.push(`/session/${encodeURIComponent(cleaned)}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-12 space-y-8">
      {/* Top Blueprint Identification Strip */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-control">
        <div className="flex items-center gap-3">
          <span className="font-ui-mono text-xs font-semibold px-2.5 py-1 bg-ink text-paper uppercase tracking-wider">
            {t('home.tag', 'PROMPTSKETCH')}
          </span>
          <span className="hidden sm:inline-block font-ui-mono text-xs text-ink-2 uppercase tracking-wide">
            {t('home.subtitle_bar', 'PLANO EXPERIMENTAL A/B & LEARNING ANALYTICS')}
          </span>
        </div>

        <nav aria-label="Accesos principales" className="flex items-center gap-2">
          <LanguageSelector compact={true} />
          <Link
            href="/admin"
            className="min-h-[44px] px-3.5 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink inline-flex items-center gap-2 transition-colors"
          >
            <CadIcon name="Sliders" size={14} />
            <span className="font-medium">{t('home.admin_btn', 'Mesa de Investigación')}</span>
          </Link>
        </nav>
      </header>

      {/* Primary Section: Student / Participant Direct Entry Hero */}
      <main className="space-y-6">
        <BlueprintPanel
          codeTag="ACCESO_RAPIDO"
          title="Ingreso a Taller o Actividad Experimental"
          subtitle="Ingresa el código compartido por tu equipo docente para iniciar la sesión."
          headingLevel={1}
          headerSlot={
            <MarginNote tone="cobalt" rotate={-1.5}>
              MODO PARTICIPANTE
            </MarginNote>
          }
          titleBlock={{
            sheetNumber: 'JOIN-01',
            status: 'EN VIVO',
            title: 'Acceso a Sala de Diálogo',
            subtitle: 'Asignación balanceada A/B automática',
          }}
        >
          <form onSubmit={handleJoinSubmit} className="space-y-6 py-2">
            <div className="max-w-xl mx-auto space-y-3 text-center sm:text-left">
              <label
                htmlFor="join-session-input"
                className="font-ui-mono text-xs uppercase tracking-wider font-semibold text-ink block"
              >
                {t('home.join_label', 'Código de campaña o taller')}
              </label>

              <div className="relative">
                <input
                  id="join-session-input"
                  type="text"
                  autoFocus
                  value={sessionCode}
                  onChange={(e) => {
                    setSessionCode(e.target.value);
                    if (codeError) setCodeError('');
                  }}
                  placeholder="Ej.: isdde1, etica-ia, stem-cs1"
                  autoComplete="off"
                  spellCheck="false"
                  aria-describedby={codeError ? 'join-error-text' : 'join-help-text'}
                  aria-invalid={Boolean(codeError)}
                  className={`w-full min-h-[56px] px-4 font-ui-mono text-lg font-bold tracking-wider uppercase text-ink bg-paper border-2 ${
                    codeError ? 'border-vermilion-ink' : 'border-line-control focus:border-cobalt'
                  } transition-colors outline-none shadow-hard`}
                />
              </div>

              {codeError ? (
                <p id="join-error-text" role="alert" className="font-ui-mono text-xs text-vermilion-ink m-0">
                  {codeError}
                </p>
              ) : (
                <p id="join-help-text" className="font-body text-xs text-ink-2 m-0">
                  {t('home.join_help', 'El código asigna automáticamente tu condición experimental y registra la traza de forma anónima.')}
                </p>
              )}

              {/* Quick Demo Code Chips */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="font-ui-mono text-xs text-ink-2 font-medium">Ejemplos de prueba:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSessionCode('isdde1');
                    setCodeError('');
                  }}
                  className="min-h-[44px] px-3 py-1.5 border border-line-control bg-paper-subtle hover:bg-paper font-ui-mono text-xs text-ink transition-colors inline-flex items-center gap-1.5"
                >
                  <CadIcon name="Play" size={12} />
                  <span>isdde1 (Control · Línea Base)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSessionCode('isdde2');
                    setCodeError('');
                  }}
                  className="min-h-[44px] px-3 py-1.5 border border-cobalt bg-cobalt-tint hover:bg-paper font-ui-mono text-xs text-cobalt font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <CadIcon name="Play" size={12} />
                  <span>isdde2 (Experimental · Andamiaje)</span>
                </button>
              </div>

              {/* Primary Action Button */}
              <div className="pt-4 flex justify-end">
                <SplitButton
                  type="submit"
                  variant="primary"
                  iconBox="ArrowRight"
                  className="w-full sm:w-auto text-base"
                >
                  {t('home.join_btn', 'Entrar a la sesión')}
                </SplitButton>
              </div>
            </div>
          </form>
        </BlueprintPanel>

        {/* Secondary Gateway: For Instructors & Researchers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-paper border border-line-control shadow-hard space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-ui-mono text-xs uppercase tracking-wider text-cobalt font-semibold flex items-center gap-1.5">
                <CadIcon name="Sliders" size={14} />
                <span>Docentes e Investigadores</span>
              </span>
              <MarginNote tone="cobalt" rotate={1}>
                CONTROL A/B
              </MarginNote>
            </div>
            <p className="font-body text-xs text-ink-2 leading-relaxed m-0">
              Diseña experimentos A/B con andamiaje de prompts, genera códigos QR para sala de clases y sigue la telemetría conversacional en tiempo real.
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="min-h-[44px] px-3 py-2 border border-cobalt bg-cobalt text-paper hover:bg-cobalt-hover font-ui-mono text-xs font-medium inline-flex items-center gap-2 transition-colors"
              >
                <span>Abrir Mesa de Investigación</span>
                <CadIcon name="ArrowRight" size={13} />
              </Link>
            </div>
          </div>

          <div className="p-4 bg-paper border border-line-control shadow-hard space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-ui-mono text-xs uppercase tracking-wider text-ink font-semibold flex items-center gap-1.5">
                <CadIcon name="BookOpen" size={14} />
                <span>Referencia Metodológica</span>
              </span>
            </div>
            <p className="font-body text-xs text-ink-2 leading-relaxed m-0">
              Consulta las fórmulas, definiciones y contratos psicométricos: pruebas de Welch, Delta de Cliff, Holm-Bonferroni y concordancia AC₁ de Gwet.
            </p>
            <div className="pt-2">
              <Link
                href="/glosario"
                className="min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink inline-flex items-center gap-2 transition-colors"
              >
                <span>Explorar Glosario Estadístico</span>
                <CadIcon name="ArrowRight" size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Collapsible technical specification strip */}
        <div className="border border-line-control bg-paper-subtle">
          <button
            type="button"
            onClick={() => setShowTechDetails(!showTechDetails)}
            aria-expanded={showTechDetails}
            className="w-full min-h-[44px] px-4 py-2.5 flex items-center justify-between text-left font-ui-mono text-xs text-ink hover:bg-paper transition-colors"
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <CadIcon name={showTechDetails ? 'ChevronDown' : 'ChevronRight'} size={14} />
              <span>Especificación técnica y rigor experimental</span>
            </span>
            <span className="font-ui-mono text-xs text-ink-2">
              {showTechDetails ? 'Ocultar detalles' : 'Ver fundamentos matemáticos'}
            </span>
          </button>

          {showTechDetails && (
            <div className="p-4 border-t border-line-control bg-paper space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatBadge label="Contraste UI" value="WCAG 2.2 AAA" variant="em" />
                <StatBadge label="Inferencia" value="Gatekeeper de Supuestos" variant="cobalt" />
                <StatBadge label="Proveedores IA" value="Groq · OpenRouter · OpenAI · Anthropic · Local" />
              </div>

              <p className="font-body text-xs text-ink-2 leading-relaxed m-0">
                PromptSketch implementa un protocolo riguroso que verifica normalidad (Shapiro-Wilk) y homogeneidad de varianza (Levene) antes de seleccionar entre la prueba paramétrica <strong>Welch t</strong> o la no paramétrica <strong>Mann-Whitney U</strong> con <strong>Delta de Cliff</strong>. Adicionalmente, aplica corrección familiar de <strong>Holm-Bonferroni</strong> y exporta directamente a <strong>LaTeX booktabs</strong> para reproducibilidad científica completa.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
