'use client';

import React, { useState, useMemo } from 'react';
import CadIcon from '../cad-icon';

/**
 * DataTable - Accessible publication-grade data table.
 * Fully operable via keyboard, right-aligned tabular numerals, dashed row dividers.
 */
export function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  caption,
  className = '',
  emptyText = 'No hay datos registrados en esta serie.',
  ...props
}) {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [data, sortField, sortDirection]);

  return (
    <div
      role="region"
      tabIndex={0}
      aria-label={caption || 'Tabla de datos experimentales'}
      className={`ps-table-container w-full overflow-x-auto border border-line-control bg-paper ${className}`}
      {...props}
    >
      <table className="ps-table w-full border-collapse text-left font-body text-xs text-ink">
        {caption && (
          <caption className="font-ui-mono text-xs text-left p-2.5 text-ink-2 uppercase tracking-wider bg-paper-subtle border-b border-line-control">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="border-b border-line-control bg-paper-subtle">
            {columns.map((col) => {
              const isSorted = sortField === col.key;
              const ariaSort = !col.sortable
                ? undefined
                : isSorted
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none';

              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={`font-ui-mono text-xs uppercase tracking-wider text-ink-2 p-3 font-semibold ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="min-h-[44px] min-w-[44px] px-2 inline-flex items-center gap-1.5 font-ui-mono text-xs uppercase text-ink-2 hover:text-ink"
                      aria-label={`Ordenar por ${col.label}`}
                    >
                      <span>{col.label}</span>
                      <span aria-hidden="true" className="shrink-0">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <CadIcon name="ArrowUp" size={12} />
                          ) : (
                            <CadIcon name="ArrowDown" size={12} />
                          )
                        ) : (
                          <CadIcon name="ArrowUpDown" size={12} className="opacity-40" />
                        )}
                      </span>
                    </button>
                  ) : (
                    <span>{col.label}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="p-6 text-center font-ui-mono text-xs text-ink-2 bg-paper"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIdx) => {
              const rowKey = row[keyField] !== undefined ? row[keyField] : rowIdx;
              return (
                <tr
                  key={rowKey}
                  className="border-b border-dotted border-rule hover:border-l-[3px] hover:border-l-ink transition-colors bg-paper"
                >
                  {columns.map((col) => {
                    const cellVal = row[col.key];
                    const formatted = col.format ? col.format(cellVal, row) : cellVal;
                    const isNum = col.align === 'right' || typeof cellVal === 'number';

                    return (
                      <td
                        key={col.key}
                        className={`p-3 text-xs text-ink ${
                          isNum ? 'text-right stat font-stat' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {formatted !== null && formatted !== undefined ? formatted : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
