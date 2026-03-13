'use client';

import { useApplications, deleteApplication } from '@/hooks/use-applications';
import { AppCard } from './app-card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export function AppList() {
  const { applications, isLoading, mutate } = useApplications();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application? All agents, orchestrations, and logs will be removed.')) {
      return;
    }
    try {
      await deleteApplication(id);
      mutate();
      toast.success('Application deleted');
    } catch {
      toast.error('Failed to delete application');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="mb-4 text-muted-foreground">No applications yet</p>
        <Link href="/create-agents/applications/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Application
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {applications.map((app) => (
        <AppCard key={app.id} app={app} onDelete={handleDelete} />
      ))}
    </div>
  );
}
