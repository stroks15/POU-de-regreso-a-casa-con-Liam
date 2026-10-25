create table if not exists public.highscores (
  id uuid primary key default gen_random_uuid(),
  score int4 not null check (score >= 0 and score <= 100000000),
  device_info text not null default 'unknown' check (char_length(device_info) <= 240),
  created_at timestamptz not null default now()
);

alter table public.highscores enable row level security;

drop policy if exists "Anyone can submit a valid score" on public.highscores;
create policy "Anyone can submit a valid score"
on public.highscores for insert
to anon, authenticated
with check (
  score >= 0
  and score <= 100000000
  and char_length(device_info) <= 240
);

drop policy if exists "Public can view leaderboard" on public.highscores;
create policy "Public can view leaderboard"
on public.highscores for select
to anon, authenticated
using (true);

grant insert, select on public.highscores to anon, authenticated;
