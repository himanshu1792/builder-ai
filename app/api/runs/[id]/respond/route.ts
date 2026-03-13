import { NextRequest, NextResponse } from "next/server";
import { resolvePendingInteraction } from "@/lib/agents/pipeline";

/**
 * POST /api/runs/[id]/respond — Send user response to a pending agent interaction.
 *
 * Body:
 * - { type: "answer", answer: string } — answer to analyst question
 * - { type: "accept_prompt" } — accept the generated prompt
 * - { type: "reject_prompt", reason: string } — reject with reason
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  let resolved = false;

  switch (body.type) {
    case "answer":
      resolved = resolvePendingInteraction(id, body.answer);
      break;
    case "accept_prompt":
      resolved = resolvePendingInteraction(id, { accepted: true });
      break;
    case "reject_prompt":
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
