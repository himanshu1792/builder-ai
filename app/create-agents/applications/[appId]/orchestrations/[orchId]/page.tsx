'use client';

import { useParams, useRouter } from 'next/navigation';
import { useOrchestration, deleteOrchestration } from '@/hooks/use-orchestrations';
import { OrchestrationEndpointDisplay } from '@/components/orchestrations/orchestration-endpoint-display';
import { ChainVisualizer } from '@/components/orchestrations/chain-visualizer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function OrchestrationDetailPage() {
  const { appId, orchId } = useParams<{ appId: string; orchId: string }>();
  const { orchestration, isLoading } = useOrchestration(appId, orchId);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Delete this orchestration? All execution logs will be removed.')) return;
    try {
      await deleteOrchestration(appId, orchId);
      toast.success('Orchestration deleted');
      router.push(`/create-agents/applications/${appId}/orchestrations`);
    } catch {
      toast.error('Failed to delete orchestration');
    }
  };

  if (isLoading || !orchestration) {
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
          <h1 className="text-2xl font-bold">{orchestration.name}</h1>
          <p className="text-muted-foreground">{orchestration.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/create-agents/applications/${appId}/orchestrations/${orchId}/logs`}>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" /> Logs
            </Button>
          </Link>
          <Link href={`/create-agents/applications/${appId}/orchestrations/${orchId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={orchestration.isActive ? 'default' : 'secondary'}>
              {orchestration.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slug</span>
            <span className="font-mono">{orchestration.slug}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Steps</span>
            <span>{orchestration.steps.length}</span>
          </div>
        </CardContent>
      </Card>

      <OrchestrationEndpointDisplay slug={orchestration.slug} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Agent Chain</CardTitle>
        </CardHeader>
        <CardContent>
          <ChainVisualizer steps={orchestration.steps} />
        </CardContent>
      </Card>

      {orchestration.steps.some((s) => s.inputMapping !== null && s.inputMapping !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Input Mappings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orchestration.steps
              .filter((s) => s.inputMapping !== null && s.inputMapping !== undefined)
              .map((step) => (
                <div key={step.stepOrder} className="flex items-start gap-3 text-sm">
                  <Badge variant="outline">Step {step.stepOrder}</Badge>
                  <div>
                    <p className="font-medium">{step.agentName}</p>
                    <pre className="mt-1 rounded bg-muted p-2 text-xs font-mono">
                      {JSON.stringify(step.inputMapping, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
