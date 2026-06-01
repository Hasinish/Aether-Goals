# Aether Goals

**Aether Goals** is a premium, minimalist, mobile-first PWA (Progressive Web App) goal tracker. Designed with sleek dark aesthetics, bold typography, and interactive segmented progress meters, it provides highly responsive discipline and milestone tracking.

---

## 🚀 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (Email Login/Signup & OTP Magic Links)
- **Offline / Syncing**: Native Service Worker Caching, PWA Standalone Manifest, and a robust LocalStorage sandbox fallback.

---

## 📋 Prerequisites
Before running or developing, make sure you have the following installed:
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- A **Supabase** account and project (for database syncing).

---

## 🛠️ Setup Instructions

### 1. Clone the Project
Open your shell and clone the codebase:
```bash
git clone https://github.com/Hasinish/Aether-Goals.git
cd Aether-Goals
```

### 2. Install Packages
Restore the application dependencies:
```bash
npm install
```

### 3. Local Environment Variables (`.env.local`)
Create a `.env.local` file in the root of the project to enable Supabase integration:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-anon-key-string
```

*Note: If these variables are not present or configured, Aether automatically boots in **Offline Sandbox Mode** (using browser LocalStorage) so you can test all features instantly.*

### 4. Supabase Database Schema Setup
Execute the following SQL queries inside your **Supabase Dashboard > SQL Editor** to establish the backend database structure and security rules:

```sql
-- 1. Create goals table
create table public.goals (
  id text not null primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.goals enable row level security;

-- Setup secure Row Level Security policies for user goals
create policy "Allow logged-in users to view their own goals" 
  on public.goals for select 
  using (auth.uid() = user_id);

create policy "Allow logged-in users to insert their own goals" 
  on public.goals for insert 
  with check (auth.uid() = user_id);

create policy "Allow logged-in users to update their own goals" 
  on public.goals for update 
  using (auth.uid() = user_id);

create policy "Allow logged-in users to delete their own goals" 
  on public.goals for delete 
  using (auth.uid() = user_id);

create table public.subtasks (
  id text not null primary key,
  goal_id text references public.goals(id) on delete cascade,
  title text not null,
  is_complete boolean not null default false,
  sort_order integer not null default 0
);

-- Enable Row Level Security
alter table public.subtasks enable row level security;

-- Setup Row Level Security policies for subtasks (inherited from goal ownership)
create policy "Allow users to view subtasks linked to their goals" 
  on public.subtasks for select 
  using (
    exists (
      select 1 from public.goals 
      where goals.id = subtasks.goal_id and goals.user_id = auth.uid()
    )
  );

create policy "Allow users to insert subtasks linked to their goals" 
  on public.subtasks for insert 
  with check (
    exists (
      select 1 from public.goals 
      where goals.id = subtasks.goal_id and goals.user_id = auth.uid()
    )
  );

  create policy "Allow users to update subtasks linked to their goals" 
  on public.subtasks for update 
  using (
    exists (
      select 1 from public.goals 
      where goals.id = subtasks.goal_id and goals.user_id = auth.uid()
    )
  );

create policy "Allow users to delete subtasks linked to their goals" 
  on public.subtasks for delete 
  using (
    exists (
      select 1 from public.goals 
      where goals.id = subtasks.goal_id and goals.user_id = auth.uid()
    )
  );
```

-- 3. Create habits table
create table public.habits (
  id text not null primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  tags text[] not null default '{}',
  daily_target integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.habits enable row level security;

-- Setup Row Level Security policies for habits
create policy "Allow logged-in users to view their own habits" 
  on public.habits for select 
  using (auth.uid() = user_id);

create policy "Allow logged-in users to insert their own habits" 
  on public.habits for insert 
  with check (auth.uid() = user_id);

create policy "Allow logged-in users to update their own habits" 
  on public.habits for update 
  using (auth.uid() = user_id);

create policy "Allow logged-in users to delete their own habits" 
  on public.habits for delete 
  using (auth.uid() = user_id);

-- 4. Create habit_logs table
create table public.habit_logs (
  id text not null primary key,
  habit_id text references public.habits(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null,
  completions integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint habit_logs_habit_id_log_date_key unique (habit_id, log_date)
);

-- Enable Row Level Security (RLS)
alter table public.habit_logs enable row level security;

-- Setup Row Level Security policies for habit_logs (tied to habit ownership)
create policy "Allow users to view logs connected to their habits" 
  on public.habit_logs for select 
  using (
    exists (
      select 1 from public.habits 
      where habits.id = habit_logs.habit_id and habits.user_id = auth.uid()
    )
  );

create policy "Allow users to insert logs connected to their habits" 
  on public.habit_logs for insert 
  with check (
    exists (
      select 1 from public.habits 
      where habits.id = habit_logs.habit_id and habits.user_id = auth.uid()
    )
  );

create policy "Allow users to update logs connected to their habits" 
  on public.habit_logs for update 
  using (
    exists (
      select 1 from public.habits 
      where habits.id = habit_logs.habit_id and habits.user_id = auth.uid()
    )
  );

create policy "Allow users to delete logs connected to their habits" 
  on public.habit_logs for delete 
  using (
    exists (
      select 1 from public.habits 
      where habits.id = habit_logs.habit_id and habits.user_id = auth.uid()
    )
  );

-- 5. Create deadlines table
create table public.deadlines (
  id text not null primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  due_date timestamp with time zone not null,
  completed boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.deadlines enable row level security;

-- Setup Row Level Security policies for deadlines
create policy "Allow logged-in users to view their own deadlines" 
  on public.deadlines for select 
  using (auth.uid() = user_id);

create policy "Allow logged-in users to insert their own deadlines" 
  on public.deadlines for insert 
  with check (auth.uid() = user_id);

create policy "Allow logged-in users to update their own deadlines" 
  on public.deadlines for update 
  using (auth.uid() = user_id);

create policy "Allow logged-in users to delete their own deadlines" 
  on public.deadlines for delete 
  using (auth.uid() = user_id);
```

### 4b. Database Migration (For Existing Databases)
If you have an existing database from an older installation, run the following migration segment in your **Supabase SQL Editor** to apply missing tables, columns, and unique constraints safely:

```sql
-- Ensure sort_order column exists on subtasks
ALTER TABLE public.subtasks ADD COLUMN IF NOT EXISTS sort_order integer not null default 0;

-- Create habits table if not exists
CREATE TABLE IF NOT EXISTS public.habits (
  id text not null primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  tags text[] not null default '{}',
  daily_target integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Create habit_logs table if not exists
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id text not null primary key,
  habit_id text references public.habits(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null,
  completions integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Apply unique constraint on habit_logs for (habit_id, log_date) safely if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'habit_logs_habit_id_log_date_key'
  ) THEN
    ALTER TABLE public.habit_logs ADD CONSTRAINT habit_logs_habit_id_log_date_key UNIQUE (habit_id, log_date);
  END IF;
END $$;

-- Create deadlines table if not exists
CREATE TABLE IF NOT EXISTS public.deadlines (
  id text not null primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  due_date timestamp with time zone not null,
  completed boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
```

### 4c. Safe Remote Updates RPC (For Atomic Transactions)
To ensure remote updates are safe from partial failures, run the following SQL segment inside your **Supabase Dashboard > SQL Editor** to establish the update transaction function:

```sql
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
```

### 5. Disable Email Confirmations (No SMTP Required)
If you want users to log in or register instantly without having to verify emails via SMTP setup:
- Navigate to **Authentication > Providers > Email** in your Supabase Dashboard.
- Toggle **Confirm email** to **OFF** (Disabled).
- Click **Save**.

---

## 💻 Running the Development Server
Launch the local development process:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser to view the application.

---

## ⚡ Deployment to Vercel
Deploy your application directly to Vercel:

1. Push your code to your GitHub repository.
2. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
3. Select your repository (`Aether-Goals`).
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will build and distribute your PWA goal tracker with global CDN delivery.
