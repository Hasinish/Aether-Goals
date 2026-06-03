# Aether Goals

A dark, minimalist, mobile-first goal tracker built as a PWA. Track goals with subtask checklists, stay consistent with daily habit streaks, and manage deadlines with a live countdown — all in one focused interface.

---

## Preview

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>Dashboard</strong></td>
      <td align="center"><strong>Goals</strong></td>
      <td align="center"><strong>Habits</strong></td>
      <td align="center"><strong>Deadlines</strong></td>
    </tr>
    <tr>
      <td><img src="./public/screenshots/home.png" width="180" alt="Dashboard"/></td>
      <td><img src="./public/screenshots/goals.png" width="180" alt="Goals"/></td>
      <td><img src="./public/screenshots/habits.png" width="180" alt="Habits"/></td>
      <td><img src="./public/screenshots/deadlines.png" width="180" alt="Deadlines"/></td>
    </tr>
  </table>
</div>

---

## Features

### Goals & Subtasks
Create goals with a list of subtasks. Each goal card shows an animated progress bar, a completion count (`3/6 tasks`), tags, and a delta badge tracking weekly momentum. Tap a goal to open a detail drawer where you can toggle individual subtasks or edit the goal.

### Daily Habit Streaks
Track daily habits with a tap-to-check-in system. Each habit card shows a circular SVG progress ring, a live streak counter, and a **100-day activity grid** — a 5 × 20 matrix of dots representing your consistency over the past 100 days (same pattern as GitHub's contribution graph). Habits support configurable daily targets (e.g. "do 3 sets").

### Deadline Countdown
Add deadlines with a live countdown timer (`14h 23m left`) displayed prominently. Each deadline card shows priority-coded status lights that pulse based on urgency — red for critical/overdue, yellow for high, lime green for normal. An elapsed time bar fills as the deadline approaches. Deadlines can be toggled complete.

### Natural Language Date Input
Type deadlines in plain English: `"tomorrow at 5pm"`, `"next Friday"`, `"June 15th"`. Powered by `chrono-node`. If no time is specified, the system defaults the deadline to **11:59 PM** of that day.

### Onboarding Guide
On first use, a 3-phase guided checklist walks new users through setup: create a goal → set a deadline → start a habit. The guide shows animated pill progress indicators and disappears once all three actions are complete.

### Guest Sandbox (`/guest`)
The entire app runs locally without any account or database configuration. All data is persisted in `localStorage`. A floating banner at the top exposes two controls: **Seed Demo** (populates realistic dummy goals, habits with 100-day logs, and deadlines) and **Reset** (wipes localStorage and reloads).

### Cloud Sync (Supabase)
For full use, connect a Supabase project for persistent storage across devices. Goals, subtasks, habits, habit logs, deadlines, and user profiles all sync to PostgreSQL with Row Level Security. Auth supports email/password login and signup.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Vanilla CSS tokens |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| NLP | chrono-node |
| PWA | Web App Manifest + Service Worker |
| Native | Capacitor (Android APK) |

---

## Local Setup

### 1. Clone & install
```bash
git clone https://github.com/Hasinish/Aether-Goals.git
cd Aether-Goals
npm install
```

### 2. Environment variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
If these are left empty, the app shows a setup screen. You can skip directly to `/guest` to use it without any config.

### 3. Database migration
In your Supabase project, open the SQL editor and run:
[supabase/migrations/001_init_schema.sql](supabase/migrations/001_init_schema.sql)

To allow instant signups without email verification:
- Supabase Dashboard > Authentication > Providers > Email
- Toggle **Confirm email** OFF

### 4. Run
```bash
npm run dev
```
Open `http://localhost:3000` or go straight to `http://localhost:3000/guest`.

---

## Android Build (Capacitor)

Requires OpenJDK 17 (`JAVA_HOME`) and Android SDK (`ANDROID_HOME`).

```bash
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

Output APK: `android/app/build/outputs/apk/debug/app-debug.apk`
