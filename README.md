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

---

## 📱 Android APK via Capacitor

This project utilizes **Capacitor** to compile the exported Next.js static web assets into a real, installable Android APK running within a native Android WebView container.

> [!IMPORTANT]
> - **No Fake APK Files**: Serving placeholder or simulated `.apk` text files is strictly forbidden. 
> - **PWA Separated**: This native build pipeline is independent of browser-level PWA install flows.

### Prerequisites & Dependencies
To compile the APK locally, you must install:
1. **Java JDK** (e.g., OpenJDK 17 or Adoptium) and ensure the `JAVA_HOME` environment variable is configured.
2. **Android SDK** (Android Studio command-line tools or full IDE setup) with `ANDROID_HOME` configured.

### Build Instructions

1. **Configure Next.js Static Export**:
   Make sure `next.config.mjs` has `output: "export"` configured.

2. **Compile Static Web Assets**:
   ```bash
   npm run build
   ```
   This generates the static code distribution inside the `out/` directory.

3. **Synchronize Web Assets to Android**:
   ```bash
   npx cap sync android
   ```

4. **Build the Debug APK**:
   Using Gradle CLI (Windows):
   ```powershell
   cd android
   .\gradlew.bat assembleDebug
   ```
   Using Gradle CLI (macOS/Linux):
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   Or open the project inside Android Studio:
   ```bash
   npx cap open android
   ```
   And select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

5. **Output APK Path**:
   The generated debug APK is located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Supabase Integration & Authentication in APK

- **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be configured at build time in `.env.local` to enable WebView database syncing.
- **Email & Password Login**: Fully supported. Session persistence is managed natively within the WebView.
- **Magic Link, OAuth, and Password Resets**: Currently **unsupported/untested** inside the APK, as they require configuring Android intent filters and deep-linking rules (`aethergoals://auth/callback`). Do not use these flows inside the Android app wrapper until deep links are set up.

---

### Release & App Hosting
- **Release Signing**: For production/Play Store builds, you must generate a release signing key and run `.\gradlew.bat bundleRelease` to build an AAB.
- **DO NOT commit** keystore files or signing credentials to git.
- **Web App Download Link**: The "Download APK" button on the web landing page reads the target hosting URL from the `NEXT_PUBLIC_ANDROID_APK_URL` environment variable. Ensure this is configured on your production hosting server.
