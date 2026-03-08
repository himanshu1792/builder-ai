"use server";

import { revalidatePath } from "next/cache";
import { repositorySchema } from "@/lib/schemas/repository";
import {
  createRepository,
  updateRepository,
  deleteRepository,
  validateGitHubPat,
  validateAdoPat,
} from "@/lib/repositories";
import type { ActionState } from "@/lib/actions/applications";

/**
 * Server Action to connect a repository to an application.
 * Validates form data with Zod, validates PAT via API call, creates via service module.
 */
export async function connectRepositoryAction(
  applicationId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validatedFields = repositorySchema.safeParse({
    provider: formData.get("provider"),
    repoUrl: formData.get("repoUrl"),
    pat: formData.get("pat"),
    organization: formData.get("organization"),
    outputFolder: formData.get("outputFolder"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { provider, repoUrl, pat, organization, outputFolder } = validatedFields.data;

  // Validate PAT by making test API call to the provider
  const validation =
    provider === "github"
      ? await validateGitHubPat(repoUrl, pat)
      : await validateAdoPat(repoUrl, pat, organization!);

  if (!validation.valid) {
    return { success: false, message: validation.error };
  }

  try {
    await createRepository({
      provider,
      repoUrl,
      pat,
      organization: organization || null,
      outputFolder,
      applicationId,
    });
  } catch {
    return { success: false, message: "Failed to connect repository." };
  }

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
  revalidatePath("/");
  return { success: true };
}

/**
 * Server Action to update a connected repository.
 * Validates partial input, updates via service module.
 */
export async function updateRepositoryAction(
  repoId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const data: Record<string, string> = {};

  const outputFolder = formData.get("outputFolder");
  if (outputFolder && typeof outputFolder === "string" && outputFolder.trim()) {
    data.outputFolder = outputFolder.trim();
  }

  const pat = formData.get("pat");
  if (pat && typeof pat === "string" && pat.trim()) {
    data.pat = pat.trim();
  }

  if (Object.keys(data).length === 0) {
    return { success: false, message: "No fields to update." };
  }

  try {
    await updateRepository(repoId, data);
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("P2025")
        ? "Repository not found."
        : "Failed to update repository.";
    return { success: false, message };
  }

  revalidatePath("/applications");
  revalidatePath("/");
  return { success: true };
}

/**
 * Server Action to delete a connected repository.
 */
export async function deleteRepositoryAction(
  repoId: string,
  applicationId: string
): Promise<ActionState> {
  try {
    await deleteRepository(repoId);
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("P2025")
        ? "Repository not found."
        : "Failed to delete repository.";
    return { success: false, message };
  }

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
  revalidatePath("/");
  return { success: true };
}
