'use client';

import { useParams } from 'next/navigation';
import { OrchestrationForm } from '@/components/orchestrations/orchestration-form';

export default function NewOrchestrationPage() {
  const { appId } = useParams<{ appId: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Orchestration</h1>
        <p className="text-muted-foreground">
          Build an agent chain — output from each step feeds into the next
        </p>
      </div>
      <OrchestrationForm appId={appId} />
    </div>
  );
}
