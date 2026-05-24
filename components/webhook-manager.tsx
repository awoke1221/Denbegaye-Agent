'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Copy,
  ExternalLink,
  Trash2,
  Edit,
  Plus,
  Webhook,
  Zap,
  Clock,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface WebhookTrigger {
  id: string;
  workflowId: string;
  userId: string;
  name: string;
  description?: string;
  url: string;
  secret?: string;
  enabled: boolean;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

interface WebhookManagerProps {
  workflows: Array<{ id: string; name: string; description?: string }>;
  className?: string;
}

export function WebhookManager({ workflows, className }: WebhookManagerProps) {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookTrigger | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    workflowId: '',
    name: '',
    description: '',
    method: 'POST' as 'GET' | 'POST' | 'PUT' | 'PATCH',
    headers: '{}',
    secret: '',
    enabled: true,
  });

  useEffect(() => {
    if (user) {
      loadWebhooks();
    }
  }, [user]);

  const loadWebhooks = async () => {
    if (!user) return;

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;

      const response = await fetch('/api/webhooks', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data);
      }
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!user) return;

    try {
      const headers = JSON.parse(formData.headers);

      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;

      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          headers,
        }),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        resetForm();
        loadWebhooks();
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.'))
      return;

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;

      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        loadWebhooks();
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleUpdateWebhook = async (webhookId: string) => {
    if (!user || !editingWebhook) return;

    try {
      const headers = JSON.parse(formData.headers);
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;

      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          method: formData.method,
          headers,
          secret: formData.secret,
          enabled: formData.enabled,
          workflowId: formData.workflowId,
        }),
      });

      if (response.ok) {
        setEditingWebhook(null);
        setShowCreateDialog(false);
        resetForm();
        loadWebhooks();
      } else {
        const errorData = await response.json();
        console.error('Failed to update webhook:', errorData);
      }
    } catch (error) {
      console.error('Failed to update webhook:', error);
    }
  };

  const handleRotateSecret = async (webhookId: string) => {
    if (!user) return;

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;
      const newSecret = `whsec_${Math.random().toString(36).slice(2)}_${Date.now()}`;

      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ secret: newSecret }),
      });

      if (response.ok) {
        await loadWebhooks();
        alert('Webhook secret regenerated successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to rotate secret:', errorData);
      }
    } catch (error) {
      console.error('Failed to rotate secret:', error);
    }
  };

  const handleToggleWebhook = async (webhookId: string, enabled: boolean) => {
    if (!user) return;

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;

      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        loadWebhooks();
      } else {
        const errorData = await response.json();
        console.error('Failed to toggle webhook:', errorData);
      }
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      workflowId: '',
      name: '',
      description: '',
      method: 'POST',
      headers: '{}',
      secret: '',
      enabled: true,
    });
  };

  const openEditDialog = (webhook: WebhookTrigger) => {
    setEditingWebhook(webhook);
    setFormData({
      workflowId: webhook.workflowId,
      name: webhook.name,
      description: webhook.description || '',
      method: webhook.method,
      headers: JSON.stringify(webhook.headers || {}, null, 2),
      secret: webhook.secret || '',
      enabled: webhook.enabled,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      PATCH: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {method}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Triggers</h2>
          <p className="text-muted-foreground">
            Create webhooks to trigger your workflows from external services
          </p>
        </div>
        <Dialog
          open={showCreateDialog || !!editingWebhook}
          onOpenChange={open => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingWebhook(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingWebhook ? 'Edit Webhook' : 'Create New Webhook'}</DialogTitle>
              <DialogDescription>
                Configure a webhook endpoint to trigger your workflow automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workflow">Workflow</Label>
                  <Select
                    value={formData.workflowId}
                    onValueChange={value => setFormData(prev => ({ ...prev, workflowId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows.map(workflow => (
                        <SelectItem key={workflow.id} value={workflow.id}>
                          {workflow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Webhook Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My webhook trigger"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this webhook does"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value: any) =>
                      setFormData(prev => ({ ...prev, method: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="secret">Secret (Optional)</Label>
                  <Input
                    id="secret"
                    type="password"
                    value={formData.secret}
                    onChange={e => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                    placeholder="Webhook signature secret"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="headers">Custom Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={formData.headers}
                  onChange={e => setFormData(prev => ({ ...prev, headers: e.target.value }))}
                  placeholder='{"Content-Type": "application/json"}'
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional JSON object with custom headers for webhook requests
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="enabled">Enable webhook immediately</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingWebhook(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={
                    editingWebhook
                      ? () => handleUpdateWebhook(editingWebhook.id)
                      : handleCreateWebhook
                  }
                >
                  {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Webhook className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first webhook to trigger workflows from external services
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          webhooks.map(webhook => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Webhook className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                      <CardDescription>
                        {workflows.find(w => w.id === webhook.workflowId)?.name ||
                          'Unknown workflow'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getMethodBadge(webhook.method)}
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={checked => handleToggleWebhook(webhook.id, checked)}
                    />
                  </div>
                </div>
                {webhook.description && <CardDescription>{webhook.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Webhook URL */}
                  <div>
                    <Label className="text-sm font-medium">Webhook URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                        {webhook.url}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(webhook.url)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(webhook.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Triggers</Label>
                      <p className="font-medium flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {webhook.triggerCount}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Triggered</Label>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {webhook.lastTriggered
                          ? new Date(webhook.lastTriggered).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Created</Label>
                      <p className="font-medium">
                        {new Date(webhook.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(webhook)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRotateSecret(webhook.id)}
                      className="text-amber-600 hover:text-amber-700"
                    >
                      🔑 Rotate Secret
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            How Webhooks Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Webhook Payload</h4>
              <p className="text-muted-foreground">
                Your workflow will receive the webhook payload as input variables. The payload is
                automatically enriched with webhook metadata.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Security</h4>
              <p className="text-muted-foreground">
                Optionally configure a secret for webhook signature verification. The webhook URL is
                unique and can be regenerated if compromised.
              </p>
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Example webhook payload structure:</p>
            <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
              {`{
  "userId": "123",
  "action": "purchase",
  "amount": 99.99,
  "_webhook": {
    "webhookId": "wh_123456",
    "triggeredAt": "2024-01-15T10:30:00Z",
    "method": "POST",
    "sourceIp": "192.168.1.1"
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
