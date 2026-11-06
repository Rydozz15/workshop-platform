-- Base schema for DB_PROVIDER=supabase (run once in the Supabase SQL editor, then 002_campaigns.sql).
-- NOTE: reconstructed from how lib/db-supabase.js reads and writes each table. Try it on a scratch
-- Supabase project first; the app tolerates missing optional columns, but not missing tables.

create table if not exists versions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  case_content text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  share_code text unique not null,
  selected_version_ids jsonb default '[]'::jsonb,
  openrouter_model text,
  ai_provider text default 'openrouter',
  system_prompt text,
  survey_config jsonb default '[]'::jsonb,
  chain_id text,
  chain_order integer default 1,
  maintain_version boolean default false,
  onboarding_instructions text,
  analysis_type text default 'preregistrado',
  hypothesis text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid references workshops(id) on delete cascade,
  version_id uuid references versions(id),
  participant_name text default 'Anonymous',
  chain_user_id text,
  onboarding_answers jsonb,
  client_metrics jsonb,
  status text default 'active',
  interaction_count integer default 0,
  survey_answers jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  role text not null,
  content text not null,
  metadata jsonb,
  telemetry jsonb,
  created_at timestamptz default now()
);

create table if not exists telemetry (
  id uuid primary key,
  session_id uuid references sessions(id) on delete cascade,
  event_type text,
  t_bot bigint, t_first_key bigint, t_send bigint,
  is_tab_blurred boolean, tab_switches integer, inactive_ms bigint,
  ttft_ms integer, total_ms integer,
  prompt_tokens integer, completion_tokens integer, cost_usd numeric,
  provider text, model text,
  created_at timestamptz default now()
);

create table if not exists settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- The server uses the anon key from trusted API routes only. Keep RLS on and add policies that match
-- your deployment before exposing the project URL publicly.
