import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';

export interface ModelCostBreakdown {
  model: string;
  displayName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface AgentCostBreakdown {
  agentId: string;
  agentName: string;
  totalTokens: number;
  totalCost: number;
}

export interface DailyCostTrend {
  date: string;
  tokens: number;
  cost: number;
}

export interface BillingData {
  applicationId: string;
  month: string;
  totalCost: number;
  totalTokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  byModel: ModelCostBreakdown[];
  byAgent: AgentCostBreakdown[];
  dailyTrend: DailyCostTrend[];
}

export function useBilling(appId: string, month?: string) {
  const params = month ? `?month=${month}` : '';
  const { data, error, isLoading, mutate } = useSWR<BillingData>(
    appId ? `/api/applications/${appId}/billing${params}` : null,
    fetcher
  );

  return { billing: data, error, isLoading, mutate };
}
