import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CalendarEvent,
  Task,
  Habit,
  Note,
  UserSettings,
  ChatMessage,
  TimeBlockProposal,
  CloudSyncStatus,
  SupabaseUserProfile,
} from '../types';
import { GROQ_MODELS } from '../lib/groq';
import {
  syncCloudEvent,
  deleteCloudEvent,
  syncCloudTask,
  deleteCloudTask,
  syncCloudHabit,
  deleteCloudHabit,
  syncCloudNote,
  deleteCloudNote,
  syncCloudChatMessage,
  clearAllCloudChatMessages,
  syncCloudAiPlan,
  fetchAllCloudData,
  pushAllLocalDataToCloud,
} from '../services/supabaseService';
import { isSupabaseConfigured, resetSupabaseClient } from '../lib/supabase';

interface AppState {
  events: CalendarEvent[];
  tasks: Task[];
  habits: Habit[];
  notes: Note[];
  settings: UserSettings;
  activeTab: 'calendar' | 'tasks' | 'habits' | 'notes' | 'planner' | 'chat';

  // Navigation
  setActiveTab: (tab: AppState['activeTab']) => void;

  // Supabase Auth & Cloud Sync
  user: SupabaseUserProfile | null;
  cloudSyncStatus: CloudSyncStatus;
  lastSyncedAt: string | null;
  setUser: (user: SupabaseUserProfile | null) => void;
  setCloudSyncStatus: (status: CloudSyncStatus) => void;
  pullFromCloud: () => Promise<{ success: boolean; error?: string }>;
  pushToCloud: () => Promise<{ success: boolean; error?: string }>;

  // Events CRUD
  addEvent: (event: Omit<CalendarEvent, 'id'> & { id?: string }) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  moveEvent: (id: string, newStart: string, newEnd: string) => void;

  // Tasks CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  // Habits CRUD
  addHabit: (name: string, category?: string) => Habit;
  deleteHabit: (id: string) => void;
  toggleHabitLog: (id: string, dateStr: string) => void;

  // Notes CRUD
  addNote: (text: string, title?: string, tags?: string[]) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Settings
  updateSettings: (updates: Partial<UserSettings>) => void;

  // Persistent AI State & Actions
  chatMessages: ChatMessage[];
  latestDayPlan: { schedule: TimeBlockProposal[]; summary?: string; advice?: string; date: string } | null;
  latestWeeklySummary: any | null;
  latestHabitReflection: { text: string; date: string } | null;

  setChatMessages: (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChatMessages: () => void;
  setLatestDayPlan: (plan: { schedule: TimeBlockProposal[]; summary?: string; advice?: string; date: string } | null) => void;
  setLatestWeeklySummary: (summary: any | null) => void;
  setLatestHabitReflection: (reflection: { text: string; date: string } | null) => void;

  // Data backup / restore
  exportData: () => string;
  importData: (jsonString: string) => { success: boolean; error?: string };
  loadDemoData: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  fastModel: GROQ_MODELS.FAST,
  smartModel: GROQ_MODELS.SMART,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  darkMode: true,
  supabaseUrl: '',
  supabaseAnonKey: '',
};

const getSampleInitialData = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const initialEvents: CalendarEvent[] = [
    {
      id: 'demo-evt-1',
      title: 'Sprint Planning & Review',
      start: `${todayStr}T10:00:00`,
      end: `${todayStr}T11:30:00`,
      color: '#9333ea',
      notes: 'Review team backlog and Q2 roadmap milestones',
    },
    {
      id: 'demo-evt-2',
      title: 'Product Sync & Demo',
      start: `${todayStr}T14:00:00`,
      end: `${todayStr}T15:00:00`,
      color: '#a855f7',
      notes: 'Demo new AI planner features to stakeholders',
    },
    {
      id: 'demo-evt-3',
      title: 'Design Critique Session',
      start: `${tomorrowStr}T11:00:00`,
      end: `${tomorrowStr}T12:00:00`,
      color: '#7c3aed',
      notes: 'Review calendar and time-blocking interactions',
    },
  ];

  const initialTasks: Task[] = [
    {
      id: 'demo-tsk-1',
      title: 'Prepare presentation deck for Product Sync',
      due: todayStr,
      priority: 'high',
      done: false,
      estimateMin: 45,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-tsk-2',
      title: 'Review PR for Groq AI tool-calling loop',
      due: todayStr,
      priority: 'high',
      done: false,
      estimateMin: 30,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-tsk-3',
      title: 'Weekly grocery shopping & meal prep',
      due: tomorrowStr,
      priority: 'med',
      done: false,
      estimateMin: 60,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-tsk-4',
      title: 'Read research paper on LLM agent scheduling',
      priority: 'low',
      done: true,
      estimateMin: 40,
      createdAt: new Date().toISOString(),
    },
  ];

  const initialHabits: Habit[] = [
    {
      id: 'demo-hab-1',
      name: 'Morning 20m Meditation & Breathwork',
      category: 'Wellness',
      logs: [todayStr],
      targetDaysPerWeek: 7,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-hab-2',
      name: 'Drink 2.5 Liters of Water',
      category: 'Health',
      logs: [todayStr],
      targetDaysPerWeek: 7,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-hab-3',
      name: 'Read 30 pages of non-fiction',
      category: 'Growth',
      logs: [],
      targetDaysPerWeek: 5,
      createdAt: new Date().toISOString(),
    },
  ];

  const initialNotes: Note[] = [
    {
      id: 'demo-note-1',
      title: 'AI Planner Key Ideas',
      text: 'Leverage Groq LLaMA 3.3 for lightning-fast planning, day scheduling, and conversational assistance. Supabase adds cross-device cloud persistence with PostgreSQL RLS.',
      createdAt: new Date().toISOString(),
      tags: ['Architecture', 'AI', 'Supabase'],
    },
  ];

  return { initialEvents, initialTasks, initialHabits, initialNotes };
};

const sampleData = getSampleInitialData();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      events: sampleData.initialEvents,
      tasks: sampleData.initialTasks,
      habits: sampleData.initialHabits,
      notes: sampleData.initialNotes,
      settings: DEFAULT_SETTINGS,
      activeTab: 'calendar',

      // Cloud state
      user: null,
      cloudSyncStatus: isSupabaseConfigured() ? 'idle' : 'unconfigured',
      lastSyncedAt: null,

      setUser: (user) => set({ user, cloudSyncStatus: user ? 'idle' : isSupabaseConfigured() ? 'idle' : 'unconfigured' }),
      setCloudSyncStatus: (cloudSyncStatus) => set({ cloudSyncStatus }),

      // Persistent AI State
      chatMessages: [
        {
          id: 'init-1',
          role: 'assistant',
          content:
            "Hello! I'm your AI Planner Assistant. You can ask me to check your calendar, schedule meetings, create tasks, move events, or plan your day. All your conversations and schedules can be synced to your Supabase cloud database. How can I help you right now?",
          timestamp: new Date().toISOString(),
        },
      ],
      latestDayPlan: null,
      latestWeeklySummary: null,
      latestHabitReflection: null,

      setActiveTab: (tab) => set({ activeTab: tab }),

      // Pull all data from Supabase
      pullFromCloud: async () => {
        const state = get();
        const user = state.user;
        if (!user) {
          return { success: false, error: 'Please sign in to sync with Supabase cloud.' };
        }

        set({ cloudSyncStatus: 'syncing' });
        try {
          const cloudData = await fetchAllCloudData(user.id);
          set({
            events: cloudData.events.length > 0 ? cloudData.events : state.events,
            tasks: cloudData.tasks.length > 0 ? cloudData.tasks : state.tasks,
            habits: cloudData.habits.length > 0 ? cloudData.habits : state.habits,
            notes: cloudData.notes.length > 0 ? cloudData.notes : state.notes,
            chatMessages: cloudData.chatMessages.length > 0 ? cloudData.chatMessages : state.chatMessages,
            latestDayPlan: cloudData.latestDayPlan ?? state.latestDayPlan,
            latestWeeklySummary: cloudData.latestWeeklySummary ?? state.latestWeeklySummary,
            latestHabitReflection: cloudData.latestHabitReflection ?? state.latestHabitReflection,
            settings: cloudData.settings ? { ...state.settings, ...cloudData.settings } : state.settings,
            cloudSyncStatus: 'synced',
            lastSyncedAt: new Date().toISOString(),
          });
          return { success: true };
        } catch (err: any) {
          console.error('Failed to pull data from Supabase:', err);
          set({ cloudSyncStatus: 'error' });
          return { success: false, error: err?.message || 'Failed to fetch cloud data' };
        }
      },

      // Push all local data to Supabase
      pushToCloud: async () => {
        const state = get();
        const user = state.user;
        if (!user) {
          return { success: false, error: 'Please sign in to push data to Supabase cloud.' };
        }

        set({ cloudSyncStatus: 'syncing' });
        try {
          await pushAllLocalDataToCloud(user.id, {
            events: state.events,
            tasks: state.tasks,
            habits: state.habits,
            notes: state.notes,
            chatMessages: state.chatMessages,
            latestDayPlan: state.latestDayPlan,
            latestWeeklySummary: state.latestWeeklySummary,
            latestHabitReflection: state.latestHabitReflection,
            settings: state.settings,
          });

          set({
            cloudSyncStatus: 'synced',
            lastSyncedAt: new Date().toISOString(),
          });
          return { success: true };
        } catch (err: any) {
          console.error('Failed to push data to Supabase:', err);
          set({ cloudSyncStatus: 'error' });
          return { success: false, error: err?.message || 'Failed to push data to cloud' };
        }
      },

      // Events CRUD
      addEvent: (eventData) => {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: eventData.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        };
        set((state) => ({ events: [...state.events, newEvent] }));

        const user = get().user;
        if (user) {
          syncCloudEvent(newEvent, user.id);
        }
        return newEvent;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));

        const user = get().user;
        if (user) {
          const updated = get().events.find((e) => e.id === id);
          if (updated) syncCloudEvent(updated, user.id);
        }
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        }));

        const user = get().user;
        if (user) {
          deleteCloudEvent(id);
        }
      },

      moveEvent: (id, newStart, newEnd) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, start: newStart, end: newEnd } : e
          ),
        }));

        const user = get().user;
        if (user) {
          const updated = get().events.find((e) => e.id === id);
          if (updated) syncCloudEvent(updated, user.id);
        }
      },

      // Tasks CRUD
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: taskData.id || `tsk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: taskData.createdAt || new Date().toISOString(),
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));

        const user = get().user;
        if (user) {
          syncCloudTask(newTask, user.id);
        }
        return newTask;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));

        const user = get().user;
        if (user) {
          const updated = get().tasks.find((t) => t.id === id);
          if (updated) syncCloudTask(updated, user.id);
        }
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));

        const user = get().user;
        if (user) {
          deleteCloudTask(id);
        }
      },

      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t
          ),
        }));

        const user = get().user;
        if (user) {
          const updated = get().tasks.find((t) => t.id === id);
          if (updated) syncCloudTask(updated, user.id);
        }
      },

      // Habits CRUD
      addHabit: (name, category = 'General') => {
        const newHabit: Habit = {
          id: `hab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          category,
          logs: [],
          targetDaysPerWeek: 7,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));

        const user = get().user;
        if (user) {
          syncCloudHabit(newHabit, user.id);
        }
        return newHabit;
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        }));

        const user = get().user;
        if (user) {
          deleteCloudHabit(id);
        }
      },

      toggleHabitLog: (id, dateStr) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            const hasDate = h.logs.includes(dateStr);
            const newLogs = hasDate
              ? h.logs.filter((d) => d !== dateStr)
              : [...h.logs, dateStr];
            return { ...h, logs: newLogs };
          }),
        }));

        const user = get().user;
        if (user) {
          const updated = get().habits.find((h) => h.id === id);
          if (updated) syncCloudHabit(updated, user.id);
        }
      },

      // Notes CRUD
      addNote: (text, title, tags = []) => {
        const newNote: Note = {
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: title || 'Untitled Note',
          text,
          createdAt: new Date().toISOString(),
          tags,
        };
        set((state) => ({ notes: [newNote, ...state.notes] }));

        const user = get().user;
        if (user) {
          syncCloudNote(newNote, user.id);
        }
        return newNote;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? { ...n, ...updates, updatedAt: new Date().toISOString() }
              : n
          ),
        }));

        const user = get().user;
        if (user) {
          const updated = get().notes.find((n) => n.id === id);
          if (updated) syncCloudNote(updated, user.id);
        }
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }));

        const user = get().user;
        if (user) {
          deleteCloudNote(id);
        }
      },

      // Settings
      updateSettings: (updates) => {
        set((state) => {
          const newSettings = { ...state.settings, ...updates };
          if (newSettings.darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          if (updates.supabaseUrl !== undefined || updates.supabaseAnonKey !== undefined) {
            resetSupabaseClient();
          }
          return {
            settings: newSettings,
            cloudSyncStatus: isSupabaseConfigured() ? state.cloudSyncStatus : 'unconfigured',
          };
        });
      },

      // Persistent AI Actions & Chat Sync
      setChatMessages: (updater) => {
        set((state) => {
          const newChatMessages =
            typeof updater === 'function' ? updater(state.chatMessages) : updater;

          const user = state.user;
          if (user && newChatMessages.length > 0) {
            const previousIds = new Set(state.chatMessages.map((m) => m.id));
            const addedMessages = newChatMessages.filter((m) => !previousIds.has(m.id));
            for (const msg of addedMessages) {
              syncCloudChatMessage(msg, user.id);
            }
          }

          return { chatMessages: newChatMessages };
        });
      },

      addChatMessage: (msg) => {
        set((state) => {
          const user = state.user;
          if (user) {
            syncCloudChatMessage(msg, user.id);
          }
          return { chatMessages: [...state.chatMessages, msg] };
        });
      },

      clearChatMessages: () => {
        const resetMsg: ChatMessage = {
          id: `init-${Date.now()}`,
          role: 'assistant',
          content: 'Chat history cleared. How can I assist you with your planner today?',
          timestamp: new Date().toISOString(),
        };

        const user = get().user;
        if (user) {
          clearAllCloudChatMessages(user.id).then(() => {
            syncCloudChatMessage(resetMsg, user.id);
          });
        }

        set({ chatMessages: [resetMsg] });
      },

      setLatestDayPlan: (plan) => {
        set({ latestDayPlan: plan });
        const user = get().user;
        if (user && plan) {
          syncCloudAiPlan('day_plan', plan, plan.date, user.id);
        }
      },

      setLatestWeeklySummary: (summary) => {
        set({ latestWeeklySummary: summary });
        const user = get().user;
        if (user && summary) {
          syncCloudAiPlan('weekly_summary', summary, new Date().toISOString(), user.id);
        }
      },

      setLatestHabitReflection: (reflection) => {
        set({ latestHabitReflection: reflection });
        const user = get().user;
        if (user && reflection) {
          syncCloudAiPlan('habit_reflection', reflection, reflection.date, user.id);
        }
      },

      // Backup & Restore
      exportData: () => {
        const state = get();
        const exportObject = {
          version: 1,
          exportedAt: new Date().toISOString(),
          events: state.events,
          tasks: state.tasks,
          habits: state.habits,
          notes: state.notes,
          settings: state.settings,
          chatMessages: state.chatMessages,
          latestDayPlan: state.latestDayPlan,
          latestWeeklySummary: state.latestWeeklySummary,
          latestHabitReflection: state.latestHabitReflection,
        };
        return JSON.stringify(exportObject, null, 2);
      },

      importData: (jsonString: string) => {
        try {
          const parsed = JSON.parse(jsonString);
          if (!parsed || typeof parsed !== 'object') {
            return { success: false, error: 'Invalid JSON format' };
          }
          set({
            events: Array.isArray(parsed.events) ? parsed.events : [],
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
            habits: Array.isArray(parsed.habits) ? parsed.habits : [],
            notes: Array.isArray(parsed.notes) ? parsed.notes : [],
            settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
            chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [],
            latestDayPlan: parsed.latestDayPlan || null,
            latestWeeklySummary: parsed.latestWeeklySummary || null,
            latestHabitReflection: parsed.latestHabitReflection || null,
          });
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err?.message || 'Failed to parse JSON backup' };
        }
      },

      loadDemoData: () => {
        const fresh = getSampleInitialData();
        set({
          events: fresh.initialEvents,
          tasks: fresh.initialTasks,
          habits: fresh.initialHabits,
          notes: fresh.initialNotes,
        });
      },
    }),
    {
      name: 'ai-planner-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            ...persistedState,
            version: 1,
          };
        }
        return persistedState as AppState;
      },
    }
  )
);
