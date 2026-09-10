'use client';

import { ReactFlowProvider } from 'reactflow';
import { AgentBuilderContent } from './components/AgentBuilderContent';
import { AuthGuard } from '@/components/AuthGuard';

type AgentBuilderPageProps = {
  initialSection?: 'builder' | 'dashboard' | 'settings' | 'templates' | 'webhooks' | 'vault';
};

export default function AgentBuilderPage({ initialSection = 'builder' }: AgentBuilderPageProps) {
  return (
    <AuthGuard>
      <ReactFlowProvider>
        <AgentBuilderContent initialSection={initialSection} />
      </ReactFlowProvider>
    </AuthGuard>
  );
}
