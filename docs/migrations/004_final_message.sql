-- Final message and condition visibility for participants (run once in the Supabase SQL editor).
-- Without this migration campaigns still work, but the final message is not stored and the
-- participant recap never shows the condition.

-- Campaign-level options, stored on every step like the other campaign fields.
alter table workshops add column if not exists final_message text;
alter table workshops add column if not exists show_condition boolean default false;
