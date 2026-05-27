'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { type AuthChangeEvent, type Session } from '@supabase/supabase-js';
import { setSupabaseAuthStorageMode, supabase } from '@/lib/supabaseClient';
import { validatePassword } from '@/lib/password-validation';

interface SupabaseUserMetadata {
  full_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  picture?: string | null;
}

interface SupabaseAppMetadata {
  provider?: string | null;
}

interface SupabaseUser {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  created_at?: string;
  last_sign_in_at?: string | null;
  photoURL?: string;
  app_metadata?: SupabaseAppMetadata | null;
  user_metadata?: SupabaseUserMetadata;
}

interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<SupabaseUser | null>;
  signUp: (email: string, password: string) => Promise<SupabaseUser | null>;
  signInWithGoogle: () => Promise<string | SupabaseUser | null>;
  signInWithGoogleForService: (
    service: string,
    nodeId?: string
  ) => Promise<{ access_token: string; refresh_token?: string } | null>;
  signOut: () => Promise<void>;
}

type AuthError = { message?: string; status?: number } | null;

const isInternalAuthError = (message: string) => {
  return /sql|server|unexpected|exception|stack trace|traceback|null value|invalid input syntax|duplicate key|internal/i.test(
    message
  );
};

const getFriendlyAuthError = (error: AuthError, fallback: string) => {
  if (!error) {
    return fallback;
  }

  const rawMessage = (error.message || '').trim();
  const normalized = rawMessage.toLowerCase();

  if (error.status === 400) {
    if (normalized.includes('invalid email') || normalized.includes('invalid email address')) {
      return 'Please enter a valid email address like name@example.com.';
    }

    if (
      normalized.includes('already registered') ||
      normalized.includes('already exists') ||
      normalized.includes('duplicate') ||
      normalized.includes('user already exists') ||
      normalized.includes('email already registered')
    ) {
      return 'An account with this email already exists. Please sign in or use a different email.';
    }

    return fallback;
  }

  if (error.status === 401) {
    return 'Invalid email or password. Please try again.';
  }

  if (error.status === 429) {
    return 'Too many requests. Please try again later.';
  }

  if (error.status && error.status >= 500) {
    return 'An unexpected server error occurred. Please try again later.';
  }

  if (error.status) {
    return fallback;
  }

  if (isInternalAuthError(rawMessage)) {
    return fallback;
  }

  return rawMessage || fallback;
};

/**
 * ✅ FIX: Properly typed default functions
 */
const normalizeAuthError = (error: unknown): AuthError => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  return {
    message: typeof (error as any).message === 'string' ? (error as any).message : undefined,
    status: typeof (error as any).status === 'number' ? (error as any).status : undefined,
  };
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async (_email: string, _password: string) => null,
  signUp: async (_email: string, _password: string) => null,
  signInWithGoogle: async () => null,
  signInWithGoogleForService: async (_service: string) => null,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isSessionValid = (session?: Session | null): session is Session => {
    return Boolean(session && (!session.expires_at || session.expires_at * 1000 > Date.now()));
  };

  const getUserFromSession = (session?: Session | null): SupabaseUser | null => {
    return isSessionValid(session) ? (session.user as SupabaseUser) : null;
  };

  const getUserFullName = (user?: SupabaseUser | null): string => {
    const fullName = user?.user_metadata?.full_name;
    return typeof fullName === 'string' ? fullName : '';
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        const activeUser = getUserFromSession(data.session);

        if (!mounted) return;

        if (activeUser) {
          setUser(activeUser);
        } else if (data.session && !isSessionValid(data.session)) {
          await supabase.auth.signOut();
          setUser(null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        const activeUser = getUserFromSession(session);
        if (activeUser) {
          await ensureUserProfile(
            activeUser.id,
            activeUser.email || '',
            getUserFullName(activeUser)
          );
          setUser(activeUser);
        } else {
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
    rememberMe = true
  ): Promise<SupabaseUser | null> => {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    if (typeof window !== 'undefined') {
      setSupabaseAuthStorageMode(rememberMe ? 'local' : 'session');
    }

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw new Error(
          getFriendlyAuthError(normalizeAuthError(error), 'Unable to sign in. Please try again.')
        );
      }

      const sessionUser = getUserFromSession(data.session);
      if (sessionUser) {
        // Ensure user profile exists
        await ensureUserProfile(
          sessionUser.id,
          sessionUser.email || '',
          getUserFullName(sessionUser)
        );

        setUser(sessionUser);
        return sessionUser;
      }

      if (data.user) {
        if (
          !data.user.email_confirmed_at &&
          data.user.app_metadata?.provider !== 'google' &&
          data.user.app_metadata?.provider !== 'github'
        ) {
          return data.user as SupabaseUser;
        }
      }

      return null;
    } finally {
      if (typeof window !== 'undefined') {
        setSupabaseAuthStorageMode('local');
      }
    }
  };

  const signUp = async (email: string, password: string): Promise<SupabaseUser | null> => {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      throw new Error(`Password does not meet requirements: ${validation.errors.join(' ')}`);
    }

    const { error, data } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error('Sign up error:', error);
      throw new Error(
        getFriendlyAuthError(
          normalizeAuthError(error),
          'Failed to create account. Please check your details and try again.'
        )
      );
    }

    if (getUserFromSession(data.session)) {
      const sessionUser = getUserFromSession(data.session);
      if (sessionUser) {
        await ensureUserProfile(
          sessionUser.id,
          sessionUser.email || '',
          getUserFullName(sessionUser)
        );
        setUser(sessionUser);
        return sessionUser;
      }
    }

    return null;
  };

  const normalizeAppUrl = (url?: string): string | undefined => {
    if (!url?.trim()) {
      return undefined;
    }

    try {
      return new URL(url.trim()).href.replace(/\/$/, '');
    } catch (error) {
      console.warn('Invalid NEXT_PUBLIC_APP_URL value:', url, error);
      return undefined;
    }
  };

  const getOAuthRedirectBase = (): string | undefined => {
    const envAppUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
    if (envAppUrl) {
      return envAppUrl;
    }

    if (typeof window !== 'undefined') {
      return window.location.origin.replace(/\/$/, '');
    }

    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
    }

    return undefined;
  };

  const buildOAuthRedirectUri = (redirectPath = '/agent-builder'): string | undefined => {
    if (/^https?:\/\//i.test(redirectPath)) {
      return redirectPath.replace(/\/$/, '');
    }

    const baseUrl = getOAuthRedirectBase();
    if (!baseUrl) {
      console.warn(
        'Unable to determine OAuth redirect base URL. Supabase will use the default redirect behavior.'
      );
      return undefined;
    }

    const path = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
    return `${baseUrl}${path}`;
  };

  const signInWithGoogle = async (
    redirectPath = '/agent-builder'
  ): Promise<string | SupabaseUser | null> => {
    const redirectTo = buildOAuthRedirectUri(redirectPath);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes:
          'openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets',
      },
    });

    if (error) {
      console.error('Google sign in error:', error);
      throw new Error(
        getFriendlyAuthError(
          normalizeAuthError(error),
          'Failed to sign in with Google. Please try again.'
        )
      );
    }

    if (data?.url && typeof window !== 'undefined') {
      window.location.href = data.url;
      return null;
    }

    return null;
  };

  const signInWithGoogleForService = async (
    service: string,
    nodeId?: string
  ): Promise<{ access_token: string; refresh_token?: string } | null> => {
    let scopes = 'openid email profile';

    switch (service) {
      case 'gmail':
        scopes +=
          ' https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';
        break;
      case 'sheets':
        scopes +=
          ' https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly';
        break;
      case 'drive':
        scopes +=
          ' https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file';
        break;
      case 'calendar':
        scopes +=
          ' https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
        break;
      default:
        scopes +=
          ' https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets';
    }

    const redirectUri = buildOAuthRedirectUri(
      `/agent-builder?oauth_service=${encodeURIComponent(service)}${
        nodeId ? `&oauth_node=${encodeURIComponent(nodeId)}` : ''
      }`
    );

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        scopes,
      },
    });

    if (error) {
      console.error('Google service sign in error:', error);
      throw new Error(
        getFriendlyAuthError(
          normalizeAuthError(error),
          `Failed to sign in with Google for ${service}. Please try again.`
        )
      );
    }

    if (data?.url) {
      window.location.href = data.url;
      return null;
    }

    return null;
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error('Sign out failed.');
    }
    setUser(null);
  };

  const ensureUserProfile = async (userId: string, email: string, fullName: string = '') => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        // Profile exists, update updated_at
        await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', userId);
        return;
      }

      // Profile doesn't exist, create it
      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        email,
        full_name: fullName,
        role: 'user', // Default role
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('Error creating user profile:', insertError);
      } else {
        console.log('User profile created successfully');
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGoogleForService,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
