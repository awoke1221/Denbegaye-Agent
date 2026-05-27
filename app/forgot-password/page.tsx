'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
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
    <div className="relative min-h-screen overflow-hidden bg-[#02040f] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute right-0 top-1/4 h-[420px] w-[420px] translate-x-1/4 rounded-full bg-[radial-gradient(circle,_rgba(168,85,247,0.16),transparent_48%)] blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-16">
        <div className="grid gap-10 rounded-[2rem] border border-white/10 bg-slate-950/75 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl p-6 lg:grid-cols-[1.3fr_1fr] lg:p-0">
          <div className="flex flex-col justify-center gap-8 rounded-[2rem] bg-slate-950/90 px-8 py-10 lg:px-10 lg:py-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
              Password help
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Reset your password
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Enter the email address associated with your account and we’ll send you a secure
                link to reset your password.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="font-semibold text-slate-100">Why reset?</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  <li>• Recover access quickly and securely</li>
                  <li>• Your account is protected </li>
                </ul>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="font-semibold text-slate-100">What to expect</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  <li>• A reset link will be emailed to you</li>
                  <li>• Link expires after a short time</li>
                  <li>• Use the new password on your next login</li>
                </ul>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-slate-950/95 shadow-none">
            <CardHeader className="bg-slate-900/90 px-8 py-7">
              <CardTitle className="text-3xl font-semibold">Forgot password</CardTitle>
              <CardDescription className="text-slate-400">
                Reset access using a secure password recovery email.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 py-8 sm:px-10 sm:py-10">
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

                <div className="space-y-3">
                  <Label htmlFor="forgot-email">Email address</Label>
                  <Input
                    id="forgot-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="bg-slate-950/95 text-white"
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
                <Link href="/login" className="font-medium text-cyan-300 hover:text-cyan-200">
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
