export type Priority = 'low' | 'med' | 'high';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 string
  end: string;   // ISO 8601 string
  color?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  due?: string; // ISO string or YYYY-MM-DD
  priority: Priority;
  done: boolean;
  estimateMin?: number; // estimated time in minutes
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  category?: string;
  logs: string[]; // Array of 'YYYY-MM-DD' dates
  targetDaysPerWeek?: number;
  createdAt: string;
}

export interface Note {
  id: string;
  title?: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
}

export interface UserSettings {
  groqApiKey?: string;
  fastModel: string;
  smartModel: string;
  workingHoursStart: string; // "09:00"
  workingHoursEnd: string;   // "18:00"
  timezone: string;
  darkMode: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export type CloudSyncStatus = 'unconfigured' | 'offline' | 'idle' | 'syncing' | 'synced' | 'error';

export interface SupabaseUserProfile {
  id: string;
  email?: string;
  lastSignIn?: string;
}

export interface QuickAddResult {
  type: 'event' | 'task';
  title: string;
  start?: string;
  end?: string;
  due?: string;
  priority?: Priority;
  estimateMin?: number;
  notes?: string;
}

export interface TimeBlockProposal {
  taskId: string;
  taskTitle: string;
  start: string;
  end: string;
  accepted?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  pendingConfirmation?: {
    actionType: 'delete_event' | 'move_event' | 'delete_task';
    targetId: string;
    details: string;
    payload?: any;
  };
  timestamp: string;
}
