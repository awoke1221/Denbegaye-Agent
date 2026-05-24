'use client';

import { ReactFlowProvider } from 'reactflow';
import { AgentBuilderContent } from './components/AgentBuilderContent';
import { AuthGuard } from '@/components/AuthGuard';

export default function AgentBuilderPage() {
  return (
    <AuthGuard>
      <ReactFlowProvider>
        <AgentBuilderContent />
      </ReactFlowProvider>
    </AuthGuard>
  );
}
