'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const completeEmailConfirmation = async () => {
      const errorDescription = searchParams.get('error_description');
      if (errorDescription) {
        if (!cancelled) {
          setErrorMessage(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
        }
        return;
      }

      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const tokenType = searchParams.get('type');
      if (tokenHash && (tokenType === 'signup' || tokenType === 'magiclink')) {
        const { error } = await supabase.auth.verifyOtp({
          type: tokenType,
          token_hash: tokenHash,
        });
        if (cancelled) return;
        if (error) {
          setErrorMessage('This confirmation link is invalid or has expired.');
          return;
        }

        if (!cancelled) {
          setSuccessMessage('Email verified successfully. Redirecting to login...');
          redirectTimer = setTimeout(() => {
            router.replace('/login');
          }, 1500);
        }
        return;
      }

      if (!code) {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          if (data.session?.user?.email_confirmed_at) {
            setSuccessMessage('Email verified successfully. Redirecting to login...');
            redirectTimer = setTimeout(() => {
              router.replace('/login');
            }, 1500);
          } else {
            router.replace('/login');
          }
        }
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;

      if (error) {
        setErrorMessage('This confirmation link is invalid or has expired.');
        return;
      }

      if (!cancelled) {
        setSuccessMessage('Email verified successfully. Redirecting to login...');
        redirectTimer = setTimeout(() => {
          router.replace('/login');
        }, 1500);
      }
    };

    void completeEmailConfirmation();

    return () => {
      cancelled = true;
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [router, searchParams]);

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-6 text-center text-[var(--text-primary)]">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold">Email confirmation failed</h1>
          <p className="text-[var(--text-secondary)]">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.replace('/verify-email')}
            className="rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm font-semibold text-[var(--button-text)]"
          >
            Return to verification
          </button>
        </div>
      </main>
    );
  }

  if (successMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-6 text-center text-[var(--text-primary)]">
        <div className="max-w-md space-y-5 rounded-[2rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.8)] p-8 shadow-[0_40px_120px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 3" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Email verified successfully</h1>
            <p className="text-[var(--text-secondary)]">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="w-full rounded-xl bg-[var(--button-bg)] px-4 py-3 text-sm font-semibold text-[var(--button-text)] transition hover:opacity-95"
          >
            Continue to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Confirming your email...
      </div>
    </main>
  );
}
