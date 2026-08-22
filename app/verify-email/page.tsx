'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { toast } = useToast();

  const loadUser = async () => {
    try {
      if (typeof window !== 'undefined' && (supabase.auth as any)?.getSessionFromUrl) {
        try {
          const sessionResult = await (supabase.auth as any).getSessionFromUrl();
          if (sessionResult?.data?.session) {
            setUser(sessionResult.data.session.user);
            setIsLoading(false);
            if (
              sessionResult.data.session.user.email_confirmed_at ||
              ['google', 'github'].includes(sessionResult.data.session.user.app_metadata?.provider)
            ) {
              toast({
                title: 'Email verified',
                description: 'Welcome back! Redirecting to builder...',
              });
              router.replace('/agent-builder');
              return;
            }
            return;
          }
        } catch (err) {
          console.warn('getSessionFromUrl failed:', err);
        }
      }

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        toast({
          title: 'Not signed in',
          description: 'Please login or sign up first.',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      setUser(data.user);

      if (
        data.user.email_confirmed_at ||
        ['google', 'github'].includes(data.user.app_metadata?.provider ?? '')
      ) {
        toast({
          title: 'Email verified',
          description: 'Welcome back! Redirecting to builder...',
        });
        router.replace('/agent-builder');
        return;
      }

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
  }, []);

  const resendVerification = async () => {
    if (!user?.email) return;
    setSending(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (error) {
      toast({
        title: 'Failed to resend',
        description: error.message,
        variant: 'destructive',
      });
    } else {
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

    if (
      data.user.email_confirmed_at ||
      ['google', 'github'].includes(data.user.app_metadata?.provider ?? '')
    ) {
      toast({
        title: 'Email verified',
        description: 'Redirecting to builder...',
      });
      router.replace('/agent-builder');
      return;
    }

    setChecking(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-slate-100">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 px-8 py-6 text-sm text-slate-300">
          Checking account status…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020817] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <div className="border-b border-white/10 bg-slate-900/80 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-cyan-300">
                <MailCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  Secure access
                </p>
                <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  Verify your email
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Avatar className="h-12 w-12 border border-white/10">
                <AvatarImage
                  src={
                    user?.user_metadata?.avatar_url ||
                    user?.user_metadata?.picture ||
                    user?.photoURL ||
                    undefined
                  }
                  alt={getUserDisplayName(user) || 'User'}
                />
                <AvatarFallback className="bg-cyan-500/10 text-cyan-200">
                  {extractAvatarInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-slate-400">Signed in as</p>
                <p className="font-medium text-white">{getUserDisplayName(user)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
              <div className="flex items-center gap-2 font-medium text-cyan-200">
                <ShieldCheck className="h-4 w-4" />
                Verification required
              </div>
              <p className="mt-2 leading-6 text-cyan-50/90">
                A verification link has been sent to your email. Please check your inbox and click
                the link to confirm your account before continuing.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={resendVerification}
                disabled={sending}
                className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${sending ? 'animate-spin' : ''}`} />
                {sending ? 'Sending...' : 'Resend email'}
              </Button>
              <Button
                variant="default"
                onClick={checkVerification}
                disabled={checking}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_16px_40px_rgba(34,211,238,0.35)]"
              >
                {checking ? 'Checking...' : 'Check status'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm leading-6 text-slate-400">
              After verification, you will be redirected automatically to continue building your AI
              workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
