'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
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
  if (isAuthInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#02040f] text-white">
        <div className="rounded-3xl border border-white/10 bg-slate-950/90 px-8 py-10 text-center shadow-2xl shadow-cyan-950/20">
          <p className="text-lg font-semibold mb-2">Checking your login state…</p>
          <p className="text-sm text-slate-400">Please wait while we prepare your account.</p>
        </div>
      </div>
    );
  }

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
      // Redirect is handled by Supabase OAuth
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
    <div className="relative min-h-screen overflow-hidden bg-[#02040f] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute left-0 top-1/4 h-[420px] w-[420px] -translate-x-1/4 rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.14),transparent_48%)] blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-16">
        <div className="grid gap-10 rounded-[2rem] border border-white/10 bg-slate-950/75 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl p-6 lg:grid-cols-[1.3fr_1fr] lg:p-0">
          <div className="flex flex-col justify-center gap-8 rounded-[2rem] bg-slate-950/90 px-8 py-10 lg:px-10 lg:py-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
              <Sparkles className="h-4 w-4" />
              Fast and friendly login
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Welcome back to Digital Employee
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Sign in quickly with Google or your email to continue managing your AI agents and
                automation workflows.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="font-semibold text-slate-100">Why login?</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  <li>• Access your saved agents instantly</li>
                  <li>• Continue from where you left off</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="font-semibold text-slate-100">Need help?</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  <li>• Use Google to skip typing credentials</li>
                  <li>• Check your email verification status</li>
                  <li>• Secure login for your workspace</li>
                </ul>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-slate-950/95 shadow-none">
            <CardHeader className="bg-slate-900/90 px-8 py-7">
              <CardTitle className="text-3xl font-semibold">Sign in</CardTitle>
              <CardDescription className="text-slate-400">
                Secure login with Google or email credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 py-8 sm:px-10 sm:py-10">
              <div className="space-y-6">
                <Button
                  style={{
                    background: '#ffffff',
                    color: '#111827',
                    borderColor: '#e5e7eb',
                  }}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                  <div className="relative z-10 mx-auto w-fit rounded-full bg-slate-950 px-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                    Or sign in with email
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  aria-describedby={formError ? errorElementId : undefined}
                >
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

                  <div className="space-y-3">
                    <Label htmlFor="email">Email address</Label>
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
                        'bg-slate-950/95 text-white',
                        fieldErrors.email &&
                          'border-red-500/70 focus:border-red-400 focus:ring-red-400'
                      )}
                      required
                      disabled={loading || authLoading || !isMounted || isCoolingDown}
                    />
                    {fieldErrors.email ? (
                      <p id="email-error" className="mt-2 text-sm text-red-300">
                        {fieldErrors.email}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                      disabled={loading || authLoading || !isMounted || isCoolingDown}
                    />
                    <label htmlFor="remember-me" className="text-sm text-slate-300">
                      Remember me on this device
                    </label>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="password">Password</Label>
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
                          'bg-slate-950/95 text-white pr-12',
                          fieldErrors.password &&
                            'border-red-500/70 focus:border-red-400 focus:ring-red-400'
                        )}
                        required
                        disabled={loading || authLoading || !isMounted || isCoolingDown}
                      />
                      {fieldErrors.password ? (
                        <p id="password-error" className="mt-2 text-sm text-red-300">
                          {fieldErrors.password}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        disabled={loading || authLoading || !isMounted || isCoolingDown}
                        className="absolute inset-y-0 right-3 flex items-center justify-center rounded-full p-2 text-slate-300 transition hover:bg-slate-800/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
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
                      'Sign in'
                    )}
                  </Button>
                </form>

                <div className="space-y-3 text-center text-sm text-slate-400">
                  <p>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="font-medium text-cyan-300 hover:text-cyan-200">
                      Sign up
                    </Link>
                  </p>
                  <p>
                    <Link
                      href="/forgot-password"
                      className="font-medium text-cyan-300 hover:text-cyan-200"
                    >
                      Forgot password?
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
