'use client';

import { useParams } from 'next/navigation';
import { useOrchestrations } from '@/hooks/use-orchestrations';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, GitBranch, Bot } from 'lucide-react';
import Link from 'next/link';

export default function OrchestrationListPage() {
  const { appId } = useParams<{ appId: string }>();
  const { orchestrations, isLoading } = useOrchestrations(appId);

  if (isLoading) {
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
          <h1 className="text-2xl font-bold">Orchestrations</h1>
          <p className="text-muted-foreground">Chain agents into sequential pipelines</p>
        </div>
        <Link href={`/create-agents/applications/${appId}/orchestrations/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Orchestration
          </Button>
        </Link>
      </div>

      {orchestrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orchestrations yet</p>
            <Link href={`/create-agents/applications/${appId}/orchestrations/new`}>
              <Button variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Create your first orchestration
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orchestrations.map((orch) => (
            <Link
              key={orch.id}
              href={`/create-agents/applications/${appId}/orchestrations/${orch.id}`}
            >
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{orch.name}</h3>
                        <Badge variant={orch.isActive ? 'default' : 'secondary'}>
                          {orch.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {orch.description && (
                        <p className="text-sm text-muted-foreground">{orch.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                        {orch.steps.map((step, i) => (
                          <span key={i} className="flex items-center gap-1">
                            {i > 0 && <span>→</span>}
                            <Bot className="h-3 w-3" />
                            <span>{step.agentName}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{orch.steps.length} step{orch.steps.length !== 1 ? 's' : ''}</p>
                      <p className="font-mono mt-1">{orch.slug}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
