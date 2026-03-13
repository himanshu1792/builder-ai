import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orchestrations, executionLogs } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appId: string; orchId: string }> }
) {
  try {
    const { appId, orchId } = await params;

    // Verify orchestration exists and belongs to app
    const [orch] = await db
      .select()
      .from(orchestrations)
      .where(and(eq(orchestrations.id, orchId), eq(orchestrations.applicationId, appId)));

    if (!orch) {
      return NextResponse.json({ error: 'Orchestration not found' }, { status: 404 });
    }

    const logs = await db
      .select()
      .from(executionLogs)
      .where(eq(executionLogs.orchestrationId, orchId))
      .orderBy(desc(executionLogs.createdAt))
      .limit(200);

    // Group by orchestration_run_id
    const runMap = new Map<string, typeof logs>();
    const standaloneRuns: typeof logs = [];

    for (const log of logs) {
      if (log.orchestrationRunId) {
        const existing = runMap.get(log.orchestrationRunId) ?? [];
        existing.push(log);
        runMap.set(log.orchestrationRunId, existing);
      } else {
        standaloneRuns.push(log);
      }
    }

    // Convert grouped runs into a structured response
    const groupedRuns = Array.from(runMap.entries()).map(([runId, steps]) => {
      const sorted = steps.sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0));
      const lastStep = sorted[sorted.length - 1];
      const firstStep = sorted[0];
      return {
        orchestrationRunId: runId,
        status: lastStep.status,
        createdAt: firstStep.createdAt,
        totalDuration: sorted.reduce((sum, s) => sum + (s.durationMs ?? 0), 0),
        totalTokens: sorted.reduce((sum, s) => sum + (s.totalTokens ?? 0), 0),
        stepCount: sorted.length,
        steps: sorted,
      };
    });

    return NextResponse.json({ groupedRuns, standalone: standaloneRuns });
  } catch (error) {
    console.error('Failed to get orchestration logs:', error);
    return NextResponse.json(
      { error: 'Failed to get orchestration logs' },
      { status: 500 }
    );
  }
}
