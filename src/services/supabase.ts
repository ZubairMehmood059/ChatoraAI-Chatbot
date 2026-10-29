import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Retrieve public client variables with safe fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
  supabaseUrl.startsWith('http')
);

// Instantiate Supabase client ONLY when configured with a genuine project URL and anon key.
// Never invent placeholder URLs or fake keys.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null;

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
}

export type { User, Session, AuthChangeEvent };
