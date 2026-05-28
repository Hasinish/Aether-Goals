# Aether Goals

**Aether Goals** is a premium, minimalist, mobile-first PWA (Progressive Web App) goal tracker. Designed with sleek dark aesthetics, bold typography, and interactive segmented progress meters, it provides highly responsive discipline and milestone tracking.

---

## 🚀 Tech Stack
- **Framework**: Next.js 14 (App Router)
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
