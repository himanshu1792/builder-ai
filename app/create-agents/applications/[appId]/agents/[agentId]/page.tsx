'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAgent, deleteAgent } from '@/hooks/use-agents';
import { EndpointDisplay } from '@/components/agents/endpoint-display';
import { SchemaViewer } from '@/components/agents/schema-viewer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Trash2, FileText, Braces } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AgentDetailPage() {
  const { appId, agentId } = useParams<{ appId: string; agentId: string }>();
  const { agent, isLoading } = useAgent(appId, agentId);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Delete this agent? All execution logs will be removed.')) return;
    try {
      await deleteAgent(appId, agentId);
      toast.success('Agent deleted');
      router.push(`/create-agents/applications/${appId}/agents`);
    } catch {
      toast.error('Failed to delete agent');
    }
  };

  if (isLoading || !agent) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground">{agent.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/create-agents/applications/${appId}/agents/${agentId}/logs`}>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" /> Logs
            </Button>
          </Link>
          <Link href={`/create-agents/applications/${appId}/agents/${agentId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <EndpointDisplay slug={agent.slug} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                {agent.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="font-mono">{agent.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temperature</span>
              <span>{agent.temperature}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono">{agent.slug}</span>
            </div>
            {agent.promptPlaceholders && agent.promptPlaceholders.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Braces className="h-3.5 w-3.5" />
                  <span>Placeholders</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {agent.promptPlaceholders.map((p) => (
                    <Badge key={p} variant="secondary" className="font-mono text-xs">
                      {`{${p}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">System Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded bg-muted p-3 text-xs font-mono max-h-48 overflow-y-auto">
              {agent.systemPrompt}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Task Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded bg-muted p-3 text-xs font-mono max-h-48 overflow-y-auto">
            {agent.taskPrompt}
          </pre>
        </CardContent>
      </Card>

      {agent.outputSchema !== null && agent.outputSchema !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Output Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <SchemaViewer schema={agent.outputSchema} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
