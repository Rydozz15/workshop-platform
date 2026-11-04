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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-14 space-y-8">
      {/* Top Blueprint Identification Strip */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-control">
        <div className="flex items-center gap-3">
          <span className="font-ui-mono text-xs font-semibold px-2 py-1 bg-ink text-paper uppercase tracking-wider">
            {t('home.tag', 'PROMPTSKETCH · v2.0')}
          </span>
          <span className="font-ui-mono text-xs text-ink-2 uppercase">
            {t('home.subtitle_bar', 'PLANO EXPERIMENTAL A/B & LEARNING ANALYTICS')}
          </span>
        </div>

        <nav aria-label="Accesos principales" className="flex flex-wrap items-center gap-2">
          <LanguageSelector compact={true} />
          <Link
            href="/glosario"
            className="min-h-[44px] px-3.5 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink inline-flex items-center gap-2"
          >
            <CadIcon name="BookOpen" size={14} />
            <span>{t('home.glossary_btn', 'Glosario Estadístico')}</span>
          </Link>
          <Link
            href="/admin"
            className="min-h-[44px] px-3.5 py-2 border border-cobalt bg-cobalt text-paper hover:bg-cobalt-hover font-ui-mono text-xs font-medium inline-flex items-center gap-2"
          >
            <CadIcon name="Sliders" size={14} />
            <span>{t('home.admin_btn', 'Mesa de Investigación (Admin)')}</span>
          </Link>
        </nav>
      </header>

      {/* Hero Workbench Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <BlueprintPanel
            codeTag="SPEC // LAK27"
            title="Laboratorio Abierto para Experimentación de Prompts Educativos"
            subtitle="Diseña, despliega y audita intervenciones conversacionales con rigor estadístico e interoperabilidad científica."
            headingLevel={2}
            titleBlock={{
              sheetNumber: 'MAIN-01',
              status: 'OPERATIVO',
              rev: 'REV 2.0',
              title: 'PromptSketch Workbench',
              subtitle: 'Inferencia con verificación previa de supuestos',
            }}
          >
            <div className="space-y-4">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight leading-tight m-0">
                Del registro crudo de chats a evidencia pedagógica{' '}
                <HandMark type="underline" tone="cobalt">
                  reproducible
                </HandMark>
                .
              </h1>

              <p className="font-body text-sm sm:text-base text-ink leading-relaxed m-0">
                PromptSketch permite comparar condiciones de prompts educativos (A/B o secuencias pre/post
                encadenadas), verificando automáticamente normalidad y escala antes de ejecutar{' '}
                <strong>Welch t</strong> o <strong>Mann-Whitney U + Delta de Cliff</strong>, corrección familiar de{' '}
                <strong>Holm-Bonferroni</strong>, analítica dialógica y exportación directa a{' '}
                <strong>LaTeX booktabs</strong>, <strong>R</strong> y <strong>Python</strong>.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <StatBadge label="Contraste UI" value="WCAG 2.2 AAA" variant="em" />
                <StatBadge label="Inferencia" value="Gatekeeper de Supuestos" variant="cobalt" />
                <StatBadge label="Proveedores IA" value="Groq · OpenRouter · OpenAI · Anthropic · Local" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-dotted border-rule">
                <div className="p-3 bg-paper-subtle border border-line-control">
                  <div className="font-ui-mono text-xs font-semibold uppercase text-ink mb-1 flex items-center gap-1.5">
                    <CadIcon name="GitCompare" size={14} />
                    <span>Comparador A/B de Prompts</span>
                  </div>
                  <p className="font-body text-xs text-ink-2 m-0 leading-relaxed">
                     Mesa de dibujo diferencial línea por línea con estimación previa de tokens y costo en USD.
                  </p>
                </div>
                <div className="p-3 bg-paper-subtle border border-line-control">
                  <div className="font-ui-mono text-xs font-semibold uppercase text-ink mb-1 flex items-center gap-1.5">
                    <CadIcon name="BarChart2" size={14} />
                    <span>Analítica Conversacional y Jueces</span>
                  </div>
                  <p className="font-body text-xs text-ink-2 m-0 leading-relaxed">
                    Latencia de lectura normalizada (ms/palabra), MATTR, ganancia g de Hake y calibración AC₁ de Gwet.
                  </p>
                </div>
              </div>
            </div>
          </BlueprintPanel>
        </div>

        {/* Participant Quick Entry Sheet */}
        <div className="lg:col-span-5">
          <BlueprintPanel
            codeTag="INGRESO_PARTICIPANTE"
            title="Unirse a una Sesión Activa"
            subtitle="Ingresa el código compartido en sala o código QR del taller."
            headingLevel={2}
            headerSlot={
              <MarginNote tone="vermilion" rotate={-2}>
                ACCESO DIRECTO
              </MarginNote>
            }
          >
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <Field
                label="Código de sesión experimental"
                required={true}
                error={codeError}
                help="Ejemplo del conjunto de referencia ISDDE: isdde1 (Línea Base) o isdde2 (Explore-before-Build)."
              >
                <input
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  placeholder="Ej. isdde1"
                  className="ps-field__control w-full font-ui-mono text-sm text-ink bg-paper border border-line-control px-3 py-2"
                />
              </Field>

              <div className="flex flex-wrap items-center gap-2">
                <span className="font-ui-mono text-xs text-ink-2">Códigos de demostración:</span>
                <button
                  type="button"
                  onClick={() => setSessionCode('isdde1')}
                  className="min-h-[44px] px-3 py-1.5 border border-line-control bg-paper-subtle hover:bg-paper font-ui-mono text-xs text-ink"
                >
                  Cargar isdde1 (Cond. A)
                </button>
                <button
                  type="button"
                  onClick={() => setSessionCode('isdde2')}
                  className="min-h-[44px] px-3 py-1.5 border border-line-control bg-paper-subtle hover:bg-paper font-ui-mono text-xs text-cobalt font-medium"
                >
                  Cargar isdde2 (Cond. B)
                </button>
              </div>

              <div className="pt-2 border-t border-line-control flex justify-end">
                <SplitButton type="submit" variant="primary" iconBox="ArrowRight">
                  Ingresar a orientación [1/3]
                </SplitButton>
              </div>
            </form>
          </BlueprintPanel>
        </div>
      </div>
    </div>
  );
}
