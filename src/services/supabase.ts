import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

function getSupabaseKeyKind(key: string): 'publishable' | 'legacy-anon' | 'secret' | 'invalid' {
  if (key.startsWith('sb_secret_')) return 'secret';
  if (key.startsWith('sb_publishable_') && key.length > 'sb_publishable_'.length) {
    return 'publishable';
  }

  const payload = key.split('.')[1];
  if (payload) {
    try {
      const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (claims.role === 'service_role') return 'secret';
      if (claims.role === 'anon') return 'legacy-anon';
    } catch {
      return 'invalid';
    }
  }

  return 'invalid';
}

function isValidSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

const supabaseKeyKind = getSupabaseKeyKind(supabaseAnonKey);
const configurationErrors: string[] = [];

if (!supabaseUrl) {
  configurationErrors.push('VITE_SUPABASE_URL is missing');
} else if (supabaseUrl === 'YOUR_SUPABASE_URL' || !isValidSupabaseUrl(supabaseUrl)) {
  configurationErrors.push('VITE_SUPABASE_URL must be a valid Supabase project URL');
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  configurationErrors.push('VITE_SUPABASE_ANON_KEY is missing');
} else if (supabaseKeyKind === 'secret') {
  configurationErrors.push('VITE_SUPABASE_ANON_KEY must not contain a Supabase secret key');
} else if (supabaseKeyKind === 'invalid') {
  configurationErrors.push('VITE_SUPABASE_ANON_KEY must be a publishable key or legacy anon key');
}

export const isSupabaseConfigured = configurationErrors.length === 0;

if (!isSupabaseConfigured) {
  console.error(`[Supabase] Client not initialized: ${configurationErrors.join('; ')}.`);
}

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
