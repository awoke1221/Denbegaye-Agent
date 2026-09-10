import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY || process.env.resend_api_key;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const sender = process.env.RESEND_FROM_EMAIL || 'Denbegaye <noreply@denbengayeaiagent.com>';

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const confirmationEmail = (confirmationUrl: string, email: string) => `
  <div style="background:#f4f7fb;padding:40px 16px;font-family:Arial,sans-serif;color:#172033">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce3ee;border-radius:18px;padding:40px">
      <p style="margin:0 0 24px;color:#52627a;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">DENBEGNAYE AI</p>
      <h1 style="margin:0 0 16px;font-size:30px;line-height:1.2;color:#172033">Confirm your email</h1>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.6">Welcome to Denbegnaye AI.</p>
      <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#52627a">Confirm <strong>${email}</strong> to activate your account and start building intelligent workflows.</p>
      <a href="${confirmationUrl}" style="display:inline-block;background:#172033;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 22px;font-weight:700">Confirm email address</a>
      <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#718096">This link expires for your security. If you did not create a Denbegnaye AI account, you can safely ignore this email.</p>
      <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e8edf4;font-size:12px;color:#8a96a8">Denbegnaye AI · denbegnayeaiagent.com</p>
    </div>
  </div>
`;

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return jsonError('Email confirmation service is not configured.', 503);
  }

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return jsonError('Email and password are required.', 400);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (createError || !created.user) {
      if (
        createError?.status === 422 ||
        /already registered|already exists/i.test(createError?.message || '')
      ) {
        return jsonError(
          'An account with this email already exists. Please sign in or use a different email.',
          400
        );
      }
      return jsonError('Unable to create your account. Please try again.', 400);
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: { redirectTo: `${appUrl}/auth/callback` },
    });

    if (linkError || !linkData.properties?.action_link) {
      console.error('Signup confirmation link generation failed:', {
        message: linkError?.message,
        status: linkError?.status,
        redirectTo: `${appUrl}/auth/callback`,
      });
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return jsonError(
        'Unable to prepare your confirmation email. Check the Supabase redirect URL configuration.',
        502
      );
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: sender,
        to: [email],
        subject: 'Confirm your Denbegnaye AI account',
        html: confirmationEmail(linkData.properties.action_link, email),
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
      console.error('Resend confirmation delivery failed:', {
        status: resendResponse.status,
        message: resendMessage.slice(0, 500),
        sender,
      });
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return jsonError(
        resendResponse.status === 401 || resendResponse.status === 403
          ? 'Email provider authorization failed. Check the Resend API key.'
          : /testing email|test mode|example\.com|recipient/i.test(resendMessage)
            ? 'Resend is currently limiting recipients. Use a real email address and enable production sending in your Resend account.'
            : 'Resend rejected the email. Check that the sender domain is verified and the recipient address is valid.',
        502
      );
    }

    return NextResponse.json({ user: created.user });
  } catch (error) {
    console.error('Signup confirmation service failed:', error);
    return jsonError('Unable to create your account. Please try again.', 500);
  }
}
