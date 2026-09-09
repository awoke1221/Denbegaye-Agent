'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface VerifyResponse {
  success: boolean;
  message?: string;
  data?: {
    transactionId: string;
    planId: string;
    status: string;
    amount: number;
    currency: string;
    billingCycle: string;
    createdAt: string;
    expiresAt: string;
  };
}

export default function PaymentResultPage() {
  const router = useRouter();
  const params = useSearchParams();
  const success = params.get('success') === 'true';
  const failed = params.get('failed') === 'true';
  const gateway = params.get('gateway') || 'paypal';
  const transactionId = params.get('tx') || params.get('token');
  const planId = params.get('planId');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Waiting for payment confirmation...');
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (success && transactionId && planId) {
      verifyPayment();
    } else if (failed) {
      setStatusMessage('Payment was not completed. You can try again or choose a different plan.');
    }
  }, [success, failed, transactionId, planId]);

  const verifyPayment = async () => {
    try {
      setLoading(true);
      setStatusMessage(
        gateway === 'paypal'
          ? 'Confirming payment with PayPal...'
          : 'Confirming payment with LakiPay...'
      );

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        setErrorMessage('You must be logged in to confirm payment.');
        return;
      }

      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          transactionId,
          planId,
          gateway,
        }),
      });

      const result: VerifyResponse = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.message || 'Unable to verify payment.');
        setStatusMessage('Payment verification failed.');
        return;
      }

      setPaymentStatus(result.data?.status || 'completed');
      setStatusMessage('Payment confirmed! Your subscription is now active.');
      router.replace('/agent-builder');
    } catch (error) {
      console.error('Payment result error:', error);
      setErrorMessage('Unexpected error while verifying payment.');
      setStatusMessage('Unable to confirm payment at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/pricing');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.76)] p-10 shadow-[0_28px_80px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            {success ? (
              <CheckCircle2 className="w-12 h-12 text-[var(--text-primary)]" />
            ) : failed ? (
              <AlertCircle className="w-12 h-12 text-[var(--text-secondary)]" />
            ) : (
              <RefreshCw className="w-12 h-12 animate-spin text-[var(--text-secondary)]" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                {success ? 'Payment Result' : failed ? 'Payment Failed' : 'Payment Status'}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">{statusMessage}</p>
            </div>
          </div>

          {paymentStatus && (
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-6">
              <p className="text-sm text-[var(--text-secondary)] mb-2">Transaction status</p>
              <Badge className="bg-[var(--bg-soft)] text-[var(--text-primary)] border-[var(--border-default)]">
                {paymentStatus}
              </Badge>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-soft)] p-6 text-[var(--text-primary)]">
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="secondary"
              onClick={handleGoBack}
              className="border-[var(--border-default)] bg-[rgba(255,255,255,0.7)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pricing
            </Button>
            <Button
              onClick={() => {
                if (success && transactionId && planId) {
                  verifyPayment();
                } else {
                  router.push('/pricing');
                }
              }}
              className="bg-[var(--button-bg)] text-[var(--button-text)] hover:bg-[var(--accent-strong)]"
            >
              {success ? 'Re-check Payment' : 'Try Again'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
