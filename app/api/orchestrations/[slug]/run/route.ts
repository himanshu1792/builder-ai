import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orchestrations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { executeOrchestration } from '@/lib/openai/orchestration-executor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Look up orchestration by slug
    const [orchestration] = await db
      .select()
      .from(orchestrations)
      .where(eq(orchestrations.slug, slug));

    if (!orchestration) {
      return NextResponse.json({ error: 'Orchestration not found' }, { status: 404 });
    }

    if (!orchestration.isActive) {
      return NextResponse.json({ error: 'Orchestration is not active' }, { status: 404 });
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

    // Execute orchestration
    const result = await executeOrchestration(orchestration.id, payload);

    return NextResponse.json(result);
  } catch (error) {
    // Check if this is a structured orchestration failure
    if (error && typeof error === 'object' && 'failedStep' in error) {
      return NextResponse.json(error, { status: 500 });
    }

    console.error('Orchestration execution failed:', error);
    return NextResponse.json(
      { error: 'Orchestration execution failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    );
  }
}
