-- Habit Tracker schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New Query)
-- It is safe to re-run: every statement uses IF NOT EXISTS or CREATE OR REPLACE where possible.

-- =====================================================================
-- Tables
-- =====================================================================

create table if not exists public.habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  description  text,
  color        text not null default '#6366f1',
  created_at   timestamptz not null default now(),
  archived_at  timestamptz
);

create index if not exists habits_user_id_idx on public.habits(user_id);

create table if not exists public.completions (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid not null references public.habits(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  created_at  timestamptz not null default now(),
  unique (habit_id, date)
);

create index if not exists completions_user_date_idx on public.completions(user_id, date);
create index if not exists completions_habit_date_idx on public.completions(habit_id, date);

create table if not exists public.daily_summaries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  for_date    date not null,
  body        text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, for_date)
);

create index if not exists daily_summaries_user_for_date_idx
  on public.daily_summaries(user_id, for_date desc);

-- =====================================================================
-- Row-Level Security
-- =====================================================================

alter table public.habits          enable row level security;
alter table public.completions     enable row level security;
alter table public.daily_summaries enable row level security;

-- Habits: users see and manage only their own
drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own" on public.habits
  for select using (auth.uid() = user_id);

drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own" on public.habits
  for insert with check (auth.uid() = user_id);

drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own" on public.habits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own" on public.habits
  for delete using (auth.uid() = user_id);

-- Completions: same
drop policy if exists "completions_select_own" on public.completions;
create policy "completions_select_own" on public.completions
  for select using (auth.uid() = user_id);

drop policy if exists "completions_insert_own" on public.completions;
create policy "completions_insert_own" on public.completions
  for insert with check (auth.uid() = user_id);

drop policy if exists "completions_delete_own" on public.completions;
create policy "completions_delete_own" on public.completions
  for delete using (auth.uid() = user_id);

-- Daily summaries: users can READ their own, but only the service role writes
drop policy if exists "summaries_select_own" on public.daily_summaries;
create policy "summaries_select_own" on public.daily_summaries
  for select using (auth.uid() = user_id);

-- =====================================================================
-- Helper view: streak per habit
-- =====================================================================
-- A SQL view that returns the current streak (consecutive days ending today)
-- for every habit the calling user owns. Used by the dashboard.
--
-- Implementation: gap-and-island via row_number difference.

create or replace view public.habit_streaks as
with daily as (
  select
    c.habit_id,
    c.user_id,
    c.date,
    c.date - (row_number() over (partition by c.habit_id order by c.date))::int as grp
  from public.completions c
),
groups as (
  select habit_id, user_id, grp, max(date) as last_day, count(*)::int as len
  from daily
  group by habit_id, user_id, grp
)
select
  habit_id,
  user_id,
  coalesce(max(len) filter (where last_day = current_date), 0) as current_streak,
  coalesce(max(len), 0) as longest_streak
from groups
group by habit_id, user_id;

-- The view inherits RLS from completions, so each user sees only their own rows.
