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

interface OrchestrationStatsTableProps {
  orchestrations: DashboardStats['orchestrationPerformance'];
}

export function OrchestrationStatsTable({ orchestrations }: OrchestrationStatsTableProps) {
  if (orchestrations.length === 0) {
    return <p className="text-sm text-muted-foreground">No orchestrations yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Orchestration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Runs</TableHead>
          <TableHead className="text-right">Success</TableHead>
          <TableHead className="text-right">Avg Duration</TableHead>
          <TableHead className="text-right">Last Run</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orchestrations.map((orch) => (
          <TableRow key={orch.id}>
            <TableCell className="font-medium">{orch.name}</TableCell>
            <TableCell>
              <Badge variant={orch.isActive ? 'default' : 'secondary'}>
                {orch.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{orch.totalRuns}</TableCell>
            <TableCell className="text-right">{orch.successRuns}</TableCell>
            <TableCell className="text-right">{orch.avgDurationMs}ms</TableCell>
            <TableCell className="text-right">
              {orch.lastRunAt
                ? new Date(orch.lastRunAt).toLocaleDateString()
                : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
