import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';

export interface OrchestrationStep {
  id: string;
  stepOrder: number;
  agentId: string;
  agentName: string;
  agentSlug?: string;
  inputMapping: {
    type: 'pick' | 'rename' | 'wrap';
    fields?: string[];
    mapping?: Record<string, string>;
    key?: string;
  } | null;
}

export interface Orchestration {
  id: string;
  applicationId: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  endpointUrl: string;
  steps: OrchestrationStep[];
}

export function useOrchestrations(appId: string) {
  const { data, error, isLoading, mutate } = useSWR<Orchestration[]>(
    appId ? `/api/applications/${appId}/orchestrations` : null,
    fetcher
  );

  return { orchestrations: data ?? [], error, isLoading, mutate };
}

export function useOrchestration(appId: string, orchId: string) {
  const { data, error, isLoading, mutate } = useSWR<Orchestration>(
    appId && orchId ? `/api/applications/${appId}/orchestrations/${orchId}` : null,
    fetcher
  );

  return { orchestration: data, error, isLoading, mutate };
}

export async function createOrchestration(
  appId: string,
  data: {
    name: string;
    description?: string | null;
    steps: {
      agentId: string;
      stepOrder: number;
      inputMapping?: {
        type: 'pick' | 'rename' | 'wrap';
        fields?: string[];
        mapping?: Record<string, string>;
        key?: string;
      } | null;
    }[];
  }
) {
  const res = await fetch(`/api/applications/${appId}/orchestrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to create orchestration');
  }
  return res.json();
}

export async function updateOrchestration(
  appId: string,
  orchId: string,
  data: Partial<{
    name: string;
    description: string | null;
    isActive: boolean;
    steps: {
      agentId: string;
      stepOrder: number;
      inputMapping?: {
        type: 'pick' | 'rename' | 'wrap';
        fields?: string[];
        mapping?: Record<string, string>;
        key?: string;
      } | null;
    }[];
  }>
) {
  const res = await fetch(`/api/applications/${appId}/orchestrations/${orchId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to update orchestration');
  }
  return res.json();
}

export async function deleteOrchestration(appId: string, orchId: string) {
  const res = await fetch(`/api/applications/${appId}/orchestrations/${orchId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete orchestration');
}
