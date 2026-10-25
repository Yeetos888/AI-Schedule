# AI Planner App: Complete Plan

Groq API, no database, key in `.env`.

## 1. What you're building

A browser-based planner with a calendar, tasks, habits, and notes, plus an AI layer (Groq) that turns plain language into events, plans your day, summarizes your week, and acts as a chat assistant. All data lives in the browser (localStorage), and the Groq key comes from `.env.local`.

## 2. Stack

| Layer | Choice |
|---|---|
| App | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Calendar | FullCalendar (day/week/month, drag-and-drop) |
| State + storage | Zustand with `persist` (localStorage) |
| Validation | Zod |
| Dates | date-fns |
| AI | Groq API via plain `fetch` (OpenAI-compatible) |
| Voice | Groq Whisper endpoint |
| Extras | vite-plugin-pwa, Vitest |

## 3. Folder structure

```
src/
  lib/
    groq.ts          # the ONLY file that talks to Groq
    prompts.ts       # system prompts
    schemas.ts       # Zod schemas for AI output
    tools.ts         # tool definitions + executors
  store/
    useStore.ts      # events, tasks, habits, notes, settings
  features/
    calendar/  tasks/  habits/  notes/  chat/  planner/
  components/        # shared UI (ConfirmCard, Modal, etc.)
  App.tsx  main.tsx
.env.local  .env.example  .gitignore
```

## 4. Data model

```ts
type Event = { id: string; title: string; start: string; end: string; color?: string; notes?: string }
type Task  = { id: string; title: string; due?: string; priority: 'low'|'med'|'high'; done: boolean; estimateMin?: number }
type Habit = { id: string; name: string; logs: string[] }  // 'YYYY-MM-DD'
type Note  = { id: string; text: string; createdAt: string }
```

Store dates as ISO strings. Add a `version` field to the persisted state so you can migrate it later.

## 5. Features

### Core (no AI)
- Calendar with create, edit, delete, drag, and resize
- Tasks with priority, due date, filters, and a done toggle
- Habit tracker with streaks
- Notes
- JSON export and import (the safety net if the browser is cleared)
- Dark mode

### AI features
1. **Quick add:** "Dentist next Tuesday 4pm for an hour" becomes an event or task
2. **Day planner:** tasks + events + working hours become a time-blocked schedule
3. **Weekly summary:** a short brief of what's coming and what's overdue
4. **Chat assistant:** "What's free Friday?", "Move gym to evening" (tool calling)
5. **Voice add:** speak, transcribe with Whisper, then run quick add
6. **Habit reflection (optional):** a short weekly note from your habit logs

## 6. Groq setup

### `.env.local`

```
VITE_GROQ_API_KEY=gsk_your_key_here
```

- Add `.env` and `.env.local` to `.gitignore` **before your first commit**
- Commit a `.env.example` with a blank value (`VITE_GROQ_API_KEY=`)
- Read it with `import.meta.env.VITE_GROQ_API_KEY` (Vite only exposes variables starting with `VITE_`)

### `src/lib/groq.ts`

```ts
const URL = "https://api.groq.com/openai/v1/chat/completions";
const KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function chat(body: object, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429) { await new Promise(r => setTimeout(r, 1000 * 2 ** i)); continue; }
    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
    return res.json();
  }
  throw new Error("Rate limited, try again shortly");
}
```

Keep model names in one config constant: a small fast model for parsing, a larger one for planning and chat. Check Groq's console for current names and limits, since they change often.

## 7. AI feature designs

### Quick add
- Prompt includes today's date, the weekday, and the `Asia/Kolkata` timezone
- Use `response_format: { type: "json_object" }` and `temperature: 0.2`
- Expected shape: `{ type: "event"|"task", title, start, end, priority }`
- Validate with Zod, show a **confirm card**, and save only after the user accepts

### Day planner
- Input: today's open tasks (with estimates), existing events, working hours (for example 9:00-18:00)
- Output: `[{ taskId, start, end }]`
- After the response, code checks for overlaps, working-hours violations, and unknown task IDs. Reject or fix before showing it, and let the user accept all or edit.

### Weekly summary
- Send only the next 7 days of events, open tasks, and overdue items
- Ask for a 5-line brief

### Chat assistant with tool calling

```ts
const tools = [
  { type: "function", function: { name: "list_events", description: "List events in a date range",
    parameters: { type: "object", properties: { from: {type:"string"}, to: {type:"string"} }, required: ["from","to"] } } },
  { type: "function", function: { name: "create_event", description: "Create a calendar event",
    parameters: { type: "object", properties: { title:{type:"string"}, start:{type:"string"}, end:{type:"string"} }, required: ["title","start","end"] } } },
  // move_event, delete_event, create_task, complete_task ...
];
```

Loop:
1. Send messages and tools to Groq
2. If the reply has `tool_calls`, run each against the store and append the results as `tool` messages
3. Call again until you get plain text
4. Cap the loop at about 5 iterations
5. Put **destructive actions** (delete, move) behind a confirmation

### Voice add
- Record with `MediaRecorder`
- POST the audio to Groq's transcription endpoint (`/openai/v1/audio/transcriptions`)
- Pass the text to quick add

## 8. Build phases

| Phase | Time | Deliverables |
|---|---|---|
| 1. Foundation | 2-3 days | Vite + React + TS + Tailwind, store with persist, calendar CRUD, task list, export/import |
| 2. Quick add | 1-2 days | `groq.ts`, schemas, quick-add bar, confirm card, error and rate-limit handling |
| 3. Planner + summary | 2 days | Day planner with validation, weekly summary |
| 4. Chat assistant | 2-3 days | Tool definitions, executor loop, chat UI, delete/move confirmations |
| 5. Habits, notes, voice | 2 days | Habit streaks, notes, Whisper input |
| 6. Polish | 2 days | Dark mode, notifications, PWA, loading and empty states, responsive layout |

Roughly 2-3 weeks of part-time work. Do phases 1 and 2 first, since quick add is the quickest win.

## 9. Testing checklist

- [ ] Unit tests (Vitest) for date helpers, overlap detection, and Zod schemas
- [ ] Tricky prompts: "tomorrow", "next Friday", "every Monday", "in 2 hours", times crossing midnight
- [ ] Failure cases: bad JSON from the model, a 429, offline, empty key
- [ ] Persistence: reload the page, then import an exported backup

## 10. Security and limits

- `VITE_` variables are bundled into the JavaScript, so **never deploy or share the build with the key in it**
- If the key is ever pushed to GitHub, revoke it in the Groq console and create a new one (removing the file from git history is not enough)
- Send only the relevant slice of data to the model
- Treat AI output as untrusted: validate dates, IDs, and durations before touching the store

## 11. When you want to share or host it

1. Move the key into a Cloudflare Worker or Vercel function that forwards to Groq
2. Change the URL in `groq.ts` and remove the `VITE_` key from the frontend
3. Optionally add Supabase later by swapping the store for a data layer behind `getEvents()` / `saveEvent()`

## 12. Future ideas

- Recurring events and browser-notification reminders
- `.ics` import/export for Google Calendar
- Drag a task onto the calendar to time-block it
- Natural-language search over notes
- Focus timer (Pomodoro) linked to tasks
