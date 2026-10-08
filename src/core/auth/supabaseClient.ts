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

export async function signInWithGoogle(): Promise<{ error: Error | null; url?: string }> {
  const client = getSupabase();
  if (!client) {
    return { error: new Error('Supabase não configurado. Adicione a URL e a Anon Key.') };
  }

  try {
    const isElectron = typeof window !== 'undefined' && Boolean((window as unknown as { electronAPI?: { isElectron?: boolean } }).electronAPI?.isElectron);
    const redirectUrl = isElectron
      ? 'http://localhost:3000'
      : (typeof window !== 'undefined' && window.location.origin.startsWith('http')
        ? window.location.origin
        : undefined);

    // Pre-warm: evita 502 Bad Gateway no navegador caso o container GoTrue esteja em repouso (cold start no plano gratuito)
    const { url: supabaseUrl, anonKey } = getSupabaseCredentials();
    if (supabaseUrl && anonKey && typeof fetch !== 'undefined') {
      try {
        const ping = await fetch(`${supabaseUrl}/auth/v1/health`, {
          headers: { apikey: anonKey },
          signal: AbortSignal.timeout(3000),
        });
        if (ping.status === 502) {
          // Container GoTrue acordando: aguarda 2s para estabilização
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch {
        // Ignora erros de rede no ping preventivo para não travar o fluxo
      }
    }

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      if (error.message.includes('not enabled') || error.message.includes('Unsupported provider')) {
        return {
          error: new Error(
            'O login com Google precisa ser habilitado no painel do Supabase (Authentication -> Providers -> Google). Use Email e Senha abaixo para entrar agora!'
          ),
        };
      }
      return { error: new Error(error.message) };
    }

    if (data?.url) {
      const electronAPI = typeof window !== 'undefined'
        ? (window as unknown as { electronAPI?: { openOAuth?: (url: string) => Promise<{ success: boolean; url?: string; canceled?: boolean; error?: string }> } }).electronAPI
        : undefined;

      if (electronAPI?.openOAuth) {
        const result = await electronAPI.openOAuth(data.url);
        if (result?.success && result.url) {
          try {
            const parsed = new URL(result.url);
            const rawHash = parsed.hash.startsWith('#') ? parsed.hash.substring(1) : parsed.hash;
            const hashParams = new URLSearchParams(rawHash);
            const searchParams = parsed.searchParams;

            const errorDesc = hashParams.get('error_description') || searchParams.get('error_description') ||
                              hashParams.get('error') || searchParams.get('error');
            if (errorDesc) {
              const decoded = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
              if (decoded.includes('Unable to exchange external code')) {
                return {
                  error: new Error(
                    'O Google autorizou o login, mas recusou a troca de chaves com o Supabase. Verifique se o Client Secret e a URL de callback estão corretos no Supabase, ou se seu e-mail está na lista de "Usuários de Teste" no Google Cloud Console. Você também pode entrar com Email e Senha abaixo!'
                  ),
                };
              }
              return { error: new Error(decoded) };
            }

            const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');

            if (accessToken && refreshToken) {
              const { error: sessionErr } = await client.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (sessionErr) return { error: new Error(sessionErr.message) };
              return { error: null, url: data.url };
            }

            const code = hashParams.get('code') || searchParams.get('code');
            if (code) {
              const { error: codeErr } = await client.auth.exchangeCodeForSession(code);
              if (codeErr) return { error: new Error(codeErr.message) };
              return { error: null, url: data.url };
            }
          } catch (urlErr) {
            console.warn('[Quantora Auth] Falha ao processar URL de retorno:', urlErr);
          }
        }
        if (result?.canceled) {
          return { error: new Error('Login com Google cancelado.') };
        }
        if (result?.error) {
          return { error: new Error(result.error) };
        }
      } else if (typeof window !== 'undefined') {
        window.open(data.url, '_blank');
      }
    }

    return { error: null, url: data?.url };
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
