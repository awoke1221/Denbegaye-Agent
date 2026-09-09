'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Send, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const getResetRedirectUrl = () => {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (explicitUrl) {
    return `${explicitUrl}/reset-password`;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/reset-password`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/reset-password`;
  }

  return undefined;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setSending(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: getResetRedirectUrl(),
    });

    if (resetError) {
      setError('Unable to send reset email. Please try again or contact support.');
      toast({
        title: 'Reset request failed',
        description: 'Unable to send password reset email.',
        variant: 'destructive',
      });
    } else {
      setMessage(
        'If an account exists for that email, we sent a password reset link. Check your inbox and follow the instructions.'
      );
      toast({
        title: 'Reset email sent',
        description: 'Check your email for the password reset link.',
      });
    }

    setSending(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.04),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(17,24,39,0.03),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.8)] shadow-[0_40px_120px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:grid-cols-[1.15fr_0.95fr]">
          <div className="flex flex-col justify-between bg-[rgba(255,255,255,0.7)] px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Password help
              </div>

              <div className="space-y-5">
                <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
                  Reset your password
                </h1>
                <p className="max-w-lg text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                  Enter the email tied to your account, and we’ll send a secure recovery link so you
                  can regain access quickly.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.62)] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  Secure recovery
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Protected by secure reset links and verified ownership checks.
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.62)] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                  <Send className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)]">Fast delivery</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Expect a reset email in just a few moments.
                </p>
              </div>
            </div>
          </div>

          <Card className="border-0 bg-[rgba(255,255,255,0.9)] shadow-none">
            <CardHeader className="px-6 pb-4 pt-7 sm:px-8">
              <CardTitle className="text-3xl font-bold text-[var(--text-primary)]">
                Forgot password
              </CardTitle>
              <CardDescription className="mt-2 text-[var(--text-secondary)]">
                Reset access using a secure password recovery email.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                ) : null}
                {message ? (
                  <div
                    role="status"
                    className="rounded-2xl border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                  >
                    {message}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-[var(--text-primary)]">
                    Email address
                  </Label>
                  <Input
                    id="forgot-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    required
                    disabled={sending}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-2xl bg-[var(--button-bg)] px-5 py-4 text-sm font-semibold text-[var(--button-text)] shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={sending}
                  aria-busy={sending}
                >
                  {sending ? 'Sending reset link...' : 'Send reset link'}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
                Remembered your password?{' '}
                <Link
                  href="/login"
                  className="font-medium text-[var(--text-primary)] transition hover:text-[var(--text-secondary)]"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
