# 🚀 PAYMENT & SUBSCRIPTION IMPLEMENTATION GUIDE

**Denbegaye Agent - Critical Path Implementation**

---

## 📌 QUICK REFERENCE - What to Do First

### Current State: Payment Flow is BROKEN

```
User clicks "Get Started"
    ↓
✅ User logged in? (Checked)
    ↓
✅ Database updated? (Yes)
    ↓
❌ PAYMENT PROCESSED? (NO!)
    ↓
❌ MONEY CHARGED? (NO!)
    ↓
❌ STRIPE INTEGRATION? (NO!)
```

### What to Implement (Priority Order)

```
Priority 1 (Do THIS First):
├── Stripe Checkout Session Creation
├── Stripe Webhook Handler
└── Payment Confirmation Flow

Priority 2 (Then This):
├── Rate Limiting Enforcement
├── Usage Tracking
└── Limit Validation Middleware

Priority 3 (After That):
├── Admin PATCH Endpoint
├── Invoice Generation
└── Email Notifications

Priority 4 (Polish):
├── Upgrade/Downgrade
├── Trial Period
└── Advanced Analytics
```

---

## 🔵 PHASE 1: IMPLEMENT PAYMENT PROCESSING (Critical)

### Step 1.1: Install Stripe Dependencies

```bash
# Install Stripe SDK
npm install stripe @stripe/react-js @stripe/js

# Add types
npm install --save-dev @types/stripe
```

### Step 1.2: Set Up Stripe Configuration

**File:** `lib/stripe.ts` (Create new file)

```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
  typescript: true,
});

export const getStripePublishableKey = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
  }
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
};
```

**File:** `.env.local` (Update)

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# App URLs
NEXT_PUBLIC_URL=http://localhost:3000
STRIPE_WEBHOOK_URL=http://localhost:3000/api/webhooks/stripe
```

### Step 1.3: Create Checkout Endpoint

**File:** `app/api/billing/checkout/route.ts` (Create new file)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe, getStripePublishableKey } from '@/lib/stripe';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { planId, billingCycle } = await request.json();

    // 1. Get authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // 2. Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 3. Validate plan exists
    const { data: plan, error: planError } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Invalid pricing plan' }, { status: 400 });
    }

    // 4. Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    // 5. Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.full_name || undefined,
        metadata: {
          userId: user.id,
          createdAt: new Date().toISOString(),
        },
      });

      stripeCustomerId = customer.id;

      // Save customer ID to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to save Stripe customer ID:', updateError);
      }
    }

    // 6. Get appropriate Stripe price ID
    const priceId =
      billingCycle === 'yearly' ? plan.stripe_price_id_yearly : plan.stripe_price_id_monthly;

    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe price ID not configured for ${plan.tier} ${billingCycle}`,
        },
        { status: 500 }
      );
    }

    // 7. Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        planId: plan.id,
        planTier: plan.tier,
        billingCycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: plan.id,
          planTier: plan.tier,
          billingCycle: billingCycle,
        },
      },
    });

    // 8. Store checkout session info temporarily
    await supabase
      .from('stripe_checkout_sessions')
      .insert({
        user_id: user.id,
        session_id: session.id,
        plan_id: plan.id,
        billing_cycle: billingCycle,
        created_at: new Date().toISOString(),
      })
      .then(() => {
        // Ignore errors - this is just for logging
      })
      .catch(err => console.error('Failed to log checkout session:', err));

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
```

### Step 1.4: Create Webhook Handler

**File:** `app/api/webhooks/stripe/route.ts` (Create new file)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';
import { headers } from 'next/headers';

// Stripe webhook event handler
export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // 1. Verify webhook signature
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  console.log(`Received Stripe event: ${event.type}`);

  // 2. Handle different event types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event.data.object as any);
        break;
      }

      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event.data.object as any);
        break;
      }

      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as any);
        break;
      }

      case 'invoice.payment_succeeded': {
        await handleInvoicePaymentSucceeded(event.data.object as any);
        break;
      }

      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailed(event.data.object as any);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Handler functions

async function handleCheckoutSessionCompleted(session: any) {
  console.log(`Checkout session completed: ${session.id}`);

  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  const billingCycle = session.metadata?.billingCycle;

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session:', session.metadata);
    return;
  }

  // 1. Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  // 2. Update user_subscriptions table
  const { error: subError } = await supabase.from('user_subscriptions').upsert(
    {
      user_id: userId,
      plan_id: planId,
      stripe_subscription_id: subscription.id,
      status: 'active',
      billing_cycle: billingCycle || 'monthly',
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (subError) {
    console.error('Failed to update subscription:', subError);
    throw subError;
  }

  // 3. Update user profile subscription tier
  const { data: plan } = await supabase
    .from('pricing_plans')
    .select('tier')
    .eq('id', planId)
    .single();

  if (plan) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: plan.tier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
    }
  }

  // 4. Log payment
  const invoice = await stripe.invoices.retrieve(session.invoice);
  const { error: paymentError } = await supabase.from('payment_history').insert({
    user_id: userId,
    subscription_id: subscription.id,
    stripe_payment_intent_id: invoice.payment_intent,
    amount: invoice.total / 100,
    currency: invoice.currency,
    status: 'succeeded',
    description: `Subscription for ${plan?.tier || 'plan'} (${billingCycle})`,
    metadata: {
      sessionId: session.id,
      invoiceId: invoice.id,
    },
  });

  if (paymentError) {
    console.error('Failed to log payment:', paymentError);
  }

  console.log(`✅ Subscription activated for user ${userId}`);

  // 5. Send welcome email
  await sendWelcomeEmail(userId, plan?.tier || 'unknown');
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log(`Subscription updated: ${subscription.id}`);

  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // Update subscription status
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: mapStripeStatus(subscription.status),
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log(`Subscription deleted: ${subscription.id}`);

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to cancel subscription:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log(`Invoice payment succeeded: ${invoice.id}`);

  const { subscription: subscriptionId } = invoice;

  // Get subscription to find user ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // Log payment
  const { error } = await supabase.from('payment_history').insert({
    user_id: userId,
    subscription_id: subscriptionId,
    stripe_payment_intent_id: invoice.payment_intent,
    amount: invoice.total / 100,
    currency: invoice.currency,
    status: 'succeeded',
    description: `Monthly charge for subscription`,
    metadata: {
      invoiceId: invoice.id,
      paidAt: new Date(invoice.paid_at * 1000).toISOString(),
    },
  });

  if (error) {
    console.error('Failed to log payment:', error);
  }

  // Send invoice email
  await sendInvoiceEmail(userId, invoice);
}

async function handleInvoicePaymentFailed(invoice: any) {
  console.log(`Invoice payment failed: ${invoice.id}`);

  const { subscription: subscriptionId } = invoice;

  // Get subscription to find user ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // Update subscription status
  const { error: subError } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (subError) {
    console.error('Failed to update subscription:', subError);
  }

  // Log failed payment
  const { error: paymentError } = await supabase.from('payment_history').insert({
    user_id: userId,
    subscription_id: subscriptionId,
    stripe_payment_intent_id: invoice.payment_intent,
    amount: invoice.total / 100,
    currency: invoice.currency,
    status: 'failed',
    description: `Payment failed - ${invoice.attempt_count} attempts`,
    metadata: {
      invoiceId: invoice.id,
      failureReason: invoice.last_finalization_error?.message,
    },
  });

  if (paymentError) {
    console.error('Failed to log payment failure:', paymentError);
  }

  // Send payment failed email
  await sendPaymentFailedEmail(userId, invoice);
}

// Helper functions

function mapStripeStatus(status: string): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'unpaid':
      return 'past_due';
    default:
      return 'incomplete';
  }
}

async function sendWelcomeEmail(userId: string, tier: string) {
  // TODO: Integrate with email service (SendGrid, Resend, etc)
  console.log(`📧 Sending welcome email to user ${userId} for ${tier} plan`);
}

async function sendInvoiceEmail(userId: string, invoice: any) {
  // TODO: Integrate with email service
  console.log(`📧 Sending invoice email to user ${userId}`);
}

async function sendPaymentFailedEmail(userId: string, invoice: any) {
  // TODO: Integrate with email service
  console.log(`📧 Sending payment failed email to user ${userId}`);
}
```

### Step 1.5: Update Pricing Page to Use Checkout

**File:** `app/pricing/page.tsx` (Modify handleSubscribe function)

Replace the current `handleSubscribe` function with:

```typescript
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

    // Call checkout endpoint
    const response = await fetch('/api/billing/checkout', {
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
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();

    // Redirect to Stripe checkout
    if (url) {
      window.location.href = url;
    }
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    alert(error instanceof Error ? error.message : 'Failed to subscribe. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### Step 1.6: Add Database Migration for Stripe Tables

**File:** `supabase/migrations/TIMESTAMP_add_stripe_tables.sql`

```sql
-- Add Stripe customer ID to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Store checkout sessions temporarily
CREATE TABLE IF NOT EXISTS public.stripe_checkout_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    plan_id UUID REFERENCES public.pricing_plans(id),
    billing_cycle TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_stripe_checkout_user
ON public.stripe_checkout_sessions(user_id);

-- Update user_subscriptions to store custom limits
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS custom_limits JSONB DEFAULT NULL;
```

### Step 1.7: Test the Payment Flow

**Testing Checklist:**

```bash
# 1. Start local development server
npm run dev

# 2. Go to pricing page
# http://localhost:3000/pricing

# 3. Click "Get Started" on any plan
# Should redirect to Stripe checkout

# 4. Use test card: 4242 4242 4242 4242
# Expiry: Any future date (e.g., 12/25)
# CVC: Any 3 digits (e.g., 123)

# 5. Complete checkout
# Should see "success=true" redirect

# 6. Check database
# user_subscriptions should be updated
# payment_history should have entry

# 7. Check Stripe Dashboard
# https://dashboard.stripe.com/test/payments
```

---

## 🟠 PHASE 2: IMPLEMENT RATE LIMITING

### Step 2.1: Create Rate Limit Middleware

**File:** `lib/rateLimitMiddleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './supabaseClient';
import Redis from 'redis';

// Create Redis client (with fallback to in-memory)
let redisClient: ReturnType<typeof Redis.createClient> | null = null;

if (process.env.REDIS_URL) {
  redisClient = Redis.createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch(err => {
    console.warn('Failed to connect to Redis:', err);
    redisClient = null;
  });
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  reason?: string;
}

export async function checkRateLimit(
  userId: string,
  limitType: 'api_calls' | 'executions',
  amount: number = 1
): Promise<RateLimitResult> {
  try {
    // 1. Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*, pricing_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return {
        allowed: false,
        limit: 0,
        current: 0,
        remaining: 0,
        reason: 'No active subscription',
      };
    }

    const plan = subscription.pricing_plans;
    const planLimit = (plan.limits as any)?.[limitType] || 0;

    // -1 means unlimited
    if (planLimit === -1) {
      return {
        allowed: true,
        limit: -1,
        current: 0,
        remaining: -1,
      };
    }

    // 2. Check current usage (monthly reset)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const cacheKey = `usage:${userId}:${limitType}:${monthStart.toISOString()}`;

    let currentUsage = 0;

    // Try Redis first
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          currentUsage = parseInt(cached, 10);
        }
      } catch (err) {
        console.warn('Redis error:', err);
      }
    }

    // If not in cache, query database
    if (currentUsage === 0) {
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('count')
        .eq('user_id', userId)
        .eq('metric_type', limitType)
        .gte('period_start', monthStart.toISOString())
        .single();

      currentUsage = usageData?.count || 0;

      // Cache for remainder of month
      if (redisClient) {
        const daysUntilMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const secondsUntilMonthEnd = daysUntilMonthEnd * 24 * 60 * 60;
        redisClient.setEx(cacheKey, secondsUntilMonthEnd, currentUsage.toString());
      }
    }

    // 3. Check if limit exceeded
    if (currentUsage + amount > planLimit) {
      return {
        allowed: false,
        limit: planLimit,
        current: currentUsage,
        remaining: Math.max(0, planLimit - currentUsage),
        reason: `Rate limit exceeded: ${currentUsage}/${planLimit}`,
      };
    }

    return {
      allowed: true,
      limit: planLimit,
      current: currentUsage,
      remaining: planLimit - currentUsage - amount,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if we can't check
    return {
      allowed: true,
      limit: 0,
      current: 0,
      remaining: 0,
      reason: 'Error checking rate limit',
    };
  }
}

export async function trackUsage(
  userId: string,
  limitType: 'api_calls' | 'executions',
  amount: number = 1
): Promise<void> {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Update usage_tracking table
    const { error } = await supabase.from('usage_tracking').upsert(
      {
        user_id: userId,
        metric_type: limitType,
        period_start: monthStart.toISOString(),
        period_end: monthEnd.toISOString(),
        count:
          (await supabase
            .from('usage_tracking')
            .select('count')
            .eq('user_id', userId)
            .eq('metric_type', limitType)
            .gte('period_start', monthStart.toISOString())
            .single()
            .then(({ data }) => data?.count || 0)) + amount,
      },
      { onConflict: 'user_id,metric_type,period_start' }
    );

    if (error) {
      console.error('Failed to track usage:', error);
    }

    // Invalidate cache
    if (redisClient) {
      const cacheKey = `usage:${userId}:${limitType}:${monthStart.toISOString()}`;
      redisClient.del(cacheKey).catch(err => console.warn('Redis delete error:', err));
    }
  } catch (error) {
    console.error('Track usage error:', error);
  }
}
```

### Step 2.2: Apply Rate Limit to API Endpoints

**Example:** `app/api/agent-run/route.ts`

```typescript
import { checkRateLimit, trackUsage } from '@/lib/rateLimitMiddleware';

export async function POST(request: NextRequest) {
  try {
    // 1. Get user from auth
    const token = request.headers.get('authorization')?.split(' ')[1];
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check rate limits
    const rateLimit = await checkRateLimit(user.id, 'executions');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have reached your limit of ${rateLimit.limit} executions this month`,
          current: rateLimit.current,
          limit: rateLimit.limit,
        },
        { status: 429 } // Too Many Requests
      );
    }

    // 3. Process the request...
    const body = await request.json();

    // ... your logic here ...

    // 4. Track the usage
    await trackUsage(user.id, 'executions', 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 🟡 PHASE 3: COMPLETE ADMIN PATCH ENDPOINT

**File:** `app/api/admin/subscriptions/route.ts` (Add PATCH method)

```typescript
export async function PATCH(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyAdmin(token);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { subscriptionId, action, status, limits } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: 'Missing subscriptionId or action' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'cancel': {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscriptionId)
          .select()
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      case 'reactivate': {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscriptionId)
          .select()
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      case 'update_limits': {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .update({
            custom_limits: limits,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscriptionId)
          .select()
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1 Tasks

- [ ] Install Stripe dependencies
- [ ] Create `lib/stripe.ts`
- [ ] Set `.env.local` with Stripe keys
- [ ] Create `/api/billing/checkout` endpoint
- [ ] Create `/api/webhooks/stripe` endpoint
- [ ] Update pricing page handleSubscribe
- [ ] Add database migration
- [ ] Test complete flow with test card
- [ ] Deploy to staging
- [ ] Test in production (with live Stripe keys)

### Phase 2 Tasks

- [ ] Create `lib/rateLimitMiddleware.ts`
- [ ] Set up Redis (or use in-memory fallback)
- [ ] Add rate limit checks to API endpoints
- [ ] Implement usage tracking
- [ ] Test rate limit enforcement
- [ ] Add rate limit response headers

### Phase 3 Tasks

- [ ] Implement PATCH endpoint
- [ ] Test cancel action
- [ ] Test reactivate action
- [ ] Test update limits action
- [ ] Update admin UI to show success/error

---

## 🧪 TESTING GUIDE

### Test Scenarios

**Scenario 1: Free Plan User Cannot Exceed Limits**

```
1. Create user with Free plan
2. Set up usage tracking with limit of 100/month
3. Try to execute 101 times
4. Should get 429 error on request 101
```

**Scenario 2: Pro Plan User Gets Higher Limits**

```
1. Upgrade user to Pro plan
2. Should now allow 10,000 executions/month
3. Verify in usage_tracking table
```

**Scenario 3: Admin Can Override Limits**

```
1. Admin calls PATCH /api/admin/subscriptions
2. Set custom_limits: { executions: 50000 }
3. User should now have higher limit
```

**Scenario 4: Payment Failure Marks Subscription as Past Due**

```
1. Use card 4000 0000 0000 0002 (decline)
2. Stripe sends invoice.payment_failed webhook
3. user_subscriptions.status should be 'past_due'
4. Send user email notification
```

---

## 🎯 SUCCESS CRITERIA

✅ **Payment Processing Complete**

- User can complete Stripe checkout
- Subscription created in database
- Revenue tracked in payment_history

✅ **Rate Limiting Enforced**

- API returns 429 when limit exceeded
- Usage correctly tracked per user
- Free tier limits respected

✅ **Admin Control**

- Can cancel subscriptions
- Can update custom limits
- Can view subscription analytics

---

## 📞 TROUBLESHOOTING

**Problem: Checkout redirects to Stripe but nothing happens**

```
Solution:
- Check browser console for errors
- Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env
- Ensure Stripe plans exist with correct price IDs
- Check network tab for failed API calls
```

**Problem: Webhook not firing after payment**

```
Solution:
- Verify webhook endpoint is accessible
- Check Stripe dashboard for webhook events
- Verify STRIPE_WEBHOOK_SECRET is correct
- Check server logs for webhook errors
```

**Problem: Rate limiting not working**

```
Solution:
- Verify usage_tracking table is being updated
- Check Redis connection if configured
- Try in-memory fallback
- Verify database indexes exist
```

---

This guide should get your payment system from 0% to 80% functional!
