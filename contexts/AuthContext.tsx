'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { validatePassword } from '@/lib/password-validation';

interface SupabaseUser {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  created_at?: string;
  last_sign_in_at?: string | null;
  photoURL?: string;
  app_metadata?: any;
  user_metadata?: any;
}

interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SupabaseUser | null>;
  signUp: (email: string, password: string) => Promise<SupabaseUser | null>;
  signInWithGoogle: () => Promise<string | SupabaseUser | null>;
  signInWithGoogleForService: (
    service: string,
    nodeId?: string
  ) => Promise<{ access_token: string; refresh_token?: string } | null>;
  signOut: () => Promise<void>;
}

/**
 * ✅ FIX: Properly typed default functions
 */
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

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // First, try to get the stored session
        const result = await supabase.auth.getSession();

        if (!mounted) return;

        if (result.data.session?.user) {
          setUser(result.data.session.user as SupabaseUser);
          setLoading(false);
          return;
        } else {
          setUser(null);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (session?.user) {
        // Ensure user profile exists when user signs in
        ensureUserProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.full_name || ''
        );
        setUser(session.user as SupabaseUser);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<SupabaseUser | null> => {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      switch (error.status) {
        case 400:
        case 401:
          throw new Error('Invalid email or password. Please try again.');
        case 429:
          throw new Error('Too many requests, please try again later.');
        default:
          throw new Error(error.message || 'Failed to sign in.');
      }
    }

    if (data.user) {
      if (
        !data.user.email_confirmed_at &&
        data.user.app_metadata?.provider !== 'google' &&
        data.user.app_metadata?.provider !== 'github'
      ) {
        throw new Error('Please verify your email before signing in.');
      }

      // Ensure user profile exists
      await ensureUserProfile(
        data.user.id,
        data.user.email || '',
        data.user.user_metadata?.full_name || ''
      );

      setUser(data.user as SupabaseUser);
      return data.user as SupabaseUser;
    }

    return null;
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
      const message = (error.message || '').toLowerCase();

      if (error.status === 400) {
        if (message.includes('invalid email') || message.includes('invalid email address')) {
          throw new Error('Please enter a valid email address like name@example.com.');
        }

        if (
          message.includes('already registered') ||
          message.includes('already exists') ||
          message.includes('duplicate') ||
          message.includes('user already exists')
        ) {
          throw new Error(
            'An account with this email already exists. Please sign in or use a different email.'
          );
        }

        throw new Error(
          'Your email or password format is not valid. Please check the requirements.'
        );
      }

      throw new Error(error.message || 'Failed to create account.');
    }

    if (data.user) {
      // Create user profile
      await ensureUserProfile(
        data.user.id,
        data.user.email || '',
        data.user.user_metadata?.full_name || ''
      );

      setUser(data.user as SupabaseUser);
      return data.user as SupabaseUser;
    }

    return null;
  };

  const signInWithGoogle = async (): Promise<string | SupabaseUser | null> => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/verify-email` : undefined,
        scopes:
          'openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets',
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to sign in with Google.');
    }

    if (data?.url) {
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

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/agent-builder?oauth_service=${encodeURIComponent(
            service
          )}${nodeId ? `&oauth_node=${encodeURIComponent(nodeId)}` : ''}`
        : undefined;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes,
      },
    });

    if (error) {
      throw new Error(error.message || `Failed to sign in with Google for ${service}.`);
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
      const { data: existingProfile, error: fetchError } = await supabase
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
