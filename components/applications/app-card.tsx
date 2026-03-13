'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, Box } from 'lucide-react';
import type { Application } from '@/hooks/use-applications';

interface AppCardProps {
  app: Application;
  onDelete: (id: string) => void;
}

export function AppCard({ app, onDelete }: AppCardProps) {
  return (
    <Card className="group relative shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary/40">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 mt-0.5">
              <Box className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate">{app.name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {app.description || 'No description'}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              onDelete(app.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Created {new Date(app.createdAt).toLocaleDateString()}
          </p>
          <Link href={`/create-agents/applications/${app.id}`}>
            <Button variant="outline" size="sm">
              Open <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
