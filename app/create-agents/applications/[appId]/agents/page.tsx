'use client';

import { useParams } from 'next/navigation';
import { useAgents, deleteAgent } from '@/hooks/use-agents';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AgentsPage() {
  const { appId } = useParams<{ appId: string }>();
  const { agents, isLoading, mutate } = useAgents(appId);

  const handleDelete = async (agentId: string) => {
    if (!confirm('Delete this agent? All execution logs will be removed.')) return;
    try {
      await deleteAgent(appId, agentId);
      mutate();
      toast.success('Agent deleted');
    } catch {
      toast.error('Failed to delete agent');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-muted-foreground">AI agents in this application</p>
        </div>
        <Link href={`/create-agents/applications/${appId}/agents/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Agent
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="mb-4 text-muted-foreground">No agents yet</p>
          <Link href={`/create-agents/applications/${appId}/agents/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Agent
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="group relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{agent.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {agent.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDelete(agent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{agent.model}</span>
                  </div>
                  <Link href={`/create-agents/applications/${appId}/agents/${agent.id}`}>
                    <Button variant="outline" size="sm">
                      Open <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
