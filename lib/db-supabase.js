/**
 * Supabase database implementation with non-destructive guarantees and
 * schema drift protection.
 *
 * SAFETY INVARIANT: Never issues destructive SQL (DROP, TRUNCATE, unconstrained DELETE).
 * Automatically handles schema drift by falling back to baseline schema when optional
 * columns (e.g. telemetry, metadata) are missing in the remote database.
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('Notice: Supabase credentials are not fully configured in environment.');
  }
}

// Client instantiation with safe dummy values if missing to prevent boot crash
const clientUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const clientKey = supabaseKey || 'placeholder-anon-key';
const supabase = createClient(clientUrl, clientKey);

function isColumnMissingError(error) {
  if (!error) return false;
  // Postgres 42703 = undefined_column
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    (error.message && error.message.toLowerCase().includes('column') && error.message.toLowerCase().includes('does not exist'))
  );
}

function isTableMissingError(error) {
  if (!error) return false;
  // Postgres 42P01 = undefined_table
  return (
    error.code === '42P01' ||
    (error.message && error.message.toLowerCase().includes('relation') && error.message.toLowerCase().includes('does not exist'))
  );
}

// --- VERSIONS ---

export async function getVersions() {
  const { data, error } = await supabase
    .from('versions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getVersion(id) {
  const { data, error } = await supabase
    .from('versions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createVersion(versionData) {
  let { data, error } = await supabase
    .from('versions')
    .insert([{ ...versionData }])
    .select()
    .single();
  if (error && isColumnMissingError(error) && 'system_prompt' in versionData) {
    // Schema not migrated yet (docs/migrations/002_campaigns.sql): retry without the new column.
    const { system_prompt: _omit, ...baseline } = versionData;
    ({ data, error } = await supabase.from('versions').insert([baseline]).select().single());
  }
  if (error) throw error;
  return data;
}

export async function updateVersion(id, versionData) {
  const { data, error } = await supabase
    .from('versions')
    .update({ ...versionData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVersion(id) {
  const { error } = await supabase
    .from('versions')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// --- WORKSHOPS ---

export async function getWorkshops() {
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getWorkshop(id) {
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getWorkshopByCode(code) {
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('share_code', code)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function getNextWorkshopInChain(chainId, order) {
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('chain_id', chainId)
    .eq('chain_order', order)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function createWorkshop({
  name,
  selected_version_ids,
  openrouter_model,
  ai_provider,
  system_prompt,
  survey_config = [],
  chain_id = null,
  chain_order = 1,
  maintain_version = false,
  onboarding_instructions,
  campaign_name,
  campaign_description,
  consent_required,
  consent_url,
  randomize_order,
  final_message,
  show_condition,
}) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let share_code;
  let exists = true;
  while (exists) {
    share_code = '';
    for (let i = 0; i < 6; i++) {
      share_code += chars[Math.floor(Math.random() * chars.length)];
    }
    const { data: existing } = await supabase
      .from('workshops')
      .select('id')
      .eq('share_code', share_code)
      .maybeSingle();
    exists = !!existing;
  }

  const payload = {
    name,
    share_code,
    selected_version_ids: selected_version_ids || [],
    openrouter_model: openrouter_model || process.env.DEFAULT_MODEL || 'meta-llama/llama-3.1-8b-instruct',
    ai_provider: ai_provider || 'openrouter',
    system_prompt: system_prompt || null,
    survey_config,
    chain_id,
    chain_order,
    maintain_version,
    is_active: true,
  };
  // Optional fields are only sent when provided so an unmigrated schema keeps working.
  const optional = { onboarding_instructions, campaign_name, campaign_description, consent_required, consent_url, randomize_order: randomize_order || undefined, final_message, show_condition: show_condition || undefined };
  for (const [k, v] of Object.entries(optional)) {
    if (v !== undefined && v !== null && v !== '') payload[k] = v;
  }

  try {
    const { data, error } = await supabase
      .from('workshops')
      .insert([payload])
      .select()
      .single();
    if (error) {
      if (isColumnMissingError(error)) {
        // Fallback for unmigrated schema
        const baseline = {
          name,
          share_code,
          selected_version_ids: selected_version_ids || [],
          openrouter_model: openrouter_model || 'meta-llama/llama-3.1-8b-instruct',
          ai_provider: ai_provider || 'openrouter',
          system_prompt: system_prompt || null,
          is_active: true,
        };
        const retry = await supabase.from('workshops').insert([baseline]).select().single();
        if (retry.error) throw retry.error;
        return retry.data;
      }
      throw error;
    }
    return data;
  } catch (err) {
    throw err;
  }
}

const CAMPAIGN_COLUMNS = ['campaign_name', 'campaign_description', 'consent_required', 'consent_url', 'randomize_order', 'final_message', 'show_condition'];

export async function updateWorkshop(id, workshopData) {
  let { data, error } = await supabase
    .from('workshops')
    .update(workshopData)
    .eq('id', id)
    .select()
    .single();
  if (error && isColumnMissingError(error)) {
    // Unmigrated schema (docs/migrations/002_campaigns.sql): save everything except the new columns.
    const baseline = Object.fromEntries(
      Object.entries(workshopData).filter(([k]) => !CAMPAIGN_COLUMNS.includes(k))
    );
    ({ data, error } = await supabase.from('workshops').update(baseline).eq('id', id).select().single());
  }
  if (error) throw error;
  return data;
}

export async function deleteWorkshop(id) {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('workshop_id', id);

  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id);
    await supabase.from('messages').delete().in('session_id', sessionIds);
    try {
      await supabase.from('telemetry').delete().in('session_id', sessionIds);
    } catch {
      // Telemetry table may not exist
    }
  }

  await supabase.from('sessions').delete().eq('workshop_id', id);

  const { error } = await supabase.from('workshops').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// --- SESSIONS ---

export async function getSessions(workshopId = null) {
  let query = supabase
    .from('sessions')
    .select('*, workshops(name), versions(title)')
    .order('started_at', { ascending: false });
  if (workshopId) {
    query = query.eq('workshop_id', workshopId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getSession(id) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, workshops(*), versions(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createSession(sessionData) {
  const { data, error } = await supabase
    .from('sessions')
    .insert([{ ...sessionData }])
    .select()
    .single();

  if (error) {
    if (isColumnMissingError(error)) {
      // Strip unmigrated fields (onboarding_answers, client_metrics, chain_position, step_sequence) and retry
      const baseline = {
        workshop_id: sessionData.workshop_id,
        version_id: sessionData.version_id,
        participant_name: sessionData.participant_name || 'Anonymous',
        chain_user_id: sessionData.chain_user_id || null,
        status: sessionData.status || 'active',
        interaction_count: sessionData.interaction_count || 0,
        survey_answers: sessionData.survey_answers || null,
      };
      const retry = await supabase.from('sessions').insert([baseline]).select().single();
      if (retry.error) throw retry.error;
      return retry.data;
    }
    throw error;
  }
  return data;
}

export async function updateSession(id, sessionData) {
  const { data, error } = await supabase
    .from('sessions')
    .update(sessionData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function incrementInteractionCount(id) {
  const { data: session, error: fetchError } = await supabase
    .from('sessions')
    .select('interaction_count')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from('sessions')
    .update({ interaction_count: (session.interaction_count || 0) + 1 })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSession(id) {
  await supabase.from('messages').delete().eq('session_id', id);
  try {
    await supabase.from('telemetry').delete().eq('session_id', id);
  } catch {
    // Non-fatal if telemetry table does not exist
  }

  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getSessionsByChainUserId(chainUserId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, workshops(name, chain_order, survey_config, onboarding_instructions, final_message, show_condition), versions(title)')
    .eq('chain_user_id', chainUserId)
    .order('started_at', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const sessionsWithMessages = await Promise.all(
    data.map(async (session) => {
      const messages = await getMessages(session.id);
      return { ...session, messages };
    })
  );

  return sessionsWithMessages;
}

export async function getLastSessionVersion(chainUserId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('version_id')
    .eq('chain_user_id', chainUserId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? data.version_id : null;
}

// --- MESSAGES ---

export async function getMessages(sessionId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createMessage(messageData) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ ...messageData }])
    .select()
    .single();

  if (error) {
    if (isColumnMissingError(error)) {
      // Strip metadata/telemetry columns if unmigrated
      const baseline = {
        session_id: messageData.session_id,
        role: messageData.role,
        content: messageData.content,
      };
      const retry = await supabase.from('messages').insert([baseline]).select().single();
      if (retry.error) throw retry.error;
      return retry.data;
    }
    throw error;
  }
  return data;
}

// --- TELEMETRY ---

export async function addTelemetry(sessionId, data) {
  const entry = {
    id: randomUUID(),
    session_id: sessionId,
    ...data,
    created_at: new Date().toISOString(),
  };

  try {
    const { data: inserted, error } = await supabase
      .from('telemetry')
      .insert([entry])
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error) || isColumnMissingError(error)) {
        // Table or column doesn't exist yet; log gracefully and return object
        console.warn('Notice: Remote Supabase lacks telemetry table; proceeding gracefully.');
        return { ...entry, simulated: true };
      }
      throw error;
    }
    return inserted;
  } catch (err) {
    console.warn('Telemetry insert caught non-fatal exception:', err.message);
    return { ...entry, simulated: true };
  }
}

export async function getTelemetry(sessionId) {
  try {
    const { data, error } = await supabase
      .from('telemetry')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      if (isTableMissingError(error)) return [];
      throw error;
    }
    return data || [];
  } catch {
    return [];
  }
}

export async function getAllTelemetry() {
  try {
    const { data, error } = await supabase
      .from('telemetry')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      if (isTableMissingError(error)) return [];
      throw error;
    }
    return data || [];
  } catch {
    return [];
  }
}

// --- SETTINGS ---

export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) {
    if (isTableMissingError(error)) {
      return { default_ai_provider: 'groq', default_ai_model: 'llama-3.3-70b-versatile' };
    }
    throw error;
  }
  const settings = {};
  (data || []).forEach((row) => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function updateSetting(key, value) {
  const { data, error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- METRICS ---

export async function getDashboardMetrics(workshopId = null) {
  let sessionsQuery = supabase.from('sessions').select('*');
  if (workshopId) {
    sessionsQuery = sessionsQuery.eq('workshop_id', workshopId);
  }
  const { data: sessions, error: sessionsError } = await sessionsQuery;
  if (sessionsError) throw sessionsError;

  const allSessions = sessions || [];
  const totalSessions = allSessions.length;
  const completedSessions = allSessions.filter((s) => s.status === 'completed').length;
  const activeSessions = allSessions.filter((s) => s.status === 'active').length;
  const totalInteractions = allSessions.reduce((sum, s) => sum + (s.interaction_count || 0), 0);
  const avgInteractions = totalSessions > 0 ? Math.round((totalInteractions / totalSessions) * 10) / 10 : 0;

  const { data: versions } = await supabase.from('versions').select('id, title');
  const versionsMap = {};
  (versions || []).forEach((v) => {
    versionsMap[v.id] = v.title;
  });

  const versionCounts = {};
  allSessions.forEach((s) => {
    const label = versionsMap[s.version_id] || 'Unknown';
    versionCounts[label] = (versionCounts[label] || 0) + 1;
  });

  const recentSessions = [...allSessions]
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    .slice(0, 20)
    .map((s) => ({
      ...s,
      version_title: versionsMap[s.version_id] || 'Unknown',
    }));

  return {
    totalSessions,
    completedSessions,
    activeSessions,
    totalInteractions,
    avgInteractions,
    versionDistribution: versionCounts,
    recentSessions,
  };
}
