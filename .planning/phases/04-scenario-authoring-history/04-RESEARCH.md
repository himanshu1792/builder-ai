# Phase 4: Scenario Authoring & History - Research

**Researched:** 2026-03-09
**Domain:** Test scenario data model, scenario authoring form with app/repo selection, scenario history list, scenario detail view, Prisma schema extension
**Confidence:** HIGH

## Summary

Phase 4 introduces the core scenario authoring flow: users write a test description in plain English, select a target application and repository, and submit. The system creates a Scenario record with status "queued" and persists the input text. Users can browse past scenarios in a list view showing status and input summary, and drill into individual scenarios to see full details including the refined prompt, generated script, and error information (all populated by later phases).

This phase is architecturally straightforward because it follows the exact same patterns established in Phases 2 and 3: Prisma model, service layer with typed inputs/outputs, Zod schema for form validation, server actions wrapping service calls, and Server Component pages with Client Component wrappers for interactivity. The key design challenge is the Scenario model -- it must be designed with fields that Phase 5 (AI Pipeline) and Phase 6 (Async Processing) will populate, even though Phase 4 only writes the initial input and sets status to "queued."

No new npm dependencies are required. The entire phase uses the existing stack: Next.js 16 App Router, Prisma 7, Zod 4, Vitest, Tailwind CSS 4.

**Primary recommendation:** Follow the established service-layer TDD pattern. Create the Scenario Prisma model with nullable fields for refinedPrompt, generatedScript, and errorMessage that future phases will populate. Build a dedicated `/scenarios/new` page for authoring (with app and repo select dropdowns), a `/scenarios` list page, and a `/scenarios/[id]` detail page. Add "Scenarios" to the TopNav.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCEN-01 | User can write a test scenario in plain English via text input | Scenario creation form with textarea for inputText, application dropdown, repository dropdown. Server action validates with Zod schema, creates Scenario record via service layer with status "queued". Form follows established useActionState + formAction pattern from ConnectRepoModal. |
| SCEN-02 | User can view list of past scenarios with generation status (queued, in progress, completed, failed) | `/scenarios` list page as Server Component fetching via `listScenarios()` service function. Each row shows truncated input text, application name, status badge with color coding, and timestamp. Follows the established list pattern from applications page. |
| SCEN-03 | User can view details of a past scenario (original input, refined prompt, generated script, error details) | `/scenarios/[id]` detail page following the `params: Promise<{ id: string }>` pattern. Server Component fetches via `getScenario(id)`. Shows all fields in sections: Input, Refined Prompt (placeholder if null), Generated Script (placeholder if null with code block styling), Error Details (if failed). |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | `/scenarios` list page, `/scenarios/new` authoring page, `/scenarios/[id]` detail page | Already in project; `params` is Promise in Next.js 16 |
| Prisma 7 | 7.4.x | Scenario model with Application and Repository relations | Already in project; `prisma-client` generator |
| Zod 4 | 4.3.x | Scenario creation form validation | Already in project; `{ error: '...' }` syntax |
| React 19 | 19.2.x | useActionState for form state, Server/Client Components | Already in project |
| Tailwind CSS 4 | 4.x | Styling with @theme semantic tokens | Already in project |
| Vitest | 4.0.18 | Service layer unit tests (TDD) | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest-mock-extended | 3.1.0 | Deep mock Prisma client in scenario service tests | Same pattern as applications.test.ts and repositories.test.ts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated `/scenarios` route | Embed scenarios in app detail page | Dedicated route is cleaner -- scenarios span multiple apps; listing all scenarios in one place is more useful for history browsing |
| `textarea` for input | Rich text editor (TipTap, Slate) | Overkill for plain-English scenario input; textarea is simple, accessible, and sufficient for v1 |
| Status as string enum | Separate StatusHistory table | Phase 4 only needs current status; a history table is premature complexity (defer to v2 if needed) |

**Installation:**
```bash
# No new packages needed -- all tools already in the project
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── scenarios/
│   ├── page.tsx                        # Server Component: scenario list page
│   ├── new/
│   │   └── page.tsx                    # Server Component: new scenario form page
│   ├── [id]/
│   │   ├── page.tsx                    # Server Component: scenario detail page
│   │   └── components/
│   │       └── ScenarioDetailClient.tsx # Client wrapper for detail interactions
│   └── components/
│       ├── ScenarioForm.tsx            # Client Component: authoring form
│       ├── ScenarioList.tsx            # Client Component: scenario list with status badges
│       └── StatusBadge.tsx             # Reusable status badge component
lib/
├── scenarios.ts                        # Scenario service (CRUD operations)
├── actions/
│   └── scenarios.ts                    # Server actions for scenario mutations
├── schemas/
│   └── scenario.ts                     # Zod schema for scenario creation form
└── __tests__/
    └── scenarios.test.ts               # Scenario service unit tests
prisma/
└── schema.prisma                       # Add Scenario model
```

### Pattern 1: Scenario Prisma Model with Forward-Compatible Fields
**What:** Design the Scenario model with nullable fields that Phase 5 (AI Pipeline) and Phase 6 (Async Processing) will populate later. Phase 4 only sets inputText, applicationId, repositoryId, and status="queued".
**When to use:** Schema design for entities that have a multi-phase lifecycle.
**Example:**
```prisma
// prisma/schema.prisma

model Scenario {
  id              String      @id @default(cuid())
  inputText       String      // Plain-English scenario text from user
  status          String      @default("queued") // queued, in_progress, completed, failed
  refinedPrompt   String?     // Populated by Phase 5 (AI refinement)
  generatedScript String?     // Populated by Phase 5 (AI generation)
  errorMessage    String?     // Populated on failure (Phase 5/6)
  applicationId   String
  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  repositoryId    String
  repository      Repository  @relation(fields: [repositoryId], references: [id], onDelete: Cascade)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

**Critical:** The Application model needs a `scenarios Scenario[]` relation added. The Repository model also needs a `scenarios Scenario[]` relation added.

### Pattern 2: Scenario Service Layer (TDD)
**What:** Service module following the exact pattern from `lib/applications.ts` and `lib/repositories.ts`.
**When to use:** All database operations for scenarios.
**Example:**
```typescript
// lib/scenarios.ts
import { prisma } from "./prisma";

export type ScenarioInput = {
  inputText: string;
  applicationId: string;
  repositoryId: string;
};

export type ScenarioListItem = {
  id: string;
  inputText: string;
  status: string;
  applicationId: string;
  repositoryId: string;
  createdAt: Date;
  updatedAt: Date;
  application: { name: string };
  repository: { repoUrl: string; provider: string };
};

export type ScenarioView = {
  id: string;
  inputText: string;
  status: string;
  refinedPrompt: string | null;
  generatedScript: string | null;
  errorMessage: string | null;
  applicationId: string;
  repositoryId: string;
  createdAt: Date;
  updatedAt: Date;
  application: { name: string; testUrl: string };
  repository: { repoUrl: string; provider: string; outputFolder: string };
};

export async function createScenario(input: ScenarioInput) {
  return prisma.scenario.create({
    data: {
      inputText: input.inputText,
      applicationId: input.applicationId,
      repositoryId: input.repositoryId,
      status: "queued",
    },
  });
}

export async function listScenarios(): Promise<ScenarioListItem[]> {
  return prisma.scenario.findMany({
    select: {
      id: true,
      inputText: true,
      status: true,
      applicationId: true,
      repositoryId: true,
      createdAt: true,
      updatedAt: true,
      application: { select: { name: true } },
      repository: { select: { repoUrl: true, provider: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getScenario(id: string): Promise<ScenarioView | null> {
  return prisma.scenario.findUnique({
    where: { id },
    include: {
      application: { select: { name: true, testUrl: true } },
      repository: { select: { repoUrl: true, provider: true, outputFolder: true } },
    },
  });
}
```

### Pattern 3: Scenario Creation Form with App/Repo Selectors
**What:** A form page at `/scenarios/new` that pre-fetches applications and their repositories in the Server Component, then passes them to a Client Component form.
**When to use:** For the scenario authoring UI.
**Example:**
```typescript
// app/scenarios/new/page.tsx (Server Component)
import { listApplications } from "@/lib/applications";
import { listAllRepositoriesGrouped } from "@/lib/scenarios";
import { ScenarioForm } from "../components/ScenarioForm";

export default async function NewScenarioPage() {
  const applications = await listApplications();
  // Fetch repos grouped by applicationId for the dependent dropdown
  const repositoriesByApp = await listAllRepositoriesGrouped();

  return (
    <div className="space-y-6">
      {/* Back link */}
      {/* ... */}
      <ScenarioForm
        applications={applications}
        repositoriesByApp={repositoriesByApp}
      />
    </div>
  );
}
```

```typescript
// app/scenarios/components/ScenarioForm.tsx (Client Component)
"use client";

import { useActionState, useState } from "react";
import { createScenarioAction } from "@/lib/actions/scenarios";

// selectedApplicationId drives the repository dropdown filter
// useActionState with formAction handles submission
// textarea for inputText with min-height for comfortable writing
// Submit button with loading spinner (pending state)
```

### Pattern 4: Status Badge Component
**What:** A small reusable component for rendering scenario status with color-coded badges.
**When to use:** Scenario list page and scenario detail page.
**Example:**
```typescript
// app/scenarios/components/StatusBadge.tsx

const statusConfig: Record<string, { label: string; className: string }> = {
  queued: {
    label: "Queued",
    className: "bg-gray-100 text-gray-600",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.queued;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
```

### Pattern 5: Scenario Detail Page with Multi-Section Layout
**What:** A detail page that shows all scenario data in collapsible/distinct sections.
**When to use:** `/scenarios/[id]` route.
**Example:**
```typescript
// app/scenarios/[id]/page.tsx
import { notFound } from "next/navigation";
import { getScenario } from "@/lib/scenarios";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = await getScenario(id);
  if (!scenario) notFound();

  return (
    <div className="space-y-6">
      {/* Back link to /scenarios */}
      {/* Status badge + metadata header */}
      {/* Section: Original Input (always shown) */}
      {/* Section: Refined Prompt (shown if not null, placeholder otherwise) */}
      {/* Section: Generated Script (code block if not null, placeholder otherwise) */}
      {/* Section: Error Details (only shown if status === "failed") */}
    </div>
  );
}
```

### Pattern 6: Dependent Dropdown (Application -> Repository)
**What:** When the user selects an application in the scenario form, the repository dropdown updates to show only repositories connected to that application.
**When to use:** ScenarioForm component.
**Example:**
```typescript
// Client-side filtering approach (no additional server calls)
const [selectedAppId, setSelectedAppId] = useState("");
const filteredRepos = repositoriesByApp[selectedAppId] || [];

// When selectedAppId changes, reset selectedRepoId
useEffect(() => {
  setSelectedRepoId("");
}, [selectedAppId]);
```

### Anti-Patterns to Avoid
- **Storing status as a Prisma enum:** Use a string column with application-level validation. Prisma enums require a migration every time a status value is added/renamed, making iteration harder. String with Zod validation is more flexible.
- **Creating scenario from the app detail page only:** Users should be able to create scenarios from a dedicated page where they can pick ANY application. Tying creation exclusively to the app detail page limits the UX.
- **Fetching repositories on application change via API call:** Pre-load all repositories grouped by applicationId in the Server Component and pass the full map to the Client Component. With v1 being single-user and local, the data volume is tiny -- no need for lazy loading.
- **Building code editor for generated script preview:** Phase 4 only displays the script (populated later). A `<pre><code>` block with monospace font is sufficient. Do not add Monaco, CodeMirror, or any code editor library.
- **Mixing client and server imports:** Keep `lib/scenarios.ts` server-only (imports Prisma). If client components need types, export them from a separate file or use `import type`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Manual field checking | Zod schema with `safeParse` | Established pattern; integrates with useActionState |
| Status display | Inline conditionals for colors | StatusBadge component | Reusable across list and detail views; single source of truth for status colors |
| Dropdown data | Client-side API fetches for apps/repos | Server Component data pre-loading | Simpler, faster, no loading states needed for small data |
| Code display | Code editor (Monaco/CodeMirror) | `<pre><code>` with Tailwind styling | Generated script is read-only in Phase 4; editor is premature |
| Date formatting | Custom date format functions | Existing `timeAgo` utility from dashboard | Already built in `app/page.tsx`; extract and reuse |
| Modal/dialog pattern | New dialog approach | Follow existing ConnectRepoModal pattern | Consistency with established UX |

**Key insight:** Phase 4 is a data-entry and data-display phase. The scenario record is a container that future phases fill in. Keep the UI simple: form to create, list to browse, detail page to inspect. No complex interactivity beyond the dependent dropdown.

## Common Pitfalls

### Pitfall 1: Forgetting Forward-Compatible Schema Fields
**What goes wrong:** Designing the Scenario model with only Phase 4's needs (inputText, status) and having to do a breaking migration when Phase 5 adds refinedPrompt, generatedScript, etc.
**Why it happens:** "We'll add those fields later" mindset.
**How to avoid:** Add ALL known fields now as nullable. Phase 4 sets inputText and status="queued". Phase 5 populates refinedPrompt and generatedScript. Phase 6 updates status and errorMessage. The schema should be designed for the full lifecycle from day one.
**Warning signs:** Planning to add columns in Phase 5 or 6 that should have been in the initial migration.

### Pitfall 2: Application and Repository Existence Validation
**What goes wrong:** User submits a scenario with an applicationId or repositoryId that no longer exists (deleted between page load and form submission), causing a Prisma foreign key error.
**Why it happens:** The form pre-loads dropdown options, but the user may take time filling in the scenario. Meanwhile, the app or repo could be deleted.
**How to avoid:** In the server action, verify that both the application and repository exist before creating the scenario. Return a user-friendly error message if either is missing. Also ensure the repository belongs to the selected application.
**Warning signs:** Unhandled Prisma P2003 (foreign key constraint) errors in production.

### Pitfall 3: Repository Must Belong to Selected Application
**What goes wrong:** The form sends an applicationId and repositoryId, but the repository is actually connected to a different application.
**Why it happens:** Client-side filtering of the repo dropdown is a UX convenience but not a security boundary. A user could manipulate form data.
**How to avoid:** In the server action, validate that `repository.applicationId === applicationId` before creating the scenario. Return an error if they don't match.
**Warning signs:** Scenarios linked to mismatched app/repo combinations.

### Pitfall 4: Not Adding Scenario Relation to Existing Models
**What goes wrong:** Adding the Scenario model without updating Application and Repository models with the reverse relation (`scenarios Scenario[]`) causes Prisma schema validation errors.
**Why it happens:** Forgetting that Prisma requires both sides of a relation to be declared.
**How to avoid:** When adding the Scenario model, also add `scenarios Scenario[]` to both the Application and Repository models.
**Warning signs:** `prisma generate` or `prisma migrate dev` fails with relation validation errors.

### Pitfall 5: Cascade Delete Behavior for Scenarios
**What goes wrong:** Deleting an application or repository leaves orphaned Scenario records, or fails with foreign key errors.
**Why it happens:** Missing `onDelete: Cascade` on the Scenario relations.
**How to avoid:** Set `onDelete: Cascade` on both the application and repository relations in the Scenario model. When an app is deleted, its scenarios are deleted. When a repo is deleted, its scenarios are deleted. This matches the Repository model's cascade pattern.
**Warning signs:** Database constraint errors when deleting applications or repositories that have associated scenarios.

### Pitfall 6: Large Text Fields Without Proper Display
**What goes wrong:** Scenario inputText, refinedPrompt, or generatedScript can be long. Displaying them without proper text wrapping, scrolling, or truncation breaks the layout.
**Why it happens:** Not accounting for variable-length content in UI components.
**How to avoid:** In the list view, truncate inputText (e.g., first 100 chars with ellipsis). In the detail view, use `whitespace-pre-wrap` for inputText and refinedPrompt, and a scrollable `<pre>` block for generatedScript. Set reasonable `max-h` on long content sections.
**Warning signs:** Layout overflow, horizontal scrollbar on the page.

### Pitfall 7: Not Revalidating Paths After Scenario Creation
**What goes wrong:** After creating a scenario and redirecting to the list page, the new scenario doesn't appear because the Server Component cache is stale.
**Why it happens:** Missing `revalidatePath` calls in the server action.
**How to avoid:** Call `revalidatePath("/scenarios")` and `revalidatePath("/")` (for dashboard stats) after scenario creation. Follow the exact pattern from `connectRepositoryAction`.
**Warning signs:** Scenarios created but not visible until manual page refresh.

## Code Examples

Verified patterns from the existing codebase, adapted for scenarios:

### Scenario Zod Schema
```typescript
// lib/schemas/scenario.ts
// Follows pattern from lib/schemas/application.ts

import { z } from "zod";

export const scenarioSchema = z.object({
  inputText: z
    .string()
    .min(10, { error: "Scenario must be at least 10 characters" })
    .max(5000, { error: "Scenario must be under 5000 characters" }),
  applicationId: z.string().min(1, { error: "Please select an application" }),
  repositoryId: z.string().min(1, { error: "Please select a repository" }),
});

export type ScenarioInput = z.infer<typeof scenarioSchema>;
```

### Server Action for Scenario Creation
```typescript
// lib/actions/scenarios.ts
// Follows pattern from lib/actions/repositories.ts

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { scenarioSchema } from "@/lib/schemas/scenario";
import { createScenario } from "@/lib/scenarios";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/actions/applications";

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
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { inputText, applicationId, repositoryId } = validatedFields.data;

  // Verify application exists
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
  });
  if (!app) {
    return { success: false, message: "Application not found." };
  }

  // Verify repository exists and belongs to the selected application
  const repo = await prisma.repository.findUnique({
    where: { id: repositoryId },
  });
  if (!repo || repo.applicationId !== applicationId) {
    return { success: false, message: "Repository not found for the selected application." };
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
```

### Scenario List Page (Server Component)
```typescript
// app/scenarios/page.tsx
import Link from "next/link";
import { listScenarios } from "@/lib/scenarios";
import { ScenarioList } from "./components/ScenarioList";

export default async function ScenariosPage() {
  const scenarios = await listScenarios();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Test Scenarios
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Browse past scenarios and their generation status.
          </p>
        </div>
        <Link
          href="/scenarios/new"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all duration-150 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/30"
        >
          {/* Plus icon */}
          New Scenario
        </Link>
      </div>

      <ScenarioList scenarios={scenarios} />
    </div>
  );
}
```

### Scenario Test Pattern (TDD)
```typescript
// lib/__tests__/scenarios.test.ts
// Follows pattern from lib/__tests__/applications.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient } from "../../generated/prisma/client";

vi.mock("../prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from "../prisma";
import {
  createScenario,
  listScenarios,
  getScenario,
} from "../scenarios";

const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("scenarios service", () => {
  beforeEach(() => {
    mockReset(mockPrisma);
  });

  describe("createScenario", () => {
    it("creates a scenario with status queued", async () => {
      // ...
      expect(mockPrisma.scenario.create).toHaveBeenCalledWith({
        data: {
          inputText: "Login and verify dashboard loads",
          applicationId: "app-123",
          repositoryId: "repo-456",
          status: "queued",
        },
      });
    });
  });

  describe("listScenarios", () => {
    it("includes application name and repository info", async () => {
      // ...verify select includes nested relations
    });

    it("orders by createdAt descending", async () => {
      // ...
    });
  });

  describe("getScenario", () => {
    it("returns full scenario with related application and repository", async () => {
      // ...
    });

    it("returns null when not found", async () => {
      // ...
    });
  });
});
```

### TopNav Update
```typescript
// app/components/TopNav.tsx -- add Scenarios to navItems
const navItems = [
  { label: "Dashboard", href: "/", exact: true },
  { label: "Applications", href: "/applications", exact: false },
  { label: "Scenarios", href: "/scenarios", exact: false },
] as const;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params: { id: string }` (sync) | `params: Promise<{ id: string }>` (async) | Next.js 15+ (enforced in 16) | Must `await params` in `/scenarios/[id]` page |
| Prisma 6 enums | Prisma 7 string columns with app-level validation | Prisma 7 (2025) | More flexible; no migration for new status values |
| useFormState (React 18) | useActionState (React 19) | React 19 | Updated hook name; same behavior |
| Client-side data fetching (SWR/React Query) | Server Components with direct DB calls | Next.js App Router | No loading spinners for initial data; simpler code |

**Deprecated/outdated:**
- `useFormState` from `react-dom`: Renamed to `useActionState` in React 19 (the project already uses the correct hook name)
- Prisma `@@map` for enums: Not needed since we use string columns

## Open Questions

1. **Scenario List Filtering**
   - What we know: SCEN-02 requires showing "a list of past scenarios." At minimum this is an unfiltered list ordered by creation date.
   - What's unclear: Whether users need to filter by application, status, or date range.
   - Recommendation: For v1, show all scenarios with no filtering. The list will be small (single-user, local). Add a filter dropdown in a future iteration if needed. Keep the list simple.

2. **Where to Place the "New Scenario" Entry Point**
   - What we know: The primary flow is `/scenarios/new`. But users might also want to start from the application detail page.
   - What's unclear: Whether a "Generate Test" button should appear on the app detail page.
   - Recommendation: Add the primary "New Scenario" button on the `/scenarios` page and in the TopNav area or dashboard. Optionally add a link on the app detail page as well, which navigates to `/scenarios/new?appId={id}` to pre-select the application. This is a minor UX enhancement, not a blocker.

3. **Scenario Deletion**
   - What we know: Requirements don't mention deleting scenarios. Phase 4 only covers create and read.
   - What's unclear: Whether users need to delete scenarios.
   - Recommendation: Do not build scenario deletion in Phase 4. It's not in the requirements. If needed later, it follows the exact same pattern as application/repository deletion.

4. **Dashboard Updates**
   - What we know: The dashboard currently shows placeholder "Tests Generated: --" and "Last Run: No test runs yet" sections.
   - What's unclear: Whether Phase 4 should update these with real scenario counts.
   - Recommendation: Update the "Tests Generated" stat card to show actual scenario count. Update "Recent Scripts" placeholder to show recent scenarios. This is a small enhancement that makes the dashboard useful as scenarios are created.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `lib/applications.ts`, `lib/repositories.ts`, `lib/actions/*.ts`, `lib/schemas/*.ts` -- Established patterns for service layer, server actions, Zod schemas that Phase 4 directly follows
- Existing codebase: `prisma/schema.prisma` -- Current schema with Application and Repository models, relation patterns, cascade delete behavior
- Existing codebase: `app/applications/[id]/page.tsx`, `app/applications/[id]/components/AppDetailClient.tsx` -- Established dynamic route + Server/Client Component patterns
- Existing codebase: `lib/__tests__/applications.test.ts` -- Established TDD pattern with vitest-mock-extended
- Existing codebase: `app/components/TopNav.tsx` -- Navigation items array structure for adding Scenarios link

### Secondary (MEDIUM confidence)
- Next.js 16 App Router documentation -- Promise params pattern (confirmed by existing codebase usage)
- Prisma 7 documentation -- Relation fields, cascade deletes, nullable fields (confirmed by existing schema)
- React 19 useActionState documentation -- Hook signature and usage (confirmed by existing ConnectRepoModal usage)

### Tertiary (LOW confidence)
- None -- all patterns are directly verifiable from the existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project; zero new dependencies
- Architecture: HIGH - Follows exact patterns from Phases 2 and 3 (service layer, server actions, dynamic routes, TDD)
- Pitfalls: HIGH - All pitfalls relate to established patterns with known solutions (cascade deletes, path revalidation, Promise params)
- Data model: HIGH - Scenario model fields are explicitly defined by requirements (SCEN-01, SCEN-02, SCEN-03) and forward requirements (AI-01, AI-02, AI-03, AI-04)

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days -- stable domain, no fast-moving dependencies; patterns are codebase-internal)
