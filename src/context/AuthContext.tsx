import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, User, Session } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  isConfigured: boolean;
  isRecoveryMode: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ needsEmailVerification: boolean; user: User | null }>;
  signIn: (email: string, password: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearRecoveryMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface SupabaseAuthErrorLike {
  code?: string;
  status?: number;
  name?: string;
}

function safeAuthError(error: unknown, operation: 'sign in' | 'sign up' | 'confirmation' | 'password reset' | 'password update'): Error {
  const authError = error as SupabaseAuthErrorLike | null;
  switch (authError?.code) {
    case 'email_not_confirmed':
      return new Error('Your email address is not confirmed. Check your inbox or request a new confirmation email.');
    case 'invalid_credentials':
      return new Error('Email or password is incorrect. If you have not confirmed this email, confirm it or request a new link.');
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return new Error('Too many authentication attempts. Please wait a few minutes and try again.');
    case 'email_address_not_authorized':
      return new Error('This Supabase project cannot send email to that address yet. Check its email provider or SMTP configuration.');
    case 'email_provider_disabled':
    case 'signup_disabled':
      return new Error('Email sign-up is disabled for this Supabase project.');
    case 'weak_password':
      return new Error('Choose a stronger password that meets the project requirements.');
    default:
      return new Error(`Supabase ${operation} could not be completed. Check the project Auth settings and try again.`);
  }
}

// Active auth token holder for API client fetch injection
let currentAuthToken: string | null = null;
export const getActiveAuthToken = (): string | null => currentAuthToken;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false);

  // Synchronize token holder
  const updateSessionState = useCallback((newSession: Session | null) => {
    setSession(newSession);
    const newTok = newSession?.access_token || null;
    setToken(newTok);
    currentAuthToken = newTok;
    setUser(newSession?.user || null);
  }, []);

  useEffect(() => {
    // Check if recovery link was opened in the URL hash
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }

    if (!isSupabaseConfigured || !supabase) {
      localStorage.removeItem('chatora_demo_user');
      localStorage.removeItem('chatora_demo_token');
      currentAuthToken = null;
      setLoading(false);
      return;
    }

    // 1. Initial Session Restoration
    supabase.auth.getSession().then(({ data: { session: initSession }, error }) => {
      if (!error && initSession) {
        updateSessionState(initSession);
      }
      setLoading(false);
    }).catch(err => {
      console.warn('Session restoration failed:', err);
      setLoading(false);
    });

    // 2. Auth State Change Listener (Sign in, Sign out, Token Refresh, Password Recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
      updateSessionState(newSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateSessionState]);

  // Sign Up with Supabase
  const signUp = async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase authentication is not configured in this environment. Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to register live accounts.'
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    });

    if (error) {
      throw safeAuthError(error, 'sign up');
    }

    // If user requires email confirmation, session will be null
    const needsEmailVerification = !data.session && Boolean(data.user);
    if (data.session) {
      updateSessionState(data.session);
    }

    return { needsEmailVerification, user: data.user };
  };

  // Sign In with Supabase
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase authentication is not configured in this environment. Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to sign in.'
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw safeAuthError(error, 'sign in');
    }

    if (!data.session) {
      throw new Error('Sign-in did not return a session. If email confirmation is enabled, confirm your address and try again.');
    }
    updateSessionState(data.session);
  };

  const resendConfirmation = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase authentication is not configured in this environment. Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to request confirmation.'
      );
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    });
    if (error) throw safeAuthError(error, 'confirmation');
  };

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out error:', err);
      }
    }
    localStorage.removeItem('chatora_demo_user');
    localStorage.removeItem('chatora_demo_token');
    updateSessionState(null);
  };

  // Request Password Reset
  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase authentication is not configured in this environment. Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to request password resets.'
      );
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/#type=recovery` : undefined,
    });

    if (error) {
      throw safeAuthError(error, 'password reset');
    }
  };

  // Update Password (e.g., after clicking password recovery link)
  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase authentication is not configured in this environment.');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw safeAuthError(error, 'password update');
    }

    setIsRecoveryMode(false);
  };

  const clearRecoveryMode = () => {
    setIsRecoveryMode(false);
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token,
        loading,
        isConfigured: isSupabaseConfigured,
        isRecoveryMode,
        signUp,
        signIn,
        resendConfirmation,
        signOut,
        resetPassword,
        updatePassword,
        clearRecoveryMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
