import { prisma } from "./prisma";
import { encrypt, decrypt } from "./encryption";

// --- Types ---

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export type RepositoryInput = {
  provider: string;
  repoUrl: string;
  pat: string;
  organization: string | null;
  outputFolder: string;
  applicationId: string;
};

export type RepositoryView = {
  id: string;
  provider: string;
  repoUrl: string;
  pat: string;
  organization: string | null;
  outputFolder: string;
  applicationId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RepositoryListItem = {
  id: string;
  provider: string;
  repoUrl: string;
  organization: string | null;
  outputFolder: string;
  applicationId: string;
  createdAt: Date;
  updatedAt: Date;
};

// --- URL Parsing ---

/**
 * Parse a GitHub URL into owner and repo components.
 * Expected format: https://github.com/{owner}/{repo}
 * Strips .git suffix if present.
 */
export function parseGitHubUrl(urlString: string): { owner: string; repo: string } {
  const url = new URL(urlString);
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    throw new Error("Invalid GitHub URL. Expected format: https://github.com/owner/repo");
  }

  return {
    owner: segments[0],
    repo: segments[1].replace(/\.git$/, ""),
  };
}

/**
 * Parse an Azure DevOps URL into project and repoName components.
 * Supports both formats:
 *   - https://dev.azure.com/{org}/{project}/_git/{repo}
 *   - https://{org}.visualstudio.com/{project}/_git/{repo}
 */
export function parseAdoUrl(urlString: string): { project: string; repoName: string } {
  const url = new URL(urlString);
  const segments = url.pathname.split("/").filter(Boolean);

  const gitIndex = segments.indexOf("_git");
  if (gitIndex === -1 || gitIndex + 1 >= segments.length) {
    throw new Error("Invalid Azure DevOps URL. Expected format: https://dev.azure.com/org/project/_git/repo");
  }

  return {
    project: segments[gitIndex - 1],
    repoName: segments[gitIndex + 1],
  };
}

/**
 * Extract a display name from a repository URL.
 * GitHub: "owner/repo"
 * ADO: "project/repo"
 */
export function extractRepoName(urlString: string, provider: "github" | "ado"): string {
  if (provider === "github") {
    const { owner, repo } = parseGitHubUrl(urlString);
    return `${owner}/${repo}`;
  } else {
    const { project, repoName } = parseAdoUrl(urlString);
    return `${project}/${repoName}`;
  }
}

// --- Slugify ---

/**
 * Convert text to a URL-safe slug.
 * Used for default output folder paths: "My Web App" -> "my-web-app"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")     // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, "-")       // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-")           // Collapse multiple hyphens
    .replace(/^-+|-+$/g, "");      // Trim leading/trailing hyphens
}

// --- PAT Validation ---

/**
 * Validate a GitHub PAT by making a test API call.
 * Checks repo access and scope permissions.
 *
 * - 200 with "repo" scope: valid
 * - 200 without "repo" scope (but fine-grained PAT may not have X-OAuth-Scopes): valid
 * - 401: invalid PAT
 * - 404 without "repo" scope: needs repo scope
 * - 404 with "repo" scope: repo not found
 */
export async function validateGitHubPat(
  repoUrl: string,
  pat: string
): Promise<ValidationResult> {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (response.status === 401) {
    return { valid: false, error: "Invalid PAT. Check that the token is correct and not expired." };
  }

  if (response.status === 404) {
    const scopes = response.headers.get("X-OAuth-Scopes") || "";
    if (!scopes.includes("repo")) {
      return { valid: false, error: "PAT needs 'repo scope'. Current scopes: " + (scopes || "none") };
    }
    return { valid: false, error: "Repository not found. Verify the URL is correct." };
  }

  if (!response.ok) {
    return { valid: false, error: `GitHub API error: ${response.status}` };
  }

  // Check for repo scope on successful response
  // Fine-grained PATs may not return X-OAuth-Scopes; treat 200 as sufficient
  const scopes = response.headers.get("X-OAuth-Scopes") || "";
  if (scopes && !scopes.includes("repo")) {
    return { valid: false, error: "PAT needs 'repo scope' for full access. Current scopes: " + scopes };
  }

  return { valid: true };
}

/**
 * Validate an Azure DevOps PAT by making a test API call.
 * Uses Basic auth with format base64(":PAT") -- note leading colon.
 *
 * - 200: valid
 * - 401: invalid PAT
 * - 403: insufficient permissions (needs Code Read & Write)
 * - 404: repo not found
 */
export async function validateAdoPat(
  repoUrl: string,
  pat: string,
  organization: string
): Promise<ValidationResult> {
  const { project, repoName } = parseAdoUrl(repoUrl);

  const credentials = Buffer.from(`:${pat}`).toString("base64");

  const response = await fetch(
    `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repoName}?api-version=7.1`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  if (response.status === 401) {
    return { valid: false, error: "Invalid PAT. Check that the token is correct and not expired." };
  }

  if (response.status === 403) {
    return { valid: false, error: "PAT needs 'Code (Read & Write)' scope. Check your token permissions." };
  }

  if (response.status === 404) {
    return { valid: false, error: "Repository not found. Verify the URL, organization, and project name." };
  }

  if (!response.ok) {
    return { valid: false, error: `Azure DevOps API error: ${response.status}` };
  }

  return { valid: true };
}

// --- CRUD Operations ---

/**
 * Create a new repository with encrypted PAT.
 */
export async function createRepository(input: RepositoryInput) {
  console.log("[createRepository] creating repository with input", {
    provider: input.provider,
    repoUrl: input.repoUrl,
    hasPat: !!input.pat,
    organization: input.organization,
    outputFolder: input.outputFolder,
    applicationId: input.applicationId,
  });
  return prisma.repository.create({
    data: {
      provider: input.provider,
      repoUrl: input.repoUrl,
      pat: encrypt(input.pat),
      organization: input.organization,
      outputFolder: input.outputFolder,
      applicationId: input.applicationId,
    },
  });
}

/**
 * List all repositories for a given application.
 * PAT field excluded for list view.
 * Ordered by most recently created first.
 */
export async function listRepositories(applicationId: string): Promise<RepositoryListItem[]> {
  return prisma.repository.findMany({
    where: { applicationId },
    select: {
      id: true,
      provider: true,
      repoUrl: true,
      organization: true,
      outputFolder: true,
      applicationId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single repository by ID with decrypted PAT.
 * Returns null if not found.
 */
export async function getRepository(id: string): Promise<RepositoryView | null> {
  const repo = await prisma.repository.findUnique({ where: { id } });
  if (!repo) return null;
  return {
    ...repo,
    pat: decrypt(repo.pat),
  };
}

/**
 * Update a repository by ID.
 * Only encrypts PAT if a new value is provided.
 * Fields not included in the input are not modified.
 */
export async function updateRepository(
  id: string,
  input: Partial<Omit<RepositoryInput, "applicationId">>
) {
  const data: Record<string, string> = {};
  if (input.provider !== undefined) data.provider = input.provider;
  if (input.repoUrl !== undefined) data.repoUrl = input.repoUrl;
  if (input.pat !== undefined) data.pat = encrypt(input.pat);
  if (input.organization !== undefined) data.organization = input.organization!;
  if (input.outputFolder !== undefined) data.outputFolder = input.outputFolder;

  return prisma.repository.update({
    where: { id },
    data,
  });
}

/**
 * Delete a repository by ID.
 */
export async function deleteRepository(id: string) {
  return prisma.repository.delete({ where: { id } });
}
