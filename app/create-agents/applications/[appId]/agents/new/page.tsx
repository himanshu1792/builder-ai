'use client';

import { useParams } from 'next/navigation';
import { AgentForm } from '@/components/agents/agent-form';

export default function NewAgentPage() {
  const { appId } = useParams<{ appId: string }>();

  return <AgentForm appId={appId} />;
}
