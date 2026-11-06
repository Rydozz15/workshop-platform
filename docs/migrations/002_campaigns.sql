-- Campaigns & per-condition prompts (run once in the Supabase SQL editor).
-- The app keeps working without this migration: new fields are simply not stored until it is applied.

alter table workshops add column if not exists campaign_name text;
alter table workshops add column if not exists campaign_description text;
alter table workshops add column if not exists consent_required boolean default false;
alter table workshops add column if not exists consent_url text;
alter table workshops add column if not exists onboarding_instructions text;

-- Each condition (row in "versions") can carry its own assistant instructions.
alter table versions add column if not exists system_prompt text;
