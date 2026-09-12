import { render, screen, waitFor } from '@testing-library/react';

const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams('token_hash=abc&type=signup'),
}));

jest.mock('@/lib/supabaseClient', () => {
  const mockVerifyOtp = jest.fn().mockResolvedValue({ error: null });

  return {
    supabase: {
      auth: {
        verifyOtp: mockVerifyOtp,
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }),
      },
    },
  };
});

import { supabase } from '@/lib/supabaseClient';
import AuthCallbackPage from '@/app/auth/callback/page';

describe('Auth callback page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({ error: null });
  });

  it('shows success and redirects to login after email verification succeeds', async () => {
    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Email verified successfully/i })
      ).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(replace).toHaveBeenCalledWith('/login');
      },
      { timeout: 2500 }
    );
  });
});
