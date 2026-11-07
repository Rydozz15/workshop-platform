/**
 * Live status of a campaign for the facilitator: what is happening right now and what needs attention.
 * Pure function so it can be tested without a database.
 */

const MIN = 60 * 1000;

/**
 * Every alert text is a Spanish source string with {placeholders}. An alert carries the filled-in text
 * (title/detail, for API consumers and tests) plus the source keys and params so the screen can translate it:
 * tr(alert.titleKey, alert.params). The keys are listed in ALERT_TEXT_KEYS for the i18n test.
 */
const T = {
  simTitle: 'El asistente está en modo de simulación',
  simDetail: 'No hay una clave de IA configurada, así que las respuestas son de ejemplo. Configúrala antes de empezar con participantes reales.',
  settings: 'Ir a Ajustes',
  pausedTitle: 'El paso "{name}" está pausado',
  pausedDetail: 'Nadie puede entrar a este paso mientras esté pausado.',
  editCampaign: 'Editar campaña',
  stalledOne: '1 persona entró y no ha escrito',
  stalledMany: '{n} personas entraron y no han escrito',
  stalledDetail: 'Llevan más de 10 minutos en la sesión sin enviar mensajes. Puede que necesiten ayuda o que tengan un problema de conexión.',
  longOne: '1 sesión lleva más de 2 horas abierta',
  longMany: '{n} sesiones llevan más de 2 horas abiertas',
  longDetail: 'Probablemente quedaron abiertas sin terminar. Puedes revisarlas en Resultados.',
  imbalanceTitle: 'Reparto desigual entre condiciones en "{name}"',
  imbalanceDetail: 'Una condición tiene bastantes más participantes que otra. Si la diferencia sigue creciendo, revisa la configuración del paso.',
  noneTitle: 'Todavía nadie ha entrado',
  noneDetail: 'Comparte el código {code} o proyecta el QR para que los participantes comiencen.',
  lowTitle: 'Menos de la mitad terminó la actividad',
  lowDetail: 'Revisa en Resultados en qué punto abandonaron para ajustar la actividad.',
};
export const ALERT_TEXT_KEYS = Object.values(T);

const fill = (text, params) => (params ? text.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m)) : text);
const alert = ({ id, severity, title, detail, params, action }) => ({
  id,
  severity,
  title: fill(title, params),
  detail: fill(detail, params),
  titleKey: title,
  detailKey: detail,
  params: params || null,
  ...(action ? { action: { ...action, labelKey: action.label } } : {}),
});
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
    alerts.push(
      alert({ id: 'ai-simulated', severity: 'warning', title: T.simTitle, detail: T.simDetail, action: { label: T.settings, href: '/admin/settings' } })
    );
  }
  steps
    .filter((s) => !s.is_active)
    .forEach((s) =>
      alerts.push(
        alert({
          id: `paused-${s.id}`,
          severity: 'warning',
          title: T.pausedTitle,
          detail: T.pausedDetail,
          params: { name: s.name },
          action: { label: T.editCampaign, href: `/admin/campaigns/${encodeURIComponent(campaign.id)}` },
        })
      )
    );
  const stalled = active.filter((s) => !(s.interaction_count > 0) && age(s) > STALLED_AFTER_MS);
  if (stalled.length > 0) {
    alerts.push(
      alert({ id: 'stalled', severity: 'warning', title: stalled.length === 1 ? T.stalledOne : T.stalledMany, detail: T.stalledDetail, params: { n: stalled.length } })
    );
  }
  const longOpen = active.filter((s) => s.interaction_count > 0 && age(s) > LONG_OPEN_AFTER_MS);
  if (longOpen.length > 0) {
    alerts.push(
      alert({ id: 'long-open', severity: 'info', title: longOpen.length === 1 ? T.longOne : T.longMany, detail: T.longDetail, params: { n: longOpen.length } })
    );
  }
  steps
    .filter((s) => s.imbalanced)
    .forEach((s) =>
      alerts.push(alert({ id: `imbalance-${s.id}`, severity: 'warning', title: T.imbalanceTitle, detail: T.imbalanceDetail, params: { name: s.name } }))
    );
  if (sessions.length === 0) {
    alerts.push(alert({ id: 'no-sessions', severity: 'info', title: T.noneTitle, detail: T.noneDetail, params: { code: campaign.share_code } }));
  } else if (sessions.length >= 10 && active.length === 0 && completed.length / sessions.length < 0.5) {
    alerts.push(alert({ id: 'low-completion', severity: 'info', title: T.lowTitle, detail: T.lowDetail }));
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
