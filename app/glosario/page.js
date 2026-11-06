'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BlueprintPanel,
  Disclosure,
  Field,
  LanguageSelector,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { GLOSSARY_ENTRIES } from '@/lib/glossary-data';
import { useTr } from '@/lib/i18n/context';



export default function GlosarioPage() {
  const tr = useTr();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(GLOSSARY_ENTRIES.map((e) => e.category)));
    return ['Todas', ...unique];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY_ENTRIES.filter((entry) => {
      const catMatch = selectedCategory === 'Todas' || entry.category === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.symbol.toLowerCase().includes(q) ||
        entry.plain.toLowerCase().includes(q) ||
        entry.id.toLowerCase().includes(q)
      );
    });
  }, [query, selectedCategory]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="space-y-3 pb-4 border-b border-line-control">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/admin/results'))}
            className="min-h-[44px] px-3 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2"
          >
            <CadIcon name="ArrowLeft" size={16} />
            <span>{tr('Volver')}</span>
          </button>
          <LanguageSelector compact={true} />
        </div>
        <div>
          <h1 className="ps-h1">{tr('Glosario')}</h1>
          <p className="ps-lead mt-1">{tr('Qué significa cada término que ves en los resultados, en palabras simples.')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_16rem] gap-4">
        <Field label={tr('Buscar un término')} className="mb-0">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr('Ej.: valor p, tamaño del efecto, Holm')}
            className="ps-field__control w-full font-body text-sm text-ink bg-paper border border-line-control px-3 py-2"
          />
        </Field>
        <Field label={tr('Tema')} className="mb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full min-h-[44px] font-body text-sm text-ink bg-paper border border-line-control px-3 py-2"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{tr(cat)}</option>
            ))}
          </select>
        </Field>
      </div>

      {filtered.length === 0 && <p className="ps-lead" role="status">{tr('No encontramos ese término. Prueba con otra palabra.')}</p>}

      <div className="space-y-4">
        {filtered.map((item) => (
          <article key={item.id} id={item.id} className="scroll-mt-24">
            <BlueprintPanel title={tr(item.title)} subtitle={tr(item.category)} headingLevel={2}>
              <p className="font-body text-base text-ink leading-relaxed m-0">{tr(item.plain)}</p>
              <div className="mt-4">
                <Disclosure title={tr('Fórmula, criterios y referencia')} summary={item.symbol}>
                  <div className="space-y-3">
                    <div>
                      <p className="ps-meta m-0 mb-1">{tr('Fórmula')}</p>
                      <code className="font-stat text-sm font-semibold text-ink break-words">{item.formula}</code>
                    </div>
                    <div>
                      <p className="ps-meta m-0 mb-1">{tr('Cómo interpretarlo')}</p>
                      <p className="font-body text-sm text-ink m-0">{tr(item.thresholds)}</p>
                    </div>
                    <p className="ps-meta m-0">{tr('Referencia:')}{' '}{item.citation}</p>
                  </div>
                </Disclosure>
              </div>
            </BlueprintPanel>
          </article>
        ))}
      </div>
    </div>
  );
}
