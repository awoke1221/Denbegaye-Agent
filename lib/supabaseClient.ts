import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
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

export { supabase, supabaseAdmin };
export default supabase;
