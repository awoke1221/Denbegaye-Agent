export interface PayPalOrderInput {
  amount: number;
  currency: 'USD' | 'ETB';
  description: string;
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  returnUrl: string;
  cancelUrl: string;
}

export interface PayPalOrderResult {
  success: boolean;
  orderId?: string;
  approvalUrl?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface PayPalCaptureResult {
  success: boolean;
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  payerEmail?: string;
  paymentMethod?: string;
  capturedAt?: string;
  error?: {
    code: string;
    message: string;
  };
}

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE_URL || 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'PayPal credentials are not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.'
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal auth failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(input: PayPalOrderInput): Promise<PayPalOrderResult> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: `${input.userId}:${input.planId}`,
            description: input.description,
            custom_id: `${input.userId}|${input.planId}|${input.billingCycle}`,
            amount: {
              currency_code: input.currency,
              value: Number(input.amount).toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'Denbegnaye',
          user_action: 'PAY_NOW',
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
          shipping_preference: 'NO_SHIPPING',
          landing_page: 'LOGIN',
        },
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: payload?.name || 'PAYPAL_ORDER_ERROR',
          message: payload?.message || 'Unable to create PayPal order.',
        },
      };
    }

    const approvalUrl = payload.links?.find((link: any) => link.rel === 'approve')?.href;

    return {
      success: true,
      orderId: payload.id,
      approvalUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'PAYPAL_EXCEPTION',
        message: error instanceof Error ? error.message : 'Failed to create PayPal order.',
      },
    };
  }
}

export async function capturePayPalOrder(orderId: string): Promise<PayPalCaptureResult> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: payload?.name || 'PAYPAL_CAPTURE_ERROR',
          message: payload?.message || 'Unable to capture PayPal payment.',
        },
      };
    }

    const capture = payload.purchase_units?.[0]?.payments?.captures?.[0];
    const payer = payload.payer;

    return {
      success: payload.status === 'COMPLETED',
      id: capture?.id || orderId,
      status: payload.status,
      amount: Number(capture?.amount?.value || 0),
      currency: capture?.amount?.currency_code || 'USD',
      payerEmail: payer?.email_address || '',
      paymentMethod: capture?.seller_receivable_breakdown ? 'PAYPAL' : 'PAYPAL',
      capturedAt: capture?.final_capture ? new Date().toISOString() : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'PAYPAL_CAPTURE_EXCEPTION',
        message: error instanceof Error ? error.message : 'Failed to capture PayPal payment.',
      },
    };
  }
}
