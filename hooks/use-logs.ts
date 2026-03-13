import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';

export interface ExecutionLog {
  id: string;
  agentId: string | null;
  orchestrationId: string | null;
  orchestrationRunId: string | null;
  stepOrder: number | null;
  inputPayload: unknown;
  outputPayload: unknown;
  status: string;
  errorMessage: string | null;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  durationMs: number | null;
  createdAt: string;
}

export function useAgentLogs(appId: string, agentId: string) {
  const { data, error, isLoading, mutate } = useSWR<ExecutionLog[]>(
    appId && agentId
      ? `/api/applications/${appId}/agents/${agentId}/logs`
      : null,
    fetcher
  );

  return { logs: data ?? [], error, isLoading, mutate };
}
