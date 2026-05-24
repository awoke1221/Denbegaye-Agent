export interface EmailNotificationOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailNotificationResult {
  success: boolean;
  provider?: 'sendgrid' | 'mailgun';
  error?: string;
}

export async function sendEmailNotification(
  options: EmailNotificationOptions
): Promise<EmailNotificationResult> {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
  const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
  const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL;

  if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: { email: SENDGRID_FROM_EMAIL },
          content: [
            { type: 'text/plain', value: options.text },
            { type: 'text/html', value: options.html || options.text },
          ],
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        return {
          success: false,
          provider: 'sendgrid',
          error: `SendGrid error: ${response.status} ${body}`,
        };
      }

      return { success: true, provider: 'sendgrid' };
    } catch (error) {
      return {
        success: false,
        provider: 'sendgrid',
        error: error instanceof Error ? error.message : 'SendGrid request failed',
      };
    }
  }

  if (MAILGUN_API_KEY && MAILGUN_DOMAIN && MAILGUN_FROM_EMAIL) {
    try {
      const body = new URLSearchParams({
        from: MAILGUN_FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        text: options.text,
      });

      if (options.html) {
        body.append('html', options.html);
      }

      const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
        },
        body,
      });

      if (!response.ok) {
        const bodyContent = await response.text();
        return {
          success: false,
          provider: 'mailgun',
          error: `Mailgun error: ${response.status} ${bodyContent}`,
        };
      }

      return { success: true, provider: 'mailgun' };
    } catch (error) {
      return {
        success: false,
        provider: 'mailgun',
        error: error instanceof Error ? error.message : 'Mailgun request failed',
      };
    }
  }

  return {
    success: false,
    error:
      'No email provider configured. Set SENDGRID_API_KEY/SENDGRID_FROM_EMAIL or MAILGUN_API_KEY/MAILGUN_DOMAIN/MAILGUN_FROM_EMAIL.',
  };
}
