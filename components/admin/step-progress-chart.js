'use client';

import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const TOGGLE = 'min-h-[44px] px-3 font-body text-sm';

/** Reads the design tokens at runtime: Chart.js draws on a canvas, which cannot use CSS variables. */
function readTokens() {
  const css = getComputedStyle(document.documentElement);
  const get = (name) => css.getPropertyValue(name).trim();
  return {
    conditions: [1, 2, 3, 4, 5, 6].map((n) => get(`--ps-cond-${n}`)),
    ink: get('--ps-ink'),
    ink2: get('--ps-ink-2'),
    paper: get('--ps-paper'),
    grid: get('--ps-line-control'),
    font: getComputedStyle(document.body).fontFamily,
  };
}

function Segmented({ label, value, options, onChange }) {
  return (
    <div role="group" aria-label={label} className="inline-flex border border-line-control bg-paper">
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={`${TOGGLE} ${value === id ? 'bg-ink text-paper font-semibold' : 'bg-paper text-ink hover:bg-paper-subtle'}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/**
 * Participants per step, split by condition.
 * `view` 'bars': vertical columns, absolute or percent, grouped or stacked.
 * `view` 'share': one donut per step.
 */
export default function StepProgressChart({ steps, view, tr }) {
  // Rendered only after the live data arrives (client side), so reading the tokens here is safe.
  const [tokens] = useState(() => (typeof window === 'undefined' ? null : readTokens()));
  const [scale, setScale] = useState('abs'); // 'abs' | 'pct'
  const [layout, setLayout] = useState('grouped'); // 'grouped' | 'stacked'

  // One series per distinct condition title, so the same condition keeps its color across steps.
  const series = useMemo(() => {
    const titles = [];
    steps.forEach((s) => s.conditions.forEach((c) => !titles.includes(c.title) && titles.push(c.title)));
    return titles;
  }, [steps]);
  const singleCondition = steps.length > 0 && steps.every((s) => s.conditions.length <= 1);
  const colorOf = (i) => tokens?.conditions[i % 6];
  const totalOf = (s) => s.conditions.reduce((a, c) => a + c.count, 0);

  if (!tokens) return <p className="ps-meta" role="status">{tr('Cargando…')}</p>;
  if (steps.length === 0 || steps.every((s) => totalOf(s) === 0)) {
    return <p className="ps-lead">{tr('Cuando alguien entre, lo verás aquí.')}</p>;
  }

  const summary = (
    <ul className="list-none m-0 p-0 mt-4 space-y-1 font-body text-sm text-ink">
      {steps.map((s) => (
        <li key={s.id}>
          <span className="font-semibold">{s.order}. {s.name}</span>{' '}
          <span className="ps-meta">{tr('{started} iniciaron · {active} en curso · {completed} terminaron', { started: s.started, active: s.active, completed: s.completed })}</span>
        </li>
      ))}
    </ul>
  );

  const baseText = { color: tokens.ink, font: { family: tokens.font, size: 12 } };
  const tooltip = {
    backgroundColor: tokens.ink,
    titleColor: tokens.paper,
    bodyColor: tokens.paper,
    cornerRadius: 0,
    displayColors: true,
  };

  if (view === 'share') {
    return (
      <div>
      <ol className="list-none m-0 p-0 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {steps.map((s) => {
          const total = totalOf(s);
          const rows = s.conditions;
          return (
            <li key={s.id} className="border border-line-control bg-paper p-3">
              <h3 className="ps-h3 mb-2">{s.order}. {s.name}</h3>
              {total === 0 ? (
                <p className="ps-meta m-0">{tr('Sin participantes todavía.')}</p>
              ) : (
                <div className="h-56" role="img" aria-label={rows.map((c) => `${c.title}: ${c.count}`).join(', ')}>
                  <Doughnut
                    data={{
                      labels: rows.map((c) => c.title),
                      datasets: [{
                        data: rows.map((c) => c.count),
                        backgroundColor: rows.map((c) => colorOf(series.indexOf(c.title))),
                        borderColor: tokens.paper,
                        borderWidth: 2,
                      }],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      cutout: '55%',
                      plugins: {
                        legend: { position: 'bottom', labels: { ...baseText, boxWidth: 12, boxHeight: 12 } },
                        tooltip: {
                          ...tooltip,
                          callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${Math.round((ctx.parsed / total) * 100)}%)` },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {summary}
      </div>
    );
  }

  const valueOf = (s, title) => {
    const count = s.conditions.find((c) => c.title === title)?.count ?? 0;
    if (scale === 'abs') return count;
    const total = totalOf(s);
    return total ? Math.round((count / total) * 1000) / 10 : 0;
  };

  // One condition per step: the bars are the steps themselves. Otherwise one series per condition.
  const datasets = singleCondition
    ? [{
        label: tr('Participantes'),
        data: steps.map((s) => s.started),
        backgroundColor: steps.map((_, i) => colorOf(i)),
        borderColor: tokens.ink,
        borderWidth: 1,
      }]
    : series.map((title, i) => ({
        label: title,
        data: steps.map((s) => valueOf(s, title)),
        backgroundColor: colorOf(i),
        borderColor: tokens.ink,
        borderWidth: 1,
      }));
  const stacked = layout === 'stacked' && !singleCondition;
  const pct = scale === 'pct' && !singleCondition;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!singleCondition && (
          <>
            <Segmented
              label={tr('Valores')}
              value={scale}
              onChange={setScale}
              options={[['abs', tr('Absolutas')], ['pct', tr('Relativas (%)')]]}
            />
            <Segmented
              label={tr('Disposición')}
              value={layout}
              onChange={setLayout}
              options={[['grouped', tr('Separadas')], ['stacked', tr('Acumuladas')]]}
            />
          </>
        )}
      </div>
      <div className="h-72 border border-line-control bg-paper p-3" role="img" aria-label={tr('Participantes por paso y condición')}>
        <Bar
          data={{ labels: steps.map((s) => `${s.order}. ${s.name}`), datasets }}
          options={{
            maintainAspectRatio: false,
            plugins: {
              legend: { display: !singleCondition, position: 'bottom', labels: { ...baseText, boxWidth: 12, boxHeight: 12 } },
              tooltip: {
                ...tooltip,
                callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}${pct ? '%' : ''}` },
              },
            },
            scales: {
              x: { stacked, grid: { display: false }, ticks: baseText, border: { color: tokens.ink } },
              y: {
                stacked,
                beginAtZero: true,
                max: pct && stacked ? 100 : undefined,
                ticks: { ...baseText, precision: 0, callback: (v) => (pct ? `${v}%` : v) },
                grid: { color: tokens.grid },
                border: { color: tokens.ink },
              },
            },
          }}
        />
      </div>
      {summary}
    </div>
  );
}
