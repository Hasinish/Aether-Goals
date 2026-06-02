-- 1. Create profiles table (User Profiles mapped to Supabase auth users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text not null unique constraint username_length check (char_length(username) >= 3),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create goals table
create table if not exists public.goals (
  id text not null primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 3. Create subtasks table
create table if not exists public.subtasks (
  id text not null primary key,
  goal_id text references public.goals(id) on delete cascade,
  title text not null,
  is_complete boolean not null default false,
  sort_order integer not null default 0
);

-- 4. Create habits table
create table if not exists public.habits (
  id text not null primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  tags text[] not null default '{}',
  daily_target integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 5. Create habit_logs table
create table if not exists public.habit_logs (
  id text not null primary key,
  habit_id text references public.habits(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null,
  completions integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint habit_logs_habit_id_log_date_key unique (habit_id, log_date)
);

-- 6. Create deadlines table
create table if not exists public.deadlines (
  id text not null primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  due_date timestamp with time zone not null,
  completed boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.subtasks enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.deadlines enable row level security;

-- Setup Row Level Security policies safely using DO blocks
-- 1. Profiles Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='profiles' AND policyname='Allow everyone to view profiles') THEN
    create policy "Allow everyone to view profiles" on public.profiles for select using (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='profiles' AND policyname='Allow users to insert their own profile') THEN
    create policy "Allow users to insert their own profile" on public.profiles for insert with check (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='profiles' AND policyname='Allow users to update their own profile') THEN
    create policy "Allow users to update their own profile" on public.profiles for update using (auth.uid() = id);
  END IF;
END $$;

-- 2. Goals Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='goals' AND policyname='Allow logged-in users to view their own goals') THEN
    create policy "Allow logged-in users to view their own goals" on public.goals for select using (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='goals' AND policyname='Allow logged-in users to insert their own goals') THEN
    create policy "Allow logged-in users to insert their own goals" on public.goals for insert with check (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='goals' AND policyname='Allow logged-in users to update their own goals') THEN
    create policy "Allow logged-in users to update their own goals" on public.goals for update using (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='goals' AND policyname='Allow logged-in users to delete their own goals') THEN
    create policy "Allow logged-in users to delete their own goals" on public.goals for delete using (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Subtasks Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='subtasks' AND policyname='Allow users to view subtasks linked to their goals') THEN
    create policy "Allow users to view subtasks linked to their goals" on public.subtasks for select using (exists (select 1 from public.goals where goals.id = subtasks.goal_id and goals.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='subtasks' AND policyname='Allow users to insert subtasks linked to their goals') THEN
    create policy "Allow users to insert subtasks linked to their goals" on public.subtasks for insert with check (exists (select 1 from public.goals where goals.id = subtasks.goal_id and goals.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='subtasks' AND policyname='Allow users to update subtasks linked to their goals') THEN
    create policy "Allow users to update subtasks linked to their goals" on public.subtasks for update using (exists (select 1 from public.goals where goals.id = subtasks.goal_id and goals.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='subtasks' AND policyname='Allow users to delete subtasks linked to their goals') THEN
    create policy "Allow users to delete subtasks linked to their goals" on public.subtasks for delete using (exists (select 1 from public.goals where goals.id = subtasks.goal_id and goals.user_id = auth.uid()));
  END IF;
END $$;

-- 4. Habits Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='habits' AND policyname='Allow logged-in users to view their own habits') THEN
    create policy "Allow logged-in users to view their own habits" on public.habits for select using (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='habits' AND policyname='Allow logged-in users to insert their own habits') THEN
    create policy "Allow logged-in users to insert their own habits" on public.habits for insert with check (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='habits' AND policyname='Allow logged-in users to update their own habits') THEN
    create policy "Allow logged-in users to update their own habits" on public.habits for update using (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='habits' AND policyname='Allow logged-in users to delete their own habits') THEN
    create policy "Allow logged-in users to delete their own habits" on public.habits for delete using (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Habit Logs Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='habit_logs' AND policyname='Allow users to view logs connected to their habits') THEN
    create policy "Allow users to view logs connected to their habits" on public.habit_logs for select using (exists (select 1 from public.habits where habits.id = habit_logs.habit_id and habits.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='habit_logs' AND policyname='Allow users to insert logs connected to their habits') THEN
    create policy "Allow users to insert logs connected to their habits" on public.habit_logs for insert with check (habit_logs.user_id = auth.uid() and exists (select 1 from public.habits where habits.id = habit_logs.habit_id and habits.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='habit_logs' AND policyname='Allow users to update logs connected to their habits') THEN
    create policy "Allow users to update logs connected to their habits" on public.habit_logs for update using (exists (select 1 from public.habits where habits.id = habit_logs.habit_id and habits.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='habit_logs' AND policyname='Allow users to delete logs connected to their habits') THEN
    create policy "Allow users to delete logs connected to their habits" on public.habit_logs for delete using (exists (select 1 from public.habits where habits.id = habit_logs.habit_id and habits.user_id = auth.uid()));
  END IF;
END $$;

-- 6. Deadlines Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='deadlines' AND policyname='Allow logged-in users to view their own deadlines') THEN
    create policy "Allow logged-in users to view their own deadlines" on public.deadlines for select using (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='deadlines' AND policyname='Allow logged-in users to insert their own deadlines') THEN
    create policy "Allow logged-in users to insert their own deadlines" on public.deadlines for insert with check (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='deadlines' AND policyname='Allow logged-in users to update their own deadlines') THEN
    create policy "Allow logged-in users to update their own deadlines" on public.deadlines for update using (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename='deadlines' AND policyname='Allow logged-in users to delete their own deadlines') THEN
    create policy "Allow logged-in users to delete their own deadlines" on public.deadlines for delete using (auth.uid() = user_id);
  END IF;
END $$;

-- 7. Create safe remote update RPC function
create or replace function public.update_goal_with_subtasks(
  p_goal_id text,
  p_title text,
  p_tags text[],
  p_sort_order integer,
  p_subtasks jsonb,
  p_deleted_subtask_ids text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.goals
  set title = p_title,
      tags = p_tags,
      sort_order = p_sort_order
  where id = p_goal_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Goal not found or access denied';
  end if;

  delete from public.subtasks
  where id = any(p_deleted_subtask_ids)
    and exists (
      select 1
      from public.goals
      where goals.id = subtasks.goal_id
        and goals.user_id = auth.uid()
    );

  insert into public.subtasks (id, goal_id, title, is_complete, sort_order)
  select
    item->>'id',
    p_goal_id,
    item->>'title',
    coalesce((item->>'is_complete')::boolean, false),
    coalesce((item->>'sort_order')::integer, 0)
  from jsonb_array_elements(p_subtasks) item
  on conflict (id) do update
  set title = excluded.title,
      is_complete = excluded.is_complete,
      sort_order = excluded.sort_order
  where exists (
    select 1
    from public.goals
    where goals.id = subtasks.goal_id
      and goals.user_id = auth.uid()
  );
end;
$$;

grant execute on function public.update_goal_with_subtasks(
  text,
  text,
  text[],
  integer,
  jsonb,
  text[]
) to authenticated;
