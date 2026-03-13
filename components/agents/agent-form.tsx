'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Braces } from 'lucide-react';
import { createAgent, updateAgent, type Agent } from '@/hooks/use-agents';
import { toast } from 'sonner';
import { extractAllPlaceholders } from '@/lib/utils/prompt-placeholders';

interface AgentFormProps {
  appId: string;
  agent?: Agent;
}

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

export function AgentForm({ appId, agent }: AgentFormProps) {
  const router = useRouter();
  const isEditing = !!agent;
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(agent?.name ?? '');
  const [description, setDescription] = useState(agent?.description ?? '');
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt ?? '');
  const [taskPrompt, setTaskPrompt] = useState(agent?.taskPrompt ?? '');
  const [outputSchema, setOutputSchema] = useState(
    agent?.outputSchema ? JSON.stringify(agent.outputSchema, null, 2) : ''
  );
  const [model, setModel] = useState(agent?.model ?? 'gpt-4o-mini');
  const [temperature, setTemperature] = useState(String(agent?.temperature ?? 0.7));

  // Live placeholder detection
  const detectedPlaceholders = useMemo(
    () => extractAllPlaceholders(systemPrompt, taskPrompt),
    [systemPrompt, taskPrompt]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim() || !taskPrompt.trim()) {
      toast.error('Name, system prompt, and task prompt are required');
      return;
    }

    let parsedSchema = null;
    if (outputSchema.trim()) {
      try {
        parsedSchema = JSON.parse(outputSchema);
      } catch {
        toast.error('Invalid JSON in output schema');
        return;
      }
    }

    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || null,
        systemPrompt: systemPrompt.trim(),
        taskPrompt: taskPrompt.trim(),
        outputSchema: parsedSchema,
        model,
        temperature: parseFloat(temperature),
      };

      if (isEditing) {
        await updateAgent(appId, agent.id, data);
        toast.success('Agent updated');
        router.push(`/create-agents/applications/${appId}/agents/${agent.id}`);
      } else {
        const created = await createAgent(appId, data);
        toast.success('Agent created');
        router.push(`/create-agents/applications/${appId}/agents/${created.id}`);
      }
    } catch {
      toast.error(isEditing ? 'Failed to update agent' : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl overflow-hidden">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Agent' : 'Create Agent'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-hidden">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Email Classifier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Classifies incoming emails by category"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              placeholder="You are an email classification agent..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="font-mono text-sm resize-y overflow-x-hidden"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskPrompt">Task Prompt</Label>
            <Textarea
              id="taskPrompt"
              placeholder="Classify the following email and return the category..."
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              rows={4}
              className="font-mono text-sm resize-y overflow-x-hidden"
              required
            />
          </div>

          {detectedPlaceholders.length > 0 && (
            <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Braces className="h-4 w-4" />
                Detected Placeholders
              </div>
              <div className="flex flex-wrap gap-1.5">
                {detectedPlaceholders.map((p) => (
                  <Badge key={p} variant="secondary" className="font-mono text-xs">
                    {`{${p}}`}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                These placeholders will be required in the payload when executing this agent.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="outputSchema">Output Schema (JSON, optional)</Label>
            <Textarea
              id="outputSchema"
              placeholder='{"type": "object", "properties": {...}}'
              value={outputSchema}
              onChange={(e) => setOutputSchema(e.target.value)}
              rows={4}
              className="font-mono text-sm resize-y overflow-x-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature ({temperature})</Label>
              <Input
                id="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
