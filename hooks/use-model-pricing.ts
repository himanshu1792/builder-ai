import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';

export interface ModelPricing {
  id: string;
  modelId: string;
  displayName: string;
  inputPricePer1k: string;
  outputPricePer1k: string;
  isActive: boolean;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export function useModelPricing() {
  const { data, error, isLoading, mutate } = useSWR<{ models: ModelPricing[] }>(
    '/api/model-pricing',
    fetcher
  );

  return { models: data?.models ?? [], error, isLoading, mutate };
}

export async function upsertModelPricing(data: {
  modelId: string;
  displayName: string;
  inputPricePer1k: number;
  outputPricePer1k: number;
  isActive?: boolean;
}) {
  const res = await fetch('/api/model-pricing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to save model pricing');
  }
  return res.json();
}
