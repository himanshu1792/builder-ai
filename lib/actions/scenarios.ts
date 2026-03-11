"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { scenarioSchema } from "@/lib/schemas/scenario";
import { createScenario } from "@/lib/scenarios";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/actions/applications";

/**
 * Server Action to create a new test scenario.
 * Validates form data with Zod, verifies application and repository exist,
 * confirms repository belongs to selected application, then creates the scenario.
 */
export async function createScenarioAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validatedFields = scenarioSchema.safeParse({
    inputText: formData.get("inputText"),
    applicationId: formData.get("applicationId"),
    repositoryId: formData.get("repositoryId"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { inputText, applicationId, repositoryId } = validatedFields.data;

  // Verify application exists
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return { success: false, message: "Application not found." };
  }

  // Verify repository exists AND belongs to the selected application
  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
  });

  if (!repository || repository.applicationId !== applicationId) {
    return {
      success: false,
      message: "Repository not found for the selected application.",
    };
  }

  try {
    await createScenario({ inputText, applicationId, repositoryId });
  } catch {
    return { success: false, message: "Failed to create scenario." };
  }

  revalidatePath("/scenarios");
  revalidatePath("/");
  redirect("/scenarios");
}
