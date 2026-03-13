import { NextRequest, NextResponse } from "next/server";
import { resolvePendingInteraction } from "@/lib/agents/pipeline";

/**
 * POST /api/regression-runs/[id]/respond — Send user response to a pending interaction.
 *
 * Body:
 * - { type: "accept_plan" } — accept the generated test plan
 * - { type: "reject_plan", reason: string } — reject with feedback
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  let resolved = false;

  switch (body.type) {
    case "accept_plan":
      resolved = resolvePendingInteraction(id, { accepted: true });
      break;
    case "reject_plan":
      resolved = resolvePendingInteraction(id, {
        accepted: false,
        reason: body.reason,
      });
      break;
    default:
      return NextResponse.json({ message: "Unknown response type" }, { status: 400 });
  }

  if (!resolved) {
    return NextResponse.json(
      { message: "No pending interaction for this run" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
