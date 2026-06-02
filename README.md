# Aether Goals

**Aether Goals** is a premium, minimalist, mobile-first PWA (Progressive Web App) goal tracker. Designed with sleek dark aesthetics, bold typography, and interactive segmented progress meters, it provides highly responsive discipline and milestone tracking.

---

## 🚀 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (Email Login/Signup & OTP Magic Links)
- **Caching**: Native Service Worker shell caching and PWA Standalone Manifest.

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
Create a `.env.local` file in the root of the project to enable Supabase integration. A Supabase project is **strictly required** for user data persistence and login functionality:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-anon-key-string
```

*Note: If these variables are missing, the application will display a configuration-required screen rather than running in an insecure sandbox mode.*

- Supabase is required for user data persistence.
- If env vars are missing, the app shows a configuration-required screen.
- PWA shell caching is supported.
- Offline data editing is not supported.
- Supabase/API data is not cached by the service worker.

---

### 4. Supabase Database Schema Setup
Establish the backend database structure, atomic transaction functions, and Row Level Security rules by executing the migration SQL file located in:
[001_init_schema.sql](supabase/migrations/001_init_schema.sql)

You can copy and run this schema initialization SQL query inside your **Supabase Dashboard > SQL Editor**.

- **Supabase Environment Variables**: The URL and Anon Key are strictly required to persist user milestones and sync check-ins. If missing, the app will redirect to a setup screen.
- **Offline Limitation**: Offline data editing is not supported. Real-time connections are required to update or complete goals, habits, and deadlines safely.

---

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
