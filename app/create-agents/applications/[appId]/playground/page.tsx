'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAgents, type Agent } from '@/hooks/use-agents';
import { useOrchestrations, type Orchestration } from '@/hooks/use-orchestrations';
import {
  usePlayground,
  type PlaygroundResult,
  type PlaygroundAgentResult,
  type PlaygroundOrchestrationResult,
} from '@/hooks/use-playground';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Play, Bot, GitBranch, Clock, Zap, DollarSign, Braces } from 'lucide-react';
import { toast } from 'sonner';

function isAgentResult(r: PlaygroundResult): r is PlaygroundAgentResult {
  return 'executionId' in r && 'model' in r;
}

function isOrchestrationResult(r: PlaygroundResult): r is PlaygroundOrchestrationResult {
  return 'steps' in r && 'orchestrationRunId' in r;
}

export default function PlaygroundPage() {
  const { appId } = useParams<{ appId: string }>();
  const { agents } = useAgents(appId);
  const { orchestrations } = useOrchestrations(appId);
  const { run, isRunning, history } = usePlayground();

  const [type, setType] = useState<'agent' | 'orchestration'>('agent');
  const [targetId, setTargetId] = useState('');
  const [payload, setPayload] = useState('{\n  "message": "Hello"\n}');
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targets: (Agent | Orchestration)[] = type === 'agent' ? agents : orchestrations;
  const selectedTarget = targets.find((t) => t.id === targetId);

  // Get placeholder info for the selected agent
  const selectedAgent = type === 'agent' && selectedTarget ? (selectedTarget as Agent) : null;
  const placeholders = selectedAgent?.promptPlaceholders ?? [];

  // Auto-generate payload template when target changes
  const handleTargetChange = (id: string) => {
    setTargetId(id);
    if (type === 'agent') {
      const agent = agents.find((a) => a.id === id);
      if (agent?.promptPlaceholders && agent.promptPlaceholders.length > 0) {
        const template: Record<string, string> = {};
        for (const p of agent.promptPlaceholders) {
          template[p] = '';
        }
        setPayload(JSON.stringify(template, null, 2));
      }
    }
  };

  const handleRun = async () => {
    if (!targetId) {
      toast.error(`Select ${type === 'agent' ? 'an agent' : 'an orchestration'}`);
      return;
    }

    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      toast.error('Invalid JSON payload');
      return;
    }

    setResult(null);
    setError(null);

    try {
      const res = await run({
        type,
        targetId,
        targetName: selectedTarget?.name ?? 'Unknown',
        payload: parsedPayload,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Playground</h1>
        <p className="text-muted-foreground">Test agents and orchestrations</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as 'agent' | 'orchestration');
                    setTargetId('');
                    setResult(null);
                    setError(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">
                      <span className="flex items-center gap-2">
                        <Bot className="h-3 w-3" /> Agent
                      </span>
                    </SelectItem>
                    <SelectItem value="orchestration">
                      <span className="flex items-center gap-2">
                        <GitBranch className="h-3 w-3" /> Orchestration
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target</Label>
                <Select value={targetId} onValueChange={handleTargetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${type}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {placeholders.length > 0 && (
                <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Braces className="h-4 w-4" />
                    Required Placeholders
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {placeholders.map((p) => (
                      <Badge key={p} variant="secondary" className="font-mono text-xs">
                        {`{${p}}`}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Include these keys in your payload to fill prompt placeholders.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Payload (JSON)</Label>
                <Textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                  placeholder='{"message": "Hello"}'
                />
              </div>

              <Button onClick={handleRun} disabled={isRunning} className="w-full">
                {isRunning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Response Panel */}
        <div className="space-y-4">
          {error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-sm text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="rounded bg-destructive/10 p-3 text-xs font-mono text-destructive overflow-x-auto">
                  {error}
                </pre>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="default">
                      <Zap className="mr-1 h-3 w-3" /> Success
                    </Badge>
                    {isAgentResult(result) && (
                      <>
                        <Badge variant="outline">
                          {result.model}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" /> {result.durationMs}ms
                        </Badge>
                        <Badge variant="outline">
                          {result.tokensUsed.total} tokens
                        </Badge>
                        <Badge variant="secondary">
                          <DollarSign className="mr-1 h-3 w-3" /> {result.estimatedCost}
                        </Badge>
                      </>
                    )}
                    {isOrchestrationResult(result) && (
                      <>
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" /> {result.totalDurationMs}ms
                        </Badge>
                        <Badge variant="outline">
                          {result.steps.length} steps
                        </Badge>
                        <Badge variant="secondary">
                          <DollarSign className="mr-1 h-3 w-3" /> {result.estimatedCost}
                        </Badge>
                      </>
                    )}
                  </div>

                  {isAgentResult(result) && (
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Prompt Tokens</p>
                        <p className="font-mono">{result.tokensUsed.prompt}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Completion Tokens</p>
                        <p className="font-mono">{result.tokensUsed.completion}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Total Tokens</p>
                        <p className="font-mono">{result.tokensUsed.total}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                    <pre className="rounded bg-muted p-3 text-xs font-mono overflow-x-auto max-h-64">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Step Breakdown for orchestrations */}
              {isOrchestrationResult(result) && result.steps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Step Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.steps.map((step, idx) => (
                      <Card key={idx} className="border">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Step {step.stepOrder}</Badge>
                              <span className="text-sm font-medium">{step.agent}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge
                                variant={step.status === 'completed' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {step.status}
                              </Badge>
                              <span>{step.tokensUsed} tokens</span>
                              <span>{step.durationMs}ms</span>
                            </div>
                          </div>
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground">
                              Output
                            </summary>
                            <pre className="mt-1 rounded bg-muted p-2 font-mono overflow-x-auto max-h-32">
                              {JSON.stringify(step.output, null, 2)}
                            </pre>
                          </details>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!result && !error && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Play className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Run an agent or orchestration to see results</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Run History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs">
                      {entry.timestamp.toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{entry.targetName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.error ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {entry.error ? 'Failed' : 'Success'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {entry.result && 'estimatedCost' in entry.result
                        ? (entry.result as PlaygroundAgentResult | PlaygroundOrchestrationResult).estimatedCost
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setType(entry.type);
                          setTargetId(entry.targetId);
                          setPayload(JSON.stringify(entry.payload, null, 2));
                          if (entry.result) setResult(entry.result);
                          if (entry.error) setError(entry.error);
                        }}
                      >
                        Replay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
