'use client';

import { useParams } from 'next/navigation';
import { useOrchestration } from '@/hooks/use-orchestrations';
import { OrchestrationForm } from '@/components/orchestrations/orchestration-form';
import { Loader2 } from 'lucide-react';

export default function EditOrchestrationPage() {
  const { appId, orchId } = useParams<{ appId: string; orchId: string }>();
  const { orchestration, isLoading } = useOrchestration(appId, orchId);

  if (isLoading || !orchestration) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Orchestration</h1>
        <p className="text-muted-foreground">Update the agent chain</p>
      </div>
      <OrchestrationForm appId={appId} orchestration={orchestration} />
    </div>
  );
}
