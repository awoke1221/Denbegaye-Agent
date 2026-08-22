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
    <div className="relative min-h-screen overflow-hidden bg-[#020817] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(15,23,42,0.9)] backdrop-blur-xl lg:grid-cols-[1.15fr_0.95fr]">
          <div className="flex flex-col justify-between bg-slate-950/80 px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <LockKeyhole className="h-3.5 w-3.5" />
                Password help
              </div>

              <div className="space-y-5">
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                  Reset your password
                </h1>
                <p className="max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
                  Enter the email tied to your account, and we’ll send a secure recovery link so you
                  can regain access quickly.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-white">Secure recovery</p>
                <p className="mt-2 text-sm text-slate-300">
                  Protected by secure reset links and verified ownership checks.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                  <Send className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-white">Fast delivery</p>
                <p className="mt-2 text-sm text-slate-300">
                  Expect a reset email in just a few moments.
                </p>
              </div>
            </div>
          </div>

          <Card className="border-0 bg-slate-900/90 shadow-none">
            <CardHeader className="px-6 pb-4 pt-7 sm:px-8">
              <CardTitle className="text-3xl font-bold text-white">Forgot password</CardTitle>
              <CardDescription className="mt-2 text-slate-400">
                Reset access using a secure password recovery email.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                  >
                    {error}
                  </div>
                ) : null}
                {message ? (
                  <div
                    role="status"
                    className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
                  >
                    {message}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-slate-200">
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
                    className="border-slate-700 bg-slate-950/90 text-white placeholder:text-slate-500"
                    required
                    disabled={sending}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 px-5 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={sending}
                  aria-busy={sending}
                >
                  {sending ? 'Sending reset link...' : 'Send reset link'}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-400">
                Remembered your password?{' '}
                <Link
                  href="/login"
                  className="font-medium text-cyan-300 transition hover:text-cyan-200"
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
