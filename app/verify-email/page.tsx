'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { extractAvatarInitials, getUserDisplayName } from '@/lib/avatar-utils';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    'Your account is waiting for email verification.'
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const emailFromUrl = searchParams.get('email')?.trim().toLowerCase() || '';

  const isUserVerified = (candidate: any) => {
    if (!candidate) return false;
    return (
      Boolean(candidate.email_confirmed_at) ||
      ['google', 'github'].includes(candidate.app_metadata?.provider ?? '')
    );
  };

  const handleVerifiedTransition = () => {
    setIsVerified(true);
    setStatusMessage('Your email has been verified successfully.');
  };

  const loadUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        if (emailFromUrl) {
          setUser({ email: emailFromUrl });
          setIsLoading(false);
          setStatusMessage('We found your email address. Please confirm it to finish setup.');
          return;
        }
        toast({
          title: 'Not signed in',
          description: 'Please login or sign up first.',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      setUser(data.user);

      if (isUserVerified(data.user)) {
        setStatusMessage(
          'Your email looks verified already. Please use the check status button to confirm.'
        );
        setIsLoading(false);
        return;
      }

      setStatusMessage('A confirmation email is waiting for you.');
      setIsLoading(false);
    } catch (err) {
      console.error('loadUser error:', err);
      toast({
        title: 'Not signed in',
        description: 'Please login or sign up first.',
        variant: 'destructive',
      });
      router.push('/login');
    }
  };

  useEffect(() => {
    loadUser();
  }, [emailFromUrl]);

  const resendVerification = async () => {
    if (!user?.email) return;
    setSending(true);

    const response = await fetch('/api/auth/resend-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    });
    const result = await response.json().catch(() => ({}));
    const error = response.ok
      ? null
      : new Error(result.error || 'Unable to resend confirmation email.');

    if (error) {
      toast({
        title: 'Failed to resend',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setStatusMessage('A fresh verification email is on the way.');
      toast({
        title: 'Verification email sent',
        description: 'Check your inbox and follow the verification link.',
      });
    }

    setSending(false);
  };

  const checkVerification = async () => {
    setChecking(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setChecking(false);
      return;
    }

    setUser(data.user);

    if (isUserVerified(data.user)) {
      handleVerifiedTransition();
      setStatusMessage('Your email has been verified successfully.');
      toast({
        title: 'Email verified',
        description: 'Verification successful. Redirecting to login...',
      });
      router.replace('/login');
      setChecking(false);
      return;
    }

    setStatusMessage('Your email is still pending verification.');
    setChecking(false);
  };

  const continueToLogin = () => {
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)]">
        <div className="rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.72)] px-8 py-6 text-sm text-[var(--text-secondary)]">
          Checking account status…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.04),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(17,24,39,0.03),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.8)] shadow-[0_40px_120px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="border-b border-[var(--border-default)] bg-[rgba(255,255,255,0.7)] p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                <MailCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  Secure access
                </p>
                <h1 className="mt-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                  Verify your email
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.64)] p-4">
              <Avatar className="h-12 w-12 border border-[var(--border-default)]">
                <AvatarImage
                  src={
                    user?.user_metadata?.avatar_url ||
                    user?.user_metadata?.picture ||
                    user?.photoURL ||
                    undefined
                  }
                  alt={getUserDisplayName(user) || 'User'}
                />
                <AvatarFallback className="bg-[var(--bg-soft)] text-[var(--text-primary)]">
                  {extractAvatarInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Signed in as</p>
                <p className="font-medium text-[var(--text-primary)]">{getUserDisplayName(user)}</p>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 text-sm ${
                isVerified
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700'
                  : 'border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4" />
                {isVerified ? 'Verification complete' : 'Verification required'}
              </div>
              <p className="mt-2 leading-6 text-current/90">{statusMessage}</p>
            </div>

            {!isVerified ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={resendVerification}
                  disabled={sending}
                  className="flex-1 border-[var(--border-default)] bg-[rgba(255,255,255,0.7)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${sending ? 'animate-spin' : ''}`} />
                  {sending ? 'Sending...' : 'Resend email'}
                </Button>
                <Button
                  variant="default"
                  onClick={checkVerification}
                  disabled={checking}
                  className="flex-1 bg-[var(--button-bg)] text-[var(--button-text)] shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                >
                  {checking ? 'Checking...' : 'Check status'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="default"
                  onClick={continueToLogin}
                  className="flex-1 bg-[var(--button-bg)] text-[var(--button-text)] shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                >
                  Continue to login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              After verification, you will be redirected automatically to continue building your AI
              workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
