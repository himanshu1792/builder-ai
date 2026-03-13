import { AppShell } from '@/components/layout/app-shell';
import { AppList } from '@/components/applications/app-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground">
            Manage your AI agent applications
          </p>
        </div>
        <Link href="/create-agents/applications/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Application
          </Button>
        </Link>
      </div>
      <div className="mt-6">
        <AppList />
      </div>
    </AppShell>
  );
}
