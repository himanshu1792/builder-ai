import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents, executionLogs } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appId: string; agentId: string }> }
) {
  try {
    const { appId, agentId } = await params;

    // Verify agent exists and belongs to app
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.applicationId, appId)));

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const logs = await db
      .select()
      .from(executionLogs)
      .where(eq(executionLogs.agentId, agentId))
      .orderBy(desc(executionLogs.createdAt))
      .limit(100);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to get agent logs:', error);
    return NextResponse.json(
      { error: 'Failed to get agent logs' },
      { status: 500 }
    );
  }
}
