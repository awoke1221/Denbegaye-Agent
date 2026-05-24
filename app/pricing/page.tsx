'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Users, Database, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface PricingPlan {
  id: string;
  name: string;
  tier: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    agents: number;
    executions: number;
    api_calls: number;
    storage_mb: number;
  };
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
}

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        // Fetch pricing plans
        const { data: plansData, error: plansError } = await supabase
          .from('pricing_plans')
          .select('*')
          .eq('is_active', true)
          .order('price_monthly');

        if (plansError) throw plansError;

        // Transform plans data
        const transformedPlans =
          plansData?.map(plan => ({
            id: plan.id,
            name: plan.name,
            tier: plan.tier,
            description: plan.description,
            price_monthly: plan.price_monthly,
            price_yearly: plan.price_yearly,
            features: plan.features || [],
            limits: plan.limits || { agents: 0, executions: 0, api_calls: 0, storage_mb: 0 },
          })) || [];

        setPlans(transformedPlans);

        // Fetch user subscription if logged in
        if (user) {
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

          if (!subscriptionError && subscriptionData) {
            setUserSubscription(subscriptionData);
          }
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, [user]);

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);

      // Get auth session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      // Create payment session via LakiPay
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle: billingCycle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment session');
      }

      const { data } = await response.json();

      // Redirect to LakiPay checkout
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL provided');
      }
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      alert(error instanceof Error ? error.message : 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPrice = (plan: PricingPlan) => {
    return billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  };

  const getSavings = (plan: PricingPlan) => {
    if (billingCycle === 'yearly' && plan.price_monthly > 0) {
      const monthlyTotal = plan.price_monthly * 12;
      const savings = monthlyTotal - plan.price_yearly;
      return Math.round((savings / monthlyTotal) * 100);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Choose Your Plan</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Unlock the full potential of AI agents with our flexible pricing plans. Start free and
            scale as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span
              className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-7 bg-gray-600 rounded-full transition-colors"
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}
            >
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <Badge variant="secondary" className="ml-2">
                Save up to 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map(plan => {
            const isCurrentPlan = userSubscription?.plan_id === plan.id;
            const isPopular = plan.tier === 'pro';

            return (
              <Card
                key={plan.id}
                className={`relative bg-white/10 border-white/20 backdrop-blur-sm ${
                  isPopular ? 'ring-2 ring-purple-500 scale-105' : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white px-4 py-1">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-green-600 text-white px-3 py-1">Current Plan</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl text-white mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-300 mb-4">
                    {plan.description}
                  </CardDescription>

                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">${getCurrentPrice(plan)}</span>
                    <span className="text-gray-400 ml-2">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                    {getSavings(plan) > 0 && (
                      <div className="text-sm text-green-400 mt-1">
                        Save {getSavings(plan)}% annually
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrentPlan}
                    className={`w-full ${
                      isPopular
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : isCurrentPlan
                          ? 'bg-green-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Get Started'}
                  </Button>
                </CardHeader>

                <CardContent>
                  {/* Limits */}
                  <div className="mb-6 p-4 bg-white/5 rounded-lg">
                    <h4 className="text-white font-semibold mb-3 flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Limits
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>AI Agents:</span>
                        <span>{plan.limits.agents === -1 ? 'Unlimited' : plan.limits.agents}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Executions:</span>
                        <span>
                          {plan.limits.executions === -1
                            ? 'Unlimited'
                            : plan.limits.executions.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>API Calls:</span>
                        <span>
                          {plan.limits.api_calls === -1
                            ? 'Unlimited'
                            : plan.limits.api_calls.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Storage:</span>
                        <span>
                          {plan.limits.storage_mb === -1
                            ? 'Unlimited'
                            : `${plan.limits.storage_mb}MB`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-white font-semibold mb-3 flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      Features
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-300">
                          <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                  immediately, and we'll prorate any billing adjustments.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  What happens if I exceed my limits?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  We'll notify you when you approach your limits. If you exceed them, your account
                  will be temporarily paused until you upgrade or your limits reset.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Our Free plan lets you try all features with generous limits. No credit card
                  required to get started, and you can upgrade anytime.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  We offer a 30-day money-back guarantee for all paid plans. If you're not
                  satisfied, contact our support team for a full refund.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
