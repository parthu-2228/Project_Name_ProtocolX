import { supabase, isSupabaseConfigured } from './supabaseClient';

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
};

// ── Sign Up ──────────────────────────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    // Local-only guest mode — generate a fake local user stored in localStorage
    const localUser: AuthUser = {
      id: `local-${Date.now()}`,
      email,
      displayName,
    };
    localStorage.setItem('wdim_local_user', JSON.stringify(localUser));
    return { user: localUser, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'Sign-up failed — please try again.' };

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      displayName,
    },
    error: null,
  };
}

// ── Sign In ──────────────────────────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    // Local-only mode: check localStorage for matching user
    const raw = localStorage.getItem('wdim_local_user');
    if (raw) {
      const localUser: AuthUser = JSON.parse(raw);
      if (localUser.email === email) return { user: localUser, error: null };
    }
    return { user: null, error: 'No account found. Please sign up first (Local Mode).' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'Login failed — please try again.' };

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      displayName: data.user.user_metadata?.display_name,
    },
    error: null,
  };
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  localStorage.removeItem('wdim_session_user');
  if (supabase && isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

// ── Get Current Session User ──────────────────────────────────────────────────
export async function getCurrentUser(): Promise<AuthUser | null> {
  // 1. Supabase session
  if (supabase && isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      return {
        id: data.session.user.id,
        email: data.session.user.email!,
        displayName: data.session.user.user_metadata?.display_name,
      };
    }
  }

  // 2. Local session fallback
  const raw = localStorage.getItem('wdim_session_user');
  if (raw) {
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  return null;
}

// ── Persist local session ─────────────────────────────────────────────────────
export function persistLocalSession(user: AuthUser): void {
  localStorage.setItem('wdim_session_user', JSON.stringify(user));
}

export function clearLocalSession(): void {
  localStorage.removeItem('wdim_session_user');
}
