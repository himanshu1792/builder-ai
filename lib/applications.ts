import { prisma } from "./prisma";
import { encrypt, decrypt } from "./encryption";

/** Input for creating or fully updating an application */
export type ApplicationInput = {
  name: string;
  testUrl: string;
  testUsername: string;
  testPassword: string;
};

/** Full application view with decrypted credentials */
export type ApplicationView = {
  id: string;
  name: string;
  testUrl: string;
  testUsername: string;
  testPassword: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Application list item without credential fields */
export type ApplicationListItem = {
  id: string;
  name: string;
  testUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Create a new application with encrypted credentials.
 * Encrypts testUsername and testPassword before storing in the database.
 */
export async function createApplication(input: ApplicationInput) {
  return prisma.application.create({
    data: {
      name: input.name,
      testUrl: input.testUrl,
      testUsername: encrypt(input.testUsername),
      testPassword: encrypt(input.testPassword),
    },
  });
}

/**
 * List all applications without credential fields.
 * Returns only id, name, testUrl, createdAt, updatedAt.
 * Ordered by most recently updated first.
 */
export async function listApplications(): Promise<ApplicationListItem[]> {
  return prisma.application.findMany({
    select: {
      id: true,
      name: true,
      testUrl: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Get a single application by ID with decrypted credentials.
 * Returns null if the application is not found.
 */
export async function getApplication(id: string): Promise<ApplicationView | null> {
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return null;
  return {
    ...app,
    testUsername: decrypt(app.testUsername),
    testPassword: decrypt(app.testPassword),
  };
}

/**
 * Update an application by ID.
 * Only encrypts credential fields that are explicitly provided.
 * Fields not included in the input are not modified.
 */
export async function updateApplication(id: string, input: Partial<ApplicationInput>) {
  const data: Record<string, string> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.testUrl !== undefined) data.testUrl = input.testUrl;
  if (input.testUsername !== undefined) data.testUsername = encrypt(input.testUsername);
  if (input.testPassword !== undefined) data.testPassword = encrypt(input.testPassword);

  return prisma.application.update({
    where: { id },
    data,
  });
}

/**
 * Delete an application by ID.
 */
export async function deleteApplication(id: string) {
  return prisma.application.delete({ where: { id } });
}
