import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js';

// Default project credentials (can be overridden by .env or localStorage)
const DEFAULT_SUPABASE_URL = 'https://zdejyzjmrjefefjptkqq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_4A3f4SO9Yat82l1-Pxq5-w_78PqB9mn';

// Resolve configuration from Vite env, default project keys, or user localStorage overrides
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const customUrl = localStorage.getItem('quantora_supabase_url');
      const customKey = localStorage.getItem('quantora_supabase_anon_key');
      if (customUrl && customKey) {
        return { url: customUrl.trim(), anonKey: customKey.trim() };
      }
    } catch {
      // Ignore storage access errors
    }
  }

  return { url: envUrl.trim(), anonKey: envKey.trim() };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http'));
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || !url.startsWith('http')) {
    supabaseInstance = null;
    currentConfigKey = '';
    return null;
  }

  const configKey = `${url}:${anonKey}`;
  if (supabaseInstance && currentConfigKey === configKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    currentConfigKey = configKey;
    return supabaseInstance;
  } catch (err) {
    console.warn('[Quantora Supabase] Falha ao instanciar cliente:', err);
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session) return null;
    return data.session;
  } catch {
    return null;
  }
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { error: new Error('Supabase não configurado. Adicione a URL e a Anon Key.') };
  }

  try {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error: error ? new Error(error.message) : null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function signInWithEmailPassword(
  email: string,
  pass: string
): Promise<{ user: User | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, error: new Error('Supabase não configurado.') };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error) return { user: null, error: new Error(error.message) };
    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function signUpWithEmailPassword(
  email: string,
  pass: string
): Promise<{ user: User | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, error: new Error('Supabase não configurado.') };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password: pass,
    });
    if (error) return { user: null, error: new Error(error.message) };
    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { error: new Error('Supabase não configurado.') };
  }

  try {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error ? new Error(error.message) : null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function signOutCloud(): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) return { error: null };

  try {
    const { error } = await client.auth.signOut();
    return { error: error ? new Error(error.message) : null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
