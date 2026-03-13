'use client';

import { useParams } from 'next/navigation';
import { useOrchestration } from '@/hooks/use-orchestrations';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { ExecutionLog } from '@/hooks/use-logs';

interface GroupedRun {
  orchestrationRunId: string;
  status: string;
  createdAt: string;
  totalDuration: number;
  totalTokens: number;
  stepCount: number;
  steps: ExecutionLog[];
}

interface OrchLogsResponse {
  groupedRuns: GroupedRun[];
  standalone: ExecutionLog[];
}

export default function OrchestrationLogsPage() {
  const { appId, orchId } = useParams<{ appId: string; orchId: string }>();
  const { orchestration } = useOrchestration(appId, orchId);
  const { data, isLoading } = useSWR<OrchLogsResponse>(
    appId && orchId ? `/api/applications/${appId}/orchestrations/${orchId}/logs` : null,
    fetcher
  );
  const [selected, setSelected] = useState<GroupedRun | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {orchestration?.name ?? 'Orchestration'} — Execution Logs
        </h1>
        <p className="text-muted-foreground">Grouped by orchestration run</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.groupedRuns || data.groupedRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No execution logs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Steps</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.groupedRuns.map((run) => (
                  <TableRow key={run.orchestrationRunId}>
                    <TableCell className="text-sm">
                      {new Date(run.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={run.status === 'completed' ? 'default' : 'destructive'}
                      >
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {run.stepCount}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {run.totalTokens}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {run.totalDuration}ms
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(run)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Run Detail</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Status</p>
                  <Badge variant={selected.status === 'completed' ? 'default' : 'destructive'}>
                    {selected.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Total Tokens</p>
                  <p>{selected.totalTokens}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Total Duration</p>
                  <p>{selected.totalDuration}ms</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-sm">Steps</p>
                {selected.steps.map((step) => (
                  <Card key={step.id}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Step {step.stepOrder ?? '?'}</Badge>
                          <Badge variant={step.status === 'completed' ? 'default' : 'destructive'}>
                            {step.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{step.model}</span>
                          <span>{step.totalTokens ?? 0} tokens</span>
                          <span>{step.durationMs}ms</span>
                        </div>
                      </div>
                      {step.errorMessage && (
                        <pre className="rounded bg-destructive/10 p-2 text-xs font-mono text-destructive overflow-x-auto">
                          {step.errorMessage}
                        </pre>
                      )}
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                          Input / Output
                        </summary>
                        <div className="mt-2 space-y-2">
                          <pre className="rounded bg-muted p-2 font-mono overflow-x-auto max-h-32">
                            {JSON.stringify(step.inputPayload, null, 2)}
                          </pre>
                          <pre className="rounded bg-muted p-2 font-mono overflow-x-auto max-h-32">
                            {step.outputPayload
                              ? JSON.stringify(step.outputPayload, null, 2)
                              : '-'}
                          </pre>
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
