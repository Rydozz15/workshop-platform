'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  BlueprintPanel,
  SplitButton,
  StatBadge,
  TitleBlock,
  Field,
  MarginNote,
  HandMark,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';
import { useLanguage } from '@/lib/i18n/context';

const PROVIDER_MODELS = {
  groq: 'llama-3.3-70b-versatile',
  openrouter: 'deepseek/deepseek-chat',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
  ollama: 'llama3.2:latest',
};

const PROVIDER_LABELS = {
  groq: 'Groq Cloud (LPU)',
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama (Local)',
};

export default function CampaignsPage() {
  const { locale } = useLanguage();
  const [campaigns, setCampaigns] = useState([]);
  const [versions, setVersions] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [globalSettings, setGlobalSettings] = useState({
    default_ai_provider: 'groq',
    default_ai_model: 'llama-3.3-70b-versatile',
  });
  const [loading, setLoading] = useState(true);
  const [statusBanner, setStatusBanner] = useState(null);

  // Builder modal state
  const [showBuilder, setShowBuilder] = useState(false);
  const [confirmDeployOpen, setConfirmDeployOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Study Design Copilot modal state
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotGoal, setCopilotGoal] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState(null);
  const [applyingCopilot, setApplyingCopilot] = useState(false);

  const [copiedCode, setCopiedCode] = useState(null);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const createBlankStep = useCallback(
    (overrides = {}) => ({
      name: '',
      selected_version_ids: [],
      ai_provider: globalSettings.default_ai_provider || 'groq',
      openrouter_model:
        globalSettings.default_ai_model ||
        PROVIDER_MODELS[globalSettings.default_ai_provider || 'groq'],
      system_prompt: '',
      analysis_type: 'preregistrado',
      hypothesis: '',
      onboarding_instructions: '',
      survey_config: [],
      maintain_version: false,
      ...overrides,
    }),
    [globalSettings]
  );

  const [steps, setSteps] = useState([]);
  const [builderTab, setBuilderTab] = useState('quick'); // 'quick' | 'advanced'
  const [quickForm, setQuickForm] = useState({
    title: '',
    selected_version_id: '',
    promptA: 'Always respond in the same language the user writes in. Provide clear, direct assistance without exploratory scaffolding.',
    promptB: 'Always respond in the same language the user writes in.\n\nRULE FOR MODE SELECTION (EXPLORE BEFORE BUILD):\nDefault to EXPLORE MODE when the user problem lacks institutional context:\n- Briefly validate her situation without inventing details.\n- Do NOT offer categorical solutions yet. Ask exactly 1 targeted contextual question.\n\nSwitch to BUILD MODE only after the user provides concrete actors, constraints, or prior attempts.',
    labelA: 'Condición A (Línea Base)',
    labelB: 'Condición B (Andamiaje Socrático)',
    hypothesis: 'El andamiaje pedagógico aumentará la aplicabilidad percibida y la formulación metacognitiva.',
    analysis_type: 'preregistrado',
    ai_provider: 'groq',
    openrouter_model: 'llama-3.3-70b-versatile',
    includeStandardSurvey: true,
  });
  const [showQuickAdvanced, setShowQuickAdvanced] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [wRes, vRes, sRes] = await Promise.all([
        fetch('/api/admin/workshops'),
        fetch('/api/admin/versions'),
        fetch('/api/admin/settings'),
      ]);
      const campaignList = await wRes.json();
      const versionList = await vRes.json();
      const settingsData = await sRes.json();

      const safeCampaigns = Array.isArray(campaignList) ? campaignList : [];
      const safeVersions = Array.isArray(versionList) ? versionList : [];

      setCampaigns(safeCampaigns);
      setVersions(safeVersions);
      if (settingsData && !settingsData.error) {
        setGlobalSettings((prev) => ({ ...prev, ...settingsData }));
      }

      const metricsMap = {};
      await Promise.all(
        safeCampaigns.map(async (c) => {
          try {
            const res = await fetch(`/api/admin/dashboard?workshopId=${c.id}`);
            metricsMap[c.id] = await res.json();
          } catch {
            metricsMap[c.id] = {};
          }
        })
      );
      setMetrics(metricsMap);
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `Error al cargar experimentos: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Listen for draft transfer from versions/page.js
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'draft') {
      const raw = localStorage.getItem('ps_pending_draft');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          localStorage.removeItem('ps_pending_draft');
          setQuickForm((prev) => ({
            ...prev,
            title: parsed.title || 'Experimento A/B desde Mesa de Dibujo',
            promptA: parsed.promptA || prev.promptA,
            promptB: parsed.promptB || prev.promptB,
            selected_version_id: parsed.suggestedVersionId || prev.selected_version_id,
          }));
          setBuilderTab('quick');
          setShowBuilder(true);
        } catch {
          // ignore
        }
      }
    }
  }, [versions]);

  // Escape handler for accessible modals
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmDeployOpen) setConfirmDeployOpen(false);
        else if (deleteTarget) setDeleteTarget(null);
        else if (showCopilot) setShowCopilot(false);
        else if (showBuilder) setShowBuilder(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmDeployOpen, deleteTarget, showCopilot, showBuilder]);

  const openNewBuilder = (initialTab = 'quick') => {
    const activeIds = versions.filter((v) => v.is_active).map((v) => v.id);
    const defaultVersion = activeIds[0] || (versions[0]?.id || '');
    setQuickForm((prev) => ({
      ...prev,
      selected_version_id: prev.selected_version_id || defaultVersion,
      ai_provider: globalSettings.default_ai_provider || 'groq',
      openrouter_model:
        globalSettings.default_ai_model ||
        PROVIDER_MODELS[globalSettings.default_ai_provider || 'groq'],
    }));
    setSteps([
      createBlankStep({
        selected_version_ids: activeIds.slice(0, 2),
      }),
    ]);
    setBuilderTab(initialTab);
    setShowBuilder(true);
  };

  const toggleVersion = (stepIndex, id) => {
    setSteps((prev) =>
      prev.map((step, idx) => {
        if (idx !== stepIndex) return step;
        const exists = step.selected_version_ids.includes(id);
        return {
          ...step,
          selected_version_ids: exists
            ? step.selected_version_ids.filter((v) => v !== id)
            : [...step.selected_version_ids, id],
        };
      })
    );
  };

  const updateStep = (index, field, value) => {
    setSteps((prev) =>
      prev.map((step, idx) => {
        if (idx !== index) return step;
        const updated = { ...step, [field]: value };
        if (field === 'ai_provider' && PROVIDER_MODELS[value]) {
          updated.openrouter_model = PROVIDER_MODELS[value];
        }
        return updated;
      })
    );
  };

  const addStep = () => {
    const lastStep = steps[steps.length - 1] || createBlankStep();
    const baseTitle = (steps[0]?.name || 'Experimento').replace(/\s*\(Paso.*$/i, '');
    setSteps((prev) => [
      ...prev,
      createBlankStep({
        name: `${baseTitle} (Paso ${prev.length + 1})`,
        selected_version_ids: [...lastStep.selected_version_ids],
        ai_provider: lastStep.ai_provider,
        openrouter_model: lastStep.openrouter_model,
        system_prompt: lastStep.system_prompt,
        analysis_type: lastStep.analysis_type,
        hypothesis: lastStep.hypothesis,
        onboarding_instructions: lastStep.onboarding_instructions,
        survey_config: JSON.parse(JSON.stringify(lastStep.survey_config || [])),
        maintain_version: true,
      }),
    ]);
  };

  const removeStep = (index) => {
    if (steps.length > 1) {
      setSteps((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const addSurveyQuestion = (stepIndex, type = 'likert') => {
    setSteps((prev) =>
      prev.map((step, idx) => {
        if (idx !== stepIndex) return step;
        const qId = `q_${Date.now().toString(36)}_${step.survey_config.length + 1}`;
        const newQ =
          type === 'likert'
            ? {
                id: qId,
                type: 'likert',
                text: '',
                scale: [1, 2, 3, 4, 5],
                minLabel: 'Totalmente en desacuerdo',
                maxLabel: 'Totalmente de acuerdo',
                reverse: false,
              }
            : type === 'checklist' || type === 'multiple'
            ? {
                id: qId,
                type,
                text: '',
                options: ['Opción A', 'Opción B'],
              }
            : {
                id: qId,
                type: 'text',
                text: '',
              };
        return {
          ...step,
          survey_config: [...step.survey_config, newQ],
        };
      })
    );
  };

  const updateSurveyQuestion = (stepIndex, qIndex, field, value) => {
    setSteps((prev) =>
      prev.map((step, idx) => {
        if (idx !== stepIndex) return step;
        const nextSurvey = step.survey_config.map((q, qi) =>
          qi === qIndex ? { ...q, [field]: value } : q
        );
        return { ...step, survey_config: nextSurvey };
      })
    );
  };

  const removeSurveyQuestion = (stepIndex, qIndex) => {
    setSteps((prev) =>
      prev.map((step, idx) => {
        if (idx !== stepIndex) return step;
        return {
          ...step,
          survey_config: step.survey_config.filter((_, qi) => qi !== qIndex),
        };
      })
    );
  };

  const copyInstrumentFromFirstStep = (stepIndex) => {
    const firstSurvey = steps[0]?.survey_config || [];
    if (firstSurvey.length === 0) {
      setStatusBanner({
        tone: 'verm',
        text: 'El Paso 1 aún no contiene ítems de evaluación para clonar.',
      });
      return;
    }
    setSteps((prev) =>
      prev.map((step, idx) =>
        idx === stepIndex
          ? { ...step, survey_config: JSON.parse(JSON.stringify(firstSurvey)) }
          : step
      )
    );
  };

  const handleQuickDeploy = (e) => {
    e?.preventDefault();
    if (!quickForm.title.trim()) {
      setStatusBanner({
        tone: 'verm',
        text: 'Ingresa un nombre para el experimento.',
      });
      return;
    }
    const versionId = quickForm.selected_version_id || versions[0]?.id;
    if (!versionId) {
      setStatusBanner({
        tone: 'verm',
        text: 'Debes seleccionar o crear al menos un escenario/caso de estudio.',
      });
      return;
    }

    const standardSurvey = [
      { id: 'applicable', text: 'La orientación recibida fue aplicable y útil para la situación planteada.', type: 'likert' },
      { id: 'context_understood', text: 'El asistente comprendió el contexto del caso antes de emitir recomendaciones.', type: 'likert' },
      { id: 'qualitative_feedback', text: '¿Qué aspectos destacarías o mejorarías de la forma de responder del asistente?', type: 'text' },
    ];

    const step1 = createBlankStep({
      name: `${quickForm.title.trim()} — ${quickForm.labelA}`,
      selected_version_ids: [versionId],
      system_prompt: quickForm.promptA,
      ai_provider: quickForm.ai_provider,
      openrouter_model: quickForm.openrouter_model,
      analysis_type: quickForm.analysis_type,
      hypothesis: quickForm.hypothesis,
      maintain_version: true,
      survey_config: quickForm.includeStandardSurvey ? standardSurvey : [],
    });

    const step2 = createBlankStep({
      name: `${quickForm.title.trim()} — ${quickForm.labelB}`,
      selected_version_ids: [versionId],
      system_prompt: quickForm.promptB,
      ai_provider: quickForm.ai_provider,
      openrouter_model: quickForm.openrouter_model,
      analysis_type: quickForm.analysis_type,
      hypothesis: quickForm.hypothesis,
      maintain_version: true,
      survey_config: quickForm.includeStandardSurvey ? standardSurvey : [],
    });

    setSteps([step1, step2]);
    setConfirmDeployOpen(true);
  };

  const requestDeployConfirmation = (e) => {
    e.preventDefault();
    if (steps.some((s) => !s.name.trim() || s.selected_version_ids.length === 0)) {
      setStatusBanner({
        tone: 'verm',
        text: 'Cada paso requiere un nombre y al menos un escenario activo seleccionado.',
      });
      return;
    }
    setConfirmDeployOpen(true);
  };

  const executeCreateCampaign = async () => {
    setDeploying(true);
    try {
      const res = await fetch('/api/admin/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(steps),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'No se pudo desplegar la secuencia');
      }
      setConfirmDeployOpen(false);
      setShowBuilder(false);
      setSteps([]);
      setStatusBanner({
        tone: 'em',
        text: 'Secuencia experimental desplegada correctamente con enlace y código QR activos.',
      });
      await fetchAll();
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `Error al desplegar experimento: ${err.message}`,
      });
    } finally {
      setDeploying(false);
    }
  };

  const confirmDeleteCampaign = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/workshops/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar experimento');
      setDeleteTarget(null);
      setStatusBanner({
        tone: 'em',
        text: `Experimento "${deleteTarget.name}" eliminado del registro.`,
      });
      await fetchAll();
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `No se pudo eliminar: ${err.message}`,
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (w) => {
    try {
      await fetch(`/api/admin/workshops/${w.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !w.is_active }),
      });
      await fetchAll();
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `No se pudo actualizar estado: ${err.message}`,
      });
    }
  };

  const copyUrl = (code) => {
    navigator.clipboard.writeText(`${baseUrl}/session/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2200);
  };

  const handleGenerateProtocol = async (e) => {
    e.preventDefault();
    if (!copilotGoal.trim()) return;
    setCopilotLoading(true);
    setCopilotResult(null);
    try {
      const res = await fetch('/api/admin/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'design',
          goal: copilotGoal.trim(),
          lang: locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en Copiloto de Diseño');
      setCopilotResult(data);
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `Error en Copiloto Experimental: ${err.message}`,
      });
    } finally {
      setCopilotLoading(false);
    }
  };

  const applyCopilotProtocol = async () => {
    if (!copilotResult?.design) return;
    setApplyingCopilot(true);
    try {
      const d = copilotResult.design;
      let targetVersionId = versions.find((v) => v.is_active)?.id || null;

      // Create the tailored case scenario if provided
      if (d.case_title && d.case_content) {
        const existingCase = versions.find((v) => v.title === d.case_title);
        if (existingCase) {
          targetVersionId = existingCase.id;
        } else {
          const vRes = await fetch('/api/admin/versions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: d.case_title,
              system_prompt: d.condition_a_prompt || '',
              case_text: d.case_content,
              description: d.case_content,
              is_active: true,
            }),
          });
          if (vRes.ok) {
            const createdVer = await vRes.json();
            targetVersionId = createdVer.id;
            await fetchAll();
          }
        }
      }

      const selectedIds = targetVersionId ? [targetVersionId] : [];
      const sharedSurvey = Array.isArray(d.survey_config) ? d.survey_config : [];
      const prov = globalSettings.default_ai_provider || 'groq';
      const mod = globalSettings.default_ai_model || PROVIDER_MODELS[prov];

      setSteps([
        createBlankStep({
          name: `${d.title || 'Estudio A/B'} — ${d.condition_a_name || 'Condición A (Base)'}`,
          selected_version_ids: selectedIds,
          ai_provider: prov,
          openrouter_model: mod,
          system_prompt: d.condition_a_prompt || '',
          analysis_type: d.analysis_type || 'preregistrado',
          hypothesis: d.hypothesis || '',
          onboarding_instructions: d.onboarding_instructions || '',
          survey_config: JSON.parse(JSON.stringify(sharedSurvey)),
          maintain_version: false,
        }),
        createBlankStep({
          name: `${d.title || 'Estudio A/B'} — ${d.condition_b_name || 'Condición B (Andamiaje)'}`,
          selected_version_ids: selectedIds,
          ai_provider: prov,
          openrouter_model: mod,
          system_prompt: d.condition_b_prompt || '',
          analysis_type: d.analysis_type || 'preregistrado',
          hypothesis: d.hypothesis || '',
          onboarding_instructions: d.onboarding_instructions || '',
          survey_config: JSON.parse(JSON.stringify(sharedSurvey)),
          maintain_version: true,
        }),
      ]);

      setShowCopilot(false);
      setShowBuilder(true);
      setStatusBanner({
        tone: 'cobalt',
        text: 'Protocolo A/B pre-cargado en el constructor. Revise los parámetros y confirme el despliegue.',
      });
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: `Error al transferir protocolo: ${err.message}`,
      });
    } finally {
      setApplyingCopilot(false);
    }
  };

  const activeVersions = versions.filter((v) => v.is_active);

  if (loading) {
    return (
      <BlueprintPanel codeTag="MOD_03" title="Cargando secuencia de experimentos">
        <p className="font-ui-mono text-xs text-ink-2 py-8 text-center">
          Sincronizando experimentos, cadenas pre/post y métricas en vivo...
        </p>
      </BlueprintPanel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Blueprint Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line-control pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <span className="font-ui-mono text-xs uppercase tracking-wider px-2 py-0.5 border border-line-control bg-paper-subtle text-ink">
              MOD_03 // EXPERIMENTOS Y SECUENCIAS
            </span>
            <MarginNote tone="cobalt" rotate={-1}>
              SECUENCIAS Y QR EN VIVO
            </MarginNote>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight m-0">
            Galería de Experimentos{' '}
            <HandMark type="underline" tone="cobalt">
              A/B y Pre-Post
            </HandMark>
          </h1>
          <p className="font-body text-sm text-ink-2 mt-1 max-w-3xl">
            Configure protocolos experimentales preregistrados o exploratorios, encadene condiciones intra-sujeto y comparta códigos QR de acceso directo para talleres y salas de clase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SplitButton
            variant="secondary"
            iconBox="Compass"
            onClick={() => setShowCopilot(true)}
          >
            Copiloto de diseño
          </SplitButton>
          <SplitButton
            variant="primary"
            iconBox="Plus"
            onClick={() => openNewBuilder('quick')}
          >
            Nuevo Experimento A/B
          </SplitButton>
        </div>
      </header>

      {/* Status Alert Banner */}
      {statusBanner && (
        <div
          role="status"
          className={`p-3 border flex items-center justify-between gap-3 font-ui-mono text-xs ${
            statusBanner.tone === 'verm'
              ? 'bg-vermilion-tint border-vermilion-ink text-vermilion-ink'
              : statusBanner.tone === 'em'
              ? 'bg-emerald-tint border-emerald text-emerald'
              : 'bg-cobalt-tint border-cobalt text-cobalt'
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

      {/* Campaign Gallery */}
      {campaigns.length === 0 ? (
        <BlueprintPanel
          codeTag="EXP_00"
          title="Sin experimentos registrados"
          subtitle="Inicie con el Copiloto de diseño o cree una secuencia manual"
        >
          <div className="py-8 text-center space-y-4">
            <p className="font-body text-sm text-ink-2 max-w-xl mx-auto">
              Aún no existen experimentos activos en esta instancia. Puede diseñar un protocolo A/B completo asistido por criterios expertos o cargar el estudio de referencia ISDDE en Resumen.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <SplitButton variant="secondary" iconBox="Compass" onClick={() => setShowCopilot(true)}>
                Diseñar con el copiloto
              </SplitButton>
              <SplitButton variant="primary" iconBox="Plus" onClick={openNewBuilder}>
                Crear Secuencia Manual
              </SplitButton>
            </div>
          </div>
        </BlueprintPanel>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {campaigns.map((w, idx) => {
            const url = `${baseUrl}/session/${w.share_code}`;
            const m = metrics[w.id] || {};
            const versionNames = (w.selected_version_ids || []).map((vid) => {
              const found = versions.find((ver) => ver.id === vid);
              return found ? found.title : 'Escenario no encontrado';
            });
            const analysisLabel = (w.analysis_type || 'preregistrado').toUpperCase();

            return (
              <BlueprintPanel
                key={w.id}
                codeTag={w.chain_id ? `CADENA · PASO ${w.chain_order || 1}` : `EXP_${String(idx + 1).padStart(2, '0')}`}
                title={w.name}
                subtitle={`Proveedor: ${PROVIDER_LABELS[w.ai_provider] || w.ai_provider || 'OpenRouter'} · Modelo: ${w.openrouter_model || 'Por defecto'}`}
                headerSlot={
                  <div className="flex flex-wrap items-center gap-2">
                    <StatBadge
                      label="Estado"
                      value={w.is_active ? 'ACTIVO' : 'PAUSADO'}
                      variant={w.is_active ? 'em' : 'verm'}
                    />
                    <button
                      type="button"
                      onClick={() => toggleActive(w)}
                      aria-label={w.is_active ? `Pausar ${w.name}` : `Activar ${w.name}`}
                      className="min-h-[44px] px-3 inline-flex items-center gap-1.5 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink"
                    >
                      <CadIcon name={w.is_active ? 'Pause' : 'Play'} size={14} />
                      <span>{w.is_active ? 'Pausar' : 'Activar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(w)}
                      aria-label={`Eliminar ${w.name}`}
                      className="min-h-[44px] min-w-[44px] px-2.5 inline-flex items-center justify-center border border-vermilion-ink bg-vermilion-tint text-vermilion-ink hover:bg-paper"
                    >
                      <CadIcon name="Trash2" size={14} />
                    </button>
                  </div>
                }
                titleBlock={{
                  sheetNumber: `CODE: ${w.share_code}`,
                  status: analysisLabel,
                  rev: w.maintain_version ? 'ESCENARIO FIJO' : 'BALANCEADO A/B',
                  n: `${m.completedSessions || 0}/${m.totalSessions || 0}`,
                  title: w.name,
                  subtitle: `${(w.survey_config || []).length} ítems de encuesta`,
                }}
              >
                <div className="space-y-4">
                  {/* KPI Strip */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-paper-subtle border border-line-control">
                      <div className="font-ui-mono text-xs uppercase text-ink-2">Sesiones</div>
                      <div className="font-stat text-xl font-bold text-ink stat mt-0.5">
                        {m.totalSessions || 0}
                      </div>
                    </div>
                    <div className="p-3 bg-paper-subtle border border-line-control">
                      <div className="font-ui-mono text-xs uppercase text-ink-2">Completadas</div>
                      <div className="font-stat text-xl font-bold text-emerald stat mt-0.5">
                        {m.completedSessions || 0}
                      </div>
                    </div>
                    <div className="p-3 bg-paper-subtle border border-line-control">
                      <div className="font-ui-mono text-xs uppercase text-ink-2">Turnos Totales</div>
                      <div className="font-stat text-xl font-bold text-cobalt stat mt-0.5">
                        {m.totalInteractions || 0}
                      </div>
                    </div>
                  </div>

                  {/* Hypothesis & System Prompt Preview */}
                  {w.hypothesis && (
                    <div className="p-3 bg-paper-subtle border-l-2 border-cobalt text-xs font-body text-ink">
                      <span className="font-ui-mono font-semibold uppercase text-cobalt mr-1.5">
                        Hipótesis declarada:
                      </span>
                      {w.hypothesis}
                    </div>
                  )}

                  <div className="text-xs font-body text-ink-2 space-y-1">
                    <div>
                      <strong className="font-ui-mono uppercase text-ink">Escenarios asignados ({versionNames.length}):</strong>{' '}
                      {versionNames.length > 0 ? versionNames.join(' · ') : 'Ninguno'}
                    </div>
                    <div>
                      <strong className="font-ui-mono uppercase text-ink">System Prompt de Campaña:</strong>{' '}
                      {w.system_prompt
                        ? `${w.system_prompt.slice(0, 140)}${w.system_prompt.length > 140 ? '…' : ''}`
                        : 'Sin override (usa el prompt base del escenario o modo directo)'}
                    </div>
                  </div>

                  {/* QR Code & Participant Entry Link */}
                  {(!w.chain_id || w.chain_order === 1) ? (
                    <div className="p-3 bg-paper-subtle border border-line-control flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="p-2 bg-paper border border-line-control shrink-0">
                        <QRCodeSVG
                          value={url}
                          size={104}
                          bgColor="rgb(255, 253, 247)"
                          fgColor="rgb(31, 29, 26)"
                          level="M"
                          role="img"
                          aria-label={`Código QR de acceso para la campaña ${w.name}`}
                          title={`Código QR para escanear y acceder a la campaña ${w.name}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2 w-full">
                        <div className="font-ui-mono text-xs uppercase font-semibold text-ink">
                          Enlace de ingreso para participantes
                        </div>
                        <div className="p-2 bg-paper border border-line-control font-ui-mono text-xs text-ink break-all">
                          {url}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => copyUrl(w.share_code)}
                            className="min-h-[44px] px-3 inline-flex items-center gap-2 border border-line-control bg-paper hover:bg-paper-muted font-ui-mono text-xs font-semibold text-ink"
                          >
                            <CadIcon name={copiedCode === w.share_code ? 'Check' : 'Copy'} size={14} />
                            <span>
                              {copiedCode === w.share_code ? 'Enlace copiado' : 'Copiar URL de sesión'}
                            </span>
                          </button>
                          <a
                            href={`/session/${w.share_code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[44px] px-3 inline-flex items-center gap-2 border border-cobalt bg-cobalt-tint font-ui-mono text-xs font-semibold text-cobalt hover:underline"
                          >
                            <CadIcon name="ExternalLink" size={14} />
                            <span>Abrir vista estudiante</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-cobalt-tint border border-cobalt font-ui-mono text-xs text-cobalt flex items-center gap-2">
                      <CadIcon name="Link" size={16} />
                      <span>
                        Paso {w.chain_order} de secuencia encadenada: los participantes transitan automáticamente aquí al completar el Paso {w.chain_order - 1}.
                      </span>
                    </div>
                  )}
                </div>
              </BlueprintPanel>
            );
          })}
        </div>
      )}

      {/* Study Design Copilot Modal */}
      {showCopilot && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setShowCopilot(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="copilot-dialog-title"
            className="w-full max-w-3xl my-8 bg-paper border-2 border-ink shadow-hard"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-paper-subtle border-b border-line-control">
              <div className="flex items-center gap-2">
                <CadIcon name="Compass" size={18} className="text-cobalt" />
                <h2
                  id="copilot-dialog-title"
                  className="font-ui-mono text-xs uppercase tracking-wider font-semibold text-ink m-0"
                >
                  COPILOTO DE DISEÑO EXPERIMENTAL
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCopilot(false)}
                aria-label="Cerrar Copiloto de Diseño"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-line-control bg-paper text-ink"
              >
                <CadIcon name="X" size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <form onSubmit={handleGenerateProtocol} className="space-y-4">
                <Field
                  label="Objetivo pedagógico o pregunta de investigación"
                  required
                  help="Describa qué habilidad cognitiva, dilema disciplinar o estrategia de andamiaje desea evaluar experimentalmente."
                >
                  <textarea
                    rows={3}
                    value={copilotGoal}
                    onChange={(e) => setCopilotGoal(e.target.value)}
                    placeholder="Ej.: Evaluar si un tutor con indagación contextual previa (Explore-before-Build) mejora la argumentación causal en ética de ingeniería frente a un asistente de respuesta directa."
                    className="w-full p-3 border border-line-control bg-paper font-body text-sm text-ink"
                  />
                </Field>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCopilotGoal(
                          'Andamiaje socrático Explore-before-Build para depuración conceptual de algoritmos recursivos en primer año de ingeniería'
                        )
                      }
                      className="min-h-[44px] px-3 border border-line-control bg-paper-subtle hover:bg-paper font-ui-mono text-xs text-ink"
                    >
                      Ejemplo: Depuración Socrática CS1
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCopilotGoal(
                          'Mentoría académica con indagación contextual previa para toma de decisiones institucionales en educación superior STEM'
                        )
                      }
                      className="min-h-[44px] px-3 border border-line-control bg-paper-subtle hover:bg-paper font-ui-mono text-xs text-ink"
                    >
                      Ejemplo: Mentoría STEM
                    </button>
                  </div>

                  <SplitButton
                    type="submit"
                    variant="primary"
                    iconBox="Compass"
                    loading={copilotLoading}
                    disabled={!copilotGoal.trim()}
                    onClick={handleGenerateProtocol}
                  >
                    Sintetizar Protocolo A/B
                  </SplitButton>
                </div>
              </form>

              {copilotResult?.design && (
                <div className="border border-line-control bg-paper-subtle p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-control pb-2">
                    <span className="font-ui-mono text-xs font-semibold uppercase text-cobalt">
                      Protocolo Generado: {copilotResult.design.title}
                    </span>
                    <StatBadge
                      label="Fuente"
                      value={copilotResult.source === 'live_llm' ? 'LLM EN VIVO' : 'ARQUITECTO DETERMINISTA'}
                      variant="cobalt"
                    />
                  </div>

                  <div className="text-xs font-body text-ink space-y-2">
                    <p className="m-0">
                      <strong className="font-ui-mono uppercase">Hipótesis falsable:</strong>{' '}
                      {copilotResult.design.hypothesis}
                    </p>
                    <p className="m-0">
                      <strong className="font-ui-mono uppercase">Escenario del caso ({copilotResult.design.case_title}):</strong>{' '}
                      {copilotResult.design.case_content}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-paper border border-line-control">
                      <div className="font-ui-mono text-xs font-semibold uppercase text-ink mb-1">
                        {copilotResult.design.condition_a_name || 'Condición A (Control)'}
                      </div>
                      <pre className="font-ui-mono text-xs text-ink-2 whitespace-pre-wrap m-0">
                        {copilotResult.design.condition_a_prompt}
                      </pre>
                    </div>
                    <div className="p-3 bg-paper border border-cobalt">
                      <div className="font-ui-mono text-xs font-semibold uppercase text-cobalt mb-1">
                        {copilotResult.design.condition_b_name || 'Condición B (Experimental)'}
                      </div>
                      <pre className="font-ui-mono text-xs text-ink whitespace-pre-wrap m-0 max-h-48 overflow-y-auto">
                        {copilotResult.design.condition_b_prompt}
                      </pre>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line-control">
                    <span className="font-ui-mono text-xs text-ink-2">
                      Incluye {(copilotResult.design.survey_config || []).length} ítems (Likert + ítem inverso + lista conductual + pregunta abierta).
                    </span>
                    <SplitButton
                      variant="primary"
                      iconBox="ArrowRight"
                      loading={applyingCopilot}
                      onClick={applyCopilotProtocol}
                    >
                      Cargar en Constructor de Secuencia A/B
                    </SplitButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Step Campaign Builder Modal */}
      {showBuilder && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setShowBuilder(false)}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="builder-dialog-title"
            className="w-full max-w-4xl my-6 bg-paper border-2 border-ink shadow-hard"
            onClick={(e) => e.stopPropagation()}
            onSubmit={requestDeployConfirmation}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-paper-subtle border-b border-line-control sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2
                    id="builder-dialog-title"
                    className="font-ui-mono text-xs uppercase tracking-wider font-semibold text-ink m-0"
                  >
                    CONSTRUCTOR EXPERIMENTAL
                  </h2>
                  <span className="font-ui-mono text-xs px-2 py-0.5 bg-cobalt-tint border border-cobalt text-cobalt font-semibold">
                    {builderTab === 'quick' ? 'MODO RÁPIDO A/B' : `MODO SECUENCIAL (${steps.length} PASOS)`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBuilderTab('quick')}
                    className={`min-h-[44px] px-3 py-1 font-ui-mono text-xs border transition-colors ${
                      builderTab === 'quick'
                        ? 'bg-cobalt text-paper border-cobalt font-semibold shadow-hard'
                        : 'bg-paper text-ink border-line-control hover:bg-paper-subtle'
                    }`}
                  >
                    Modo Rápido A/B
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderTab('advanced')}
                    className={`min-h-[44px] px-3 py-1 font-ui-mono text-xs border transition-colors ${
                      builderTab === 'advanced'
                        ? 'bg-cobalt text-paper border-cobalt font-semibold shadow-hard'
                        : 'bg-paper text-ink border-line-control hover:bg-paper-subtle'
                    }`}
                  >
                    Modo Secuencial Completo
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBuilder(false)}
                aria-label="Cerrar constructor"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-line-control bg-paper text-ink"
              >
                <CadIcon name="X" size={16} />
              </button>
            </div>

            {builderTab === 'quick' ? (
              <div className="p-5 space-y-5">
                {/* Basic Experiment Info */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-7">
                    <Field label="Nombre del Experimento A/B" required help="Ejemplo: Taller CS1 — Socrático vs. Directo">
                      <input
                        type="text"
                        value={quickForm.title}
                        onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                        placeholder="Ej.: Evaluación de Andamiaje en Ética IA"
                        className="w-full px-3 py-2 border border-line-control bg-paper font-body text-sm text-ink min-h-[44px]"
                        required
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-5">
                    <Field label="Caso / Escenario de Estudio" required help="Problema que leerán los estudiantes">
                      <select
                        value={quickForm.selected_version_id}
                        onChange={(e) => setQuickForm({ ...quickForm, selected_version_id: e.target.value })}
                        className="w-full px-3 py-2 border border-line-control bg-paper font-ui-mono text-xs text-ink min-h-[44px]"
                      >
                        {versions.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                {/* Side-by-Side Prompts Comparator */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Condition A */}
                  <div className="p-4 bg-paper border border-line-control space-y-3">
                    <div className="flex items-center justify-between border-b border-line-control pb-2">
                      <span className="font-ui-mono text-xs font-semibold uppercase text-ink">
                        Condición A (Línea Base / Control)
                      </span>
                      <span className="font-ui-mono text-xs px-2 py-0.5 bg-paper-subtle border border-line-control text-ink-2">
                        50% sorteo
                      </span>
                    </div>
                    <Field label="Nombre de la condición" required>
                      <input
                        type="text"
                        value={quickForm.labelA}
                        onChange={(e) => setQuickForm({ ...quickForm, labelA: e.target.value })}
                        className="w-full px-3 py-1.5 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                      />
                    </Field>
                    <Field label="System Prompt Condición A" help="Instrucciones para la IA en el grupo de control">
                      <textarea
                        rows={6}
                        value={quickForm.promptA}
                        onChange={(e) => setQuickForm({ ...quickForm, promptA: e.target.value })}
                        placeholder="Instrucciones de la condición A..."
                        className="w-full p-2.5 border border-line-control bg-paper font-ui-mono text-xs text-ink leading-relaxed"
                      />
                    </Field>
                  </div>

                  {/* Condition B */}
                  <div className="p-4 bg-paper border-2 border-cobalt space-y-3">
                    <div className="flex items-center justify-between border-b border-cobalt pb-2">
                      <span className="font-ui-mono text-xs font-semibold uppercase text-cobalt">
                        Condición B (Experimental / Andamiaje)
                      </span>
                      <span className="font-ui-mono text-xs px-2 py-0.5 bg-cobalt-tint border border-cobalt text-cobalt font-semibold">
                        50% sorteo
                      </span>
                    </div>
                    <Field label="Nombre de la condición" required>
                      <input
                        type="text"
                        value={quickForm.labelB}
                        onChange={(e) => setQuickForm({ ...quickForm, labelB: e.target.value })}
                        className="w-full px-3 py-1.5 border border-cobalt bg-paper font-ui-mono text-xs text-ink font-semibold"
                      />
                    </Field>
                    <Field label="System Prompt Condición B" help="Instrucciones pedagógicas del asistente experimental">
                      <textarea
                        rows={6}
                        value={quickForm.promptB}
                        onChange={(e) => setQuickForm({ ...quickForm, promptB: e.target.value })}
                        placeholder="Instrucciones de la condición B..."
                        className="w-full p-2.5 border border-cobalt bg-paper font-ui-mono text-xs text-ink leading-relaxed"
                      />
                    </Field>
                  </div>
                </div>

                {/* Preconfigured Survey Checkbox */}
                <div className="p-3 bg-paper-subtle border border-line-control flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="include-standard-survey"
                    checked={quickForm.includeStandardSurvey}
                    onChange={(e) => setQuickForm({ ...quickForm, includeStandardSurvey: e.target.checked })}
                    className="w-4 h-4 mt-1 accent-cobalt cursor-pointer"
                  />
                  <div>
                    <label htmlFor="include-standard-survey" className="font-ui-mono text-xs font-semibold text-ink cursor-pointer block">
                      Incluir instrumento breve post-sesión (3 preguntas pre-configuradas)
                    </label>
                    <p className="font-body text-xs text-ink-2 m-0 mt-0.5">
                      Evalúa aplicabilidad percibida (Likert 1-5), comprensión contextual (Likert 1-5) y comentarios cualitativos abiertos.
                    </p>
                  </div>
                </div>

                {/* Progressive Disclosure: Advanced Settings */}
                <div className="border border-line-control bg-paper">
                  <button
                    type="button"
                    onClick={() => setShowQuickAdvanced(!showQuickAdvanced)}
                    className="w-full min-h-[44px] px-4 py-2 flex items-center justify-between text-left font-ui-mono text-xs text-ink hover:bg-paper-subtle transition-colors"
                  >
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <CadIcon name={showQuickAdvanced ? 'ChevronDown' : 'ChevronRight'} size={14} />
                      <span>Opciones Metodológicas Avanzadas (Proveedor LLM, Hipótesis, Régimen)</span>
                    </span>
                    <span className="text-ink-2">
                      {showQuickAdvanced ? 'Ocultar' : 'Configurar'}
                    </span>
                  </button>

                  {showQuickAdvanced && (
                    <div className="p-4 border-t border-line-control bg-paper-subtle space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Field label="Proveedor IA" required>
                            <select
                              value={quickForm.ai_provider}
                              onChange={(e) => {
                                const prov = e.target.value;
                                setQuickForm({
                                  ...quickForm,
                                  ai_provider: prov,
                                  openrouter_model: PROVIDER_MODELS[prov] || quickForm.openrouter_model,
                                });
                              }}
                              className="w-full px-2.5 py-1.5 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                            >
                              <option value="groq">Groq Cloud (LPU ultra-rápida)</option>
                              <option value="openrouter">OpenRouter</option>
                              <option value="openai">OpenAI</option>
                              <option value="anthropic">Anthropic Claude</option>
                              <option value="ollama">Ollama (Local)</option>
                            </select>
                          </Field>
                        </div>
                        <div>
                          <Field label="Modelo" required>
                            <input
                              type="text"
                              value={quickForm.openrouter_model}
                              onChange={(e) => setQuickForm({ ...quickForm, openrouter_model: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                            />
                          </Field>
                        </div>
                        <div>
                          <Field label="Régimen metodológico" required>
                            <select
                              value={quickForm.analysis_type}
                              onChange={(e) => setQuickForm({ ...quickForm, analysis_type: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                            >
                              <option value="preregistrado">PREREGISTRADO (Confirmatorio)</option>
                              <option value="exploratorio">EXPLORATORIO (Piloto)</option>
                            </select>
                          </Field>
                        </div>
                      </div>

                      <Field label="Hipótesis experimental falsable" help="Se incluirá en el reporte de inferencia estadística">
                        <input
                          type="text"
                          value={quickForm.hypothesis}
                          onChange={(e) => setQuickForm({ ...quickForm, hypothesis: e.target.value })}
                          placeholder="Ej.: La condición B generará mayor aplicabilidad y menor fatiga conversacional."
                          className="w-full px-3 py-1.5 border border-line-control bg-paper font-body text-xs text-ink"
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-6">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="border border-line-control bg-paper-subtle p-4 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-control pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-ui-mono text-xs font-bold px-2 py-0.5 bg-ink text-paper">
                          PASO {index + 1}
                        </span>
                        <span className="font-ui-mono text-xs uppercase text-ink-2">
                          {index === 0 ? 'Ingreso Inicial con QR' : 'Transición Encadenada Automática'}
                        </span>
                    </div>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="min-h-[44px] px-3 inline-flex items-center gap-1.5 border border-vermilion-ink bg-vermilion-tint font-ui-mono text-xs text-vermilion-ink"
                      >
                        <CadIcon name="Trash2" size={14} />
                        <span>Quitar paso</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Field label="Nombre del paso / condición" required>
                        <input
                          value={step.name}
                          onChange={(e) => updateStep(index, 'name', e.target.value)}
                          placeholder="Ej.: Estudio Ética IA — Condición A (Base)"
                          className="w-full px-3 border border-line-control bg-paper font-body text-sm text-ink"
                        />
                      </Field>
                    </div>
                    <div>
                      <Field label="Régimen metodológico" required>
                        <select
                          value={step.analysis_type || 'preregistrado'}
                          onChange={(e) => updateStep(index, 'analysis_type', e.target.value)}
                          className="w-full px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                        >
                          <option value="preregistrado">PREREGISTRADO (Confirmatorio)</option>
                          <option value="exploratorio">EXPLORATORIO (Piloto)</option>
                        </select>
                      </Field>
                    </div>
                  </div>

                  {index === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field
                        label="Hipótesis experimental"
                        help="Se incluye en el cajetín de auditoría y en el revisor metodológico."
                      >
                        <textarea
                          rows={2}
                          value={step.hypothesis || ''}
                          onChange={(e) => updateStep(index, 'hypothesis', e.target.value)}
                          placeholder="Ej.: El andamiaje socrático incrementará la aplicabilidad percibida y la densidad causal."
                          className="w-full p-2.5 border border-line-control bg-paper font-body text-xs text-ink"
                        />
                      </Field>
                      <Field
                        label="Instrucciones de Onboarding para estudiantes"
                        help="Mostradas en el Paso 1 del Stepper antes de habilitar el chat."
                      >
                        <textarea
                          rows={2}
                          value={step.onboarding_instructions || ''}
                          onChange={(e) => updateStep(index, 'onboarding_instructions', e.target.value)}
                          placeholder="Instrucciones neutrales sobre qué se espera en la sesión..."
                          className="w-full p-2.5 border border-line-control bg-paper font-body text-xs text-ink"
                        />
                      </Field>
                    </div>
                  )}

                  {/* Scenario selection */}
                  <div>
                    <div className="font-ui-mono text-xs font-semibold uppercase tracking-wider text-ink mb-2">
                      Escenarios / Versiones activas incluidas en el sorteo ({step.selected_version_ids.length} seleccionadas)
                    </div>
                    {activeVersions.length === 0 ? (
                      <p className="font-ui-mono text-xs text-vermilion-ink">
                        No hay escenarios activos. Cree al menos un escenario en &quot;Prompts y A/B&quot; o use el Copiloto de Diseño.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeVersions.map((v) => {
                          const checked = step.selected_version_ids.includes(v.id);
                          return (
                            <label
                              key={v.id}
                              className={`min-h-[44px] px-3 py-2 border flex items-center gap-2.5 cursor-pointer font-body text-xs ${
                                checked
                                  ? 'bg-cobalt-tint border-cobalt text-ink font-semibold'
                                  : 'bg-paper border-line-control text-ink'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleVersion(index, v.id)}
                                className="w-4 h-4 accent-cobalt"
                              />
                              <span className="truncate">{v.title}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Multi-Provider AI Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Proveedor de IA" required>
                      <select
                        value={step.ai_provider}
                        onChange={(e) => updateStep(index, 'ai_provider', e.target.value)}
                        className="w-full px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                      >
                        <option value="groq">Groq Cloud (LPU baja latencia)</option>
                        <option value="openrouter">OpenRouter (Multi-modelo)</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="ollama">Ollama (Inferencia Local)</option>
                      </select>
                    </Field>
                    <Field label="Identificador del modelo" required>
                      <input
                        value={step.openrouter_model}
                        onChange={(e) => updateStep(index, 'openrouter_model', e.target.value)}
                        placeholder={PROVIDER_MODELS[step.ai_provider] || 'llama-3.3-70b-versatile'}
                        className="w-full px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                      />
                    </Field>
                  </div>

                  <Field
                    label="System Prompt de la Condición"
                    help="Deje vacío si desea modo línea base directo (Naive) o heredar el prompt definido dentro del escenario."
                  >
                    <textarea
                      rows={4}
                      value={step.system_prompt || ''}
                      onChange={(e) => updateStep(index, 'system_prompt', e.target.value)}
                      placeholder="Escriba aquí las reglas pedagógicas del asistente para esta condición..."
                      className="w-full p-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                    />
                  </Field>

                  {index > 0 && (
                    <label className="min-h-[44px] px-3 py-2 border border-line-control bg-paper inline-flex items-center gap-2.5 cursor-pointer font-ui-mono text-xs text-ink">
                      <input
                        type="checkbox"
                        checked={Boolean(step.maintain_version)}
                        onChange={(e) => updateStep(index, 'maintain_version', e.target.checked)}
                        className="w-4 h-4 accent-cobalt"
                      />
                      <span>Mantener el mismo escenario asignado al estudiante en el paso anterior (diseño intra-sujeto pareado)</span>
                    </label>
                  )}

                  {/* Post-Session Survey Builder */}
                  <div className="border-t border-dashed border-rule pt-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-ui-mono text-xs font-semibold uppercase text-ink">
                        Instrumento Post-Sesión ({step.survey_config.length} ítems)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => copyInstrumentFromFirstStep(index)}
                            className="min-h-[44px] px-3 inline-flex items-center gap-1.5 border border-cobalt bg-cobalt-tint font-ui-mono text-xs text-cobalt"
                          >
                            <CadIcon name="Copy" size={14} />
                            <span>Copiar instrumento del Paso 1</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => addSurveyQuestion(index, 'likert')}
                          className="min-h-[44px] px-3 inline-flex items-center gap-1.5 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                        >
                          <CadIcon name="Plus" size={14} />
                          <span>Ítem Likert (1-5)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addSurveyQuestion(index, 'checklist')}
                          className="min-h-[44px] px-3 inline-flex items-center gap-1.5 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                        >
                          <CadIcon name="Plus" size={14} />
                          <span>Lista Conductual</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addSurveyQuestion(index, 'text')}
                          className="min-h-[44px] px-3 inline-flex items-center gap-1.5 border border-line-control bg-paper font-ui-mono text-xs text-ink"
                        >
                          <CadIcon name="Plus" size={14} />
                          <span>Pregunta Abierta</span>
                        </button>
                      </div>
                    </div>

                    {step.survey_config.length === 0 ? (
                      <p className="font-ui-mono text-xs text-ink-2 m-0">
                        Sin ítems post-sesión configurados para este paso.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {step.survey_config.map((q, qIndex) => (
                          <div
                            key={q.id || qIndex}
                            className="p-3 bg-paper border border-line-control space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                aria-label={`Tipo de pregunta ${qIndex + 1}`}
                                value={q.type}
                                onChange={(e) => updateSurveyQuestion(index, qIndex, 'type', e.target.value)}
                                className="min-h-[44px] px-2.5 border border-line-control bg-paper-subtle font-ui-mono text-xs text-ink sm:w-44"
                              >
                                <option value="likert">Escala Likert 1–5</option>
                                <option value="checklist">Casillas (Checklist)</option>
                                <option value="multiple">Opción Múltiple</option>
                                <option value="text">Texto Abierto</option>
                              </select>
                              <input
                                aria-label={`Enunciado de pregunta ${qIndex + 1}`}
                                value={q.text}
                                onChange={(e) => updateSurveyQuestion(index, qIndex, 'text', e.target.value)}
                                placeholder="Enunciado del ítem o afirmación observable..."
                                required
                                className="min-h-[44px] flex-1 px-3 border border-line-control bg-paper font-body text-xs text-ink"
                              />
                              <button
                                type="button"
                                onClick={() => removeSurveyQuestion(index, qIndex)}
                                aria-label={`Eliminar pregunta ${qIndex + 1}`}
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-vermilion-ink bg-vermilion-tint text-vermilion-ink"
                              >
                                <CadIcon name="X" size={14} />
                              </button>
                            </div>

                            {q.type === 'likert' && (
                              <label className="min-h-[44px] inline-flex items-center gap-2 font-ui-mono text-xs text-ink-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(q.reverse)}
                                  onChange={(e) =>
                                    updateSurveyQuestion(index, qIndex, 'reverse', e.target.checked)
                                  }
                                  className="w-4 h-4 accent-cobalt"
                                />
                                <span>Ítem codificado inversamente (para control psicométrico en Alfa de Cronbach)</span>
                              </label>
                            )}

                            {(q.type === 'checklist' || q.type === 'multiple') && (
                              <div>
                                <input
                                  aria-label={`Opciones separadas por punto y coma para pregunta ${qIndex + 1}`}
                                  value={(q.options || []).join('; ')}
                                  onChange={(e) =>
                                    updateSurveyQuestion(
                                      index,
                                      qIndex,
                                      'options',
                                      e.target.value
                                        .split(';')
                                        .map((s) => s.trim())
                                        .filter(Boolean)
                                    )
                                  }
                                  placeholder="Opción 1; Opción 2; Opción 3"
                                  className="min-h-[44px] w-full px-3 border border-line-control bg-paper-subtle font-body text-xs text-ink"
                                />
                                <span className="font-ui-mono text-xs text-ink-2">
                                  Separe las opciones con punto y coma (;).
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={addStep}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 border border-dashed border-ink bg-paper-subtle hover:bg-paper font-ui-mono text-xs font-semibold uppercase text-ink"
                >
                  <CadIcon name="Plus" size={14} />
                  <span>Añadir Paso Encadenado (Post-Test / Condición B)</span>
                </button>
              </div>
            </div>
          )}

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-paper-subtle border-t border-line-control sticky bottom-0">
              <button
                type="button"
                onClick={() => setShowBuilder(false)}
                className="min-h-[44px] px-4 border border-line-control bg-paper font-ui-mono text-xs uppercase text-ink"
              >
                Cancelar
              </button>
              {builderTab === 'quick' ? (
                <SplitButton
                  type="button"
                  variant="primary"
                  iconBox="Check"
                  disabled={!quickForm.title.trim()}
                  onClick={handleQuickDeploy}
                >
                  Desplegar Experimento A/B
                </SplitButton>
              ) : (
                <SplitButton
                  type="submit"
                  variant="primary"
                  iconBox="Check"
                  disabled={steps.some((s) => !s.name.trim() || s.selected_version_ids.length === 0)}
                  onClick={requestDeployConfirmation}
                >
                  Revisar y Desplegar Secuencia
                </SplitButton>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Pre-Launch Confirmation Modal */}
      {confirmDeployOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4"
          onClick={() => setConfirmDeployOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-deploy-title"
            className="w-full max-w-lg bg-paper border-2 border-ink shadow-hard p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-cobalt">
              <CadIcon name="ShieldCheck" size={18} />
              <h3 id="confirm-deploy-title" className="font-ui-mono text-xs uppercase font-bold m-0">
                CONFIRMAR DESPLIEGUE DE EXPERIMENTO EN VIVO
              </h3>
            </div>
            <p className="font-body text-sm text-ink m-0">
              Está a punto de activar una secuencia de <strong>{steps.length}</strong> {steps.length === 1 ? 'paso' : 'pasos encadenados'} bajo régimen{' '}
              <strong className="font-ui-mono uppercase">{steps[0]?.analysis_type || 'preregistrado'}</strong>. Se generará un enlace público y código QR para captura de sesiones en vivo o de prueba.
            </p>
            <ul className="font-ui-mono text-xs text-ink-2 space-y-1 pl-4 m-0">
              {steps.map((s, idx) => (
                <li key={idx}>
                  Paso {idx + 1}: {s.name} ({s.ai_provider} · {s.openrouter_model || 'modelo por defecto'} · {s.survey_config.length} ítems)
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-3 pt-2 border-t border-line-control">
              <button
                type="button"
                onClick={() => setConfirmDeployOpen(false)}
                className="min-h-[44px] px-4 border border-line-control bg-paper font-ui-mono text-xs uppercase text-ink"
              >
                Volver a editar
              </button>
              <SplitButton
                variant="primary"
                iconBox="Play"
                loading={deploying}
                onClick={executeCreateCampaign}
              >
                Confirmar y Publicar QR
              </SplitButton>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-campaign-title"
            className="w-full max-w-md bg-paper border-2 border-vermilion-ink shadow-hard p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-vermilion-ink">
              <CadIcon name="AlertTriangle" size={18} />
              <h3 id="delete-campaign-title" className="font-ui-mono text-xs uppercase font-bold m-0">
                CONFIRMAR ELIMINACIÓN DE EXPERIMENTO
              </h3>
            </div>
            <p className="font-body text-sm text-ink m-0">
              ¿Desea eliminar permanentemente <strong>{deleteTarget.name}</strong>? Si pertenece a una cadena, solo se eliminará este paso específico.
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
                onClick={confirmDeleteCampaign}
                className="min-h-[44px] px-4 border border-vermilion-ink bg-vermilion-tint font-ui-mono text-xs font-bold uppercase text-vermilion-ink"
              >
                {deleting ? 'Eliminando…' : 'Eliminar Experimento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
