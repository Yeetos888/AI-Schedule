# Supabase Setup Guide for AI Schedule

AI Schedule supports seamless hybrid cloud persistence with Supabase. When configured, your calendar events, tasks, habits, and notes are securely backed up and synchronized across devices in real time with Row Level Security (RLS).

---

## 1. Quick Setup (2 Minutes)

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **New Project**, choose an organization and project name (e.g. `ai-planner`), and set a secure database password.
3. Wait ~1-2 minutes for your project to provision.

### Step 2: Run the Database Schema
1. In your Supabase Dashboard, navigate to the **SQL Editor** (terminal icon in the left sidebar).
2. Click **New Query**.
3. Open [`supabase/schema.sql`](./schema.sql), copy its entire content, paste it into the SQL Editor, and click **Run**.
4. You should see `Success. No rows returned`. All 5 tables (`events`, `tasks`, `habits`, `notes`, `user_settings`) and their RLS policies are now active.

### Step 3: Copy Your API Credentials
1. In the Supabase dashboard, go to **Project Settings** (gear icon) -> **API** (or **Data API**).
2. Copy your:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon / public key** (e.g., `eyJh...`)

### Step 4: Add to `.env` or in the App UI
Add the keys to your `.env` file:
```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
```
*Alternatively, you can paste the Supabase URL and Anon Key directly inside the app in **Settings -> Supabase Cloud** or the **Cloud Sync** modal!*

---

## 2. Features

- **Row Level Security (RLS)**: Every row is tied to `auth.uid()`, preventing any cross-user data leakage.
- **Authentication**: Email/password authentication and passwordless magic links are supported right inside the app.
- **Local-First & Offline Resilient**: If you go offline or haven't connected Supabase yet, all planner operations continue to work locally via `localStorage`.
- **One-Click Cloud Sync**: Migrate your existing local tasks, events, habits, and notes up to Supabase in one click.
- **Realtime Sync**: Updates can stream across multiple tabs/devices automatically.
