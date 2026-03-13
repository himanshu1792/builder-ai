'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ExecutionLog } from '@/hooks/use-logs';

interface LogTableProps {
  logs: ExecutionLog[];
}

export function LogTable({ logs }: LogTableProps) {
  const [selected, setSelected] = useState<ExecutionLog | null>(null);

  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">No execution logs yet.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Model</TableHead>
            <TableHead className="text-right">Tokens</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-sm">
                {new Date(log.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant={log.status === 'completed' ? 'default' : 'destructive'}>
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{log.model ?? '-'}</TableCell>
              <TableCell className="text-right text-sm">
                {log.totalTokens ?? '-'}
              </TableCell>
              <TableCell className="text-right text-sm">
                {log.durationMs ? `${log.durationMs}ms` : '-'}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(log)}
                >
                  Detail
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Execution Detail</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Status</p>
                  <Badge variant={selected.status === 'completed' ? 'default' : 'destructive'}>
                    {selected.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Model</p>
                  <p>{selected.model ?? '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Duration</p>
                  <p>{selected.durationMs ? `${selected.durationMs}ms` : '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Tokens</p>
                  <p>
                    {selected.promptTokens ?? 0} prompt + {selected.completionTokens ?? 0}{' '}
                    completion = {selected.totalTokens ?? 0} total
                  </p>
                </div>
              </div>
              {selected.errorMessage && (
                <div>
                  <p className="font-medium text-muted-foreground text-sm">Error</p>
                  <pre className="mt-1 rounded bg-destructive/10 p-3 text-xs font-mono text-destructive overflow-x-auto">
                    {selected.errorMessage}
                  </pre>
                </div>
              )}
              <div>
                <p className="font-medium text-muted-foreground text-sm">Input</p>
                <pre className="mt-1 rounded bg-muted p-3 text-xs font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(selected.inputPayload, null, 2)}
                </pre>
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-sm">Output</p>
                <pre className="mt-1 rounded bg-muted p-3 text-xs font-mono overflow-x-auto max-h-48">
                  {selected.outputPayload
                    ? JSON.stringify(selected.outputPayload, null, 2)
                    : '-'}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
