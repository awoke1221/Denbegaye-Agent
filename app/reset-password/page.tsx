'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
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

        if (!session?.user) {
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
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.04),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(17,24,39,0.03),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.8)] shadow-[0_40px_120px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:grid-cols-[1.15fr_0.95fr]">
          <div className="flex flex-col justify-between bg-[rgba(255,255,255,0.7)] px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Secure reset
              </div>

              <div className="space-y-5">
                <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
                  Choose a new password
                </h1>
                <p className="max-w-lg text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                  Create a strong password to keep your account protected. Once updated, you’ll be
                  ready to sign back in immediately.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.62)] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)]">Safe recovery</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Password recovery is verified in-browser before updates are applied.
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.62)] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  Ready to sign in
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Finish reset and continue where you left off.
                </p>
              </div>
            </div>
          </div>

          <Card className="border-0 bg-[rgba(255,255,255,0.9)] shadow-none">
            <CardHeader className="px-6 pb-4 pt-7 sm:px-8">
              <CardTitle className="text-3xl font-bold text-[var(--text-primary)]">
                Reset password
              </CardTitle>
              <CardDescription className="mt-2 text-[var(--text-secondary)]">
                Create a new password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8 sm:px-8">
              {isVerifying ? (
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-6 py-10 text-center text-[var(--text-secondary)]">
                  Checking your reset link…
                </div>
              ) : error ? (
                <div className="space-y-4">
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => router.replace('/forgot-password')}
                      className="border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    >
                      Request a new reset link
                    </Button>
                    <Link
                      href="/login"
                      className="text-center text-sm font-medium text-[var(--text-primary)] transition hover:text-[var(--text-secondary)]"
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
                      className="rounded-2xl border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                    >
                      {success}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="reset-password" className="text-[var(--text-primary)]">
                      New password
                    </Label>
                    <Input
                      id="reset-password"
                      name="password"
                      type="password"
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-[var(--text-primary)]">
                      Confirm password
                    </Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-2xl bg-[var(--button-bg)] px-5 py-4 text-sm font-semibold text-[var(--button-text)] shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    {submitting ? 'Updating password...' : 'Update password'}
                  </Button>

                  <p className="text-center text-sm text-[var(--text-secondary)]">
                    Remembered your password?{' '}
                    <Link
                      href="/login"
                      className="font-medium text-[var(--text-primary)] transition hover:text-[var(--text-secondary)]"
                    >
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
