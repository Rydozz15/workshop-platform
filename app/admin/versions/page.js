'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { diffLines, diffWordsWithSpace } from 'diff';
import {
  BlueprintPanel,
  SplitButton,
  StatBadge,
  DataTable,
  Field,
  MarginNote,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';

const PRICING_MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Groq · Llama 3.3 70B', promptPer1M: 0.59, completionPer1M: 0.79 },
  { id: 'llama-3.1-8b-instant', label: 'Groq · Llama 3.1 8B Instant', promptPer1M: 0.05, completionPer1M: 0.08 },
  { id: 'qwen/qwen-2.5-72b-instruct', label: 'OpenRouter · Qwen 2.5 72B', promptPer1M: 0.35, completionPer1M: 0.40 },
  { id: 'gpt-4o-mini', label: 'OpenAI · GPT-4o mini', promptPer1M: 0.15, completionPer1M: 0.60 },
  { id: 'claude-3-5-haiku-20241022', label: 'Anthropic · Claude 3.5 Haiku', promptPer1M: 0.80, completionPer1M: 4.00 },
  { id: 'ollama-local', label: 'Local · Ollama ($0.00)', promptPer1M: 0.0, completionPer1M: 0.0 },
];

function estimateTokens(text) {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * Builds synchronized side-by-side aligned rows from diffLines + word-level inline highlights.
 */
function buildAlignedDiffRows(textA = '', textB = '') {
  const parts = diffLines(textA || '', textB || '');
  const rows = [];
  let lineA = 1;
  let lineB = 1;

  for (let i = 0; i < parts.length; i++) {
    const current = parts[i];
    const next = parts[i + 1];

    // Modified block: removed immediately followed by added
    if (current.removed && next && next.added) {
      const remLines = current.value.replace(/\n$/, '').split('\n');
      const addLines = next.value.replace(/\n$/, '').split('\n');
      const maxLen = Math.max(remLines.length, addLines.length);

      for (let k = 0; k < maxLen; k++) {
        const leftStr = remLines[k] !== undefined ? remLines[k] : null;
        const rightStr = addLines[k] !== undefined ? addLines[k] : null;
        const wordDiff =
          leftStr !== null && rightStr !== null ? diffWordsWithSpace(leftStr, rightStr) : null;

        rows.push({
          type: 'modified',
          numA: leftStr !== null ? lineA++ : null,
          numB: rightStr !== null ? lineB++ : null,
          textA: leftStr,
          textB: rightStr,
          wordDiff,
        });
      }
      i++; // Skip next (already paired)
      continue;
    }

    const lines = current.value.replace(/\n$/, '').split('\n');
    for (const ln of lines) {
      if (current.removed) {
        rows.push({
          type: 'removed',
          numA: lineA++,
          numB: null,
          textA: ln,
          textB: null,
        });
      } else if (current.added) {
        rows.push({
          type: 'added',
          numA: null,
          numB: lineB++,
          textA: null,
          textB: ln,
        });
      } else {
        rows.push({
          type: 'unchanged',
          numA: lineA++,
          numB: lineB++,
          textA: ln,
          textB: ln,
        });
      }
    }
  }

  return rows;
}

export default function VersionsPage() {
  const [versions, setVersions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editor Modal State
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', case_content: '' });
  const [saving, setSaving] = useState(false);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // A/B Drafting Comparator State
  const [compareSource, setCompareSource] = useState('prompts'); // 'prompts' | 'versions'
  const [selectedLeftId, setSelectedLeftId] = useState('');
  const [selectedRightId, setSelectedRightId] = useState('');
  const [customDraftA, setCustomDraftA] = useState(
    'Always respond in the same language the user writes in. Provide clear, helpful guidance to the academic scenario presented.'
  );
  const [customDraftB, setCustomDraftB] = useState(
    'Always respond in the same language the user writes in.\n\nRULE FOR MODE SELECTION (EXPLORE BEFORE BUILD):\nDefault to EXPLORE MODE when the user problem lacks institutional context:\n- Briefly validate her situation without inventing details.\n- Do NOT offer categorical solutions yet. Ask exactly 1 targeted contextual question.\n\nSwitch to BUILD MODE only after the user provides concrete actors, constraints, or prior attempts.'
  );
  const [diffViewMode, setDiffViewMode] = useState('split'); // 'split' | 'unified'
  const [mobileTab, setMobileTab] = useState('diff'); // 'a' | 'b' | 'diff'
  const [pricingModelId, setPricingModelId] = useState('llama-3.3-70b-versatile');

  const fetchAll = async () => {
    const [vRes, cRes] = await Promise.all([
      fetch('/api/admin/versions'),
      fetch('/api/admin/workshops'),
    ]);
    const vList = await vRes.json();
    const cList = await cRes.json();
    setVersions(vList);
    setCampaigns(cList);

    if (vList.length >= 2 && !selectedLeftId && !selectedRightId) {
      setSelectedLeftId(vList[0].id);
      setSelectedRightId(vList[1].id);
    } else if (vList.length === 1 && !selectedLeftId) {
      setSelectedLeftId(vList[0].id);
      setSelectedRightId(vList[0].id);
    }

    // Pre-populate comparator prompts from existing campaigns if present
    if (cList.length >= 2) {
      const sortedC = [...cList].sort((a, b) => (a.chain_order || 1) - (b.chain_order || 1));
      if (sortedC[0]?.system_prompt !== undefined && sortedC[1]?.system_prompt) {
        setCustomDraftA(
          sortedC[0].system_prompt ||
            'Always respond in the same language the user writes in. (Línea base sin andamiaje explícito)'
        );
        setCustomDraftB(sortedC[1].system_prompt);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', case_content: '' });
    setShowEditor(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({ title: v.title, case_content: v.case_content });
    setShowEditor(true);
  };

  const handleClone = async (v) => {
    await fetch('/api/admin/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${v.title} (Copia B)`,
        case_content: v.case_content,
      }),
    });
    fetchAll();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await fetch(`/api/admin/versions/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/admin/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setShowEditor(false);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/versions/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchAll();
  };

  const toggleActive = async (v) => {
    await fetch(`/api/admin/versions/${v.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !v.is_active }),
    });
    fetchAll();
  };

  // Resolve comparator texts
  const textA = useMemo(() => {
    if (compareSource === 'versions') {
      return versions.find((v) => v.id === selectedLeftId)?.case_content || '';
    }
    return customDraftA;
  }, [compareSource, versions, selectedLeftId, customDraftA]);

  const textB = useMemo(() => {
    if (compareSource === 'versions') {
      return versions.find((v) => v.id === selectedRightId)?.case_content || '';
    }
    return customDraftB;
  }, [compareSource, versions, selectedRightId, customDraftB]);

  const diffRows = useMemo(() => buildAlignedDiffRows(textA, textB), [textA, textB]);

  const diffStats = useMemo(() => {
    const added = diffRows.filter((r) => r.type === 'added').length;
    const removed = diffRows.filter((r) => r.type === 'removed').length;
    const modified = diffRows.filter((r) => r.type === 'modified').length;
    const tokensA = estimateTokens(textA);
    const tokensB = estimateTokens(textB);
    const rate = PRICING_MODELS.find((m) => m.id === pricingModelId) || PRICING_MODELS[0];
    // Cost per 100 student turns assuming ~220 completion tokens per turn
    const cost100A = ((tokensA + 120) * 100 * rate.promptPer1M + 220 * 100 * rate.completionPer1M) / 1e6;
    const cost100B = ((tokensB + 120) * 100 * rate.promptPer1M + 220 * 100 * rate.completionPer1M) / 1e6;

    return {
      added,
      removed,
      modified,
      tokensA,
      tokensB,
      cost100A,
      cost100B,
    };
  }, [diffRows, textA, textB, pricingModelId]);

  if (loading) {
    return (
      <BlueprintPanel codeTag="MOD_02" title="Cargando mesa de bocetos y escenarios…">
        <p className="font-ui-mono text-xs text-ink-2 m-0">Preparando comparador diferencial A/B…</p>
      </BlueprintPanel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-line-control">
        <div>
          <span className="font-ui-mono text-xs uppercase tracking-wider text-cobalt font-semibold">
            MOD_02 // PROMPT_SPEC &amp; ESCENARIOS DE CASO
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1 m-0">
            Mesa de Dibujo y Comparador Diferencial A/B
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MarginNote tone="vermilion" rotate={-2}>
            AISLAR UNA VARIABLE
          </MarginNote>
          <SplitButton variant="primary" iconBox="Plus" onClick={openCreate}>
            Nuevo Escenario / Versión
          </SplitButton>
        </div>
      </div>

      {/* SECTION 1: DRAFTING TABLE A/B DIFF COMPARATOR */}
      <BlueprintPanel
        codeTag="DIFF_CAD // A_VS_B"
        title="Comparador Técnico de Condición A (Línea Base) vs. Condición B (Experimental)"
        subtitle="Inspecciona línea por línea los cambios exactos de instrucciones o viñetas y su impacto en tokens y costo."
        headingLevel={2}
        titleBlock={{
          sheetNumber: 'DIF-01',
          status: `${diffStats.modified + diffStats.added + diffStats.removed} CAMBIOS`,
          rev: `${diffStats.tokensA} vs ${diffStats.tokensB} TOK`,
          title: 'Auditoría Diferencial Pre-Lanzamiento',
          subtitle: 'Control de variables de confusión por longitud de prompt',
        }}
      >
        <div className="space-y-4">
          {/* Mode & Model Pricing Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line-control">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCompareSource('prompts')}
                className={`min-h-[44px] px-3 py-1.5 border font-ui-mono text-xs ${
                  compareSource === 'prompts'
                    ? 'bg-cobalt text-paper border-cobalt font-semibold'
                    : 'bg-paper-subtle text-ink border-line-control'
                }`}
              >
                Comparar System Prompts (A vs B)
              </button>
              <button
                type="button"
                onClick={() => setCompareSource('versions')}
                className={`min-h-[44px] px-3 py-1.5 border font-ui-mono text-xs ${
                  compareSource === 'versions'
                    ? 'bg-cobalt text-paper border-cobalt font-semibold'
                    : 'bg-paper-subtle text-ink border-line-control'
                }`}
              >
                Comparar Escenarios Guardados ({versions.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="pricing-model-select" className="font-ui-mono text-xs text-ink-2">
                Tarifa ref.:
              </label>
              <select
                id="pricing-model-select"
                value={pricingModelId}
                onChange={(e) => setPricingModelId(e.target.value)}
                className="min-h-[44px] px-2.5 py-1.5 bg-paper border border-line-control font-ui-mono text-xs text-ink"
              >
                {PRICING_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setDiffViewMode(diffViewMode === 'split' ? 'unified' : 'split')}
                className="hidden md:inline-flex min-h-[44px] px-3 py-1.5 border border-line-control bg-paper-subtle hover:bg-paper font-ui-mono text-xs text-ink items-center gap-1.5"
              >
                <CadIcon name="Columns" size={14} />
                <span>{diffViewMode === 'split' ? 'Vista unificada' : 'Vista 2 columnas'}</span>
              </button>
            </div>
          </div>

          {/* Editable Prompts or Version Dropdowns */}
          {compareSource === 'versions' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Escenario A (Trama / Control)" className="mb-0">
                <select
                  value={selectedLeftId}
                  onChange={(e) => setSelectedLeftId(e.target.value)}
                  className="ps-field__control w-full font-ui-mono text-xs text-ink bg-paper border border-line-control px-3 py-2"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Escenario B (Cobalto / Experimental)" className="mb-0">
                <select
                  value={selectedRightId}
                  onChange={(e) => setSelectedRightId(e.target.value)}
                  className="ps-field__control w-full font-ui-mono text-xs text-ink bg-paper border border-line-control px-3 py-2"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="draft-prompt-a" className="font-ui-mono text-xs font-semibold uppercase text-ink">
                    Boceto Condición A (Línea Base)
                  </label>
                  <span className="font-ui-mono text-xs text-ink-2 stat">
                    ~{diffStats.tokensA} tok · USD ${diffStats.cost100A.toFixed(4)} / 100 turnos
                  </span>
                </div>
                <textarea
                  id="draft-prompt-a"
                  rows={5}
                  value={customDraftA}
                  onChange={(e) => setCustomDraftA(e.target.value)}
                  className="w-full p-3 bg-paper border border-line-control font-ui-mono text-xs text-ink leading-relaxed"
                />
                {campaigns.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <label htmlFor="load-camp-a" className="font-ui-mono text-xs text-ink-2">
                      Cargar desde campaña:
                    </label>
                    <select
                      id="load-camp-a"
                      onChange={(e) => {
                        const found = campaigns.find((c) => c.id === e.target.value);
                        if (found) setCustomDraftA(found.system_prompt || '(Sin system prompt — modo directo)');
                      }}
                      defaultValue=""
                      className="min-h-[44px] px-2 bg-paper-subtle border border-line-control font-ui-mono text-xs text-ink"
                    >
                      <option value="" disabled>
                        Seleccionar…
                      </option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="draft-prompt-b" className="font-ui-mono text-xs font-semibold uppercase text-cobalt">
                    Boceto Condición B (Andamiaje Pedagógico)
                  </label>
                  <span className="font-ui-mono text-xs text-cobalt font-semibold stat">
                    ~{diffStats.tokensB} tok · USD ${diffStats.cost100B.toFixed(4)} / 100 turnos
                  </span>
                </div>
                <textarea
                  id="draft-prompt-b"
                  rows={5}
                  value={customDraftB}
                  onChange={(e) => setCustomDraftB(e.target.value)}
                  className="w-full p-3 bg-paper border border-cobalt font-ui-mono text-xs text-ink leading-relaxed"
                />
                {campaigns.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <label htmlFor="load-camp-b" className="font-ui-mono text-xs text-ink-2">
                      Cargar desde campaña:
                    </label>
                    <select
                      id="load-camp-b"
                      onChange={(e) => {
                        const found = campaigns.find((c) => c.id === e.target.value);
                        if (found) setCustomDraftB(found.system_prompt || '(Sin system prompt — modo directo)');
                      }}
                      defaultValue=""
                      className="min-h-[44px] px-2 bg-paper-subtle border border-line-control font-ui-mono text-xs text-ink"
                    >
                      <option value="" disabled>
                        Seleccionar…
                      </option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Telemetry & Diff Summary Badges */}
          <div className="flex flex-wrap gap-2">
            <StatBadge label="Líneas añadidas (+)" value={diffStats.added} variant="em" />
            <StatBadge label="Líneas eliminadas (-)" value={diffStats.removed} variant="verm" />
            <StatBadge label="Líneas modificadas (~)" value={diffStats.modified} variant="cobalt" />
            <StatBadge
              label="Delta Tokens (B - A)"
              value={`${diffStats.tokensB - diffStats.tokensA >= 0 ? '+' : ''}${
                diffStats.tokensB - diffStats.tokensA
              } tok`}
            />
          </div>

          {/* Mobile Tabs (< md) */}
          <div className="flex md:hidden gap-1 border-b border-line-control pb-2">
            {[
              { id: 'a', label: 'Cond. A' },
              { id: 'b', label: 'Cond. B' },
              { id: 'diff', label: 'Diferencias' },
            ].map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => setMobileTab(tb.id)}
                className={`flex-1 min-h-[44px] border font-ui-mono text-xs ${
                  mobileTab === tb.id
                    ? 'bg-cobalt text-paper border-cobalt font-semibold'
                    : 'bg-paper-subtle text-ink border-line-control'
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {/* Diff Inspection Surface */}
          <div
            role="region"
            aria-label="Resultado de comparación línea por línea"
            tabIndex={0}
            className="border border-line-control bg-paper max-h-[420px] overflow-auto font-ui-mono text-xs"
          >
            {diffViewMode === 'split' ? (
              <table className="w-full border-collapse table-fixed">
                <thead className="sticky top-0 bg-paper-subtle border-b border-line-control z-10">
                  <tr>
                    <th
                      scope="col"
                      className={`p-2 text-left uppercase text-ink border-r border-line-control ${
                        mobileTab === 'b' ? 'hidden md:table-cell' : ''
                      }`}
                    >
                      [TRAMA] Condición A · Línea Base
                    </th>
                    <th
                      scope="col"
                      className={`p-2 text-left uppercase text-cobalt ${
                        mobileTab === 'a' ? 'hidden md:table-cell' : ''
                      }`}
                    >
                      [COBALTO] Condición B · Experimental
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {diffRows.map((row, idx) => {
                    const leftBg =
                      row.type === 'removed'
                        ? 'bg-vermilion-tint text-vermilion-ink'
                        : row.type === 'modified'
                        ? 'bg-paper-subtle text-ink'
                        : 'bg-paper text-ink';
                    const rightBg =
                      row.type === 'added'
                        ? 'bg-emerald-tint text-emerald'
                        : row.type === 'modified'
                        ? 'bg-cobalt-tint text-ink'
                        : 'bg-paper text-ink';

                    return (
                      <tr key={idx} className="border-b border-dotted border-rule align-top">
                        <td
                          className={`p-2 border-r border-line-control break-words whitespace-pre-wrap ${leftBg} ${
                            mobileTab === 'b' ? 'hidden md:table-cell' : ''
                          }`}
                        >
                          <span className="inline-block w-8 text-ink-2 select-none stat">
                            {row.numA ?? '·'}
                          </span>
                          <span className="inline-block w-4 font-bold select-none">
                            {row.type === 'removed' ? '-' : row.type === 'modified' ? '~' : ' '}
                          </span>
                          {row.textA !== null ? row.textA : ''}
                        </td>
                        <td
                          className={`p-2 break-words whitespace-pre-wrap ${rightBg} ${
                            mobileTab === 'a' ? 'hidden md:table-cell' : ''
                          }`}
                        >
                          <span className="inline-block w-8 text-ink-2 select-none stat">
                            {row.numB ?? '·'}
                          </span>
                          <span className="inline-block w-4 font-bold select-none">
                            {row.type === 'added' ? '+' : row.type === 'modified' ? '~' : ' '}
                          </span>
                          {row.wordDiff
                            ? row.wordDiff
                                .filter((part) => !part.removed)
                                .map((part, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className={
                                      part.added
                                        ? 'underline decoration-2 decoration-cobalt font-semibold'
                                        : ''
                                    }
                                  >
                                    {part.value}
                                  </span>
                                ))
                            : row.textB !== null
                            ? row.textB
                            : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="divide-y divide-dotted divide-rule">
                {diffRows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`p-2 whitespace-pre-wrap break-words ${
                      row.type === 'added'
                        ? 'bg-emerald-tint text-emerald'
                        : row.type === 'removed'
                        ? 'bg-vermilion-tint text-vermilion-ink'
                        : row.type === 'modified'
                        ? 'bg-cobalt-tint text-ink'
                        : 'bg-paper text-ink'
                    }`}
                  >
                    <span className="inline-block w-14 text-ink-2 stat">
                      {row.numA ?? '·'}/{row.numB ?? '·'}
                    </span>
                    <span className="font-bold mr-2">
                      {row.type === 'added' ? '[+]' : row.type === 'removed' ? '[-]' : row.type === 'modified' ? '[~]' : '[=]'}
                    </span>
                    <span>{row.textB ?? row.textA}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="font-body text-xs text-ink-2 m-0 leading-relaxed">
            <strong>En palabras simples:</strong> Antes de lanzar un experimento A/B, verifica aquí exactamente qué
            reglas cambian entre tu condición base y tu condición con andamiaje, y cuánto costarán 100 turnos de
            estudiantes en tu proveedor elegido.
          </p>
        </div>
      </BlueprintPanel>

      {/* SECTION 2: SAVED SCENARIO VERSIONS TABLE */}
      <BlueprintPanel
        codeTag="CAT_ESCENARIOS"
        title={`Repositorio de Escenarios y Viñetas (${versions.length})`}
        subtitle="Viñetas asignadas a los participantes en la Hoja de Caso durante las sesiones."
        headingLevel={2}
      >
        <DataTable
          caption="Catálogo de escenarios experimentales"
          columns={[
            { key: 'title', label: 'Título del Escenario', sortable: true },
            {
              key: 'is_active',
              label: 'Disponibilidad',
              sortable: true,
              format: (val, row) => (
                <button
                  type="button"
                  onClick={() => toggleActive(row)}
                  className="min-h-[44px] px-2.5 py-1 border border-line-control bg-paper-subtle hover:bg-paper font-ui-mono text-xs text-ink"
                >
                  {val ? '[ACTIVO] · Clic para pausar' : '[PAUSADO] · Clic para activar'}
                </button>
              ),
            },
            {
              key: 'case_content',
              label: 'Extensión',
              align: 'right',
              format: (val) => `${(val || '').trim().split(/\s+/).filter(Boolean).length} palabras`,
            },
            {
              key: 'created_at',
              label: 'Creado',
              sortable: true,
              format: (val) => (val ? new Date(val).toLocaleDateString('es-CL') : '—'),
            },
            {
              key: 'id',
              label: 'Acciones',
              align: 'right',
              format: (_, row) => (
                <div className="inline-flex flex-wrap justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="min-h-[44px] px-3 py-1.5 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink inline-flex items-center gap-1"
                  >
                    <CadIcon name="Edit3" size={13} />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClone(row)}
                    className="min-h-[44px] px-3 py-1.5 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-cobalt inline-flex items-center gap-1"
                  >
                    <CadIcon name="Copy" size={13} />
                    <span>Clonar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    aria-label={`Eliminar ${row.title}`}
                    className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 border border-vermilion-ink bg-vermilion-tint font-ui-mono text-xs text-vermilion-ink inline-flex items-center justify-center"
                  >
                    <CadIcon name="Trash2" size={14} />
                  </button>
                </div>
              ),
            },
          ]}
          data={versions}
          emptyText="No hay escenarios creados todavía. Pulsa 'Nuevo Escenario / Versión' para redactar una viñeta."
        />
      </BlueprintPanel>

      {/* Editor Modal */}
      {showEditor && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editing ? 'Editar escenario' : 'Crear nuevo escenario'}
        >
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <BlueprintPanel
              codeTag={editing ? 'EDIT_VER' : 'NEW_VER'}
              title={editing ? `Editar: ${editing.title}` : 'Crear Nuevo Escenario de Caso'}
              headingLevel={2}
            >
              <form onSubmit={handleSave} className="space-y-4">
                <Field label="Título identificador del escenario" required={true}>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej. Caso A — Sobrecarga de servicio académico"
                    required
                    className="ps-field__control w-full font-body text-sm text-ink bg-paper border border-line-control px-3 py-2"
                  />
                </Field>

                <Field
                  label="Contenido de la Hoja de Caso (admite Markdown)"
                  required={true}
                  help="Este texto se mostrará permanentemente a los participantes como contexto del problema."
                >
                  <textarea
                    rows={8}
                    value={form.case_content}
                    onChange={(e) => setForm({ ...form, case_content: e.target.value })}
                    placeholder="Describe el escenario, los actores involucrados y la decisión o tarea..."
                    required
                    className="w-full p-3 bg-paper border border-line-control font-body text-sm text-ink leading-relaxed"
                  />
                </Field>

                <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-line-control">
                  <button
                    type="button"
                    onClick={() => setShowEditor(false)}
                    className="min-h-[44px] px-4 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink"
                  >
                    Cancelar
                  </button>
                  <SplitButton type="submit" variant="primary" iconBox="Save" loading={saving}>
                    {editing ? 'Guardar cambios' : 'Crear escenario'}
                  </SplitButton>
                </div>
              </form>
            </BlueprintPanel>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación de escenario"
        >
          <div className="max-w-md w-full">
            <BlueprintPanel codeTag="CONFIRMAR_BAJA" title="¿Eliminar este escenario?" headingLevel={2}>
              <p className="font-body text-sm text-ink leading-relaxed mb-4">
                Se eliminará permanentemente <strong>{deleteTarget.title}</strong>. Las campañas activas que
                dependan exclusivamente de este escenario dejarán de asignarlo.
              </p>
              <div className="flex justify-end gap-2 pt-3 border-t border-line-control">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="min-h-[44px] px-4 py-2 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                >
                  Cancelar
                </button>
                <SplitButton variant="danger" iconBox="Trash2" onClick={confirmDelete}>
                  Confirmar eliminación
                </SplitButton>
              </div>
            </BlueprintPanel>
          </div>
        </div>
      )}
    </div>
  );
}
