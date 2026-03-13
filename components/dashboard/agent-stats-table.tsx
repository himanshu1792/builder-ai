'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { DashboardStats } from '@/hooks/use-stats';

interface AgentStatsTableProps {
  agents: DashboardStats['agentPerformance'];
}

export function AgentStatsTable({ agents }: AgentStatsTableProps) {
  if (agents.length === 0) {
    return <p className="text-sm text-muted-foreground">No agents yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Runs</TableHead>
          <TableHead className="text-right">Success</TableHead>
          <TableHead className="text-right">Failed</TableHead>
          <TableHead className="text-right">Avg Duration</TableHead>
          <TableHead className="text-right">Last Run</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id}>
            <TableCell className="font-medium">{agent.name}</TableCell>
            <TableCell>
              <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                {agent.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{agent.totalRuns}</TableCell>
            <TableCell className="text-right">{agent.successRuns}</TableCell>
            <TableCell className="text-right">{agent.failedRuns}</TableCell>
            <TableCell className="text-right">{agent.avgDurationMs}ms</TableCell>
            <TableCell className="text-right">
              {agent.lastRunAt
                ? new Date(agent.lastRunAt).toLocaleDateString()
                : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
