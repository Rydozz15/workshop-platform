/**
 * Supabase database implementation.
 * 
 * Make sure to run the SQL schema in your Supabase project (see bottom of file)
 * and set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: Supabase credentials are not set.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
  const { data, error } = await supabase
    .from('versions')
    .insert([{ ...versionData }])
    .select()
    .single();
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
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data || null;
}

export async function createWorkshop(workshopData) {
  const { data, error } = await supabase
    .from('workshops')
    .insert([{ ...workshopData }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWorkshop(id, workshopData) {
  const { data, error } = await supabase
    .from('workshops')
    .update(workshopData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkshop(id) {
  const { error } = await supabase
    .from('workshops')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// --- SESSIONS ---

export async function getSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, workshops(name), versions(title)')
    .order('started_at', { ascending: false });
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
  if (error) throw error;
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
  // Read-modify-write for simplicity
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
  if (error) throw error;
  return data;
}

// --- METRICS ---

export async function getDashboardMetrics(workshopId = null) {
  // Fetch all sessions (optionally filtered by workshop)
  let sessionsQuery = supabase.from('sessions').select('*');
  if (workshopId) {
    sessionsQuery = sessionsQuery.eq('workshop_id', workshopId);
  }
  const { data: sessions, error: sessionsError } = await sessionsQuery;
  if (sessionsError) throw sessionsError;

  const allSessions = sessions || [];

  const totalSessions = allSessions.length;
  const completedSessions = allSessions.filter(s => s.status === 'completed').length;
  const activeSessions = allSessions.filter(s => s.status === 'active').length;
  const totalInteractions = allSessions.reduce((sum, s) => sum + (s.interaction_count || 0), 0);
  const avgInteractions = totalSessions > 0 ? Math.round(totalInteractions / totalSessions * 10) / 10 : 0;

  // Fetch all versions for labeling
  const { data: versions } = await supabase.from('versions').select('id, title');
  const versionsMap = {};
  (versions || []).forEach(v => { versionsMap[v.id] = v.title; });

  // Version distribution
  const versionCounts = {};
  allSessions.forEach(s => {
    const label = versionsMap[s.version_id] || 'Unknown';
    versionCounts[label] = (versionCounts[label] || 0) + 1;
  });

  // Recent sessions with version info
  const recentSessions = [...allSessions]
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    .slice(0, 20)
    .map(s => ({
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

/*
-- SQL Schema for Supabase (run in SQL Editor):

CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  case_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  share_code TEXT UNIQUE NOT NULL,
  selected_version_ids JSONB DEFAULT '[]',
  openrouter_model TEXT DEFAULT 'meta-llama/llama-3.1-8b-instruct',
  ai_provider TEXT DEFAULT 'openrouter',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID REFERENCES workshops(id),
  version_id UUID REFERENCES versions(id),
  participant_name TEXT DEFAULT 'Anonymous',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  interaction_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_workshop ON sessions(workshop_id);
CREATE INDEX idx_sessions_version ON sessions(version_id);
CREATE INDEX idx_messages_session ON messages(session_id);
*/
