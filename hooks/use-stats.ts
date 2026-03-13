import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';

export interface DashboardStats {
  application: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  };
  summary: {
    totalAgents: number;
    totalOrchestrations: number;
    totalRuns: number;
    successRate: string;
    avgResponseTimeMs: number;
    costMtd: string;
  };
  agentPerformance: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    totalRuns: number;
    successRuns: number;
    failedRuns: number;
    avgDurationMs: number;
    lastRunAt: string | null;
  }>;
  orchestrationPerformance: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    totalRuns: number;
    successRuns: number;
    avgDurationMs: number;
    lastRunAt: string | null;
  }>;
  executionsOverTime: Array<{
    date: string;
    completed: number;
    failed: number;
  }>;
}

export function useStats(appId: string) {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    appId ? `/api/applications/${appId}/stats` : null,
    fetcher
  );

  return { stats: data, error, isLoading, mutate };
}
