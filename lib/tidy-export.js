/**
 * Publication-Grade Tidy Data Exports (Wickham, 2014)
 *
 * Implements:
 * - Turn-level export (`tidy_turns.csv` / `.json`)
 * - Session-level export (`tidy_sessions.csv` / `.json`)
 * - Longitudinal pre/post export (`tidy_longitudinal.csv` / `.json`)
 * - Clean CSV serialization (escaped quotes, commas, empty strings for missing data)
 * - Bundled auto-generated Codebook integration
 *
 * Reference: survey_stats.md §6.1, PROJECT.md
 */

import { analyzeConversation, extractEpistemicConnectors, tokenize } from './chat-analytics.js';
import { calculateHakeGain } from './psychometrics.js';
import { generateCodebook, CODEBOOK_SCHEMA } from './codebook.js';
import { canonicalType } from './survey-schema.js';
import { buildWideTable } from './step-evolution.js';

export { generateCodebook, CODEBOOK_SCHEMA };

/**
 * Escapes a cell value for standard CSV compatibility.
 * 
 * @param {any} val - Raw cell value
 * @returns {string} CSV-safe escaped string
 */
export function escapeCsvCell(val) {
  if (val === null || val === undefined) {
    return '';
  }
  if (typeof val === 'boolean') {
    return val ? 'true' : 'false';
  }
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return '';
    return Number.isInteger(val) ? val.toString() : val.toFixed(4).replace(/\.?0+$/, '');
  }
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of objects into standard CSV text.
 * 
 * @param {string[]} headers - Ordered list of column headers
 * @param {object[]} rows - Array of row objects
 * @returns {string} CSV text
 */
export function toCSV(headers, rows) {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map(row => {
    return headers.map(h => escapeCsvCell(row[h])).join(',');
  });
  return [headerLine, ...rowLines].join('\n');
}

/**
 * Generates Turn-Level Tidy Export (`tidy_turns.csv` and JSON).
 *
 * @param {object[]} sessions - Array of session objects with messages array
 * @returns {object} { csv, json, data }
 */
export function generateTidyTurns(sessions = []) {
  const rows = [];
  const headers = [
    'session_id',
    'turn_index',
    'speaker',
    'timestamp',
    'reading_latency_ms',
    'composition_time_ms',
    'norm_reading_ms_per_word',
    'skipped_reading_flag',
    'inactivity_outlier_flag',
    'word_count',
    'prompt_tokens',
    'completion_tokens',
    'cost_usd',
    'causal_connectors_count',
    'adversative_connectors_count',
    'metacognitive_markers_count',
    'content',
  ];

  for (const session of sessions) {
    const sessionId = session.id || session.session_id || '';
    const messages = session.messages || [];

    let lastBotWordCount = 0;
    let turnIndex = 1;

    for (const msg of messages) {
      const content = msg.content || '';
      const words = content.trim().split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const speaker = msg.role || 'user';
      const timestamp = msg.created_at || msg.timestamp || new Date().toISOString();

      let readingLatencyMs = null;
      let compositionTimeMs = null;
      let normReadingMsPerWord = null;
      let skippedReadingFlag = null;
      let inactivityOutlierFlag = null;

      let promptTokens = null;
      let completionTokens = null;
      let costUsd = null;

      let causalCount = null;
      let adversativeCount = null;
      let metacognitiveCount = null;

      if (speaker === 'user') {
        const conns = extractEpistemicConnectors(content, wordCount);
        causalCount = conns.causalCount;
        adversativeCount = conns.adversativeCount;
        metacognitiveCount = conns.metacognitiveCount;

        if (msg.telemetry) {
          const { t_bot, t_first_key, t_send, is_tab_blurred } = msg.telemetry;
          if (t_bot && t_first_key) {
            readingLatencyMs = Math.max(0, t_first_key - t_bot);
            compositionTimeMs = Math.max(0, (t_send || t_first_key) - t_first_key);
            const wordsPrev = Math.max(1, lastBotWordCount);
            normReadingMsPerWord = readingLatencyMs / wordsPrev;
            skippedReadingFlag = normReadingMsPerWord < 100 || (lastBotWordCount > 20 && readingLatencyMs < 800);
            inactivityOutlierFlag = readingLatencyMs > 180000 || !!is_tab_blurred;
          }
        }
      } else if (speaker === 'assistant') {
        lastBotWordCount = wordCount;
        if (msg.telemetry) {
          promptTokens = msg.telemetry.prompt_tokens || null;
          completionTokens = msg.telemetry.completion_tokens || null;
          costUsd = msg.telemetry.cost_usd || null;
        }
      }

      rows.push({
        session_id: sessionId,
        turn_index: turnIndex++,
        speaker,
        timestamp,
        reading_latency_ms: readingLatencyMs,
        composition_time_ms: compositionTimeMs,
        norm_reading_ms_per_word: normReadingMsPerWord,
        skipped_reading_flag: skippedReadingFlag,
        inactivity_outlier_flag: inactivityOutlierFlag,
        word_count: wordCount,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        cost_usd: costUsd,
        causal_connectors_count: causalCount,
        adversative_connectors_count: adversativeCount,
        metacognitive_markers_count: metacognitiveCount,
        content,
      });
    }
  }

  return {
    csv: toCSV(headers, rows),
    json: JSON.stringify(rows, null, 2),
    data: rows,
  };
}

/**
 * Generates Session-Level Tidy Export (`tidy_sessions.csv` and JSON).
 *
 * @param {object[]} sessions - Array of session objects with messages & survey responses
 * @param {object[]} workshops - Optional workshops array for metadata resolution
 * @param {object[]} versions - Optional versions array for metadata resolution
 * @returns {object} { csv, json, data }
 */
export function generateTidySessions(sessions = [], workshops = [], versions = []) {
  const workshopMap = new Map((workshops || []).map(w => [w.id, w]));
  const versionMap = new Map((versions || []).map(v => [v.id, v]));

  // Dynamically identify survey question keys
  const surveyKeys = new Set();
  sessions.forEach(s => {
    const answersObj = s.survey_responses || s.survey_answers;
    if (answersObj && typeof answersObj === 'object') {
      Object.keys(answersObj).forEach(k => surveyKeys.add(`survey_${k}`));
    }
  });
  const sortedSurveyKeys = Array.from(surveyKeys).sort();

  const baseHeaders = [
    'session_id',
    'participant_name',
    'campaign_id',
    'campaign_name',
    'condition',
    'version_id',
    'version_title',
    'chain_user_id',
    'chain_order',
    'chain_position',
    'step_sequence',
    'duration_seconds',
    'student_total_words',
    'bot_total_words',
    'verbal_volume_ratio',
    'student_mlu_w',
    'mattr_25',
    'mattr_50',
    'avg_reading_latency_ms_per_word',
    'skipped_reading_ratio',
    'causal_density_per_100w',
    'adversative_density_per_100w',
    'metacognitive_density_per_100w',
  ];

  const headers = [...baseHeaders, ...sortedSurveyKeys];
  const rows = [];

  for (const session of sessions) {
    const workshop = workshopMap.get(session.workshop_id) || {};
    const version = versionMap.get(session.version_id) || {};

    const messages = session.messages || [];
    const analytics = analyzeConversation(messages);

    const startedTs = session.created_at || session.started_at;
    let durationSeconds = session.duration_seconds || null;
    if (!durationSeconds && startedTs && session.completed_at) {
      durationSeconds = Math.max(0, Math.round((new Date(session.completed_at) - new Date(startedTs)) / 1000));
    }

    const row = {
      session_id: session.id || session.session_id,
      participant_name: session.participant_name || 'Anonymous',
      campaign_id: session.workshop_id || '',
      campaign_name: workshop.name || session.workshop_name || '',
      condition: session.condition || (workshop.chain_order === 2 ? 'B' : version.title && version.title.includes('B') ? 'B' : 'A'),
      version_id: session.version_id || '',
      version_title: version.title || session.version_title || '',
      chain_user_id: session.chain_user_id || '',
      chain_order: session.chain_order || workshop.chain_order || 1,
      // Position in this participant's own order (differs from chain_order when the order is randomized).
      chain_position: session.chain_position || session.chain_order || workshop.chain_order || 1,
      step_sequence: Array.isArray(session.step_sequence)
        ? session.step_sequence.map((id) => workshopMap.get(id)?.name || id).join(' > ')
        : '',
      duration_seconds: durationSeconds,
      student_total_words: analytics.studentWords,
      bot_total_words: analytics.botWords,
      verbal_volume_ratio: analytics.verbalVolumeRatio,
      student_mlu_w: analytics.studentMluW,
      mattr_25: analytics.mattr25,
      mattr_50: analytics.mattr50,
      avg_reading_latency_ms_per_word: analytics.avgReadingLatency,
      skipped_reading_ratio: analytics.skippedReadingRatio,
      causal_density_per_100w: analytics.epistemicConnectors.causalDensity,
      adversative_density_per_100w: analytics.epistemicConnectors.adversativeDensity,
      metacognitive_density_per_100w: analytics.epistemicConnectors.metacognitiveDensity,
    };

    // Attach survey answers
    const answersObj = session.survey_responses || session.survey_answers;
    sortedSurveyKeys.forEach(k => {
      const origKey = k.replace(/^survey_/, '');
      const rawVal = answersObj && answersObj[origKey] !== undefined ? answersObj[origKey] : null;
      row[k] = Array.isArray(rawVal) ? rawVal.join('; ') : rawVal;
    });

    rows.push(row);
  }

  return {
    csv: toCSV(headers, rows),
    json: JSON.stringify(rows, null, 2),
    data: rows,
  };
}

/**
 * Generates Participant-Longitudinal Tidy Export (`tidy_longitudinal.csv` and JSON).
 * Pairs chained Step 1 (Pre/Baseline) and Step 2 (Post/Prompted) sessions by chain_user_id.
 *
 * @param {object[]} sessions - Array of all session records
 * @param {object[]} workshops - Optional workshops array for chain ordering
 * @returns {object} { csv, json, data }
 */
export function generateTidyLongitudinal(sessions = [], workshops = []) {
  const workshopMap = new Map((workshops || []).map(w => [w.id, w]));

  // Group sessions by chain_user_id
  const chainedGroups = new Map();
  for (const s of sessions) {
    const chainId = s.chain_user_id;
    if (chainId) {
      if (!chainedGroups.has(chainId)) chainedGroups.set(chainId, []);
      chainedGroups.get(chainId).push(s);
    }
  }

  const headers = [
    'chain_user_id',
    'participant_name',
    'pre_session_id',
    'post_session_id',
    'pre_score',
    'post_score',
    'hake_gain_g',
    'gain_tier',
    'delta_verbal_volume_ratio',
    'delta_mattr_25',
    'delta_metacognitive_density',
  ];

  const rows = [];

  for (const [chainId, group] of chainedGroups.entries()) {
    if (group.length < 2) continue;

    // Sort by chain_order or started_at / created_at
    group.sort((a, b) => {
      // The participant's own position first (randomized order), then the step order.
      const orderA = a.chain_position || a.chain_order || (workshopMap.get(a.workshop_id)?.chain_order) || 1;
      const orderB = b.chain_position || b.chain_order || (workshopMap.get(b.workshop_id)?.chain_order) || 1;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.created_at || a.started_at) - new Date(b.created_at || b.started_at);
    });

    const preSession = group[0];
    const postSession = group[1];

    const preAnalytics = analyzeConversation(preSession.messages || []);
    const postAnalytics = analyzeConversation(postSession.messages || []);

    // Extract composite or primary survey score if present
    const extractScore = (session) => {
      const answersObj = session.survey_responses || session.survey_answers;
      if (!answersObj) return null;
      // Only scale (likert) answers feed the pre/post score: choices and free text are not numbers.
      const cfg = session.survey_config || session.workshops?.survey_config || [];
      const typeOf = (k) => {
        const q = cfg.find((x) => x.id === k || x.text === k);
        return q ? canonicalType(q.type) : null;
      };
      const vals = Object.entries(answersObj)
        .filter(([k]) => !k.endsWith('__other') && (typeOf(k) === null || typeOf(k) === 'likert'))
        .map(([, v]) => v)
        .map((v) => {
          if (typeof v === 'number' && !isNaN(v)) return v;
          if (typeof v === 'string' && /^[1-7](\.\d+)?$/.test(v.trim())) return parseFloat(v.trim());
          return null;
        })
        .filter((v) => v !== null);
      if (vals.length === 0) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };

    const preScore = extractScore(preSession);
    const postScore = extractScore(postSession);

    let hakeGain = null;
    let gainTier = null;
    if (preScore !== null && postScore !== null) {
      const hake = calculateHakeGain([preScore], [postScore], 5.0);
      hakeGain = hake.gClass;
      gainTier = hake.tier;
    }

    const deltaRvol = postAnalytics.verbalVolumeRatio - preAnalytics.verbalVolumeRatio;
    const deltaMattr = postAnalytics.mattr25 - preAnalytics.mattr25;
    const deltaMeta = postAnalytics.epistemicConnectors.metacognitiveDensity - preAnalytics.epistemicConnectors.metacognitiveDensity;

    rows.push({
      chain_user_id: chainId,
      participant_name: postSession.participant_name || preSession.participant_name || 'Anonymous',
      pre_session_id: preSession.id || preSession.session_id,
      post_session_id: postSession.id || postSession.session_id,
      pre_score: preScore,
      post_score: postScore,
      hake_gain_g: hakeGain,
      gain_tier: gainTier,
      delta_verbal_volume_ratio: deltaRvol,
      delta_mattr_25: deltaMattr,
      delta_metacognitive_density: deltaMeta,
    });
  }

  return {
    csv: toCSV(headers, rows),
    json: JSON.stringify(rows, null, 2),
    data: rows,
  };
}

/**
 * Wide export: one row per participant, one column per question and step (any number of steps).
 * The steps are the workshops of the campaigns the sessions belong to, in step order, so a step
 * nobody has answered yet still gets its columns.
 */
export function generateTidyWide(sessions = [], workshops = [], versions = []) {
  const versionMap = new Map((versions || []).map((v) => [v.id, v.title]));
  const chainIds = new Set();
  const soloIds = new Set();
  for (const s of sessions) {
    const w = (workshops || []).find((x) => x.id === s.workshop_id);
    if (!w) continue;
    if (w.chain_id) chainIds.add(w.chain_id);
    else soloIds.add(w.id);
  }
  const steps = (workshops || [])
    .filter((w) => (w.chain_id ? chainIds.has(w.chain_id) : soloIds.has(w.id)))
    .sort((a, b) => (a.chain_order || 1) - (b.chain_order || 1));
  const { headers, rows } = buildWideTable({
    steps,
    sessions,
    versionTitle: (s) => versionMap.get(s.version_id) || s.version_title || '',
  });
  return { csv: toCSV(headers, rows), json: JSON.stringify(rows, null, 2), data: rows };
}

/**
 * Unified Multi-Level Tidy Export Dispatcher
 *
 * @param {object} payload - { sessions, workshops, versions, level }
 * @returns {object} { csv, json, data, codebook }
 */
export function generateTidyExport({ sessions = [], workshops = [], versions = [], level = 'session' } = {}) {
  let result;
  switch (level) {
    case 'turn':
      result = generateTidyTurns(sessions);
      break;
    case 'longitudinal':
      result = generateTidyLongitudinal(sessions, workshops);
      break;
    case 'wide':
      result = generateTidyWide(sessions, workshops, versions);
      break;
    case 'session':
    default:
      result = generateTidySessions(sessions, workshops, versions);
      break;
  }

  const codebook = generateCodebook();
  return {
    ...result,
    codebook,
  };
}
