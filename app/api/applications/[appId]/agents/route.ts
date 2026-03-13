import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents, applications } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createAgentSchema } from '@/lib/validation/agent';
import { generateSlug } from '@/lib/utils/slug';
import { extractAllPlaceholders } from '@/lib/utils/prompt-placeholders';

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

    const result = await db
      .select()
      .from(agents)
      .where(eq(agents.applicationId, appId))
      .orderBy(desc(agents.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list agents:', error);
    return NextResponse.json(
      { error: 'Failed to list agents' },
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
    const parsed = createAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: parsed.error.message },
        { status: 400 }
      );
    }

    // Auto-extract placeholders from prompts
    const promptPlaceholders = extractAllPlaceholders(
      parsed.data.systemPrompt,
      parsed.data.taskPrompt
    );

    const id = nanoid();
    let slug = generateSlug(parsed.data.name);

    // Ensure slug uniqueness by appending a short suffix if needed
    const existingSlug = await db
      .select()
      .from(agents)
      .where(eq(agents.slug, slug));

    if (existingSlug.length > 0) {
      slug = `${slug}-${nanoid(6)}`;
    }

    const [created] = await db
      .insert(agents)
      .values({
        id,
        applicationId: appId,
        slug,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        systemPrompt: parsed.data.systemPrompt,
        taskPrompt: parsed.data.taskPrompt,
        outputSchema: parsed.data.outputSchema ?? null,
        model: parsed.data.model,
        temperature: parsed.data.temperature,
        promptPlaceholders,
        isActive: parsed.data.isActive,
      })
      .returning();

    return NextResponse.json(
      {
        ...created,
        endpointUrl: `/api/agents/${slug}/run`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
