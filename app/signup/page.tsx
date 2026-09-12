'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Bot,
  Zap,
} from 'lucide-react';
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
  const [isMounted, setIsMounted] = useState(false);

  const {
    failedAttempts,
    isCoolingDown,
    cooldownSeconds,
    cooldownMessage,
    recordFailedAttempt,
    clearProtection,
  } = useSignupProtection();

  const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth();

  const { toast } = useToast();
  const router = useRouter();

  /**
   * Normalize email before sending it to Supabase.
   */
  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  /**
   * Prevent hydration mismatch.
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Redirect authenticated users.
   *
   * Google/GitHub users can go directly to the agent builder.
   * Email/password users need email verification first.
   */
  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const provider = user.app_metadata?.provider;

    const isOAuthUser = typeof provider === 'string' && ['google', 'github'].includes(provider);

    const isEmailConfirmed = Boolean(user.email_confirmed_at);

    if (isEmailConfirmed || isOAuthUser) {
      router.replace('/agent-builder');
      return;
    }

    if (user.email) {
      router.replace(`/verify-email?email=${encodeURIComponent(normalizeEmail(user.email))}`);
    }
  }, [authLoading, user, router]);

  /**
   * Password validation.
   */
  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  /**
   * Email validation.
   */
  const emailValidation = useMemo<EmailValidationResult>(() => {
    if (email.length === 0) {
      return { success: true };
    }

    const validation = emailSchema.safeParse(email);

    if (validation.success) {
      return { success: true };
    }

    return {
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

  /**
   * Email/password signup.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    /**
     * Prevent repeated requests while protection is active.
     */
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

    /**
     * Normalize and validate email.
     */
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

    /**
     * Confirm password.
     */
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

    /**
     * Validate password strength.
     */
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
      /**
       * Create Supabase account.
       */
      const newUser = await signUp(normalizedEmail, password);

      /**
       * Signup succeeded, so reset client-side protection.
       */
      clearProtection();

      toast({
        title: 'Success',
        description: 'Account created successfully. Please check your email for verification.',
      });

      /**
       * Supabase may return an unconfirmed user when
       * email confirmation is enabled.
       */
      if (newUser && !newUser.email_confirmed_at) {
        router.replace(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
      } else {
        router.replace('/agent-builder');
      }
    } catch (error: unknown) {
      const defaultMessage = 'Failed to create account. Please try again.';

      let message = defaultMessage;

      if (error instanceof Error) {
        message = error.message || defaultMessage;

        /**
         * Give a clearer message for Supabase rate limits.
         */
        if (/too many requests|rate limit|429/i.test(error.message)) {
          message = `We’re pausing signup temporarily to protect against abuse. Please try again in ${SIGNUP_COOLDOWN_SECONDS} seconds.`;
        }
      }

      /**
       * Record failed signup attempt.
       */
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

  /**
   * Google OAuth signup/login.
   */
  const handleGoogleSignIn = async () => {
    if (googleLoading || loading) {
      return;
    }

    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to sign up with Google. Please try again.',
        variant: 'destructive',
      });

      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.04),transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(17,24,39,0.03),transparent_28%)]" />

      <div className="pointer-events-none absolute right-8 top-20 h-72 w-72 rounded-full bg-[rgba(17,24,39,0.03)] blur-3xl" />

      <div className="pointer-events-none absolute bottom-8 left-12 h-64 w-64 rounded-full bg-[rgba(17,24,39,0.04)] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.8)] shadow-[0_40px_120px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:grid-cols-[1.15fr_0.95fr]">
          {/* Left side */}
          <div className="flex flex-col justify-between bg-[rgba(255,255,255,0.72)] px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                <Sparkles className="h-3.5 w-3.5" />
                New workspace
              </div>

              <div className="space-y-5">
                <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
                  Create your account
                </h1>

                <p className="max-w-lg text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                  Start building AI-powered automations with secure workflows, templates, and a
                  collaborative system that scales with your business.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.6)] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                  <Bot className="h-5 w-5" />
                </div>

                <p className="text-base font-semibold text-[var(--text-primary)]">Save workflows</p>

                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Keep every automation in one place
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.6)] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                  <Zap className="h-5 w-5" />
                </div>

                <p className="text-base font-semibold text-[var(--text-primary)]">Launch fast</p>

                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Move from idea to execution in minutes
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <ShieldCheck className="h-4 w-4 text-[var(--text-primary)]" />
              Protected by secure email verification and strong password policies
            </div>
          </div>

          {/* Right side */}
          <Card className="border-0 bg-[rgba(255,255,255,0.9)] shadow-none">
            <CardHeader className="px-6 pb-4 pt-7 sm:px-8">
              <CardTitle className="text-3xl font-bold text-[var(--text-primary)]">
                Start free
              </CardTitle>

              <CardDescription className="mt-2 text-[var(--text-secondary)]">
                One account for your agents, workflows, and automation tools.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-8 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
                {/* Auth loading */}
                {isAuthInitializing ? (
                  <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                    Checking your authentication state. If you are already signed in, you will be
                    redirected shortly.
                  </div>
                ) : null}

                {/* Google button */}
                <Button
                  style={{
                    background: '#ffffff',
                    color: '#111827',
                    borderColor: '#e5e7eb',
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
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
                    <Image
                      src="/google-icon.svg"
                      alt="Google"
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                  )}

                  <span className="ml-2">
                    {googleLoading ? 'Signing in with Google' : 'Continue with Google'}
                  </span>
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-x-0 top-1/2 flex items-center">
                    <span className="mx-auto h-px w-full max-w-xs bg-[var(--border-default)]" />
                  </div>

                  <div className="relative z-10 mx-auto w-fit rounded-full bg-[var(--bg-subtle)] px-3 text-[10px] font-medium uppercase tracking-[0.25em] text-[var(--text-tertiary)]">
                    Or sign up with email
                  </div>
                </div>

                {/* Signup protection */}
                <SignupProtectionPanel
                  cooldownMessage={cooldownMessage}
                  failedAttempts={failedAttempts}
                  cooldownSeconds={cooldownSeconds}
                />

                {/* Errors */}
                {submissionErrors.length > 0 && (
                  <div
                    id="form-error-summary"
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                    className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100"
                  >
                    <p className="font-semibold text-rose-200">Please fix the following issues:</p>

                    <ul className="mt-2 list-inside list-disc space-y-1">
                      {submissionErrors.map(error => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[var(--text-primary)]">
                      Email address
                    </Label>

                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] disabled:cursor-not-allowed disabled:opacity-60"
                      required
                      disabled={loading || isCoolingDown}
                      aria-invalid={email.length > 0 && !isEmailValid}
                      aria-describedby={
                        email.length > 0 && !isEmailValid
                          ? 'email-error form-error-summary'
                          : undefined
                      }
                    />

                    {email.length > 0 && !isEmailValid && (
                      <p id="email-error" role="alert" className="text-sm text-red-600">
                        {emailValidationMessage ??
                          'Please enter a valid email address like name@example.com.'}
                      </p>
                    )}
                  </div>

                  {/* Password */}
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

                  {/* Confirm password */}
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

                {/* Password requirements */}
                <div
                  id="password-requirements"
                  aria-live="polite"
                  className="rounded-3xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]"
                >
                  <p className="mb-3 font-semibold text-[var(--text-primary)]">
                    Password requirements
                  </p>

                  <div className="space-y-3">
                    {passwordValidation.requirements.map(requirement => (
                      <div key={requirement.key} className="flex items-center gap-3">
                        {requirement.met ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}

                        <span
                          className={
                            requirement.met
                              ? 'text-[var(--text-primary)]'
                              : 'text-[var(--text-tertiary)]'
                          }
                        >
                          {requirement.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 px-5 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-75"
                  disabled={loading || isCoolingDown || googleLoading}
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
                    <span className="inline-flex items-center gap-2">
                      Create account
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                {/* Login link */}
                <p className="text-center text-sm text-[var(--text-secondary)]">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-medium text-[var(--text-primary)] transition hover:text-[var(--text-secondary)]"
                  >
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
