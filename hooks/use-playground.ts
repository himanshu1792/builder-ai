import { useState, useCallback } from 'react';

export interface PlaygroundAgentResult {
  result: unknown;
  executionId: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  durationMs: number;
  estimatedCost: string;
}

export interface PlaygroundOrchestrationStep {
  agent: string;
  agentId: string;
  stepOrder: number;
  status: 'completed' | 'failed';
  durationMs: number;
  tokensUsed: number;
  output?: unknown;
  error?: string;
}

export interface PlaygroundOrchestrationResult {
  result: unknown;
  orchestrationRunId: string;
  steps: PlaygroundOrchestrationStep[];
  totalDurationMs: number;
  totalTokensUsed: number;
  estimatedCost: string;
}

export type PlaygroundResult = PlaygroundAgentResult | PlaygroundOrchestrationResult;

export interface PlaygroundRun {
  id: string;
  type: 'agent' | 'orchestration';
  targetId: string;
  targetName: string;
  payload: Record<string, unknown>;
  result: PlaygroundResult | null;
  error: string | null;
  timestamp: Date;
}

export function usePlayground() {
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<PlaygroundRun[]>([]);

  const run = useCallback(
    async (params: {
      type: 'agent' | 'orchestration';
      targetId: string;
      targetName: string;
      payload: Record<string, unknown>;
    }): Promise<PlaygroundResult> => {
      setIsRunning(true);
      const runEntry: PlaygroundRun = {
        id: crypto.randomUUID(),
        type: params.type,
        targetId: params.targetId,
        targetName: params.targetName,
        payload: params.payload,
        result: null,
        error: null,
        timestamp: new Date(),
      };

      try {
        const body =
          params.type === 'agent'
            ? { type: 'agent' as const, agentId: params.targetId, payload: params.payload }
            : { type: 'orchestration' as const, orchestrationId: params.targetId, payload: params.payload };

        const res = await fetch('/api/playground/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || err.error || `Execution failed (${res.status})`);
        }

        const result = await res.json();
        runEntry.result = result;
        setHistory((prev) => [runEntry, ...prev].slice(0, 10));
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        runEntry.error = msg;
        setHistory((prev) => [runEntry, ...prev].slice(0, 10));
        throw err;
      } finally {
        setIsRunning(false);
      }
    },
    []
  );

  return { run, isRunning, history };
}
