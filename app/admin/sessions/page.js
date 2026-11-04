'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BlueprintPanel,
  SplitButton,
  StatBadge,
  TitleBlock,
  DataTable,
  MarginNote,
  HandMark,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';

function stripThinkingTags(text) {
  if (!text) return '';
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*$/gi, '');
  return cleaned.trim();
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '—';
  const s = Math.max(0, Math.round(Number(seconds)));
  if (s >= 3600) {
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  }
  if (s >= 60) {
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  }
  return `${s}s`;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportingLabel, setExportingLabel] = useState('');
  const [statusBanner, setStatusBanner] = useState(null);

  // Transcript Inspector modal state
  const [inspectedSession, setInspectedSession] = useState(null);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async (workshopId = '') => {
    setLoading(true);
    try {
      const exportUrl = workshopId
        ? `/api/admin/export?workshopId=${encodeURIComponent(workshopId)}`
        : '/api/admin/export';
      const [wRes, sRes] = await Promise.all([
        fetch('/api/admin/workshops'),
        fetch(exportUrl),
      ]);
      const wData = await wRes.json();
      const sData = await sRes.json();
      setCampaigns(Array.isArray(wData) ? wData : []);
      setSessions(Array.isArray(sData) ? sData : []);
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `Error al sincronizar sesiones: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedCampaign);
  }, [selectedCampaign, loadData]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (deleteTarget) setDeleteTarget(null);
        else if (inspectedSession) setInspectedSession(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteTarget, inspectedSession]);

  const confirmDeleteSession = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const targetId = deleteTarget.id || deleteTarget.session_id;
      const res = await fetch(`/api/session/${targetId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar registro de sesión');
      setDeleteTarget(null);
      if (inspectedSession && (inspectedSession.id === targetId || inspectedSession.session_id === targetId)) {
        setInspectedSession(null);
      }
      setStatusBanner({
        tone: 'em',
        text: `Sesión de "${deleteTarget.participant_name}" eliminada correctamente.`,
      });
      await loadData(selectedCampaign);
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `No se pudo eliminar la sesión: ${err.message}`,
      });
    } finally {
      setDeleting(false);
    }
  };

  const triggerExport = async ({ format, level, filename, mimeType }) => {
    setExportingLabel(filename);
    try {
      const params = new URLSearchParams();
      if (selectedCampaign) params.set('workshopId', selectedCampaign);
      if (format) params.set('format', format);
      if (level) params.set('level', level);

      const url = `/api/admin/export${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al generar archivo de exportación');

      const content = format === null
        ? JSON.stringify(await res.json(), null, 2)
        : await res.text();

      const blob = new Blob([content], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);

      setStatusBanner({
        tone: 'em',
        text: `Archivo científico "${filename}" descargado (compatible con R, pandas y SPSS).`,
      });
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `Fallo en exportación: ${err.message}`,
      });
    } finally {
      setExportingLabel('');
    }
  };

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      const pName = (s.participant_name || '').toLowerCase();
      const cName = (s.campaign_name || '').toLowerCase();
      const vName = (s.version_title || '').toLowerCase();
      return pName.includes(q) || cName.includes(q) || vName.includes(q);
    });
  }, [sessions, searchQuery]);

  const tableRows = useMemo(() => {
    return filteredSessions.map((s) => {
      const msgs = s.messages || [];
      let stuWords = 0;
      let botWords = 0;
      msgs.forEach((m) => {
        const wc = (m.content || '').trim().split(/\s+/).filter(Boolean).length;
        if (m.role === 'user') stuWords += wc;
        else if (m.role === 'assistant') botWords += wc;
      });
      return {
        ...s,
        id: s.id || s.session_id,
        turnsCount: msgs.length || s.interaction_count || 0,
        wordBalance: `${stuWords} / ${botWords}`,
        durationFormatted: formatDuration(s.duration_seconds),
      };
    });
  }, [filteredSessions]);

  const columns = [
    {
      key: 'participant_name',
      label: 'Participante',
      sortable: true,
      format: (val, row) => (
        <div>
          <div className="font-semibold text-ink">{val || 'Anónimo'}</div>
          {row.chain_order ? (
            <div className="font-ui-mono text-xs text-cobalt">Paso {row.chain_order}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'campaign_name',
      label: 'Experimento / Condición',
      sortable: true,
    },
    {
      key: 'version_title',
      label: 'Escenario',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      format: (val) => (
        <StatBadge
          label="Estado"
          value={val === 'completed' ? 'COMPLETADA' : 'EN CURSO'}
          variant={val === 'completed' ? 'em' : 'cobalt'}
        />
      ),
    },
    {
      key: 'turnsCount',
      label: 'Mensajes',
      align: 'right',
      sortable: true,
    },
    {
      key: 'wordBalance',
      label: 'Palabras (Est./IA)',
      align: 'right',
    },
    {
      key: 'durationFormatted',
      label: 'Duración',
      align: 'right',
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center',
      format: (_, row) => (
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInspectedSession(row)}
            className="min-h-[44px] px-3 inline-flex items-center gap-1.5 border border-line-control bg-paper-subtle hover:bg-paper font-ui-mono text-xs text-ink"
          >
            <CadIcon name="Eye" size={14} />
            <span>Traza</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            aria-label={`Eliminar sesión de ${row.participant_name}`}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-vermilion-ink bg-vermilion-tint text-vermilion-ink hover:bg-paper"
          >
            <CadIcon name="Trash2" size={14} />
          </button>
        </div>
      ),
    },
  ];

  const todayStamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line-control pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <span className="font-ui-mono text-xs uppercase tracking-wider px-2 py-0.5 border border-line-control bg-paper-subtle text-ink">
              MOD_04 // TRAZAS CONVERSACIONALES Y EXPORTACIÓN TIDY
            </span>
            <MarginNote tone="cobalt" rotate={1}>
              DATOS LISTOS PARA R Y PANDAS
            </MarginNote>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight m-0">
            Registro de{' '}
            <HandMark type="underline" tone="cobalt">
              Sesiones y Trazas
            </HandMark>
          </h1>
          <p className="font-body text-sm text-ink-2 mt-1 max-w-3xl">
            Inspeccione cada diálogo turno a turno junto a sus respuestas de encuesta y exporte tablas Tidy (Wickham, 2014) acompañadas de libro de códigos científico.
          </p>
        </div>

        {/* Scientific Export SplitButton + Codebook */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={Boolean(exportingLabel)}
            onClick={() =>
              triggerExport({
                format: 'codebook',
                level: 'session',
                filename: `promptsketch_codebook_${todayStamp}.md`,
                mimeType: 'text/markdown;charset=utf-8',
              })
            }
            className="min-h-[44px] px-3.5 inline-flex items-center gap-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs font-semibold uppercase text-ink"
          >
            <CadIcon name="BookOpen" size={14} />
            <span>Codebook (.md)</span>
          </button>

          <SplitButton
            variant="primary"
            iconBox="Download"
            loading={Boolean(exportingLabel)}
            disabled={sessions.length === 0}
            primaryAction={{
              label: 'Exportar Tidy Sesiones (.csv)',
              icon: 'Download',
              onClick: () =>
                triggerExport({
                  format: 'csv',
                  level: 'session',
                  filename: `tidy_sessions_${todayStamp}.csv`,
                  mimeType: 'text/csv;charset=utf-8',
                }),
            }}
            menuActions={[
              {
                label: 'Tidy Turnos Conversacionales (.csv)',
                icon: 'FileSpreadsheet',
                onClick: () =>
                  triggerExport({
                    format: 'csv',
                    level: 'turn',
                    filename: `tidy_turns_${todayStamp}.csv`,
                    mimeType: 'text/csv;charset=utf-8',
                  }),
              },
              {
                label: 'Tidy Longitudinal Pre/Post (.csv)',
                icon: 'GitCompare',
                onClick: () =>
                  triggerExport({
                    format: 'csv',
                    level: 'longitudinal',
                    filename: `tidy_longitudinal_${todayStamp}.csv`,
                    mimeType: 'text/csv;charset=utf-8',
                  }),
              },
              {
                label: 'Transcripciones Completas (.json)',
                icon: 'FileCode',
                onClick: () =>
                  triggerExport({
                    format: null,
                    level: null,
                    filename: `sessions_full_${todayStamp}.json`,
                    mimeType: 'application/json;charset=utf-8',
                  }),
              },
            ]}
          />
        </div>
      </header>

      {statusBanner && (
        <div
          role="status"
          className={`p-3 border flex items-center justify-between gap-3 font-ui-mono text-xs ${
            statusBanner.tone === 'verm'
              ? 'bg-vermilion-tint border-vermilion-ink text-vermilion-ink'
              : 'bg-emerald-tint border-emerald text-emerald'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label="Cerrar notificación"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-current bg-paper text-ink"
          >
            <CadIcon name="X" size={14} />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <BlueprintPanel
        codeTag="FILTROS"
        title={`Explorador de Muestra (${filteredSessions.length} de ${sessions.length} sesiones)`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="campaign-filter-select"
              className="block font-ui-mono text-xs font-semibold uppercase tracking-wider text-ink mb-1.5"
            >
              Filtrar por Experimento / Condición
            </label>
            <select
              id="campaign-filter-select"
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="min-h-[44px] w-full px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
            >
              <option value="">Todos los experimentos ({campaigns.length})</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="session-search-input"
              className="block font-ui-mono text-xs font-semibold uppercase tracking-wider text-ink mb-1.5"
            >
              Buscar por participante o escenario
            </label>
            <input
              id="session-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej.: Participante 01, Authorship, Caso..."
              className="min-h-[44px] w-full px-3 border border-line-control bg-paper font-body text-xs text-ink"
            />
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="font-ui-mono text-xs text-ink-2 py-8 text-center">
              Cargando registro completo de sesiones y mensajes...
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={tableRows}
              caption="Registro auditable de sesiones experimentales y balance léxico"
              emptyText="No se encontraron sesiones para los criterios seleccionados."
            />
          )}
        </div>
      </BlueprintPanel>

      {/* Transcript Inspector Modal */}
      {inspectedSession && (
        <div
          className="fixed inset-0 z-50 bg-ink/65 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setInspectedSession(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transcript-modal-title"
            className="w-full max-w-3xl my-6 bg-paper border-2 border-ink shadow-hard flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-paper-subtle border-b border-line-control">
              <div className="flex items-center gap-2">
                <CadIcon name="MessageSquare" size={16} className="text-cobalt" />
                <h2
                  id="transcript-modal-title"
                  className="font-ui-mono text-xs uppercase tracking-wider font-semibold text-ink m-0"
                >
                  INSPECTOR DE TRAZA CONVERSACIONAL · {inspectedSession.participant_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectedSession(null)}
                aria-label="Cerrar inspector de traza"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-line-control bg-paper text-ink"
              >
                <CadIcon name="X" size={16} />
              </button>
            </div>

            <TitleBlock
              sheetNumber={(inspectedSession.id || '').slice(0, 8)}
              status={inspectedSession.status === 'completed' ? 'COMPLETADA' : 'EN CURSO'}
              rev={inspectedSession.chain_order ? `PASO ${inspectedSession.chain_order}` : 'INDIVIDUAL'}
              n={`${inspectedSession.turnsCount || 0} MSGS`}
              title={inspectedSession.campaign_name}
              subtitle={inspectedSession.version_title}
            />

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* System Prompt Box */}
              <div className="p-3 bg-paper-subtle border border-line-control">
                <div className="font-ui-mono text-xs uppercase font-semibold text-ink mb-1">
                  System Prompt Activo en esta Sesión
                </div>
                <pre className="font-ui-mono text-xs text-ink-2 whitespace-pre-wrap m-0 max-h-36 overflow-y-auto">
                  {inspectedSession.system_prompt
                    ? inspectedSession.system_prompt
                    : 'Sin System Prompt adicional (Condición Base / Naive Mode)'}
                </pre>
              </div>

              {/* Conversation Log */}
              <div
                role="log"
                aria-label="Transcripción turno a turno"
                className="space-y-3"
              >
                {(!inspectedSession.messages || inspectedSession.messages.length === 0) ? (
                  <p className="font-ui-mono text-xs text-ink-2 text-center py-6">
                    Esta sesión no registra mensajes conversacionales.
                  </p>
                ) : (
                  inspectedSession.messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    const cleanText = stripThinkingTags(msg.content);
                    const wordCount = cleanText.trim().split(/\s+/).filter(Boolean).length;
                    const tel = msg.telemetry || msg.metadata?.telemetry || null;

                    return (
                      <div
                        key={msg.id || idx}
                        className={`p-3.5 border ${
                          isUser
                            ? 'bg-paper-subtle border-line-control ml-0 sm:ml-8'
                            : 'bg-paper border-l-4 border-l-cobalt border-line-control mr-0 sm:mr-8'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dotted border-rule pb-1.5 mb-2 font-ui-mono text-xs">
                          <span className={isUser ? 'font-bold text-ink' : 'font-bold text-cobalt'}>
                            #{idx + 1} · {isUser ? 'ESTUDIANTE' : 'ASISTENTE IA'}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 text-ink-2 stat">
                            <span>{wordCount} palabras</span>
                            {tel?.ttft_ms ? <span>· TTFT {Math.round(tel.ttft_ms)} ms</span> : null}
                            {tel?.cost_usd ? <span>· USD {Number(tel.cost_usd).toFixed(5)}</span> : null}
                            {msg.created_at ? (
                              <span>· {new Date(msg.created_at).toLocaleTimeString()}</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="font-body text-sm text-ink leading-relaxed prose max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanText}</ReactMarkdown>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Post-Session Survey Responses */}
              {inspectedSession.survey_answers &&
                Object.keys(inspectedSession.survey_answers).length > 0 && (
                  <div className="p-4 bg-paper-subtle border border-line-control space-y-2.5">
                    <div className="font-ui-mono text-xs uppercase font-semibold text-cobalt">
                      Respuestas del Instrumento Post-Sesión
                    </div>
                    <dl className="space-y-2 m-0">
                      {Object.entries(inspectedSession.survey_answers).map(([k, val]) => {
                        const matchedQ = (inspectedSession.survey_config || []).find(
                          (q) => q.id === k
                        );
                        const label = matchedQ ? matchedQ.text : k;
                        const displayVal = Array.isArray(val) ? val.join(' · ') : String(val);
                        return (
                          <div key={k} className="border-b border-dotted border-rule pb-1.5">
                            <dt className="font-ui-mono text-xs text-ink-2">{label}</dt>
                            <dd className="font-body text-xs font-semibold text-ink m-0 mt-0.5">
                              {displayVal}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                )}
            </div>

            <div className="flex justify-end gap-3 px-5 py-3 bg-paper-subtle border-t border-line-control">
              <button
                type="button"
                onClick={() => setInspectedSession(null)}
                className="min-h-[44px] px-4 border border-line-control bg-paper font-ui-mono text-xs font-semibold uppercase text-ink"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-session-title"
            className="w-full max-w-md bg-paper border-2 border-vermilion-ink shadow-hard p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-vermilion-ink">
              <CadIcon name="AlertTriangle" size={18} />
              <h3 id="delete-session-title" className="font-ui-mono text-xs uppercase font-bold m-0">
                CONFIRMAR ELIMINACIÓN DE SESIÓN
              </h3>
            </div>
            <p className="font-body text-sm text-ink m-0">
              ¿Desea eliminar permanentemente la sesión de{' '}
              <strong>{deleteTarget.participant_name}</strong> y todos sus turnos conversacionales?
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-line-control">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="min-h-[44px] px-4 border border-line-control bg-paper font-ui-mono text-xs uppercase text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteSession}
                className="min-h-[44px] px-4 border border-vermilion-ink bg-vermilion-tint font-ui-mono text-xs font-bold uppercase text-vermilion-ink"
              >
                {deleting ? 'Eliminando…' : 'Eliminar Sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
