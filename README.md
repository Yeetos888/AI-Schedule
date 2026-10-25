# Antigravity AI Planner

An intelligent, browser-based personal planner powered by **Groq LLaMA 3.3** for lightning-fast AI features and **Supabase (PostgreSQL)** for cross-device cloud persistence and real-time synchronization.

---

## 🌟 Key Features

- **Full-featured Calendar**: Day, week, and month views powered by FullCalendar with drag-and-drop, color coding, and notes.
- **Smart Task Management**: Categorized by priority (low, med, high), due dates, and completion status.
- **Habit Tracker**: Visual 7-day progress grids, streak tracking, and completion rates.
- **Notes & Ideas**: Markdown-ready note-taking with tag filtering.
- **AI Day Planner**: Converts your open tasks and existing calendar events into an optimized, time-blocked schedule with conflict validation.
- **AI Chat Assistant with Tool Calling**: Converse with your planner to list, add, move, or delete calendar events and tasks with confirmation protection.
- **AI Weekly Summaries & Habit Reflection**: Synthesizes upcoming deadlines and weekly routines into actionable insights.
- **Supabase Cloud Persistence**:
  - Secure PostgreSQL cloud database storage for **ALL** data:
    - Calendar Events
    - Tasks & Todos
    - Habits & Completion Logs
    - Notes & Tags
    - **Full AI Chat History & Tool Execution Logs**
    - **AI Generated Day Plans & Weekly Summaries**
    - User Preferences & Settings
  - Row Level Security (RLS) ensures total privacy (data is tied to `auth.uid()`).
  - Real-time updates across multiple tabs/devices.
  - Local-first architecture: Works offline seamlessly using browser `localStorage` when disconnected.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your keys:
```env
# Groq API Key (https://console.groq.com/keys)
VITE_GROQ_API_KEY="gsk_..."

# Supabase Credentials (https://supabase.com/dashboard -> Project Settings -> API)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
```
*(Note: You can also enter or update both the Groq API Key and Supabase credentials dynamically in the app's Settings & Cloud Sync UI!)*

### 4. Setup Supabase Database
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and open the **SQL Editor**.
2. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
3. All tables, RLS policies, and realtime publications will be configured automatically.

### 5. Run Development Server
```bash
npm run dev
```

### 6. Build for Production
```bash
npm run build
```

---

## 🌐 Deploy to Render (Static Site)

This project is pre-configured with [`render.yaml`](./render.yaml) for zero-config static hosting on Render:

1. Push your repository to GitHub / GitLab.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** → **Static Site** (or **Blueprint**).
3. Connect your repository. Render will automatically detect the settings:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `./dist`
   - **SPA Rewrite Rule**: `/*` → `/index.html`
4. Add your **Environment Variables** in the Render dashboard:
   - `VITE_GROQ_API_KEY`: Your Groq API key
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `NODE_VERSION`: `20`
5. Click **Create Static Site** — your app will deploy in ~1 minute!
