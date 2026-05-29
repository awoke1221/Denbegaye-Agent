'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const normalizePassword = (value: string) => value.trim();

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const verifyRecoverySession = async () => {
      setIsVerifying(true);
      setError(null);

      if (typeof window === 'undefined' || !(supabase.auth as any)?.getSessionFromUrl) {
        setError('Unable to verify the password reset link. Please request a new one.');
        setIsVerifying(false);
        return;
      }

      try {
        const result = await (supabase.auth as any).getSessionFromUrl();
        const session = result?.data?.session;

        if (session?.user) {
          setIsReady(true);
        } else {
          setError('The password reset link is invalid or has expired.');
        }
      } catch (fetchError) {
        console.error('Password reset verification failed:', fetchError);
        setError('The password reset link is invalid or has expired.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyRecoverySession();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedPassword = normalizePassword(password);
    const normalizedConfirm = normalizePassword(confirmPassword);

    if (!normalizedPassword || !normalizedConfirm) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (normalizedPassword !== normalizedConfirm) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    setSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({ password: normalizedPassword });

    if (updateError) {
      console.error('Password update failed:', updateError);
      setError('Unable to reset your password. Please try again or request a new link.');
      toast({
        title: 'Reset failed',
        description: 'Unable to update your password.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    setSuccess('Your password has been updated. You can now sign in with your new password.');
    toast({
      title: 'Password reset successful',
      description: 'Your account password was updated successfully.',
    });
    setSubmitting(false);

    setTimeout(() => {
      router.replace('/login');
    }, 3000);
  };

  return (
    <div className="relative min-h-screen overflow-hidden auth-root">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute right-0 top-1/4 h-[420px] w-[420px] translate-x-1/4 rounded-full bg-[radial-gradient(circle,_rgba(168,85,247,0.16),transparent_48%)] blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-16">
        <div className="grid gap-10 rounded-[2rem] border border-white/10 bg-slate-950/75 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl p-6 lg:grid-cols-[1.3fr_1fr] lg:p-0">
          <div className="flex flex-col justify-center gap-8 rounded-[2rem] bg-slate-950/90 px-8 py-10 lg:px-10 lg:py-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
              Secure reset
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Reset your password
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Finish resetting your password using the secure link we sent to your email. Once
                updated, you can sign in with your new password.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="font-semibold text-slate-100">Safe recovery</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  <li>• Token verification happens in your browser</li>
                  <li>• Password is updated directly in Supabase</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="font-semibold text-slate-100">Next steps</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  <li>• Enter a strong new password</li>
                  <li>• Confirm the password exactly</li>
                  <li>• Sign in again once reset is complete</li>
                </ul>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-slate-950/95 shadow-none">
            <CardHeader className="bg-slate-900/90 px-8 py-7">
              <CardTitle className="text-3xl font-semibold">Reset password</CardTitle>
              <CardDescription className="text-slate-400">
                Create a new password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 py-8 sm:px-10 sm:py-10">
              {isVerifying ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-6 py-10 text-center text-slate-300">
                  Checking your reset link…
                </div>
              ) : error ? (
                <div className="space-y-4">
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                  >
                    {error}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button variant="secondary" onClick={() => router.replace('/forgot-password')}>
                      Request a new reset link
                    </Button>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
                    >
                      Back to sign in
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {success ? (
                    <div
                      role="status"
                      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
                    >
                      {success}
                    </div>
                  ) : null}
                  {error ? (
                    <div
                      role="alert"
                      className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                    >
                      {error}
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <Label htmlFor="reset-password">New password</Label>
                    <Input
                      id="reset-password"
                      name="password"
                      type="password"
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="bg-slate-950/95 text-white"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="bg-slate-950/95 text-white"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 px-5 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    {submitting ? 'Updating password…' : 'Update password'}
                  </Button>

                  <p className="text-center text-sm text-slate-400">
                    Remembered your password?{' '}
                    <Link href="/login" className="font-medium text-cyan-300 hover:text-cyan-200">
                      Sign in
                    </Link>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
