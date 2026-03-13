import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orchestrations, orchestrationSteps, agents } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { updateOrchestrationSchema } from '@/lib/validation/orchestration';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appId: string; orchId: string }> }
) {
  try {
    const { appId, orchId } = await params;

    const [orch] = await db
      .select()
      .from(orchestrations)
      .where(and(eq(orchestrations.id, orchId), eq(orchestrations.applicationId, appId)));

    if (!orch) {
      return NextResponse.json({ error: 'Orchestration not found' }, { status: 404 });
    }

    // Load steps with agent details
    const steps = await db
      .select({
        id: orchestrationSteps.id,
        stepOrder: orchestrationSteps.stepOrder,
        agentId: orchestrationSteps.agentId,
        agentName: agents.name,
        agentSlug: agents.slug,
        inputMapping: orchestrationSteps.inputMapping,
      })
      .from(orchestrationSteps)
      .innerJoin(agents, eq(orchestrationSteps.agentId, agents.id))
      .where(eq(orchestrationSteps.orchestrationId, orchId))
      .orderBy(asc(orchestrationSteps.stepOrder));

    return NextResponse.json({
      ...orch,
      endpointUrl: `/api/orchestrations/${orch.slug}/run`,
      steps,
    });
  } catch (error) {
    console.error('Failed to get orchestration:', error);
    return NextResponse.json(
      { error: 'Failed to get orchestration' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string; orchId: string }> }
) {
  try {
    const { appId, orchId } = await params;
    const body = await request.json();
    const parsed = updateOrchestrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: parsed.error.message },
        { status: 400 }
      );
    }

    const { steps, ...orchData } = parsed.data;

    // Update orchestration fields
    const [updated] = await db
      .update(orchestrations)
      .set({
        ...orchData,
        updatedAt: new Date(),
      })
      .where(and(eq(orchestrations.id, orchId), eq(orchestrations.applicationId, appId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Orchestration not found' }, { status: 404 });
    }

    // If steps provided, replace all steps
    if (steps) {
      // Delete existing steps
      await db
        .delete(orchestrationSteps)
        .where(eq(orchestrationSteps.orchestrationId, orchId));

      // Insert new steps
      const stepValues = steps.map((step) => ({
        id: nanoid(),
        orchestrationId: orchId,
        agentId: step.agentId,
        stepOrder: step.stepOrder,
        inputMapping: step.inputMapping ?? null,
      }));

      await db.insert(orchestrationSteps).values(stepValues);
    }

    // Load updated steps for response
    const updatedSteps = await db
      .select({
        stepOrder: orchestrationSteps.stepOrder,
        agentId: orchestrationSteps.agentId,
        agentName: agents.name,
        inputMapping: orchestrationSteps.inputMapping,
      })
      .from(orchestrationSteps)
      .innerJoin(agents, eq(orchestrationSteps.agentId, agents.id))
      .where(eq(orchestrationSteps.orchestrationId, orchId))
      .orderBy(asc(orchestrationSteps.stepOrder));

    return NextResponse.json({
      ...updated,
      endpointUrl: `/api/orchestrations/${updated.slug}/run`,
      steps: updatedSteps,
    });
  } catch (error) {
    console.error('Failed to update orchestration:', error);
    return NextResponse.json(
      { error: 'Failed to update orchestration' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ appId: string; orchId: string }> }
) {
  try {
    const { appId, orchId } = await params;

    const [deleted] = await db
      .delete(orchestrations)
      .where(and(eq(orchestrations.id, orchId), eq(orchestrations.applicationId, appId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Orchestration not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Orchestration deleted' });
  } catch (error) {
    console.error('Failed to delete orchestration:', error);
    return NextResponse.json(
      { error: 'Failed to delete orchestration' },
      { status: 500 }
    );
  }
}
