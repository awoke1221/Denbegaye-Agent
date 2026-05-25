import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';

import { supabase } from '@/lib/supabaseClient';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure the stubbed client methods are jest mocks we can control
    supabase.auth.getSession = jest
      .fn()
      .mockResolvedValue({ data: { session: null }, error: null });
    supabase.auth.signInWithPassword = jest.fn();
    supabase.auth.signUp = jest.fn();
    supabase.auth.signInWithOAuth = jest.fn();
    supabase.auth.signOut = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('provides auth context to children', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('signIn');
    expect(result.current).toHaveProperty('signUp');
    expect(result.current).toHaveProperty('signOut');
    expect(result.current).toHaveProperty('signInWithGoogle');
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('loads session on mount', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token-123',
    };

    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for useEffect state updates
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(mockSession.user);
  });

  it('handles sign in successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      app_metadata: {},
    };
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const signInResult = await result.current.signIn('test@example.com', 'Test123!');
      // signIn returns the user on success
      expect(signInResult).toEqual(mockUser);
    });
  });

  it('handles sign in error', async () => {
    const mockError = { message: 'Invalid credentials', status: 401 };
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: mockError,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(result.current.signIn('test@example.com', 'wrong-password')).rejects.toThrow(
        'Invalid email or password. Please try again.'
      );
    });
  });

  it('handles sign up successfully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    supabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const signUpResult = await result.current.signUp('test@example.com', 'Test123!');
      // signUp returns the user on success
      expect(signUpResult).toEqual(mockUser);
    });
  });

  it('handles OAuth sign in', async () => {
    // Return empty data to avoid jsdom navigation
    supabase.auth.signInWithOAuth.mockResolvedValue({
      data: {},
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.any(Object),
    });
  });

  it('handles sign out', async () => {
    supabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(result.current.signOut()).resolves.toBeUndefined();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('returns default context when used outside provider', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });
});
