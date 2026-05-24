'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Chrome, Github, Mail, Lock } from 'lucide-react';
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
  const { signIn, signInWithGoogle, signInWithGithub } = useAuth();
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

  const handleGithubSignIn = async () => {
    try {
      await signInWithGithub();
      toast({
        title: 'Success',
        description: 'Logged in with GitHub successfully',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to login with GitHub',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02040f] text-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-300/40 shadow-xl">
              <img
                src="/denbegnaye-logo.png"
                onError={event => {
                  (event.target as HTMLImageElement).src = '/placeholder-logo.png';
                }}
                alt="Denbegnaye logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-2xl font-black tracking-tight">Denbegnaye</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-cyan-200">Sign in to continue</p>
        </div>

        <Card className="bg-[#041026]/90 backdrop-blur-sm border border-cyan-500/30 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Choose your preferred sign in method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  style={{
                    background: '#fff',
                    color: '#222',
                    borderColor: '#e0e0e0',
                  }}
                  className="flex items-center gap-2 font-semibold shadow-sm hover:bg-gray-100 transition"
                  onClick={handleGoogleSignIn}
                  type="button"
                >
                  <img src="/google-icon.svg" alt="Google" className="h-5 w-5 mr-2" />
                  <span style={{ color: '#222' }}>Sign in with Google</span>
                </Button>
                <Button
                  style={{
                    background: '#181717',
                    color: '#fff',
                    borderColor: '#181717',
                  }}
                  className="flex items-center gap-2 font-semibold shadow-sm hover:bg-gray-900 transition"
                  onClick={handleGithubSignIn}
                  type="button"
                >
                  <img src="/github-icon.svg" alt="GitHub" className="h-5 w-5 mr-2" />
                  <span style={{ color: '#fff' }}>Sign in with GitHub</span>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-950 px-2 text-gray-500">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
                <Link href="/signup" className="text-cyan-300 hover:text-cyan-200 font-medium">
                  Sign up
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
