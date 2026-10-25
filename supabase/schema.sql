-- ==============================================================================
-- AI SCHEDULE - COMPLETE SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Run this complete script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- It stores ALL planner data:
-- 1. Events
-- 2. Tasks
-- 3. Habits & Streaks
-- 4. Notes
-- 5. AI Chat Messages (History, tool calls, tool results)
-- 6. AI Generated Plans & Artifacts (Day plans, weekly summaries, habit reflections)
-- 7. User Settings & Preferences
--
-- All tables are secured with Row Level Security (RLS) linked to auth.uid().
-- Realtime streaming is enabled for immediate multi-device synchronization.
-- ==============================================================================

-- 1. EVENTS TABLE
create table if not exists public.events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_time text not null,
  end_time text not null,
  color text default '#6366f1',
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. TASKS TABLE
create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due text,
  priority text default 'med' check (priority in ('low', 'med', 'high')),
  done boolean default false not null,
  estimate_min integer default 30,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. HABITS TABLE
create table if not exists public.habits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text default 'General',
  logs text[] default '{}'::text[] not null,
  target_days_per_week integer default 7,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. NOTES TABLE
create table if not exists public.notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default 'Untitled Note',
  text text not null default '',
  tags text[] default '{}'::text[] not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. AI CHAT MESSAGES TABLE (Full AI conversation history & tool interactions)
create table if not exists public.chat_messages (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content text not null default '',
  name text,
  tool_call_id text,
  tool_calls jsonb default '[]'::jsonb,
  pending_confirmation jsonb,
  timestamp text not null,
  created_at timestamptz default now() not null
);

-- 6. AI PLANS & ARTIFACTS TABLE (Day plans, weekly summaries, habit reflections)
create table if not exists public.ai_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_type text not null check (plan_type in ('day_plan', 'weekly_summary', 'habit_reflection')),
  data jsonb not null,
  date text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint unique_user_plan_type unique (user_id, plan_type)
);

-- 7. USER SETTINGS TABLE
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  groq_api_key text,
  fast_model text default 'openai/gpt-oss-20b',
  smart_model text default 'openai/gpt-oss-120b',
  working_hours_start text default '09:00',
  working_hours_end text default '18:00',
  timezone text default 'Asia/Kolkata',
  dark_mode boolean default true,
  updated_at timestamptz default now() not null
);

-- Indexes for performance
create index if not exists idx_events_user_id on public.events(user_id);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_habits_user_id on public.habits(user_id);
create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);
create index if not exists idx_ai_plans_user_id on public.ai_plans(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each user can only read, insert, update, and delete their own records
-- ==============================================================================

alter table public.events enable row level security;
alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.notes enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ai_plans enable row level security;
alter table public.user_settings enable row level security;

-- Events Policies
drop policy if exists "Users can select their own events" on public.events;
create policy "Users can select their own events" on public.events
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own events" on public.events;
create policy "Users can insert their own events" on public.events
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own events" on public.events;
create policy "Users can update their own events" on public.events
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own events" on public.events;
create policy "Users can delete their own events" on public.events
  for delete using (auth.uid() = user_id);

-- Tasks Policies
drop policy if exists "Users can select their own tasks" on public.tasks;
create policy "Users can select their own tasks" on public.tasks
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks" on public.tasks
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- Habits Policies
drop policy if exists "Users can select their own habits" on public.habits;
create policy "Users can select their own habits" on public.habits
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own habits" on public.habits;
create policy "Users can insert their own habits" on public.habits
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own habits" on public.habits;
create policy "Users can update their own habits" on public.habits
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own habits" on public.habits;
create policy "Users can delete their own habits" on public.habits
  for delete using (auth.uid() = user_id);

-- Notes Policies
drop policy if exists "Users can select their own notes" on public.notes;
create policy "Users can select their own notes" on public.notes
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notes" on public.notes;
create policy "Users can insert their own notes" on public.notes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notes" on public.notes;
create policy "Users can update their own notes" on public.notes
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes" on public.notes
  for delete using (auth.uid() = user_id);

-- Chat Messages Policies
drop policy if exists "Users can select their own chat messages" on public.chat_messages;
create policy "Users can select their own chat messages" on public.chat_messages
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own chat messages" on public.chat_messages;
create policy "Users can insert their own chat messages" on public.chat_messages
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own chat messages" on public.chat_messages;
create policy "Users can update their own chat messages" on public.chat_messages
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own chat messages" on public.chat_messages;
create policy "Users can delete their own chat messages" on public.chat_messages
  for delete using (auth.uid() = user_id);

-- AI Plans Policies
drop policy if exists "Users can select their own ai plans" on public.ai_plans;
create policy "Users can select their own ai plans" on public.ai_plans
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own ai plans" on public.ai_plans;
create policy "Users can insert their own ai plans" on public.ai_plans
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own ai plans" on public.ai_plans;
create policy "Users can update their own ai plans" on public.ai_plans
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own ai plans" on public.ai_plans;
create policy "Users can delete their own ai plans" on public.ai_plans
  for delete using (auth.uid() = user_id);

-- User Settings Policies
drop policy if exists "Users can select their own settings" on public.user_settings;
create policy "Users can select their own settings" on public.user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert/update their own settings" on public.user_settings;
create policy "Users can insert/update their own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- ==============================================================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'events') then
    alter publication supabase_realtime add table public.events;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'tasks') then
    alter publication supabase_realtime add table public.tasks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'habits') then
    alter publication supabase_realtime add table public.habits;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notes') then
    alter publication supabase_realtime add table public.notes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ai_plans') then
    alter publication supabase_realtime add table public.ai_plans;
  end if;
end $$;
