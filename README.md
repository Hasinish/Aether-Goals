# Aether Goals

<div align="center">
  <p><strong>A premium, minimalist, mobile-first Progressive Web App (PWA) goal tracker.</strong></p>
  <p>Designed with sleek dark aesthetics, frosted glassmorphism, vibrant progress rings, and NLP deadline parser to help you build discipline and reach your milestones.</p>
</div>

---

## :: Interface Preview

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>[Home Dashboard]</strong></td>
      <td align="center"><strong>[Goals Tracker]</strong></td>
      <td align="center"><strong>[Habits Matrix]</strong></td>
      <td align="center"><strong>[Smart Deadlines]</strong></td>
    </tr>
    <tr>
      <td><img src="./public/screenshots/home.png" width="180" alt="Home Dashboard"/></td>
      <td><img src="./public/screenshots/goals.png" width="180" alt="Goals Tracker"/></td>
      <td><img src="./public/screenshots/habits.png" width="180" alt="Habits Matrix"/></td>
      <td><img src="./public/screenshots/deadlines.png" width="180" alt="Smart Deadlines"/></td>
    </tr>
  </table>
</div>

---

## :: Core Pillars

### 1. [Guest] Guest Sandbox Mode (`/guest`)
* **Instant local playground**: Explore the app without registering or configuring a database.
* **Sync-to-LocalStorage**: Automatic state persistence of goals, habits, progress logs, and deadlines inside `localStorage`.
* **Zero-config walkthrough**: A frosted glass banner lets you "Seed Demo Data" to instantly preview the app's visual potential or "Reset" to a clean slate.

### 2. [Onboard] Progressive Onboarding Path
* **Step-by-step guidance**: Guiding checklist items that walk you through:
  * **Phase 1**: Define a core goal.
  * **Phase 2**: Set a target deadline.
  * **Phase 3**: Establish a daily habit to build consistency.
* **Checklist Progress Pills**: Segmented checklist tracking that dynamically fills as onboarding is finished.

### 3. [NLP] Smart NLP Deadlines (`chrono-node`)
* **Natural language parser**: Type deadlines like `"tomorrow at 5pm"`, `"next Friday"`, or `"June 15th"`.
* **Smart defaults**: If no specific hour is supplied (e.g. `"tomorrow"`), the app defaults the deadline to **11:59 PM** (`23:59`) of that day. Custom hours (e.g. `"at 5pm"`) are fully respected.
* **Urgency-based prioritization**: Priorities are dynamically mapped with colored status lights (Pulsing Red for critical, Yellow for high, Lime Green for normal).

### 4. [Aesthetics] Premium Dark Aesthetics & Micro-interactions
* **Glassmorphic notifications**: Ambient-colored glows and frosted blur effects (`backdrop-filter`) for interactive messages.
* **100-day activity grid**: Beautiful GitHub-inspired 100-day consistency matrix (5x20 grid of circular indicator nodes) for habits.
* **Crossfading video overlays**: Sleek background video loops running inside custom React requestAnimationFrame double-buffering layers to eliminate loop cuts.

### 5. [Sync] Supabase Cloud Sync (Full Mode)
* **Real-time DB sync**: Automatic backup of database profiles, goals, subtasks, habits, and deadlines.
* **Secure auth**: Built-in email auth, signups, and metadata configurations.

---

## :: Technology Stack

* **Front-end / App**: [Next.js 15](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
* **Languages**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) & custom Vanilla CSS design tokens
* **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
* **Natural Language Parsing**: [Chrono-node](https://github.com/wanasit/chrono)
* **PWA Standalone Capabilities**: Web App Manifest & Service Worker shell caching
* **Native Compilation**: [Capacitor CLI](https://capacitorjs.com/) for Android compilation

---

## :: Local Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/Hasinish/Aether-Goals.git
cd Aether-Goals
npm install
```

### 2. Configuration (`.env.local`)
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-anon-key-string
```
*Note: If you leave these variables empty, the app will display a setup assistant prompting config, but you can immediately enter `/guest` to play in sandbox mode.*

### 3. Supabase Migrations
If using Supabase, run the initial migration script in the SQL editor:
[supabase/migrations/001_init_schema.sql](supabase/migrations/001_init_schema.sql)

To enable instant signups, turn off email verification:
* **Supabase Console > Authentication > Providers > Email**.
* Toggle **Confirm email** to **OFF**.

### 4. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:3000/guest`** in your browser.

---

## :: Native Android Compilation (Capacitor)
This project is pre-configured to build a native Android APK using Capacitor:

1. Ensure **OpenJDK 17** (configured in `JAVA_HOME`) and the **Android SDK** (configured in `ANDROID_HOME`) are installed.
2. Compile and export static assets:
   ```bash
   npm run build
   ```
3. Sync assets to the Capacitor Android project:
   ```bash
   npx cap sync android
   ```
4. Build the debug APK via Gradle:
   ```bash
   cd android
   .\gradlew.bat assembleDebug
   ```
   *The output APK will be located at: `android/app/build/outputs/apk/debug/app-debug.apk`*
