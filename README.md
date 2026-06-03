# Aether Goals

**Aether Goals** is a premium, minimalist, mobile-first Progressive Web App (PWA) goal tracker. Designed with sleek dark aesthetics, vibrant color systems, and interactive progress rings, it helps users build discipline and consistency.

---

## ✨ Core Features

### 1. 🛡️ Guest Sandbox Mode (`/guest`)
* **Local-Only Playground**: Test and explore the entire app instantly without signing up or setting up a database.
* **LocalStorage Sync**: Bypasses Supabase completely and syncs your goals, habits, logs, and deadlines to `localStorage`.
* **Reset Walkthrough**: A floating glassmorphic sandbox control bar allows clearing all local storage and reloading the session in one click.

### 2. 🏁 Progressive Onboarding Guided Path
* **Step-by-Step Milestones**: Guides new users through a 3-step onboarding path to reduce empty-slate friction:
  * **Phase 1**: Set your core goal.
  * **Phase 2**: Establish a target deadline.
  * **Phase 3**: Build consistency by starting your first daily habit.
* **Segmented Progress Indicators**: Displays animated checklist progress pills tracking your onboarding status.

### 3. 🧠 Smart NLP Date Parsing (Chrono-Node)
* **Natural Language Deadlines**: Enter deadlines using phrases like `"tomorrow at 5pm"`, `"next Friday"`, or `"June 15th"`.
* **Smart Time Defaulting**: If you specify a date without an explicit hour (e.g. `"tomorrow"` or `"Friday"`), the system automatically defaults the deadline time to **11:59 PM** (`23:59`) of that day. Custom time expressions (e.g. `"at 5pm"`) are fully respected.

### 4. 💎 Premium Aesthetics & Animations
* **Glassmorphic Toast Notifications**: Floating top notifications use frosted glass effects (`backdrop-filter`), status-colored borders, and soft colored ambient glows (lime green for success, red for error, white for info) with high `zIndex` layering.
* **Dynamic Deadlines**: Priority-colored status lights (Pulsing Red for Critical/Overdue, Yellow/Orange for High, Lime Green for Normal) highlight urgency.
* **100-Day Contribution Grid**: Habit cards display a minimalist 100-day activity matrix (5x20 grid of circular nodes) representing your streak consistency.
* **Ambient Backgrounds**: Subtle looping video overlays and smooth gradients.

### 5. ☁️ Supabase Cloud Synchronization
* **Database Persistence**: Automatic synchronization of goals, subtasks, habits, and deadlines.
* **Secure Auth**: Suppoorts password logins, signups, and profiles.

---

## 🚀 Tech Stack
* **Framework**: Next.js 15 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS & Vanilla CSS Design Tokens
* **Database & Auth**: Supabase
* **Natural Language Processing**: Chrono-Node (`chrono-node`)
* **Offline Capable**: Native Service Worker shell caching and PWA Standalone Manifest.

---

## 🛠️ Local Setup Instructions

### 1. Clone the Project
```bash
git clone https://github.com/Hasinish/Aether-Goals.git
cd Aether-Goals
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables (`.env.local`)
Create a `.env.local` file in the root of the project to configure Supabase connectivity:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-anon-key-string
```
*Note: If these variables are not configured, the app will show a Setup Screen prompting you to configure Supabase, or you can go directly to `/guest` to run in the local Sandbox.*

### 4. Supabase Database Migration
Execute the migration SQL script inside your **Supabase Dashboard > SQL Editor** to establish the database schema:
[001_init_schema.sql](supabase/migrations/001_init_schema.sql)

### 5. Disable Email Confirmations
To allow instant user registrations without setting up SMTP:
* In Supabase, go to **Authentication > Providers > Email**.
* Toggle **Confirm email** to **OFF** and click **Save**.

### 6. Run the Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** (or `http://localhost:3000/guest`) in your browser.

---

## ⚡ Deployment to Vercel
1. Push your changes to your Git repository.
2. Link your repository in [Vercel](https://vercel.com).
3. Configure the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.
4. Click **Deploy**.

---

## 📱 Android Compilation via Capacitor
This project supports bundling Next.js static files into a native Android APK:

1. Ensure **OpenJDK 17** (configured in `JAVA_HOME`) and the **Android SDK** (configured in `ANDROID_HOME`) are installed.
2. Compile web assets for static export:
   ```bash
   npm run build
   ```
3. Sync static files to the Android Gradle project:
   ```bash
   npx cap sync android
   ```
4. Build the debug APK:
   ```bash
   cd android
   .\gradlew.bat assembleDebug
   ```
   *The built APK will be located at: `android/app/build/outputs/apk/debug/app-debug.apk`*
