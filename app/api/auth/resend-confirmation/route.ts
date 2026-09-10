import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY || process.env.resend_api_key;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const sender = process.env.RESEND_FROM_EMAIL || 'Denbegaye <noreply@denbengayeaiagent.com>';

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return NextResponse.json({ error: 'Email service is not configured.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${appUrl}/auth/callback` },
    });

    if (error || !data.properties?.action_link) {
      return NextResponse.json({ error: 'Unable to send confirmation email.' }, { status: 502 });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: sender,
        to: [email],
        subject: 'Confirm your Denbegnaye AI account',
        html: `<div style="background:#f4f7fb;padding:40px 16px;font-family:Arial,sans-serif;color:#172033"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dce3ee;border-radius:18px;padding:40px"><p style="color:#52627a;font-size:12px;font-weight:700;letter-spacing:2px">DENBEGNAYE AI</p><h1 style="font-size:30px">Confirm your email</h1><p style="font-size:16px;line-height:1.6;color:#52627a">Use the button below to confirm your account and start building intelligent workflows.</p><a href="${data.properties.action_link}" style="display:inline-block;background:#172033;color:#fff;text-decoration:none;border-radius:10px;padding:14px 22px;font-weight:700">Confirm email address</a><p style="margin-top:28px;font-size:13px;line-height:1.6;color:#718096">If you did not create this account, you can safely ignore this email.</p><p style="margin-top:24px;padding-top:20px;border-top:1px solid #e8edf4;font-size:12px;color:#8a96a8">Denbegnaye AI · denbegnayeaiagent.com</p></div></div>`,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      let resendMessage = '';
      try {
        resendMessage = JSON.parse(resendError).message || '';
      } catch {
        resendMessage = resendError;
      }

      return NextResponse.json(
        {
          error: /testing email|test mode|example\.com|recipient/i.test(resendMessage)
            ? 'Resend is currently limiting recipients. Use a real email address and enable production sending in your Resend account.'
            : 'Unable to send confirmation email. Please check the recipient address.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Resend confirmation failed:', error);
    return NextResponse.json({ error: 'Unable to send confirmation email.' }, { status: 500 });
  }
}
