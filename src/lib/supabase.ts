import { createClient, SupabaseClient, type User } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let currentConfigKey = '';

/**
 * Returns the effective Supabase URL from environment or localStorage/settings
 */
export function getSupabaseUrl(): string {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim();
  }
  try {
    const raw = localStorage.getItem('ai-planner-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.settings?.supabaseUrl) {
        return parsed.state.settings.supabaseUrl.trim();
      }
    }
  } catch {
    // ignore json parsing errors
  }
  return '';
}

/**
 * Returns the effective Supabase Anon Key from environment or localStorage/settings
 */
export function getSupabaseAnonKey(): string {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  try {
    const raw = localStorage.getItem('ai-planner-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.settings?.supabaseAnonKey) {
        return parsed.state.settings.supabaseAnonKey.trim();
      }
    }
  } catch {
    // ignore json parsing errors
  }
  return '';
}

/**
 * Determines whether Supabase credentials have been configured
 */
export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('your-project') &&
    key.length > 20
  );
}

/**
 * Gets or initializes the Supabase client singleton
 */
export function getSupabase(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key || !url.startsWith('http')) {
    return null;
  }

  const configKey = `${url}::${key}`;
  if (cachedClient && currentConfigKey === configKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    currentConfigKey = configKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Force resets the cached client (e.g., when the user updates credentials in Settings)
 */
export function resetSupabaseClient(): void {
  cachedClient = null;
  currentConfigKey = '';
}

/**
 * Validates connection to a Supabase project by testing health
 */
export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL and Anon Key are required.' };
  }

  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return { success: false, message: 'URL must begin with https:// or http://' };
  }

  try {
    const tempClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    // Check if we can query the public endpoint or auth health
    const { error } = await tempClient.from('events').select('id', { count: 'exact', head: true });
    
    // In Supabase, if the table exists or if RLS is on, error code might be 0 or PGRST error,
    // but if credentials are completely wrong, it throws a network / unauthorized 401 error.
    if (error && error.message && error.message.includes('API key')) {
      return { success: false, message: `Invalid Anon Key: ${error.message}` };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase project!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to connect to Supabase endpoint.',
    };
  }
}

export type { User };
