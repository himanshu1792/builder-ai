import { NextRequest, NextResponse } from "next/server";
import { regressionSchema } from "@/lib/schemas/regression";
import { createScenario } from "@/lib/scenarios";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/regression-runs — Create a new regression testing run.
 * Stores the target URL as inputText with type="regression".
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validated = regressionSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { targetUrl, applicationId, repositoryId } = validated.data;

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

    const scenario = await createScenario({
      inputText: targetUrl,
      applicationId,
      repositoryId,
      type: "regression",
    });

    return NextResponse.json({ id: scenario.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create regression run:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
