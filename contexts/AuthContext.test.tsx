import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
};

jest.mock('../lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('AuthContext', () => {
  const mockRouter = { push: jest.fn(), replace: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
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
    expect(result.current).toHaveProperty('signInWithGitHub');
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

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockSession.user);
  });

  it('handles sign in successfully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const signInResult = await result.current.signIn('test@example.com', 'password');
      expect(signInResult.success).toBe(true);
      expect(signInResult.user).toEqual(mockUser);
    });
  });

  it('handles sign in error', async () => {
    const mockError = { message: 'Invalid credentials' };
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: mockError,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const signInResult = await result.current.signIn('test@example.com', 'wrong-password');
      expect(signInResult.success).toBe(false);
      expect(signInResult.error).toBe('Invalid credentials');
    });
  });

  it('handles sign up successfully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const signUpResult = await result.current.signUp('test@example.com', 'password');
      expect(signUpResult.success).toBe(true);
      expect(signUpResult.user).toEqual(mockUser);
    });
  });

  it('handles OAuth sign in', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://auth.example.com' },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
      },
    });
  });

  it('handles sign out', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const signOutResult = await result.current.signOut();
      expect(signOutResult.success).toBe(true);
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
