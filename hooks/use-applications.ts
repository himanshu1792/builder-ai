import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';

export interface Application {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useApplications() {
  const { data, error, isLoading, mutate } = useSWR<Application[]>(
    '/api/applications',
    fetcher
  );

  return { applications: data ?? [], error, isLoading, mutate };
}

export function useApplication(appId: string) {
  const { data, error, isLoading, mutate } = useSWR<Application>(
    appId ? `/api/applications/${appId}` : null,
    fetcher
  );

  return { application: data, error, isLoading, mutate };
}

export async function createApplication(data: { name: string; description?: string | null }) {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create application');
  return res.json();
}

export async function updateApplication(appId: string, data: { name?: string; description?: string | null }) {
  const res = await fetch(`/api/applications/${appId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update application');
  return res.json();
}

export async function deleteApplication(appId: string) {
  const res = await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete application');
}
