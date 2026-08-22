'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Sparkles, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Bot, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useLoginProtection } from './hooks/useLoginProtection';
import { LoginProtectionPanel } from './components/LoginProtectionPanel';

const sanitizeAuthErrorMessage = (error: unknown) => {
  const fallback = 'Unable to sign in. Please check your credentials and try again.';

  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message) {
    return fallback;
  }

  if (/please verify your email/i.test(message)) {
    return 'Please verify your email before signing in.';
  }

  if (/invalid email or password|invalid login|credentials/i.test(message)) {
    return 'Invalid email or password. Please try again.';
  }

  if (/invalid email|email.*format/i.test(message)) {
    return 'Please enter a valid email address.';
  }

  if (/too many requests|rate limit|429/i.test(message)) {
    return 'Too many login attempts. Please try again later.';
  }

  return fallback;
};

const loginFormSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer')
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must contain letters and numbers'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const getLoginFieldErrors = (values: LoginFormValues) => {
  const parseResult = loginFormSchema.safeParse(values);

  if (parseResult.success) {
    return { email: undefined, password: undefined };
  }

  const { fieldErrors } = parseResult.error.flatten();

  return {
    email: fieldErrors.email?.[0],
    password: fieldErrors.password?.[0],
  };
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touchedFields, setTouchedFields] = useState<{ email?: boolean; password?: boolean }>({});
  const [isMounted, setIsMounted] = useState(false);
  const { user, loading: authLoading, signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const {
    cooldownMessage,
    cooldownSeconds,
    failedAttempts,
    isCoolingDown,
    recordFailedAttempt,
    clearProtection,
  } = useLoginProtection();
  const router = useRouter();
  const errorElementId = 'login-form-error';

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const validateLoginField = (field: keyof LoginFormValues, value: string) => {
    const validationValues: LoginFormValues = {
      email: field === 'email' ? value : normalizeEmail(email),
      password: field === 'password' ? value : password,
    };

    return getLoginFieldErrors(validationValues)[field];
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (touchedFields.email) {
      setFieldErrors(prev => ({
        ...prev,
        email: validateLoginField('email', value),
      }));
    }
  };

  const handleEmailBlur = () => {
    const normalized = normalizeEmail(email);
    setEmail(normalized);
    setTouchedFields(prev => ({ ...prev, email: true }));
    setFieldErrors(prev => ({
      ...prev,
      email: validateLoginField('email', normalized),
    }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    if (touchedFields.password) {
      setFieldErrors(prev => ({
        ...prev,
        password: validateLoginField('password', value),
      }));
    }
  };

  const handlePasswordBlur = () => {
    setTouchedFields(prev => ({ ...prev, password: true }));
    setFieldErrors(prev => ({
      ...prev,
      password: validateLoginField('password', password),
    }));
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || authLoading || !user) {
      return;
    }

    const providerCandidate = user.app_metadata?.provider;
    const provider = typeof providerCandidate === 'string' ? providerCandidate : '';

    if (user.email_confirmed_at || ['google', 'github'].includes(provider)) {
      router.replace('/agent-builder');
    } else {
      router.replace('/verify-email');
    }
  }, [authLoading, isMounted, router, user]);

  const isAuthInitializing = !isMounted || authLoading;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || authLoading || !isMounted || isCoolingDown) {
      if (isCoolingDown) {
        setFormError(
          cooldownMessage || 'Too many login attempts. Please wait a moment before retrying.'
        );
      }
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const validationErrors = getLoginFieldErrors({ email: normalizedEmail, password });
    const hasValidationErrors = Boolean(validationErrors.email || validationErrors.password);

    if (hasValidationErrors) {
      setTouchedFields({ email: true, password: true });
      setFieldErrors(validationErrors);
      setFormError('Please fix the highlighted fields before signing in.');
      return;
    }

    setFormError(null);
    setLoading(true);

    try {
      const normalizedEmail = normalizeEmail(email);
      const user = await signIn(normalizedEmail, password, rememberMe);
      clearProtection();
      setFieldErrors({});
      toast({
        title: 'Success',
        description: 'Logged in successfully.',
      });

      if (user && !user.email_confirmed_at) {
        router.replace('/verify-email');
      } else {
        router.replace('/agent-builder');
      }
    } catch (error: unknown) {
      const message = sanitizeAuthErrorMessage(error);
      recordFailedAttempt();
      setFormError(message);
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
    if (googleLoading || authLoading || !isMounted) {
      return;
    }

    setFormError(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const message = sanitizeAuthErrorMessage(error);
      setFormError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020817] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),transparent_28%)]" />
      <div className="pointer-events-none absolute left-8 top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-8 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/75 shadow-[0_40px_120px_rgba(15,23,42,0.9)] backdrop-blur-xl lg:grid-cols-[1.15fr_0.95fr]">
          <div className="flex flex-col justify-between bg-slate-950/80 px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Denbegnaye
              </div>

              <div className="space-y-5">
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                  Welcome back
                </h1>
                <p className="max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
                  Sign in to continue building AI agents, automations, and workflows with a modern
                  execution engine designed for speed and clarity.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                  <Bot className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-white">AI builder</p>
                <p className="mt-2 text-sm text-slate-300">Manage workflows and agent logic</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                  <Zap className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-white">Realtime execution</p>
                <p className="mt-2 text-sm text-slate-300">Track every node as it runs</p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Secure and encrypted authentication experience
            </div>
          </div>

          <Card className="border-0 bg-slate-900/90 shadow-none">
            <CardHeader className="px-6 pb-4 pt-7 sm:px-8">
              <CardTitle className="text-3xl font-bold text-white">Sign in</CardTitle>
              <CardDescription className="mt-2 text-slate-400">
                Use your email or Google account to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8 sm:px-8">
              <div className="space-y-6">
                <Button
                  style={{
                    background: '#ffffff',
                    color: '#111827',
                    borderColor: '#e5e7eb',
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleGoogleSignIn}
                  type="button"
                  disabled={googleLoading || authLoading || !isMounted}
                  aria-busy={googleLoading || authLoading || !isMounted}
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-700" aria-hidden="true" />
                  ) : (
                    <Image
                      src="/google-icon.svg"
                      alt="Google logo"
                      width={20}
                      height={20}
                      className="h-5 w-5"
                      priority={false}
                    />
                  )}
                  {googleLoading ? 'Starting Google sign-in...' : 'Continue with Google'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-x-0 top-1/2 flex items-center">
                    <span className="mx-auto h-px w-full max-w-xs bg-slate-700" />
                  </div>
                  <div className="relative z-10 mx-auto w-fit rounded-full bg-slate-900 px-3 text-[10px] font-medium uppercase tracking-[0.25em] text-slate-400">
                    Or continue with email
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  aria-describedby={formError ? errorElementId : undefined}
                >
                  {isAuthInitializing ? (
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
                      Checking your login state. If you are already signed in, you will be
                      redirected.
                    </div>
                  ) : null}

                  <LoginProtectionPanel
                    cooldownMessage={cooldownMessage}
                    failedAttempts={failedAttempts}
                    cooldownSeconds={cooldownSeconds}
                  />

                  {formError ? (
                    <div
                      id={errorElementId}
                      role="alert"
                      aria-live="assertive"
                      className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                    >
                      {formError}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={e => handleEmailChange(e.target.value)}
                      onBlur={handleEmailBlur}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={
                        fieldErrors.email ? 'email-error' : formError ? errorElementId : undefined
                      }
                      className={cn(
                        'border-slate-700 bg-slate-950/90 text-white placeholder:text-slate-500',
                        fieldErrors.email &&
                          'border-red-500/70 focus:border-red-400 focus:ring-red-400'
                      )}
                      required
                      disabled={loading || authLoading || !isMounted || isCoolingDown}
                    />
                    {fieldErrors.email ? (
                      <p id="email-error" className="text-sm text-red-300">
                        {fieldErrors.email}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        value={password}
                        onChange={e => handlePasswordChange(e.target.value)}
                        onBlur={handlePasswordBlur}
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={
                          fieldErrors.password
                            ? 'password-error'
                            : formError
                              ? errorElementId
                              : undefined
                        }
                        className={cn(
                          'border-slate-700 bg-slate-950/90 pr-12 text-white placeholder:text-slate-500',
                          fieldErrors.password &&
                            'border-red-500/70 focus:border-red-400 focus:ring-red-400'
                        )}
                        required
                        disabled={loading || authLoading || !isMounted || isCoolingDown}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        disabled={loading || authLoading || !isMounted || isCoolingDown}
                        className="absolute inset-y-0 right-3 flex items-center justify-center rounded-full p-2 text-slate-300 transition hover:bg-slate-800/80 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password ? (
                      <p id="password-error" className="text-sm text-red-300">
                        {fieldErrors.password}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="remember-me"
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-300"
                    >
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                        disabled={loading || authLoading || !isMounted || isCoolingDown}
                      />
                      Remember me
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 px-5 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={loading || authLoading || !isMounted || isCoolingDown}
                    aria-busy={loading || authLoading || !isMounted || isCoolingDown}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2
                          className="h-4 w-4 animate-spin text-slate-950"
                          aria-hidden="true"
                        />
                        Signing in...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Continue <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-slate-400">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/signup"
                    className="font-medium text-cyan-300 transition hover:text-cyan-200"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
