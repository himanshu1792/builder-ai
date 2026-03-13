import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateAgentSchema } from '@/lib/validation/agent';
import { extractAllPlaceholders } from '@/lib/utils/prompt-placeholders';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appId: string; agentId: string }> }
) {
  try {
    const { appId, agentId } = await params;
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.applicationId, appId)));

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...agent,
      endpointUrl: `/api/agents/${agent.slug}/run`,
    });
  } catch (error) {
    console.error('Failed to get agent:', error);
    return NextResponse.json(
      { error: 'Failed to get agent' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string; agentId: string }> }
) {
  try {
    const { appId, agentId } = await params;
    const body = await request.json();
    const parsed = updateAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: parsed.error.message },
        { status: 400 }
      );
    }

    // Re-extract placeholders if prompts were updated
    let promptPlaceholders: string[] | undefined;
    if (parsed.data.systemPrompt || parsed.data.taskPrompt) {
      // Need current agent to merge prompts for extraction
      const [currentAgent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, agentId), eq(agents.applicationId, appId)));

      if (currentAgent) {
        const systemPrompt = parsed.data.systemPrompt ?? currentAgent.systemPrompt;
        const taskPrompt = parsed.data.taskPrompt ?? currentAgent.taskPrompt;
        promptPlaceholders = extractAllPlaceholders(systemPrompt, taskPrompt);
      }
    }

    const [updated] = await db
      .update(agents)
      .set({
        ...parsed.data,
        ...(promptPlaceholders !== undefined ? { promptPlaceholders } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(agents.id, agentId), eq(agents.applicationId, appId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...updated,
      endpointUrl: `/api/agents/${updated.slug}/run`,
    });
  } catch (error) {
    console.error('Failed to update agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ appId: string; agentId: string }> }
) {
  try {
    const { appId, agentId } = await params;
    const [deleted] = await db
      .delete(agents)
      .where(and(eq(agents.id, agentId), eq(agents.applicationId, appId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Agent deleted' });
  } catch (error) {
    console.error('Failed to delete agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
