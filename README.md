<div align="center">

# ⚡ AI Schedule & Smart Planner
### An Intelligent Day Planner & Life OS Powered by Groq AI & Supabase Cloud

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-ai--schedule--dnv6.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://ai-schedule-dnv6.onrender.com)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Yeetos888%2FAI--Schedule-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Yeetos888/AI-Schedule)
[![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Groq](https://img.shields.io/badge/AI_Inference-Groq_LLaMA_3.3-F05A28?style=for-the-badge)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br />

<p align="center">
  <a href="https://ai-schedule-dnv6.onrender.com" target="_blank">
    <img src="https://img.shields.io/badge/VIEW_LIVE_DEMO-4F46E5?style=for-the-badge&logo=googlechrome&logoColor=white" alt="View Live Demo" height="40"/>
  </a>
</p>

<p align="center">
  <b>AI Schedule</b> seamlessly blends a full-featured calendar, todo manager, habit tracker, and notes system with cutting-edge <b>Groq LLaMA 3.3 AI</b>. Everything is persistently stored in <b>Supabase PostgreSQL</b> with Row Level Security (RLS) and real-time syncing.
</p>

</div>

---

## 👥 Project Team

<div align="center">

| Role | Name | Profile / Contact |
|---|---|---|
| **Developer** | **Amaan** | [@Yeetos888](https://github.com/Yeetos888) |
| **Mentor** | **Mohd Ismail** | Project Mentorship & Guidance |

</div>

---

## 🌟 Key Features

### 📅 1. Interactive Calendar (FullCalendar)
- Day, Week, and Month views with smooth animations.
- Drag-and-drop event rescheduling, duration resizing, custom color coding, and detailed markdown notes.

### 📋 2. Smart Task Management
- Prioritize tasks (`High`, `Med`, `Low`) with estimated completion times (minutes).
- Due date tracking and one-click completion toggling with celebratory confetti effects.

### 🔥 3. Habit Tracker & Streaks
- Visual 7-day completion matrices for tracking routines (wellness, health, reading, etc.).
- Real-time weekly streak calculations and consistency tracking.

### 📝 4. Scratchpad Notes
- Tagged personal notes with markdown formatting, instant search, and real-time edits.

### 🤖 5. AI Day Planner & Conflict Resolver
- Groq-powered day planning: converts your open tasks and calendar events into an optimized, conflict-free time-blocked schedule within working hours.
- Automatic overlap detection and working-hours enforcement.

### 💬 6. Conversational AI Assistant (Function Calling)
- Real-time conversational agent capable of inspecting and modifying your planner directly via tool calls:
  - `list_events`, `create_event`, `move_event`, `delete_event`
  - `list_tasks`, `create_task`, `toggle_task`, `delete_task`
- Safety confirmations guard all destructive operations (e.g., deleting or moving events).

### ☁️ 7. Supabase Cloud Sync (PostgreSQL + RLS)
- **Zero-Data-Loss Local-First**: Operates seamlessly in the browser via `localStorage` even when offline.
- **Full Cloud Persistence**: Stores **all** planner data:
  - Events, Tasks, Habits, Notes
  - Full AI Chat History & Tool Execution Logs (`chat_messages`)
  - AI Day Plans & Weekly Summaries (`ai_plans`)
  - User Preferences & Settings (`user_settings`)
- **Row Level Security (RLS)**: Enforces cryptographic user boundaries where `auth.uid() = user_id`.
- **Flexible Auth**: Supports Email & Password, Passwordless Magic Links, and **Anonymous Guest Sign-Ins**.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Styling & Design** | Tailwind CSS v4, Lucide Icons, Glassmorphism UI |
| **Calendar Engine** | FullCalendar (`@fullcalendar/react`) |
| **State Management** | Zustand with `persist` (Local-First Architecture) |
| **Cloud Database & Auth** | Supabase (`@supabase/supabase-js`, PostgreSQL with RLS) |
| **AI Engine** | Groq Cloud API (LLaMA 3.3 70B & GPT-OSS models) |
| **Deployment** | Render Static Site (`render.yaml` Blueprint) |

---

## 🚀 Live Demo & Deployment

| Resource | Link |
|---|---|
| **🌐 Production App** | [https://ai-schedule-dnv6.onrender.com](https://ai-schedule-dnv6.onrender.com) |
| **📦 GitHub Repository** | [https://github.com/Yeetos888/AI-Schedule](https://github.com/Yeetos888/AI-Schedule) |
| **🗄️ Database Schema** | [`supabase/schema.sql`](./supabase/schema.sql) |

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Yeetos888/AI-Schedule.git
cd AI-Schedule
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the project root:
```env
# Groq API Key (Get at https://console.groq.com/keys)
VITE_GROQ_API_KEY="gsk_..."

# Supabase Credentials (Get at https://supabase.com/dashboard -> Project Settings -> API)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
```

### 4. Database Setup
1. In your [Supabase Dashboard](https://supabase.com/dashboard), navigate to the **SQL Editor**.
2. Run the complete [`supabase/schema.sql`](./supabase/schema.sql) script to provision all 5 tables and RLS security policies.

### 5. Launch development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Building for Production

```bash
npm run build
```
The compiled, minified production assets will be generated in `./dist`.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Developed with ❤️ by <b>Amaan</b> under the mentorship of <b>Mohd Ismail</b>.</sub>
</div>
