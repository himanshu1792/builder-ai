'use client';

import { useParams } from 'next/navigation';
import { useAgent } from '@/hooks/use-agents';
import { AgentForm } from '@/components/agents/agent-form';
import { Loader2 } from 'lucide-react';

export default function EditAgentPage() {
  const { appId, agentId } = useParams<{ appId: string; agentId: string }>();
  const { agent, isLoading } = useAgent(appId, agentId);

  if (isLoading || !agent) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <AgentForm appId={appId} agent={agent} />;
}
