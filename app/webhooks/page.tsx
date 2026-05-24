'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WebhookManager } from '@/components/webhook-manager';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Webhook } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import { LoadingState } from '@/components/loading-state';
import { AgentWorkflow } from '@/types/agent';
import { supabase } from '@/lib/supabaseClient';

export default function WebhooksPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);

  useEffect(() => {
    if (user) {
      loadWorkflows();
    }
  }, [user]);

  const loadWorkflows = async () => {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setWorkflows(data as AgentWorkflow[]);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card/50 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/agent-builder')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Builder
                </Button>
                <div className="w-px h-6 bg-border" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Webhook className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">Webhook Triggers</h1>
                    <p className="text-sm text-muted-foreground">
                      Manage external webhook integrations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks Content */}
        <div className="container mx-auto px-6 py-8">
          <WebhookManager workflows={workflows} />
        </div>
      </div>
    </AuthGuard>
  );
}
