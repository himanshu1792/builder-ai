import { NextRequest, NextResponse } from "next/server";
import { scenarioSchema } from "@/lib/schemas/scenario";
import { createScenario } from "@/lib/scenarios";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/runs — Create a new scenario run and return its ID.
 * The frontend uses this ID to open an SSE stream.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const validated = scenarioSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { inputText, applicationId, repositoryId } = validated.data;

  // Verify application exists
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });
  if (!application) {
    return NextResponse.json({ message: "Application not found." }, { status: 404 });
  }

  // Verify repository belongs to application
  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
  });
  if (!repository || repository.applicationId !== applicationId) {
    return NextResponse.json(
      { message: "Repository not found for the selected application." },
      { status: 404 }
    );
  }

  const scenario = await createScenario({ inputText, applicationId, repositoryId });

  return NextResponse.json({ id: scenario.id }, { status: 201 });
}
