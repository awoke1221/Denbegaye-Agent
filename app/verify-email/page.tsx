'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
      // Try to parse session from URL (OAuth redirect). This helps when
      // Supabase places the session in the URL fragment after OAuth.
      if (typeof window !== 'undefined' && (supabase.auth as any)?.getSessionFromUrl) {
        try {
          const sessionResult = await (supabase.auth as any).getSessionFromUrl();
          if (sessionResult?.data?.session) {
            // session should now be stored by supabase client
            setUser(sessionResult.data.session.user);
            setIsLoading(false);
            // If email already verified, redirect home
            if (sessionResult.data.session.user.email_confirmed_at) {
              toast({
                title: 'Email verified',
                description: 'Welcome back! Redirecting to home...',
              });
              router.push('/');
              return;
            }
            return;
          }
        } catch (err) {
          // ignore and continue to getUser fallback
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

      if (data.user.email_confirmed_at) {
        toast({
          title: 'Email verified',
          description: 'Welcome back! Redirecting to home...',
        });
        router.push('/');
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

    if (data.user.email_confirmed_at) {
      toast({
        title: 'Email verified',
        description: 'Redirecting to home...',
      });
      router.push('/');
      return;
    }

    setChecking(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#02040f] text-white">
        <p>Checking account status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02040f] text-white p-4">
      <div className="w-full max-w-lg bg-[#041026]/90 rounded-2xl border border-cyan-500/30 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar>
            <AvatarImage
              src={
                user?.user_metadata?.avatar_url ||
                user?.user_metadata?.picture ||
                user?.photoURL ||
                undefined
              }
              alt={getUserDisplayName(user) || 'User'}
            />
            <AvatarFallback>{extractAvatarInitials(user)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">Verify your email</h1>
            <p className="text-gray-300">{getUserDisplayName(user)}</p>
          </div>
        </div>

        <p className="text-gray-300 mb-4">
          A verification link has been sent to your email. Please check your inbox and click the
          link to verify your account.
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={resendVerification} disabled={sending}>
            {sending ? 'Sending...' : 'Resend verification email'}
          </Button>
          <Button variant="default" onClick={checkVerification} disabled={checking}>
            {checking ? 'Checking...' : 'Check verification status'}
          </Button>
        </div>

        <p className="mt-4 text-gray-400 text-sm">
          After verification, you will be redirected to the home page automatically.
        </p>
      </div>
    </div>
  );
}
