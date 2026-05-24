import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, processWebhookEvent } from '@/lib/payments/lakipay';
import { handlePaymentWebhook } from '@/lib/payments/paymentService';

/**
 * POST /api/payments/lakipay/webhook
 * Handle LakiPay webhook notifications
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body for signature verification
    const body = await request.text();

    // 2. Get signature from headers
    const signature = request.headers.get('x-lakipay-signature');
    if (!signature) {
      console.warn('Missing webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 3. Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.warn('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 4. Parse webhook payload
    let webhook;
    try {
      webhook = JSON.parse(body);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    console.log(`Received LakiPay webhook: ${webhook.event}`, webhook.data);

    // 5. Process based on event type
    const event = webhook.event;

    if (event === 'payment.completed') {
      // Payment successful
      const processed = processWebhookEvent(webhook);
      await handlePaymentWebhook(processed.transactionId, 'COMPLETED', processed.metadata);

      return NextResponse.json({ received: true });
    } else if (event === 'payment.failed') {
      // Payment failed
      const processed = processWebhookEvent(webhook);
      await handlePaymentWebhook(processed.transactionId, 'FAILED', processed.metadata);

      return NextResponse.json({ received: true });
    } else if (event === 'payment.cancelled') {
      // Payment cancelled
      const processed = processWebhookEvent(webhook);
      await handlePaymentWebhook(processed.transactionId, 'CANCELLED', processed.metadata);

      return NextResponse.json({ received: true });
    } else if (event === 'payment.processing') {
      // Payment processing
      console.log(`Payment processing: ${webhook.data.lakipay_transaction_id}`);
      return NextResponse.json({ received: true });
    } else {
      // Unknown event
      console.warn(`Unknown webhook event: ${event}`);
      return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

/**
 * GET /api/payments/lakipay/webhook
 * For webhook verification from LakiPay
 */
export async function GET(request: NextRequest) {
  try {
    // Return 200 OK for webhook validation
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook validation error:', error);
    return NextResponse.json({ error: 'Webhook validation failed' }, { status: 500 });
  }
}
