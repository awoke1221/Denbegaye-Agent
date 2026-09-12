import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const replace = jest.fn();
const push = jest.fn();
const toast = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
  useSearchParams: () => new URLSearchParams('email=test@example.com'),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));

jest.mock('@/lib/supabaseClient', () => {
  const getUserMock = jest.fn();
  return {
    supabase: {
      auth: {
        getUser: getUserMock,
      },
    },
  };
});

import { supabase } from '@/lib/supabaseClient';
import VerifyEmailPage from '@/app/verify-email/page';

describe('Verify email page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sent: true }),
    });
    global.fetch = fetchMock as typeof fetch;
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          email: 'test@example.com',
          user_metadata: {},
          app_metadata: {},
        },
      },
      error: null,
    });
  });

  it('resends the verification email when the resend button is clicked', async () => {
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resend email/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /resend email/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/resend-confirmation',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Verification email sent',
      })
    );
  });

  it('checks verification status and redirects to login when the email is confirmed', async () => {
    (supabase.auth.getUser as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          user: {
            email: 'test@example.com',
            user_metadata: {},
            app_metadata: {},
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          user: {
            email: 'test@example.com',
            user_metadata: {},
            app_metadata: {},
            email_confirmed_at: '2026-01-01T00:00:00.000Z',
          },
        },
        error: null,
      });

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /check status/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /check status/i }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login');
    });
  });
});
