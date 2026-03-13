import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { modelPricing } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import { createModelPricingSchema } from '@/lib/validation/model-pricing';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db
      .select()
      .from(modelPricing)
      .orderBy(desc(modelPricing.createdAt));

    return NextResponse.json({ models: result });
  } catch (error) {
    console.error('Failed to list model pricing:', error);
    return NextResponse.json(
      { error: 'Failed to list model pricing' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createModelPricingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: parsed.error.message },
        { status: 400 }
      );
    }

    const id = nanoid();
    const [created] = await db
      .insert(modelPricing)
      .values({
        id,
        modelId: parsed.data.modelId,
        displayName: parsed.data.displayName,
        inputPricePer1k: parsed.data.inputPricePer1k.toFixed(6),
        outputPricePer1k: parsed.data.outputPricePer1k.toFixed(6),
        isActive: parsed.data.isActive,
      })
      .onConflictDoUpdate({
        target: modelPricing.modelId,
        set: {
          displayName: parsed.data.displayName,
          inputPricePer1k: parsed.data.inputPricePer1k.toFixed(6),
          outputPricePer1k: parsed.data.outputPricePer1k.toFixed(6),
          isActive: parsed.data.isActive,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create/update model pricing:', error);
    return NextResponse.json(
      { error: 'Failed to create/update model pricing' },
      { status: 500 }
    );
  }
}
