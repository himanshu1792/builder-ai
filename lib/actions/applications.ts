"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { applicationSchema } from "@/lib/schemas/application";
import {
  createApplication,
  updateApplication,
  deleteApplication,
} from "@/lib/applications";

export type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
};

/**
 * Server Action to create a new application.
 * Validates form data with Zod, creates via service module, then redirects.
 * Used with React useActionState in the create form.
 */
export async function createApplicationAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validatedFields = applicationSchema.safeParse({
    name: formData.get("name"),
    testUrl: formData.get("testUrl"),
    testUsername: formData.get("testUsername"),
    testPassword: formData.get("testPassword"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await createApplication(validatedFields.data);
  } catch {
    return { success: false, message: "Failed to create application." };
  }

  revalidatePath("/applications");
  revalidatePath("/");
  redirect("/applications");
}

/**
 * Server Action to update an existing application.
 * Validates form data with Zod, updates via service module.
 * Returns success state (no redirect -- modal closes on success).
 */
export async function updateApplicationAction(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validatedFields = applicationSchema.safeParse({
    name: formData.get("name"),
    testUrl: formData.get("testUrl"),
    testUsername: formData.get("testUsername"),
    testPassword: formData.get("testPassword"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateApplication(id, validatedFields.data);
  } catch (error) {
    // Handle Prisma P2025 (record not found) and other errors
    const message =
      error instanceof Error && error.message.includes("P2025")
        ? "Application not found."
        : "Failed to update application.";
    return { success: false, message };
  }

  revalidatePath("/applications");
  revalidatePath("/");
  return { success: true };
}

/**
 * Server Action to delete an application.
 * Deletes via service module, revalidates cache.
 */
export async function deleteApplicationAction(id: string): Promise<ActionState> {
  try {
    await deleteApplication(id);
  } catch (error) {
    // Handle Prisma P2025 (record not found) and other errors
    const message =
      error instanceof Error && error.message.includes("P2025")
        ? "Application not found."
        : "Failed to delete application.";
    return { success: false, message };
  }

  revalidatePath("/applications");
  revalidatePath("/");
  return { success: true };
}
