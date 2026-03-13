import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { executeAgent } from '@/lib/openai/agent-executor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Look up agent by slug
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.slug, slug));

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (!agent.isActive) {
      return NextResponse.json({ error: 'Agent is not active' }, { status: 404 });
    }

    // Parse payload
    let payload: Record<string, unknown> = {};
    try {
      const body = await request.text();
      if (body) {
        payload = JSON.parse(body);
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Execute agent
    const result = await executeAgent(
      {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        systemPrompt: agent.systemPrompt,
        taskPrompt: agent.taskPrompt,
        outputSchema: agent.outputSchema,
        model: agent.model,
        temperature: agent.temperature,
        promptPlaceholders: (agent.promptPlaceholders as string[]) ?? [],
      },
      payload
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Agent execution failed:', error);
    return NextResponse.json(
      { error: 'LLM execution failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    );
  }
}
