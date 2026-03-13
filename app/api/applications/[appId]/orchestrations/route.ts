import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orchestrations, orchestrationSteps, applications, agents } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createOrchestrationSchema } from '@/lib/validation/orchestration';
import { generateSlug } from '@/lib/utils/slug';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params;

    // Verify application exists
    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, appId));

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get orchestrations with their steps
    const orchList = await db
      .select()
      .from(orchestrations)
      .where(eq(orchestrations.applicationId, appId))
      .orderBy(desc(orchestrations.createdAt));

    // For each orchestration, load steps with agent names
    const result = await Promise.all(
      orchList.map(async (orch) => {
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
          .where(eq(orchestrationSteps.orchestrationId, orch.id))
          .orderBy(asc(orchestrationSteps.stepOrder));

        return {
          ...orch,
          endpointUrl: `/api/orchestrations/${orch.slug}/run`,
          steps,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list orchestrations:', error);
    return NextResponse.json(
      { error: 'Failed to list orchestrations' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params;

    // Verify application exists
    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, appId));

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createOrchestrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: parsed.error.message },
        { status: 400 }
      );
    }

    // Verify all agents exist and belong to this application
    for (const step of parsed.data.steps) {
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, step.agentId));

      if (!agent) {
        return NextResponse.json(
          { error: `Agent not found: ${step.agentId}` },
          { status: 400 }
        );
      }

      if (agent.applicationId !== appId) {
        return NextResponse.json(
          { error: `Agent ${step.agentId} does not belong to this application` },
          { status: 400 }
        );
      }
    }

    const orchId = nanoid();
    let slug = generateSlug(parsed.data.name);

    // Ensure slug uniqueness
    const existingSlug = await db
      .select()
      .from(orchestrations)
      .where(eq(orchestrations.slug, slug));

    if (existingSlug.length > 0) {
      slug = `${slug}-${nanoid(6)}`;
    }

    // Create orchestration
    const [created] = await db
      .insert(orchestrations)
      .values({
        id: orchId,
        applicationId: appId,
        slug,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
      })
      .returning();

    // Create steps
    const stepValues = parsed.data.steps.map((step) => ({
      id: nanoid(),
      orchestrationId: orchId,
      agentId: step.agentId,
      stepOrder: step.stepOrder,
      inputMapping: step.inputMapping ?? null,
    }));

    await db.insert(orchestrationSteps).values(stepValues);

    // Load steps with agent names for response
    const steps = await db
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

    return NextResponse.json(
      {
        ...created,
        endpointUrl: `/api/orchestrations/${slug}/run`,
        steps,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create orchestration:', error);
    return NextResponse.json(
      { error: 'Failed to create orchestration' },
      { status: 500 }
    );
  }
}
