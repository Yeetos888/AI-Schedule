import { getSupabase } from '../lib/supabase';
import type {
  CalendarEvent,
  Task,
  Habit,
  Note,
  ChatMessage,
  TimeBlockProposal,
  UserSettings,
} from '../types';

// ============================================================================
// DATA CONVERTERS
// ============================================================================

export function toDbEvent(event: CalendarEvent, userId: string) {
  return {
    id: event.id,
    user_id: userId,
    title: event.title,
    start_time: event.start,
    end_time: event.end,
    color: event.color || '#6366f1',
    notes: event.notes || '',
    updated_at: new Date().toISOString(),
  };
}

export function fromDbEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    start: row.start_time,
    end: row.end_time,
    color: row.color,
    notes: row.notes || '',
  };
}

export function toDbTask(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    due: task.due || null,
    priority: task.priority || 'med',
    done: task.done ?? false,
    estimate_min: task.estimateMin || 30,
    created_at: task.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function fromDbTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    due: row.due || undefined,
    priority: (row.priority as Task['priority']) || 'med',
    done: Boolean(row.done),
    estimateMin: row.estimate_min,
    createdAt: row.created_at,
  };
}

export function toDbHabit(habit: Habit, userId: string) {
  return {
    id: habit.id,
    user_id: userId,
    name: habit.name,
    category: habit.category || 'General',
    logs: habit.logs || [],
    target_days_per_week: habit.targetDaysPerWeek ?? 7,
    created_at: habit.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function fromDbHabit(row: any): Habit {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    logs: Array.isArray(row.logs) ? row.logs : [],
    targetDaysPerWeek: row.target_days_per_week ?? 7,
    createdAt: row.created_at,
  };
}

export function toDbNote(note: Note, userId: string) {
  return {
    id: note.id,
    user_id: userId,
    title: note.title || 'Untitled Note',
    text: note.text || '',
    tags: note.tags || [],
    created_at: note.createdAt || new Date().toISOString(),
    updated_at: note.updatedAt || new Date().toISOString(),
  };
}

export function fromDbNote(row: any): Note {
  return {
    id: row.id,
    title: row.title,
    text: row.text || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toDbChatMessage(msg: ChatMessage, userId: string) {
  return {
    id: msg.id,
    user_id: userId,
    role: msg.role,
    content: msg.content || '',
    name: msg.name || null,
    tool_call_id: msg.tool_call_id || null,
    tool_calls: msg.tool_calls || [],
    pending_confirmation: msg.pendingConfirmation || null,
    timestamp: msg.timestamp || new Date().toISOString(),
  };
}

export function fromDbChatMessage(row: any): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content || '',
    name: row.name || undefined,
    tool_call_id: row.tool_call_id || undefined,
    tool_calls: Array.isArray(row.tool_calls) ? row.tool_calls : undefined,
    pendingConfirmation: row.pending_confirmation || undefined,
    timestamp: row.timestamp || row.created_at,
  };
}

// ============================================================================
// ALL DATA SYNC OPERATIONS
// ============================================================================

export interface AllPlannerData {
  events: CalendarEvent[];
  tasks: Task[];
  habits: Habit[];
  notes: Note[];
  chatMessages: ChatMessage[];
  latestDayPlan: { schedule: TimeBlockProposal[]; summary?: string; advice?: string; date: string } | null;
  latestWeeklySummary: any | null;
  latestHabitReflection: { text: string; date: string } | null;
  settings?: Partial<UserSettings>;
}

export async function fetchAllCloudData(userId: string): Promise<AllPlannerData> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const [
    eventsRes,
    tasksRes,
    habitsRes,
    notesRes,
    chatRes,
    plansRes,
    settingsRes,
  ] = await Promise.all([
    supabase.from('events').select('*').eq('user_id', userId).order('start_time', { ascending: true }),
    supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('notes').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
    supabase.from('chat_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('ai_plans').select('*').eq('user_id', userId),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (tasksRes.error) throw tasksRes.error;
  if (habitsRes.error) throw habitsRes.error;
  if (notesRes.error) throw notesRes.error;
  if (chatRes.error) throw chatRes.error;
  if (plansRes.error) throw plansRes.error;

  let latestDayPlan: AllPlannerData['latestDayPlan'] = null;
  let latestWeeklySummary: any = null;
  let latestHabitReflection: AllPlannerData['latestHabitReflection'] = null;

  if (plansRes.data) {
    for (const plan of plansRes.data) {
      if (plan.plan_type === 'day_plan') {
        latestDayPlan = plan.data;
      } else if (plan.plan_type === 'weekly_summary') {
        latestWeeklySummary = plan.data;
      } else if (plan.plan_type === 'habit_reflection') {
        latestHabitReflection = plan.data;
      }
    }
  }

  let userSettings: Partial<UserSettings> | undefined = undefined;
  if (settingsRes?.data) {
    userSettings = {
      groqApiKey: settingsRes.data.groq_api_key || undefined,
      fastModel: settingsRes.data.fast_model,
      smartModel: settingsRes.data.smart_model,
      workingHoursStart: settingsRes.data.working_hours_start,
      workingHoursEnd: settingsRes.data.working_hours_end,
      timezone: settingsRes.data.timezone,
      darkMode: settingsRes.data.dark_mode,
    };
  }

  return {
    events: (eventsRes.data || []).map(fromDbEvent),
    tasks: (tasksRes.data || []).map(fromDbTask),
    habits: (habitsRes.data || []).map(fromDbHabit),
    notes: (notesRes.data || []).map(fromDbNote),
    chatMessages: (chatRes.data || []).map(fromDbChatMessage),
    latestDayPlan,
    latestWeeklySummary,
    latestHabitReflection,
    settings: userSettings,
  };
}

export async function pushAllLocalDataToCloud(
  userId: string,
  localData: AllPlannerData
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const promises: PromiseLike<any>[] = [];

  // 1. Events
  if (localData.events && localData.events.length > 0) {
    const rows = localData.events.map((e) => toDbEvent(e, userId));
    promises.push(supabase.from('events').upsert(rows, { onConflict: 'id' }));
  }

  // 2. Tasks
  if (localData.tasks && localData.tasks.length > 0) {
    const rows = localData.tasks.map((t) => toDbTask(t, userId));
    promises.push(supabase.from('tasks').upsert(rows, { onConflict: 'id' }));
  }

  // 3. Habits
  if (localData.habits && localData.habits.length > 0) {
    const rows = localData.habits.map((h) => toDbHabit(h, userId));
    promises.push(supabase.from('habits').upsert(rows, { onConflict: 'id' }));
  }

  // 4. Notes
  if (localData.notes && localData.notes.length > 0) {
    const rows = localData.notes.map((n) => toDbNote(n, userId));
    promises.push(supabase.from('notes').upsert(rows, { onConflict: 'id' }));
  }

  // 5. Chat Messages (AI history)
  if (localData.chatMessages && localData.chatMessages.length > 0) {
    const rows = localData.chatMessages.map((m) => toDbChatMessage(m, userId));
    promises.push(supabase.from('chat_messages').upsert(rows, { onConflict: 'id' }));
  }

  // 6. AI Plans (Day plan, weekly summary, habit reflection)
  const aiPlansRows = [];
  if (localData.latestDayPlan) {
    aiPlansRows.push({
      id: `${userId}_day_plan`,
      user_id: userId,
      plan_type: 'day_plan',
      data: localData.latestDayPlan,
      date: localData.latestDayPlan.date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  if (localData.latestWeeklySummary) {
    aiPlansRows.push({
      id: `${userId}_weekly_summary`,
      user_id: userId,
      plan_type: 'weekly_summary',
      data: localData.latestWeeklySummary,
      date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  if (localData.latestHabitReflection) {
    aiPlansRows.push({
      id: `${userId}_habit_reflection`,
      user_id: userId,
      plan_type: 'habit_reflection',
      data: localData.latestHabitReflection,
      date: localData.latestHabitReflection.date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  if (aiPlansRows.length > 0) {
    promises.push(supabase.from('ai_plans').upsert(aiPlansRows, { onConflict: 'id' }));
  }

  // 7. Settings
  if (localData.settings) {
    promises.push(
      supabase.from('user_settings').upsert(
        {
          user_id: userId,
          groq_api_key: localData.settings.groqApiKey || null,
          fast_model: localData.settings.fastModel,
          smart_model: localData.settings.smartModel,
          working_hours_start: localData.settings.workingHoursStart,
          working_hours_end: localData.settings.workingHoursEnd,
          timezone: localData.settings.timezone,
          dark_mode: localData.settings.darkMode ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    );
  }

  const results = await Promise.all(promises);
  for (const res of results) {
    if (res?.error) {
      throw res.error;
    }
  }

  return true;
}

// ============================================================================
// INDIVIDUAL ENTITY CLOUD MUTATIONS
// ============================================================================

export async function syncCloudEvent(event: CalendarEvent, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('events').upsert(toDbEvent(event, userId));
  if (error) console.error('Error syncing event to Supabase:', error);
}

export async function deleteCloudEvent(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) console.error('Error deleting event from Supabase:', error);
}

export async function syncCloudTask(task: Task, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('tasks').upsert(toDbTask(task, userId));
  if (error) console.error('Error syncing task to Supabase:', error);
}

export async function deleteCloudTask(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) console.error('Error deleting task from Supabase:', error);
}

export async function syncCloudHabit(habit: Habit, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('habits').upsert(toDbHabit(habit, userId));
  if (error) console.error('Error syncing habit to Supabase:', error);
}

export async function deleteCloudHabit(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) console.error('Error deleting habit from Supabase:', error);
}

export async function syncCloudNote(note: Note, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('notes').upsert(toDbNote(note, userId));
  if (error) console.error('Error syncing note to Supabase:', error);
}

export async function deleteCloudNote(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) console.error('Error deleting note from Supabase:', error);
}

export async function syncCloudChatMessage(msg: ChatMessage, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('chat_messages').upsert(toDbChatMessage(msg, userId));
  if (error) console.error('Error syncing chat message to Supabase:', error);
}

export async function deleteCloudChatMessage(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('chat_messages').delete().eq('id', id);
  if (error) console.error('Error deleting chat message from Supabase:', error);
}

export async function clearAllCloudChatMessages(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('chat_messages').delete().eq('user_id', userId);
  if (error) console.error('Error clearing chat messages from Supabase:', error);
}

export async function syncCloudAiPlan(
  planType: 'day_plan' | 'weekly_summary' | 'habit_reflection',
  data: any,
  date: string,
  userId: string
) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('ai_plans').upsert(
    {
      id: `${userId}_${planType}`,
      user_id: userId,
      plan_type: planType,
      data,
      date,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) console.error(`Error syncing AI plan (${planType}) to Supabase:`, error);
}
