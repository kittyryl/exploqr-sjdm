-- Run this once in the Supabase project's SQL Editor (Dashboard → SQL Editor
-- → New query) to set up spot ratings & reviews. See lib/supabase.ts and
-- components/spot/SpotReviews.tsx for how the app talks to this table.

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  spot_id text not null,
  device_id text not null,
  name text,
  hearts smallint not null check (hearts between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (spot_id, device_id)
);

create index if not exists reviews_spot_id_idx on reviews (spot_id);

alter table reviews enable row level security;

-- drop-then-create so this whole file can be re-run safely (Postgres has no
-- "create policy if not exists") if it was only partially applied before.

-- Anyone can read reviews — they're public by design (this is what visitors
-- see on a spot's page).
drop policy if exists "Public read access" on reviews;
create policy "Public read access" on reviews
  for select using (true);

-- Anyone can post a review. There's no real auth here (see useDeviceId.ts),
-- so this can't be scoped tighter than "the anon key can insert" — the same
-- honeypot-only trust level the rest of the app's forms already accept.
drop policy if exists "Public insert access" on reviews;
create policy "Public insert access" on reviews
  for insert with check (true);

-- Needed so a visitor re-rating a spot can update their own row instead of
-- failing on the unique(spot_id, device_id) constraint (the app calls
-- .upsert(), which is an insert-or-update). Same caveat as above: device_id
-- is client-supplied and unauthenticated, so this technically permits
-- editing *any* row, not just "your own" — there's no server-side identity
-- to check that against without adding real auth. Deliberately no delete
-- policy: removing a bad review is a manual step in the Supabase table
-- editor, not something exposed to visitors.
drop policy if exists "Public update access" on reviews;
create policy "Public update access" on reviews
  for update using (true) with check (true);
