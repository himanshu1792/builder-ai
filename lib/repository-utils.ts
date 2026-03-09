/**
 * Client-safe repository utilities.
 *
 * These functions have NO server-side dependencies (no Prisma, no Node crypto)
 * and can be safely imported in "use client" components.
 *
 * The full repository service (lib/repositories.ts) should only be imported
 * from server components or server actions.
 */

// --- Types (duplicated for client-safety) ---

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
