/**
 * Live status of a campaign for the facilitator: what is happening right now and what needs attention.
 * Pure function so it can be tested without a database.
 */

const MIN = 60 * 1000;
export const STALLED_AFTER_MS = 10 * MIN; // joined but never wrote
export const LONG_OPEN_AFTER_MS = 2 * 60 * MIN;

/**
 * @param {object} args
 * @param {object} args.campaign   from groupCampaigns() (has steps[])
 * @param {object[]} args.versions all versions (conditions)
 * @param {object[]} args.sessions sessions of this campaign's steps
 * @param {boolean} [args.aiIsSimulated] true when no real AI provider key is configured
 * @param {number} [args.now]
 */
export function computeLiveStatus({ campaign, versions = [], sessions = [], aiIsSimulated = false, now = Date.now() }) {
  const versionTitle = new Map(versions.map((v) => [v.id, v.title]));
  const stepName = new Map(campaign.steps.map((s) => [s.id, s.name]));
  const age = (s) => now - new Date(s.started_at).getTime();

  const active = sessions.filter((s) => s.status === 'active');
  const completed = sessions.filter((s) => s.status === 'completed');
  // With a randomized order any step can be a participant's first one, so count them across steps.
  const participants = new Set(
    sessions
      .filter((s) => campaign.randomize_order || s.workshop_id === campaign.steps[0]?.id)
      .map((s) => s.chain_user_id || s.id)
  ).size;
  const totalMessages = sessions.reduce((sum, s) => sum + (s.interaction_count || 0), 0);

  const steps = campaign.steps.map((step) => {
    const mine = sessions.filter((s) => s.workshop_id === step.id);
    const counts = new Map((step.selected_version_ids || []).map((id) => [id, 0]));
    mine.forEach((s) => counts.set(s.version_id, (counts.get(s.version_id) || 0) + 1));
    const conditions = [...counts].map(([id, count]) => ({ id, title: versionTitle.get(id) || 'Condición', count }));
    const values = conditions.map((c) => c.count);
    const total = values.reduce((a, b) => a + b, 0);
    const imbalanced = conditions.length >= 2 && total >= 6 && (Math.max(...values) - Math.min(...values)) / total > 0.34;
    return {
      id: step.id,
      name: step.name,
      order: step.chain_order || 1,
      is_active: step.is_active !== false,
      started: mine.length,
      active: mine.filter((s) => s.status === 'active').length,
      completed: mine.filter((s) => s.status === 'completed').length,
      conditions,
      imbalanced,
    };
  });

  const alerts = [];
  if (aiIsSimulated) {
    alerts.push({
      id: 'ai-simulated',
      severity: 'warning',
      title: 'El asistente está en modo de simulación',
      detail: 'No hay una clave de IA configurada, así que las respuestas son de ejemplo. Configúrala antes de empezar con participantes reales.',
      action: { label: 'Ir a Ajustes', href: '/admin/settings' },
    });
  }
  steps
    .filter((s) => !s.is_active)
    .forEach((s) =>
      alerts.push({
        id: `paused-${s.id}`,
        severity: 'warning',
        title: `El paso "${s.name}" está pausado`,
        detail: 'Nadie puede entrar a este paso mientras esté pausado.',
        action: { label: 'Editar campaña', href: `/admin/campaigns/${encodeURIComponent(campaign.id)}` },
      })
    );
  const stalled = active.filter((s) => !(s.interaction_count > 0) && age(s) > STALLED_AFTER_MS);
  if (stalled.length > 0) {
    alerts.push({
      id: 'stalled',
      severity: 'warning',
      title: `${stalled.length} ${stalled.length === 1 ? 'persona entró' : 'personas entraron'} y no ${stalled.length === 1 ? 'ha escrito' : 'han escrito'}`,
      detail: 'Llevan más de 10 minutos en la sesión sin enviar mensajes. Puede que necesiten ayuda o que tengan un problema de conexión.',
    });
  }
  const longOpen = active.filter((s) => s.interaction_count > 0 && age(s) > LONG_OPEN_AFTER_MS);
  if (longOpen.length > 0) {
    alerts.push({
      id: 'long-open',
      severity: 'info',
      title: `${longOpen.length} ${longOpen.length === 1 ? 'sesión lleva' : 'sesiones llevan'} más de 2 horas abierta${longOpen.length === 1 ? '' : 's'}`,
      detail: 'Probablemente quedaron abiertas sin terminar. Puedes revisarlas en Resultados.',
    });
  }
  steps
    .filter((s) => s.imbalanced)
    .forEach((s) =>
      alerts.push({
        id: `imbalance-${s.id}`,
        severity: 'warning',
        title: `Reparto desigual entre condiciones en "${s.name}"`,
        detail: 'Una condición tiene bastantes más participantes que otra. Si la diferencia sigue creciendo, revisa la configuración del paso.',
      })
    );
  if (sessions.length === 0) {
    alerts.push({
      id: 'no-sessions',
      severity: 'info',
      title: 'Todavía nadie ha entrado',
      detail: `Comparte el código ${campaign.share_code} o proyecta el QR para que los participantes comiencen.`,
    });
  } else if (sessions.length >= 10 && active.length === 0 && completed.length / sessions.length < 0.5) {
    alerts.push({
      id: 'low-completion',
      severity: 'info',
      title: 'Menos de la mitad terminó la actividad',
      detail: 'Revisa en Resultados en qué punto abandonaron para ajustar la actividad.',
    });
  }

  const order = { error: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => order[a.severity] - order[b.severity]);

  const recent = [...sessions]
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    .slice(0, 8)
    .map((s) => ({
      id: s.id,
      participant_name: s.participant_name,
      step_name: stepName.get(s.workshop_id) || '',
      condition: versionTitle.get(s.version_id) || '',
      status: s.status,
      interaction_count: s.interaction_count || 0,
      started_at: s.started_at,
    }));

  return {
    totals: {
      participants,
      sessions: sessions.length,
      active: active.length,
      completed: completed.length,
      avgMessages: sessions.length ? Math.round((totalMessages / sessions.length) * 10) / 10 : 0,
    },
    steps,
    alerts,
    recent,
  };
}
