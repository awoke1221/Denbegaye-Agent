import { supabase } from '@/lib/supabaseClient';

export class WebhookOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookOperationError';
  }
}

export async function updateWebhook(webhookId: string, updateData: any) {
  // Enforce immutable fields when updating
  const mutableFields = [
    'name',
    'description',
    'enabled',
    'method',
    'headers',
    'secret',
    'workflowId',
  ];
  const sanitized = Object.keys(updateData).reduce((acc: any, key) => {
    if (mutableFields.includes(key)) {
      acc[key] = updateData[key];
    }
    return acc;
  }, {});

  const { error } = await supabase
    .from('webhookTriggers')
    .update({
      ...sanitized,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', webhookId);

  if (error) {
    throw new WebhookOperationError(`Failed to update webhook: ${error.message}`);
  }
}

export async function deleteWebhook(webhookId: string) {
  const { error } = await supabase.from('webhookTriggers').delete().eq('id', webhookId);

  if (error) {
    throw new WebhookOperationError(`Failed to delete webhook: ${error.message}`);
  }
}

export async function logWebhookEvent(
  webhookId: string,
  status: 'success' | 'failure',
  eventType: 'trigger' | 'error',
  payload: any,
  metadata: any,
  errorMessage?: string
) {
  const { error } = await supabase.from('webhookEvents').insert({
    id: `we_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    webhookId,
    status,
    eventType,
    payload,
    metadata,
    errorMessage,
    createdAt: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to log webhook event:', error.message);
  }
}
