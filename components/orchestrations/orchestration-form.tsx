'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAgents, type Agent } from '@/hooks/use-agents';
import {
  createOrchestration,
  updateOrchestration,
  type Orchestration,
} from '@/hooks/use-orchestrations';
import { StepBuilder, type StepConfig } from './step-builder';
import { toast } from 'sonner';

interface OrchestrationFormProps {
  appId: string;
  orchestration?: Orchestration;
}

export function OrchestrationForm({ appId, orchestration }: OrchestrationFormProps) {
  const router = useRouter();
  const isEditing = !!orchestration;
  const { agents } = useAgents(appId);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(orchestration?.name ?? '');
  const [description, setDescription] = useState(orchestration?.description ?? '');
  const [steps, setSteps] = useState<StepConfig[]>(
    orchestration?.steps.map((s) => ({
      agentId: s.agentId,
      inputMapping: s.inputMapping,
    })) ?? [{ agentId: '', inputMapping: null }]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    const validSteps = steps.filter((s) => s.agentId);
    if (validSteps.length === 0) {
      toast.error('At least one step with a selected agent is required');
      return;
    }

    setLoading(true);
    try {
      const stepsPayload = validSteps.map((s, i) => ({
        agentId: s.agentId,
        stepOrder: i + 1,
        inputMapping: s.inputMapping,
      }));

      if (isEditing) {
        await updateOrchestration(appId, orchestration.id, {
          name: name.trim(),
          description: description.trim() || null,
          steps: stepsPayload,
        });
        toast.success('Orchestration updated');
        router.push(`/create-agents/applications/${appId}/orchestrations/${orchestration.id}`);
      } else {
        const created = await createOrchestration(appId, {
          name: name.trim(),
          description: description.trim() || null,
          steps: stepsPayload,
        });
        toast.success('Orchestration created');
        router.push(`/create-agents/applications/${appId}/orchestrations/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save orchestration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Orchestration' : 'Create Orchestration'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Email Processing Pipeline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Classifies, summarizes, and routes emails"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Agent Chain</CardTitle>
          <p className="text-xs text-muted-foreground">
            Define the sequence of agents. Output from each step feeds into the next.
          </p>
        </CardHeader>
        <CardContent>
          <StepBuilder agents={agents} steps={steps} onChange={setSteps} />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
