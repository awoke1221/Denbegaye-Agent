'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

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
        router.replace('/agent-builder');
        return;
      }

      if (!code) {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          router.replace(data.session?.user?.email_confirmed_at ? '/agent-builder' : '/login');
        }
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;

      if (error) {
        setErrorMessage('This confirmation link is invalid or has expired.');
        return;
      }

      router.replace('/agent-builder');
    };

    void completeEmailConfirmation();

    return () => {
      cancelled = true;
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Confirming your email...
      </div>
    </main>
  );
}
