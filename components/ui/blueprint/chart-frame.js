'use client';

import React, { useState, useId } from 'react';
import DataTable from './data-table';
import CadIcon from '../cad-icon';
import { useTr } from '@/lib/i18n/context';

/**
 * ChartFrame - Accessible statistical chart container.
 * Enforces dual visual encoding: Condition A (diagonal hatch) vs Condition B (solid cobalt),
 * direct labels, error bars, plain-text trend summary, and mandatory "Ver como tabla" toggle.
 */
export function ChartFrame({
  title,
  subtitle,
  data,
  ariaLabel,
  trendSummary,
  tableData,
  tableColumns,
  children,
  className = '',
  ...props
}) {
  const [showTable, setShowTable] = useState(false);
  const tr = useTr();
  const chartId = useId();
  const summaryId = `chart-summary-${chartId}`;
  const captionId = `chart-caption-${chartId}`;
  const hatchPatternId = `ps-hatch-${chartId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Default table columns fallback if tableData is provided
  const derivedColumns = tableColumns || [
    { key: 'metric', label: tr('Métrica / Dimensión') },
    { key: 'conditionA', label: tr('Condición A (Baseline)'), align: 'right' },
    { key: 'conditionB', label: tr('Condición B (Socrático)'), align: 'right' },
    { key: 'effect', label: tr('Efecto / Dif.'), align: 'right' },
  ];

  const derivedTableData = tableData || (data ? [
    {
      id: 1,
      metric: title || tr('Puntuación promedio'),
      conditionA: data.conditionA ? `${data.conditionA.mean ?? data.conditionA.value ?? '—'} (±${data.conditionA.sd ?? '0.0'})` : '—',
      conditionB: data.conditionB ? `${data.conditionB.mean ?? data.conditionB.value ?? '—'} (±${data.conditionB.sd ?? '0.0'})` : '—',
      effect: data.diff ? `${data.diff > 0 ? '+' : ''}${data.diff}` : '—',
    }
  ] : []);

  // Standard sample chart renderer if custom SVG children is not supplied
  const renderDefaultSvg = () => {
    const valA = Number(data?.conditionA?.mean ?? data?.conditionA?.value ?? 3.2);
    const valB = Number(data?.conditionB?.mean ?? data?.conditionB?.value ?? 4.1);
    const labelA = data?.conditionA?.label || tr('Condición A (Baseline)');
    const labelB = data?.conditionB?.label || tr('Condición B (Socrático)');
    const maxVal = Math.max(5, Math.ceil(Math.max(valA, valB) * 1.25));

    // SVG coordinates
    const width = 480;
    const height = 220;
    const chartBottom = 170;
    const chartTop = 30;
    const barWidth = 90;

    const scaleY = (v) => chartBottom - ((v / maxVal) * (chartBottom - chartTop));

    const yA = scaleY(valA);
    const yB = scaleY(valB);
    const heightA = chartBottom - yA;
    const heightB = chartBottom - yB;

    // Error bars (e.g., CI ±0.35)
    const errA = Number(data?.conditionA?.ci ?? 0.35);
    const errB = Number(data?.conditionB?.ci ?? 0.30);
    const ciLowA = scaleY(Math.max(0, valA - errA));
    const ciHighA = scaleY(Math.min(maxVal, valA + errA));
    const ciLowB = scaleY(Math.max(0, valB - errB));
    const ciHighB = scaleY(Math.min(maxVal, valB + errB));

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[260px] bg-paper border border-line-control"
        role="img"
        aria-label={ariaLabel || title || tr('Comparación gráfica entre condición A y B')}
        aria-describedby={summaryId}
      >
        <defs>
          {/* Diagonal hatch pattern for Condition A */}
          <pattern
            id={hatchPatternId}
            width="8"
            height="8"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="var(--ps-ink)"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 1, 2, 3, 4, 5].map((tick) => {
          if (tick > maxVal) return null;
          const y = scaleY(tick);
          return (
            <g key={tick} className="opacity-40">
              <line
                x1="45"
                y1={y}
                x2={width - 20}
                y2={y}
                stroke="var(--ps-rule)"
                strokeDasharray="3 3"
              />
              <text
                x="35"
                y={y + 4}
                textAnchor="end"
                className="font-ui-mono stat fill-ink-2 text-xs"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Baseline horizontal axis */}
        <line
          x1="45"
          y1={chartBottom}
          x2={width - 20}
          y2={chartBottom}
          stroke="var(--ps-line-control)"
          strokeWidth="1.5"
        />

        {/* Bar A: Diagonal hatch pattern + graphite */}
        <g tabIndex={0} role="graphics-symbol" aria-label={`${labelA}: ${valA}`}>
          <rect
            x="110"
            y={yA}
            width={barWidth}
            height={heightA}
            fill="var(--ps-graphite-tint)"
            stroke="var(--ps-line-control)"
            strokeWidth="1.5"
          />
          <rect
            x="110"
            y={yA}
            width={barWidth}
            height={heightA}
            fill={`url(#${hatchPatternId})`}
            stroke="var(--ps-ink)"
            strokeWidth="1.5"
          />
          {/* Direct Label */}
          <text
            x={110 + barWidth / 2}
            y={yA - 12}
            textAnchor="middle"
            className="font-stat font-bold text-xs fill-ink stat"
          >
            {valA.toFixed(2)}
          </text>
          {/* Error Bar */}
          <line
            x1={110 + barWidth / 2}
            y1={ciLowA}
            x2={110 + barWidth / 2}
            y2={ciHighA}
            stroke="var(--ps-ink)"
            strokeWidth="1.5"
          />
          <line
            x1={110 + barWidth / 2 - 4}
            y1={ciHighA}
            x2={110 + barWidth / 2 + 4}
            y2={ciHighA}
            stroke="var(--ps-ink)"
            strokeWidth="1.5"
          />
          <line
            x1={110 + barWidth / 2 - 4}
            y1={ciLowA}
            x2={110 + barWidth / 2 + 4}
            y2={ciLowA}
            stroke="var(--ps-ink)"
            strokeWidth="1.5"
          />
          {/* X Axis Label */}
          <text
            x={110 + barWidth / 2}
            y={chartBottom + 18}
            textAnchor="middle"
            className="font-ui-mono text-xs fill-ink uppercase"
          >
            Cond. A (Trama)
          </text>
        </g>

        {/* Bar B: Solid Cobalt fill */}
        <g tabIndex={0} role="graphics-symbol" aria-label={`${labelB}: ${valB}`}>
          <rect
            x="270"
            y={yB}
            width={barWidth}
            height={heightB}
            fill="var(--ps-cobalt)"
            stroke="var(--ps-ink)"
            strokeWidth="1.5"
          />
          {/* Direct Label */}
          <text
            x={270 + barWidth / 2}
            y={yB - 12}
            textAnchor="middle"
            className="font-stat font-bold text-xs fill-ink stat"
          >
            {valB.toFixed(2)}
          </text>
          {/* Error Bar */}
          <line
            x1={270 + barWidth / 2}
            y1={ciLowB}
            x2={270 + barWidth / 2}
            y2={ciHighB}
            stroke="var(--ps-ink)"
            strokeWidth="1.5"
          />
          <line
            x1={270 + barWidth / 2 - 4}
            y1={ciHighB}
            x2={270 + barWidth / 2 + 4}
            y2={ciHighB}
            stroke="var(--ps-ink)"
            strokeWidth="1.5"
          />
          <line
            x1={270 + barWidth / 2 - 4}
            y1={ciLowB}
            x2={270 + barWidth / 2 + 4}
            y2={ciLowB}
            stroke="var(--ps-ink)"
            strokeWidth="1.5"
          />
          {/* X Axis Label */}
          <text
            x={270 + barWidth / 2}
            y={chartBottom + 18}
            textAnchor="middle"
            className="font-ui-mono text-xs fill-cobalt uppercase font-semibold"
          >
            Cond. B (Cobalto)
          </text>
        </g>
      </svg>
    );
  };

  return (
    <figure
      className={`ps-chartframe bg-paper border border-line-control p-4 ${className}`}
      {...props}
    >
      <figcaption id={captionId} className="ps-chartframe__caption flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          {title && (
            <h4 className="font-ui-mono text-xs uppercase tracking-wider font-semibold text-ink m-0">
              {title}
            </h4>
          )}
          {subtitle && (
            <p className="font-ui-mono text-xs text-ink-2 m-0 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Mandatory accessible toggle */}
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="min-h-[44px] min-w-[44px] px-3 py-1.5 inline-flex items-center gap-1.5 border border-line-control bg-paper-subtle hover:bg-paper font-ui-mono text-xs text-ink active:translate-y-px"
          aria-expanded={showTable}
        >
          <CadIcon name={showTable ? 'BarChart2' : 'Table'} size={14} />
          <span>{showTable ? tr('Ver como gráfico') : tr('Ver como tabla')}</span>
        </button>
      </figcaption>

      {/* Main Representation: Graphical SVG vs Accessible Table */}
      <div className="ps-chartframe__content">
        {showTable ? (
          <DataTable
            columns={derivedColumns}
            data={derivedTableData}
            caption={tr('Representación tabular de: {title}', { title: title || tr('Métricas') })}
          />
        ) : (
          children || renderDefaultSvg()
        )}
      </div>

      {/* Textual Trend Summary (WCAG AAA reading comprehension) */}
      {trendSummary && (
        <div
          id={summaryId}
          className="mt-3 p-2.5 bg-paper-subtle border-l-2 border-cobalt font-body text-xs text-ink leading-relaxed"
        >
          <span className="font-ui-mono font-semibold uppercase text-cobalt mr-1">
            {tr('Resumen de tendencia:')}
          </span>
          {trendSummary}
        </div>
      )}
    </figure>
  );
}

export default ChartFrame;
