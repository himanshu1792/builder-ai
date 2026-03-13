import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculateBilling } from '@/lib/billing/cost-calculator';

export async function GET(
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

    // Get month from query params, default to current month
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    const billing = await calculateBilling(appId, month);

    return NextResponse.json(billing);
  } catch (error) {
    console.error('Failed to get billing:', error);
    return NextResponse.json(
      { error: 'Failed to get billing data' },
      { status: 500 }
    );
  }
}
