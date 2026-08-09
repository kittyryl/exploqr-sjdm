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

-- Feedback photo attachments. The browser uploads directly to this bucket
-- (see components/home/FeedbackForm.tsx) and the resulting public URLs are
-- emailed through Web3Forms — Web3Forms' own file attachments are a paid
-- feature, and this reuses the Supabase project we already have.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-photos', 'feedback-photos', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read: the emailed links must open without a login.
drop policy if exists "Public read feedback photos" on storage.objects;
create policy "Public read feedback photos" on storage.objects
  for select using (bucket_id = 'feedback-photos');

-- Public insert: same unauthenticated trust level as the reviews table
-- above. The bucket's own MIME allow-list and 5MB ceiling are the real
-- guard, plus random UUID filenames so nothing is enumerable. Deliberately
-- no update or delete policy — cleanup is a manual dashboard step.
drop policy if exists "Public upload feedback photos" on storage.objects;
create policy "Public upload feedback photos" on storage.objects
  for insert with check (bucket_id = 'feedback-photos');
