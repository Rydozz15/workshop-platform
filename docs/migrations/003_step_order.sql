-- Randomized step order per participant (run once in the Supabase SQL editor).
-- Without this migration campaigns still work, but the "randomize order" option is not stored
-- and every participant follows the fixed step order.

-- Campaign option, stored on every step like the other campaign-level fields.
alter table workshops add column if not exists randomize_order boolean default false;

-- The order given to a participant and the position of each of their sessions in it.
alter table sessions add column if not exists chain_position integer;
alter table sessions add column if not exists step_sequence jsonb;
