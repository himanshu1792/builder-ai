import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';

export interface Agent {
  id: string;
  applicationId: string;
  slug: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  taskPrompt: string;
  outputSchema: unknown;
  model: string;
  temperature: number;
  promptPlaceholders: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  endpointUrl?: string;
}

export function useAgents(appId: string) {
  const { data, error, isLoading, mutate } = useSWR<Agent[]>(
    appId ? `/api/applications/${appId}/agents` : null,
    fetcher
  );

  return { agents: data ?? [], error, isLoading, mutate };
}

export function useAgent(appId: string, agentId: string) {
  const { data, error, isLoading, mutate } = useSWR<Agent>(
    appId && agentId ? `/api/applications/${appId}/agents/${agentId}` : null,
    fetcher
  );

  return { agent: data, error, isLoading, mutate };
}

export async function createAgent(
  appId: string,
  data: {
    name: string;
    description?: string | null;
    systemPrompt: string;
    taskPrompt: string;
    outputSchema?: unknown;
    model?: string;
    temperature?: number;
    isActive?: boolean;
  }
) {
  const res = await fetch(`/api/applications/${appId}/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create agent');
  return res.json();
}

export async function updateAgent(
  appId: string,
  agentId: string,
  data: Partial<{
    name: string;
    description: string | null;
    systemPrompt: string;
    taskPrompt: string;
    outputSchema: unknown;
    model: string;
    temperature: number;
    isActive: boolean;
  }>
) {
  const res = await fetch(`/api/applications/${appId}/agents/${agentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update agent');
  return res.json();
}

export async function deleteAgent(appId: string, agentId: string) {
  const res = await fetch(`/api/applications/${appId}/agents/${agentId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete agent');
}
