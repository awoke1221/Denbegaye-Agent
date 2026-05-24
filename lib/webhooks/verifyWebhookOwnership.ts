import { supabase } from '@/lib/supabaseClient';

export class WebhookNotFoundError extends Error {
  constructor(message: string = 'Webhook not found') {
    super(message);
    this.name = 'WebhookNotFoundError';
  }
}

export async function verifyWebhookOwnership(webhookId: string, userId: string) {
  const { data: existingWebhook, error: fetchError } = await supabase
    .from('webhookTriggers')
    .select('*')
    .eq('id', webhookId)
    .eq('userId', userId)
    .single();

  if (fetchError || !existingWebhook) {
    throw new WebhookNotFoundError();
  }

  return existingWebhook;
}
