/**
 * Supabase database implementation (stub).
 * 
 * To activate:
 * 1. Set DB_PROVIDER=supabase in .env.local
 * 2. Set SUPABASE_URL and SUPABASE_ANON_KEY
 * 3. Run the SQL schema in your Supabase project (see schema.sql)
 * 4. Implement each function below using the Supabase client
 * 
 * npm install @supabase/supabase-js
 */

// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const NOT_IMPLEMENTED = () => {
  throw new Error('Supabase adapter not yet implemented. Set DB_PROVIDER=memory or implement this module.');
};

export const getVersions = NOT_IMPLEMENTED;
export const getVersion = NOT_IMPLEMENTED;
export const createVersion = NOT_IMPLEMENTED;
export const updateVersion = NOT_IMPLEMENTED;
export const deleteVersion = NOT_IMPLEMENTED;

export const getWorkshops = NOT_IMPLEMENTED;
export const getWorkshop = NOT_IMPLEMENTED;
export const getWorkshopByCode = NOT_IMPLEMENTED;
export const createWorkshop = NOT_IMPLEMENTED;
export const updateWorkshop = NOT_IMPLEMENTED;
export const deleteWorkshop = NOT_IMPLEMENTED;

export const getSessions = NOT_IMPLEMENTED;
export const getSession = NOT_IMPLEMENTED;
export const createSession = NOT_IMPLEMENTED;
export const updateSession = NOT_IMPLEMENTED;
export const incrementInteractionCount = NOT_IMPLEMENTED;

export const getMessages = NOT_IMPLEMENTED;
export const createMessage = NOT_IMPLEMENTED;

export const getDashboardMetrics = NOT_IMPLEMENTED;

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
