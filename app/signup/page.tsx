'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { z } from 'zod';
import { PasswordField } from '@/app/signup/components/PasswordField';
import { SignupProtectionPanel } from '@/app/signup/components/SignupProtectionPanel';
import { useSignupProtection } from '@/app/signup/hooks/useSignupProtection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { validatePassword } from '@/lib/password-validation';

const SIGNUP_COOLDOWN_SECONDS = 60;

const emailSchema = z.string().trim().email({
  message: 'Please enter a valid email address, for example name@example.com.',
});

type EmailValidationResult = { success: true } | { success: false; message: string };

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    failedAttempts,
    isCoolingDown,
    cooldownSeconds,
    cooldownMessage,
    recordFailedAttempt,
    clearProtection,
  } = useSignupProtection();
  const [isMounted, setIsMounted] = useState(false);
  const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      const provider = user.app_metadata?.provider;

      if (
        user.email_confirmed_at ||
        (typeof provider === 'string' && ['google', 'github'].includes(provider))
      ) {
        router.replace('/agent-builder');
      } else {
        router.replace('/verify-email');
      }
    }
  }, [authLoading, user, router]);

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const normalizeEmail = (value: string) => value.trim().toLowerCase();
  const emailValidation = useMemo<EmailValidationResult>(() => {
    if (email.length === 0) {
      return { success: true };
    }

    const validation = emailSchema.safeParse(email);
    return validation.success
      ? { success: true }
      : {
          success: false,
          message: validation.error.errors[0]?.message ?? 'Please enter a valid email address.',
        };
  }, [email]);
  const isEmailValid = emailValidation.success;
  const emailValidationMessage = useMemo(() => {
    if (emailValidation.success) {
      return undefined;
    }

    return emailValidation.message;
  }, [emailValidation]);
  const isAuthInitializing = !isMounted || authLoading;

  // Protection state is managed by `useSignupProtection` hook

  if (isAuthInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#02040f] text-white">
        <div className="rounded-3xl border border-white/10 bg-slate-950/90 px-8 py-10 text-center shadow-2xl shadow-cyan-950/20">
          <p className="text-lg font-semibold mb-2">Checking your authentication state…</p>
          <p className="text-sm text-slate-400">
            Please wait while we prepare your signup experience.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) {
      return;
    }

    if (isCoolingDown) {
      const message = `Too many signup attempts. Please wait ${cooldownSeconds} second${
        cooldownSeconds === 1 ? '' : 's'
      } before retrying.`;
      setSubmissionErrors([message]);
      toast({
        title: 'Signup paused',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    setSubmissionErrors([]);

    const normalizedEmail = normalizeEmail(email);
    const parsedEmail = emailSchema.safeParse(normalizedEmail);

    if (!parsedEmail.success) {
      const message =
        parsedEmail.error.errors[0]?.message ??
        'Please enter a valid email address, for example name@example.com.';
      setSubmissionErrors([message]);
      toast({
        title: 'Invalid email address',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      const message = 'Passwords do not match. Please confirm your password exactly.';
      setSubmissionErrors([message]);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    if (!passwordValidation.isValid) {
      const message =
        'Your password must meet all of the requirements below before creating an account.';
      setSubmissionErrors(passwordValidation.errors);
      toast({
        title: 'Weak password',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const newUser = await signUp(normalizedEmail, password);
      clearProtection();
      toast({
        title: 'Success',
        description: 'Account created successfully, check your email for verification',
      });

      if (newUser && !newUser.email_confirmed_at) {
        router.replace('/verify-email');
      } else {
        router.replace('/agent-builder');
      }
    } catch (error: unknown) {
      const defaultMessage = 'Failed to create account. Please try again.';
      let message = defaultMessage;

      if (error instanceof Error) {
        message = error.message || defaultMessage;

        if (/too many requests|rate limit|429/i.test(error.message)) {
          message = `We’re pausing signup temporarily to protect against abuse. Please try again in ${SIGNUP_COOLDOWN_SECONDS} seconds.`;
        }
      }

      recordFailedAttempt();
      setSubmissionErrors([message]);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading) {
      return;
    }

    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Redirect is handled by Supabase OAuth
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to sign up with Google. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02040f] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute right-0 top-1/4 h-[420px] w-[420px] translate-x-1/4 rounded-full bg-[radial-gradient(circle,_rgba(168,85,247,0.16),transparent_48%)] blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-16">
        <div className="grid gap-10 rounded-[2rem] border border-white/10 bg-slate-950/75 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl p-6 lg:grid-cols-[1.3fr_1fr] lg:p-0">
          <div className="flex flex-col justify-center gap-8 rounded-[2rem] bg-slate-950/90 px-8 py-10 lg:px-10 lg:py-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
              <Sparkles className="h-4 w-4" />
              Secure signup with email or Google
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Build your Digital Employee account
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Sign up fast, store your workflows, and unlock AI-powered Work automations in one
                secure place.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="font-semibold text-slate-100">Why sign up?</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  <li>• Save workflows and templates</li>
                  <li>• Secure access with email verification</li>
                  <li>• Free starter tier with upgrades</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="font-semibold text-slate-100">Quick setup</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  <li>• Use a strong password with symbols</li>
                  <li>• Verify your email after signup</li>
                  <li>• Save time with Google signup</li>
                </ul>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-slate-950/95 shadow-none">
            <CardHeader className="bg-slate-900/90 px-8 py-7">
              <CardTitle className="text-3xl font-semibold">Create your account</CardTitle>
              <CardDescription className="text-slate-400">
                One account to manage your AI agents and automation tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 py-8 sm:px-10 sm:py-10">
              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
                <Button
                  style={{
                    background: '#ffffff',
                    color: '#111827',
                    borderColor: '#e5e7eb',
                  }}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={handleGoogleSignIn}
                  type="button"
                  disabled={googleLoading || loading}
                  aria-disabled={googleLoading || loading}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
                      <span className="sr-only">Signing in with Google</span>
                    </>
                  ) : (
                    <>
                      <Image
                        src="/google-icon.svg"
                        alt="Google"
                        width={20}
                        height={20}
                        className="h-5 w-5"
                      />
                    </>
                  )}
                  <span className="ml-2">
                    {googleLoading ? 'Signing in with Google' : 'Continue with Google'}
                  </span>
                </Button>

                <div className="relative">
                  <div className="absolute inset-x-0 top-1/2 flex items-center">
                    <span className="mx-auto h-px w-full max-w-xs bg-slate-700" />
                  </div>
                  <div className="relative z-10 mx-auto w-fit rounded-full bg-slate-950 px-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                    Or sign up with email
                  </div>
                </div>

                <SignupProtectionPanel
                  cooldownMessage={cooldownMessage}
                  failedAttempts={failedAttempts}
                  cooldownSeconds={cooldownSeconds}
                />

                {submissionErrors.length > 0 && (
                  <div
                    id="form-error-summary"
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                    className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100"
                  >
                    <p className="font-semibold text-rose-200">Please fix the following issues:</p>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      {submissionErrors.map(error => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="bg-slate-950/95 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      required
                      disabled={loading || isCoolingDown}
                      aria-invalid={!!(email.length > 0 && !isEmailValid)}
                      aria-describedby={
                        email.length > 0 && !isEmailValid
                          ? 'email-error form-error-summary'
                          : undefined
                      }
                    />
                    {email.length > 0 && !isEmailValid && (
                      <p id="email-error" role="alert" className="text-sm text-rose-300">
                        {emailValidationMessage ??
                          'Please enter a valid email address like name@example.com.'}
                      </p>
                    )}
                  </div>

                  <PasswordField
                    id="password"
                    name="password"
                    label="Password"
                    value={password}
                    placeholder="Create a secure password"
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading || isCoolingDown}
                    hasError={password.length > 0 && !passwordValidation.isValid}
                    ariaDescribedBy={`password-requirements ${
                      submissionErrors.length > 0 ? 'form-error-summary' : ''
                    }`.trim()}
                  />

                  <PasswordField
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm password"
                    value={confirmPassword}
                    placeholder="Confirm your password"
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={loading || isCoolingDown}
                    hasError={confirmPassword.length > 0 && password !== confirmPassword}
                    errorMessage={
                      confirmPassword.length > 0 && password !== confirmPassword
                        ? 'Passwords do not match. Please confirm your password exactly.'
                        : undefined
                    }
                    ariaDescribedBy={
                      confirmPassword.length > 0 && password !== confirmPassword
                        ? 'confirm-error form-error-summary'
                        : undefined
                    }
                  />
                </div>

                <div
                  id="password-requirements"
                  aria-live="polite"
                  className="rounded-3xl border border-slate-800 bg-slate-900/95 p-4 text-sm text-slate-300"
                >
                  <p className="mb-3 font-semibold text-slate-100">Password requirements</p>
                  <div className="space-y-3">
                    {passwordValidation.requirements.map(requirement => (
                      <div key={requirement.key} className="flex items-center gap-3">
                        {requirement.met ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400" />
                        )}
                        <span className={requirement.met ? 'text-slate-200' : 'text-slate-400'}>
                          {requirement.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 px-5 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-75"
                  disabled={loading || isCoolingDown}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-slate-950/90" />
                      <span>Creating account...</span>
                      <span className="sr-only" aria-live="polite">
                        Creating account, please wait.
                      </span>
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>

                <p className="text-center text-sm text-slate-400">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-cyan-300 hover:text-cyan-200">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
