'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await signIn(email, password);
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });

      if (user && !user.email_confirmed_at) {
        router.push('/verify-email');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to login',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Redirect is handled by Supabase OAuth
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to login with Google',
        variant: 'destructive',
      });
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
                Welcome back to Denbegnaye
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
                  <li>• Protected by Supabase auth</li>
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
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm transition hover:bg-slate-100"
                  onClick={handleGoogleSignIn}
                  type="button"
                >
                  <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-x-0 top-1/2 flex items-center">
                    <span className="mx-auto h-px w-full max-w-xs bg-slate-700" />
                  </div>
                  <div className="relative z-10 mx-auto w-fit rounded-full bg-slate-950 px-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                    Or sign in with email
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="bg-slate-950/95 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="bg-slate-950/95 text-white"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 px-5 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>

                <p className="text-center text-sm text-slate-400">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="font-medium text-cyan-300 hover:text-cyan-200">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
