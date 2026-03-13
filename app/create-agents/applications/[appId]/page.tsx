'use client';

import { useParams } from 'next/navigation';
import { useStats } from '@/hooks/use-stats';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { AgentStatsTable } from '@/components/dashboard/agent-stats-table';
import { OrchestrationStatsTable } from '@/components/dashboard/orchestration-stats-table';
import { ExecutionsChart } from '@/components/dashboard/executions-chart';
import { SuccessRateChart } from '@/components/dashboard/success-rate-chart';
import { ResponseTimeChart } from '@/components/dashboard/response-time-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { appId } = useParams<{ appId: string }>();
  const { stats, isLoading } = useStats(appId);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{stats.application.name}</h1>
        <p className="text-muted-foreground">
          {stats.application.description || 'Application dashboard'}
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards summary={stats.summary} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Executions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ExecutionsChart data={stats.executionsOverTime} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <SuccessRateChart
              successRate={stats.summary.successRate}
              totalRuns={stats.summary.totalRuns}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponseTimeChart data={stats.executionsOverTime} />
        </CardContent>
      </Card>

      {/* Performance Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentStatsTable agents={stats.agentPerformance} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orchestration Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <OrchestrationStatsTable orchestrations={stats.orchestrationPerformance} />
        </CardContent>
      </Card>
    </div>
  );
}
