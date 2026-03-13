'use client';

import { useParams } from 'next/navigation';
import { useAgent } from '@/hooks/use-agents';
import { useAgentLogs } from '@/hooks/use-logs';
import { LogTable } from '@/components/logs/log-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AgentLogsPage() {
  const { appId, agentId } = useParams<{ appId: string; agentId: string }>();
  const { agent } = useAgent(appId, agentId);
  const { logs, isLoading } = useAgentLogs(appId, agentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {agent?.name ?? 'Agent'} — Execution Logs
        </h1>
        <p className="text-muted-foreground">
          Last 100 executions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <LogTable logs={logs} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
