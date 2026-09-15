import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type AuthStorageMode = 'local' | 'session';
let authStorageMode: AuthStorageMode = 'local';

export const setSupabaseAuthStorageMode = (mode: AuthStorageMode) => {
  authStorageMode = mode;
};

const getBrowserStorage = (mode: AuthStorageMode): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return mode === 'session' ? window.sessionStorage : window.localStorage;
  } catch (error) {
    console.warn('Supabase storage access failed:', error);
    return null;
  }
};

const authStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const preferredStorage =
        authStorageMode === 'session' ? window.sessionStorage : window.localStorage;
      const fallbackStorage =
        authStorageMode === 'session' ? window.localStorage : window.sessionStorage;
      return preferredStorage.getItem(key) ?? fallbackStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    const storage = getBrowserStorage(authStorageMode);
    if (!storage) return;

    try {
      storage.setItem(key, value);
      const otherStorage =
        authStorageMode === 'session' ? window.localStorage : window.sessionStorage;
      otherStorage.removeItem(key);
    } catch {
      // ignore write errors for secure storage fallback
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // ignore cleanup errors
    }
  },
};

export const clearSupabaseAuthStorage = () => {
  const projectRef = new URL(SUPABASE_URL || 'http://localhost').hostname.split('.')[0];
  const authTokenKey = `sb-${projectRef}-auth-token`;

  authStorage.removeItem(authTokenKey);

  if (typeof window === 'undefined') {
    return;
  }

  try {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (key?.startsWith('sb-') && key.endsWith('-auth-token')) {
          storage.removeItem(key);
        }
      }
    }
  } catch {
    // Ignore browser storage cleanup failures.
  }
};

let supabase: SupabaseClient;
let supabaseAdmin: SupabaseClient | null = null;

const createMissingEnvClient = (): SupabaseClient => {
  console.warn(
    'Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Supabase client will be stubbed until runtime environment variables are configured.'
  );

  return new Proxy(
    {},
    {
      get: () => {
        return () => {
          throw new Error(
            'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment to use Supabase features.'
          );
        };
      },
    }
  ) as SupabaseClient;
};

if (process.env.NODE_ENV === 'test') {
  const stub: any = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null }, error: null }),
      signUp: async () => ({ data: { user: null }, error: null }),
      signInWithOAuth: async () => ({ data: {}, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };

  supabase = stub as unknown as SupabaseClient;
  supabaseAdmin = null;
} else {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    supabase = createMissingEnvClient();
    supabaseAdmin = null;
  } else {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: authStorage,
      },
    });

    supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : null;
  }
}

export const getSupabaseAuthStorageInfo = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const localKeys: string[] = [];
  const sessionKeys: string[] = [];

  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key) {
        localKeys.push(key);
      }
    }
  } catch {
    // Ignore storage access errors
  }

  try {
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key) {
        sessionKeys.push(key);
      }
    }
  } catch {
    // Ignore storage access errors
  }

  return {
    authStorageMode,
    localStorageKeys: localKeys.filter(key => key.includes('supabase')),
    sessionStorageKeys: sessionKeys.filter(key => key.includes('supabase')),
    localStorageCount: localKeys.length,
    sessionStorageCount: sessionKeys.length,
  };
};

export const inferSupabaseAuthStorageMode = (): AuthStorageMode => {
  if (typeof window === 'undefined') {
    return authStorageMode;
  }

  try {
    let hasLocal = false;
    let hasSession = false;

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.includes('supabase')) {
        hasLocal = true;
        break;
      }
    }

    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key?.includes('supabase')) {
        hasSession = true;
        break;
      }
    }

    if (hasSession && !hasLocal) {
      return 'session';
    }

    if (hasLocal) {
      return 'local';
    }
  } catch {
    // Ignore storage access errors
  }

  return authStorageMode;
};

export const logSupabaseAuthStorageInfo = () => {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
    return;
  }

  const info = getSupabaseAuthStorageInfo();
  if (!info) {
    console.info('Supabase auth storage info unavailable.');
    return;
  }

  console.info('Supabase auth storage info:', info);
};

export { supabase, supabaseAdmin };
export default supabase;
