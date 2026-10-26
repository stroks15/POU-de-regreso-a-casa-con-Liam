create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_level integer not null default 1 check (current_level between 1 and 24),
  high_score integer not null default 0 check (high_score between 0 and 100000000),
  total_time_played integer not null default 0 check (total_time_played >= 0),
  updated_at timestamptz not null default now()
);
create index if not exists user_progress_updated_at_idx on public.user_progress (updated_at desc);
alter table public.user_progress enable row level security;
drop policy if exists "Users can read their own Pou progress" on public.user_progress;
create policy "Users can read their own Pou progress" on public.user_progress for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert their own Pou progress" on public.user_progress;
create policy "Users can insert their own Pou progress" on public.user_progress for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own Pou progress" on public.user_progress;
create policy "Users can update their own Pou progress" on public.user_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.user_progress to authenticated;
