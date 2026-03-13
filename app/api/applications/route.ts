import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applications } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import { createApplicationSchema } from '@/lib/validation/application';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list applications:', error);
    return NextResponse.json(
      { error: 'Failed to list applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: parsed.error.message },
        { status: 400 }
      );
    }

    const id = nanoid();
    const [created] = await db
      .insert(applications)
      .values({
        id,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create application:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}
