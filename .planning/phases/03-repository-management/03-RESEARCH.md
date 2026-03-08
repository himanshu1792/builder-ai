# Phase 3: Repository Management - Research

**Researched:** 2026-03-08
**Domain:** Repository connection (GitHub/Azure DevOps), PAT validation, Next.js dynamic routes, inline editing UX
**Confidence:** HIGH

## Summary

Phase 3 adds the ability for users to connect GitHub and Azure DevOps repositories to their registered applications, validate PATs by making test API calls, configure output folder paths for generated scripts, and manage connected repositories through a new application detail page. The implementation leverages the existing codebase patterns (Prisma service layer, Zod schemas, server actions, encryption module) with no new npm dependencies required -- Node.js built-in `fetch` and `URL` APIs handle all HTTP calls and URL parsing.

The core technical challenge is PAT validation: making server-side API calls to GitHub (`GET /repos/{owner}/{repo}`) and Azure DevOps (`GET /{organization}/{project}/_apis/git/repositories/{repoName}`) with the user-provided PAT, then interpreting response headers and status codes to give specific, actionable feedback about missing permissions. The UI challenge is the new application detail page at `/applications/[id]` with inline editing for application fields and a compact repository list with connect/edit/delete capabilities.

**Primary recommendation:** Use Node.js native `fetch` for PAT validation API calls (no Octokit/axios dependency). Parse repo URLs with the built-in `URL` class. Follow the established service-layer pattern for a new `lib/repositories.ts` module with encrypted PAT storage via the existing `lib/encryption.ts`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Clicking an ApplicationCard navigates to an app detail page (`/applications/[id]`)
- App detail page shows full app details at the top (name, URL, credentials with reveal) plus connected repos below
- Edit/delete for the application moves to the detail page -- inline editing (click field or "Edit" button makes fields editable), replacing the current modal-based edit flow
- ApplicationCard becomes a clickable link; hover edit/delete icons are removed from the card
- Single "Connect Repository" modal/form with a GitHub/Azure DevOps toggle/selector at the top
- Form fields adjust based on provider: GitHub shows URL + PAT; ADO shows URL + PAT + organization name
- Repo URL field accepts full URLs only (e.g., `https://github.com/org/repo`) -- no shorthand parsing
- Output folder is a field in the connect form (set during connection, editable later)
- On submit, the PAT is validated by making a test API call to the provider
- If PAT has insufficient permissions, show specific missing permissions (e.g., "PAT needs 'repo' scope for GitHub" or "Needs Code Read & Write for ADO")
- Reuse existing PasswordField component for PAT input
- PAT is encrypted at rest using the existing encryption module
- Compact list rows on the app detail page (not cards)
- Each row shows: provider icon (GitHub/ADO), repo name extracted from URL, output folder path, edit/delete action buttons on hover
- Empty state: dashed border area with "No repositories connected" + "Connect Repository" button (matches existing ApplicationsClient empty state pattern)
- No limit on repos per application -- list scrolls if long
- Output folder is set during repo connection (field in the connect form)
- Default value: `tests/{application-name}` (slugified from app name, e.g., "My Web App" -> `tests/my-web-app`)
- No validation against actual repo contents -- folder will be created when scripts are pushed (Phase 7)
- Duplicates allowed -- multiple repos can share the same output folder path
- User can edit the output folder after connection from the repo row

### Claude's Discretion
- Exact inline editing UX on the detail page (toggle mode vs click-to-edit)
- Provider toggle/selector design in the connect form
- Repo name extraction logic from full URL
- Slugification algorithm for default output folder
- Loading states and error handling patterns
- Database schema design for Repository model (relation to Application)

### Deferred Ideas (OUT OF SCOPE)
- Temp file for generated scripts (create temp file, delete after PR created) -- Phase 7: MCP Repository Operations
- Running generated scripts via agents with Playwright libraries installed -- Add to v2 backlog (v1 generates scripts only, doesn't execute them)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REPO-01 | User can connect a GitHub repo by providing repo URL and Personal Access Token | GitHub PAT validation via `GET /repos/{owner}/{repo}` with `Authorization: Bearer {PAT}`, check `X-OAuth-Scopes` header for `repo` scope; URL parsing with `new URL()` to extract owner/repo |
| REPO-02 | User can connect an Azure DevOps repo by providing repo URL, PAT, and org name | ADO PAT validation via `GET https://dev.azure.com/{org}/{project}/_apis/git/repositories/{repoName}?api-version=7.1` with Basic auth (base64 `:PAT`); requires `vso.code` scope; 401/403 indicates permission issues |
| REPO-03 | User can configure output folder path for generated scripts per repo | Output folder stored in Repository model, default `tests/{slugified-app-name}`, editable inline from repo row; no remote validation needed |
| REPO-04 | User can view list of connected repos for an application | New app detail page at `/applications/[id]` with Server Component data fetching; `listRepositories(applicationId)` service function; compact list rows with provider icon, repo name, output folder |
| REPO-05 | User can remove a connected repo | DeleteDialog pattern reuse; `deleteRepository(id)` service function with cascade consideration; revalidatePath on the detail page |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | Dynamic route `/applications/[id]` page, server actions | Already in project; `params` is Promise in Next.js 16 (must `await params`) |
| Prisma 7 | 7.4.x | Repository model with Application relation (FK) | Already in project; `prisma-client` generator, custom output to `generated/prisma/` |
| Zod 4 | 4.3.x | Repository connection form validation schema | Already in project; uses `{ error: '...' }` syntax for custom messages |
| Node.js built-in `fetch` | N/A | Server-side PAT validation HTTP calls to GitHub/ADO APIs | Zero dependencies; available in Node.js 18+; sufficient for simple GET requests |
| Node.js built-in `URL` | N/A | Parse repo URLs to extract owner/repo/project/org segments | Zero dependencies; standard API; handles edge cases (trailing slashes, `.git` suffix) |
| lib/encryption.ts | N/A | Encrypt PAT at rest (AES-256-GCM) | Already in project; same pattern as application credentials |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.0.18 | Unit tests for repository service, URL parsing, PAT validation | TDD for service module; mock fetch calls |
| vitest-mock-extended | 3.1.0 | Deep mock Prisma client in repository service tests | Same pattern as `applications.test.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `fetch` | Octokit (GitHub SDK) | Octokit adds 200KB+ dependency for a single API call; native fetch is sufficient for PAT validation |
| Native `fetch` | azure-devops-node-api | Same reasoning; a single GET request doesn't justify the SDK dependency |
| Native `URL` | url-parse npm package | Built-in URL is standard and sufficient; no edge cases that require a library |

**Installation:**
```bash
# No new packages needed -- all tools are already in the project or built into Node.js
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── applications/
│   ├── [id]/
│   │   ├── page.tsx                    # Server Component: app detail page
│   │   └── components/
│   │       ├── AppDetailClient.tsx      # Client wrapper: manages editing/modal state
│   │       ├── AppDetailHeader.tsx      # Application info with inline editing
│   │       ├── RepositoryList.tsx       # Repository list with compact rows
│   │       ├── RepositoryRow.tsx        # Single repo row with actions
│   │       ├── ConnectRepoModal.tsx     # Connect repository form modal
│   │       └── DeleteRepoDialog.tsx     # Repo delete confirmation (reuse DeleteDialog pattern)
│   ├── page.tsx                        # Existing: app list page (cards become links)
│   └── components/
│       ├── ApplicationCard.tsx          # Modified: becomes clickable link, no hover edit/delete
│       ├── ApplicationsClient.tsx       # Modified: remove edit/delete handlers
│       └── ...                          # Existing components
lib/
├── repositories.ts                      # Repository service (CRUD + PAT validation)
├── actions/
│   └── repositories.ts                  # Server actions for repo mutations
├── schemas/
│   └── repository.ts                    # Zod schema for connect-repo form
└── __tests__/
    └── repositories.test.ts             # Repository service unit tests
prisma/
└── schema.prisma                        # Add Repository model
```

### Pattern 1: Next.js 16 Dynamic Route with Promise Params
**What:** In Next.js 16, `params` in page components is a `Promise` that must be awaited
**When to use:** App detail page at `/applications/[id]`
**Example:**
```typescript
// app/applications/[id]/page.tsx
// Source: Next.js 16 App Router docs
import { notFound } from "next/navigation";
import { getApplication } from "@/lib/applications";
import { listRepositories } from "@/lib/repositories";
import { AppDetailClient } from "./components/AppDetailClient";

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplication(id);

  if (!application) notFound();

  const repositories = await listRepositories(id);

  return (
    <AppDetailClient application={application} repositories={repositories} />
  );
}
```

### Pattern 2: PAT Validation as Server-Side Service Function
**What:** Validate PAT by making an API call to the provider, returning structured success/error result
**When to use:** On form submit in the connect repository server action
**Example:**
```typescript
// lib/repositories.ts
// Source: GitHub REST API docs, Azure DevOps REST API docs

type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

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
    // GitHub returns 404 for both "repo doesn't exist" and "no access"
    const scopes = response.headers.get("X-OAuth-Scopes") || "";
    if (!scopes.includes("repo")) {
      return { valid: false, error: "PAT needs 'repo' scope. Current scopes: " + (scopes || "none") };
    }
    return { valid: false, error: "Repository not found. Verify the URL is correct." };
  }

  if (!response.ok) {
    return { valid: false, error: `GitHub API error: ${response.status}` };
  }

  // Verify repo scope is present for write operations (needed in Phase 7)
  const scopes = response.headers.get("X-OAuth-Scopes") || "";
  if (!scopes.includes("repo")) {
    return { valid: false, error: "PAT needs 'repo' scope for full access. Current scopes: " + scopes };
  }

  return { valid: true };
}

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
```

### Pattern 3: URL Parsing for GitHub and Azure DevOps
**What:** Extract owner/repo from GitHub URLs and project/repoName from ADO URLs
**When to use:** During PAT validation and for extracting display name from repo URL
**Example:**
```typescript
// lib/repositories.ts

export function parseGitHubUrl(urlString: string): { owner: string; repo: string } {
  const url = new URL(urlString);
  // Expected format: https://github.com/{owner}/{repo}
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    throw new Error("Invalid GitHub URL. Expected format: https://github.com/owner/repo");
  }

  return {
    owner: segments[0],
    repo: segments[1].replace(/\.git$/, ""),
  };
}

export function parseAdoUrl(urlString: string): { project: string; repoName: string } {
  const url = new URL(urlString);
  // Expected format: https://dev.azure.com/{org}/{project}/_git/{repo}
  // or: https://{org}.visualstudio.com/{project}/_git/{repo}
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

export function extractRepoName(urlString: string, provider: "github" | "ado"): string {
  if (provider === "github") {
    const { owner, repo } = parseGitHubUrl(urlString);
    return `${owner}/${repo}`;
  } else {
    const { project, repoName } = parseAdoUrl(urlString);
    return `${project}/${repoName}`;
  }
}
```

### Pattern 4: Slugification for Default Output Folder
**What:** Convert application name to a URL-safe slug for the default output folder path
**When to use:** Pre-filling the output folder field in the connect repo form
**Example:**
```typescript
// lib/repositories.ts

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")     // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, "-")       // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-")           // Collapse multiple hyphens
    .replace(/^-+|-+$/g, "");      // Trim leading/trailing hyphens
}

// Usage: `tests/${slugify(applicationName)}`
// "My Web App" -> "tests/my-web-app"
// "Test App (v2)" -> "tests/test-app-v2"
```

### Pattern 5: Prisma Repository Model
**What:** Database model for connected repositories with relation to Application
**When to use:** Prisma schema extension
**Example:**
```prisma
// prisma/schema.prisma

model Application {
  id            String       @id @default(cuid())
  name          String
  testUrl       String
  testUsername   String
  testPassword   String
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  repositories  Repository[]
}

model Repository {
  id             String      @id @default(cuid())
  provider       String      // "github" or "ado"
  repoUrl        String
  pat            String      // Encrypted via lib/encryption.ts (AES-256-GCM)
  organization   String?     // Required for ADO, null for GitHub
  outputFolder   String      // e.g., "tests/my-web-app"
  applicationId  String
  application    Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}
```

### Pattern 6: Inline Editing on Detail Page
**What:** Toggle between view mode and edit mode for application fields on the detail page
**When to use:** Application detail header section
**Recommendation (Claude's Discretion):** Use a single "Edit" button that toggles the entire section into edit mode (all fields become editable at once), with Save/Cancel buttons. This is simpler than per-field click-to-edit and avoids confusing state management with multiple fields editing independently.
**Example:**
```typescript
// Simplified concept for AppDetailHeader
const [editing, setEditing] = useState(false);

// View mode: static text display
// Edit mode: form fields with defaultValues pre-filled
// Save triggers updateApplicationAction, Cancel reverts to view mode
```

### Anti-Patterns to Avoid
- **Client-side PAT validation:** Never send PAT to a third-party API from the browser. All API calls must go through server actions to keep PATs server-side only.
- **Storing PAT in plaintext:** Always encrypt via `lib/encryption.ts` before persisting to database.
- **Parsing URLs with regex:** Use the built-in `URL` class. Regex for URLs is fragile and misses edge cases.
- **Fetching application data client-side:** The detail page should be a Server Component that fetches via the service layer, passing data to Client Components for interactivity.
- **Separate validation and creation steps:** Validate PAT in the same server action that creates the repository record. Do not expose a separate "validate" endpoint.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL parsing | Custom regex for GitHub/ADO URLs | `new URL()` built-in | Handles protocol, port, trailing slashes, query params automatically |
| HTTP client | Custom XMLHttpRequest wrapper | `fetch()` built-in | Standard, no dependencies; sufficient for simple GET requests |
| Encryption | Custom crypto implementation | Existing `lib/encryption.ts` | Already battle-tested with AES-256-GCM; reuse for PAT storage |
| Slug generation | Complex transliteration library | Simple regex-based slugify | App names are user-entered English text; no need for full Unicode transliteration |
| Modal/dialog | Custom overlay implementation | Follow existing ApplicationModal/DeleteDialog patterns | Consistent UX; proven patterns with escape key, backdrop click, focus management |
| Form validation | Manual field checking | Zod schema with `safeParse` | Already established pattern; integrates with useActionState error display |

**Key insight:** This phase is primarily about wiring up existing patterns (service layer, encrypted fields, modals, server actions) to a new domain (repositories). The only genuinely new territory is the PAT validation HTTP calls and the inline editing UX on the detail page.

## Common Pitfalls

### Pitfall 1: GitHub Returns 404 Instead of 403 for Private Repos
**What goes wrong:** When a PAT lacks the `repo` scope, GitHub returns `404 Not Found` instead of `403 Forbidden` for private repositories. This makes it impossible to distinguish "repo doesn't exist" from "PAT can't see the repo."
**Why it happens:** GitHub intentionally hides the existence of private repos from unauthorized tokens.
**How to avoid:** On 404, check the `X-OAuth-Scopes` response header. If `repo` scope is missing, report "PAT needs 'repo' scope" rather than "repository not found." If `repo` scope IS present and still 404, then the repository genuinely doesn't exist.
**Warning signs:** Users report "repo not found" when the repo clearly exists.

### Pitfall 2: Azure DevOps Base64 Encoding Format
**What goes wrong:** ADO requires Basic auth with an empty username: `base64(":PAT")`. If you encode `base64("PAT")` without the leading colon, authentication fails silently or returns 401.
**Why it happens:** ADO's Basic auth expects the `username:password` format where username is empty and password is the PAT.
**How to avoid:** Always use `Buffer.from(\`:\${pat}\`).toString("base64")` (note the leading colon).
**Warning signs:** 401 errors even with a valid PAT.

### Pitfall 3: Next.js 16 Promise Params
**What goes wrong:** In Next.js 16, `params` in page components is a `Promise<{ id: string }>`, not a plain object. Accessing `params.id` directly (without await) returns `undefined`.
**Why it happens:** Next.js 16 changed params to be async for streaming/parallel data loading.
**How to avoid:** Always `const { id } = await params;` in async server components.
**Warning signs:** `undefined` values when accessing route params, or TypeScript errors about `Promise`.

### Pitfall 4: Prisma Migration with Existing Data
**What goes wrong:** Adding a Repository model with a foreign key to Application requires a migration. If the migration script is misconfigured, it can fail or corrupt data.
**Why it happens:** New relation fields, cascade deletes, and index creation can conflict with existing data.
**How to avoid:** Run `prisma migrate dev` in development to auto-generate and apply migration. Test the migration with existing application records in the database. Use `onDelete: Cascade` so deleting an application also removes its repositories.
**Warning signs:** Migration errors mentioning foreign key constraints or missing tables.

### Pitfall 5: Forgetting to Revalidate Multiple Paths
**What goes wrong:** After creating/deleting a repository on the detail page, the applications list page and dashboard may show stale data (e.g., wrong repo count).
**Why it happens:** Next.js caches Server Component output. Without `revalidatePath`, stale data persists.
**How to avoid:** In every repository mutation server action, call `revalidatePath("/applications/[id]")`, `revalidatePath("/applications")`, and `revalidatePath("/")` (if dashboard shows repo counts).
**Warning signs:** Navigating back to the list page shows outdated counts or states.

### Pitfall 6: Azure DevOps URL Format Variants
**What goes wrong:** ADO repos can have two URL formats: `https://dev.azure.com/{org}/{project}/_git/{repo}` and the legacy `https://{org}.visualstudio.com/{project}/_git/{repo}`. Only handling one format breaks for users with the other.
**Why it happens:** Microsoft migrated from `visualstudio.com` to `dev.azure.com` but both formats remain in use.
**How to avoid:** Support both URL patterns in the parser. Check `hostname` of the parsed URL to determine format, then extract segments accordingly.
**Warning signs:** ADO users with `visualstudio.com` URLs get "invalid URL" errors.

## Code Examples

Verified patterns from the existing codebase and official documentation:

### Repository Zod Schema
```typescript
// lib/schemas/repository.ts
// Follows pattern from lib/schemas/application.ts

import { z } from "zod";

const githubUrlPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;
const adoUrlPattern = /^https:\/\/(dev\.azure\.com\/[\w.-]+|[\w.-]+\.visualstudio\.com)\/[\w.-]+\/_git\/[\w.-]+\/?$/;

export const repositorySchema = z
  .object({
    provider: z.enum(["github", "ado"], { error: "Select a provider" }),
    repoUrl: z.string().url({ error: "Must be a valid URL" }),
    pat: z.string().min(1, { error: "Personal Access Token is required" }),
    organization: z.string().optional(),
    outputFolder: z.string().min(1, { error: "Output folder is required" }),
  })
  .refine(
    (data) => {
      if (data.provider === "github") return githubUrlPattern.test(data.repoUrl);
      if (data.provider === "ado") return adoUrlPattern.test(data.repoUrl);
      return false;
    },
    { message: "Invalid repository URL for the selected provider", path: ["repoUrl"] }
  )
  .refine(
    (data) => {
      if (data.provider === "ado" && (!data.organization || data.organization.trim() === "")) {
        return false;
      }
      return true;
    },
    { message: "Organization name is required for Azure DevOps", path: ["organization"] }
  );

export type RepositoryInput = z.infer<typeof repositorySchema>;
```

### Server Action Pattern for Repository Creation
```typescript
// lib/actions/repositories.ts
// Follows pattern from lib/actions/applications.ts

"use server";

import { revalidatePath } from "next/cache";
import { repositorySchema } from "@/lib/schemas/repository";
import {
  createRepository,
  validateGitHubPat,
  validateAdoPat,
} from "@/lib/repositories";
import type { ActionState } from "@/lib/actions/applications";

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

  // Validate PAT by making test API call
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
```

### Provider Toggle in Connect Form
```typescript
// Concept for ConnectRepoModal provider toggle
// Claude's Discretion: Segmented control style

<div className="flex rounded-lg border border-border bg-surface-dim p-0.5">
  <button
    type="button"
    onClick={() => setProvider("github")}
    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      provider === "github"
        ? "bg-surface text-text-primary shadow-sm"
        : "text-text-muted hover:text-text-secondary"
    }`}
  >
    GitHub
  </button>
  <button
    type="button"
    onClick={() => setProvider("ado")}
    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      provider === "ado"
        ? "bg-surface text-text-primary shadow-sm"
        : "text-text-muted hover:text-text-secondary"
    }`}
  >
    Azure DevOps
  </button>
</div>
{/* Hidden input to submit provider value with form */}
<input type="hidden" name="provider" value={provider} />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params: { id: string }` (synchronous) | `params: Promise<{ id: string }>` (async) | Next.js 15+ (fully enforced in 16) | Must `await params` in all dynamic route pages |
| GitHub PAT (classic) only | Fine-grained PATs + classic PATs | GitHub 2023 | Fine-grained PATs use `X-GitHub-Api-Version` header; classic PATs use `X-OAuth-Scopes` for scope checking |
| ADO `visualstudio.com` URLs | `dev.azure.com` URLs (both supported) | Microsoft 2019 | Must handle both URL formats in parser |
| Prisma 6 `prisma-client-js` generator | Prisma 7 `prisma-client` generator | Prisma 7 (2025) | Project already uses Prisma 7; new model uses same generator config |

**Deprecated/outdated:**
- `node-fetch`: No longer needed; Node.js 18+ has built-in `fetch`
- `querystring` module: Use `URLSearchParams` instead
- GitHub API v3 without version header: Should always include `X-GitHub-Api-Version: 2022-11-28`

## Open Questions

1. **Fine-grained PAT vs Classic PAT Detection**
   - What we know: Classic PATs return `X-OAuth-Scopes` header with scopes like `repo`. Fine-grained PATs do not return this header (they use the `X-Accepted-GitHub-Permissions` header instead).
   - What's unclear: Whether the validation logic should handle both PAT types differently, or just check for a successful 200 response as sufficient proof of access.
   - Recommendation: For v1, check `X-OAuth-Scopes` for classic PATs. If the header is absent (fine-grained PAT), treat a 200 response as sufficient validation. Flag this for review if users report issues. The detailed permission check for fine-grained PATs can be added in a future iteration.

2. **ADO Organization Extraction vs Manual Input**
   - What we know: The user decision requires a separate organization field. The organization could theoretically be extracted from the URL (`https://dev.azure.com/{org}/...`).
   - What's unclear: Whether to auto-fill the organization from the URL or keep it as a separate manual field.
   - Recommendation: Auto-fill the organization field from the URL when possible (parse `dev.azure.com/{org}` or `{org}.visualstudio.com`), but allow the user to override. This reduces friction while respecting the user's decision to have the field.

3. **Cascade Delete Behavior**
   - What we know: `onDelete: Cascade` on the Repository model means deleting an Application deletes all its repositories. This matches the established pattern.
   - What's unclear: Whether the user expects a warning about connected repos when deleting an application.
   - Recommendation: Add a note in the delete confirmation dialog if the application has connected repositories (e.g., "This will also remove 3 connected repositories"). This is a minor UX enhancement that can be addressed in implementation.

## Sources

### Primary (HIGH confidence)
- GitHub REST API Authentication docs: https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api -- PAT header format, `X-GitHub-Api-Version` header
- GitHub OAuth Scopes docs: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps -- `X-OAuth-Scopes` / `X-Accepted-OAuth-Scopes` headers, `repo` scope definition
- Azure DevOps REST API docs: https://learn.microsoft.com/en-us/azure/devops/integrate/how-to/call-rest-api -- URL format, Basic auth with base64, API versioning (7.1)
- Azure DevOps Git Repositories API: https://learn.microsoft.com/en-us/rest/api/azure/devops/git/repositories/get-repository?view=azure-devops-rest-7.1 -- GET repository endpoint, `vso.code` scope, response schema
- Azure DevOps PAT docs: https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate -- PAT scopes, Basic auth encoding format
- Next.js Dynamic Routes docs: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes -- `[id]` segment, Promise params in Next.js 16
- Existing codebase: `lib/applications.ts`, `lib/encryption.ts`, `lib/actions/applications.ts`, `lib/schemas/application.ts` -- Established patterns for service layer, encryption, server actions, Zod schemas

### Secondary (MEDIUM confidence)
- GitHub community discussion on PAT scope checking: https://github.com/orgs/community/discussions/24345 -- Confirmed `X-OAuth-Scopes` header approach for checking token scopes
- Azure DevOps PAT scope verification: https://devblogs.microsoft.com/devops/all-azure-devops-rest-apis-now-support-pat-scopes/ -- Confirmed all REST APIs support granular PAT scopes

### Tertiary (LOW confidence)
- Fine-grained PAT behavior with `X-Accepted-GitHub-Permissions` header -- behavior not fully verified with test calls; recommend validation in implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project; no new dependencies needed
- Architecture: HIGH - Follows established patterns (service layer, server actions, dynamic routes) with well-documented APIs
- Pitfalls: HIGH - GitHub 404-vs-403 behavior and ADO base64 encoding are well-documented; Next.js 16 Promise params confirmed in docs
- PAT validation: MEDIUM - GitHub classic PAT validation well-understood; fine-grained PAT and ADO scope introspection less certain (may need runtime testing)

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (30 days -- stable domain, no fast-moving dependencies)
