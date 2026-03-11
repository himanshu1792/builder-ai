---
phase: 04-scenario-authoring-history
verified: 2026-03-09T23:49:30Z
status: passed
score: 21/21 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Visit /scenarios/new, select an application, verify only that app's repos appear in the repository dropdown"
    expected: "Repository dropdown populates with only the repos linked to the selected application; selecting a different app resets the repo selection"
    why_human: "Dependent dropdown behavior requires browser interaction; filteredRepos logic is correct in code but runtime behavior cannot be confirmed statically"
  - test: "Submit the /scenarios/new form with valid data"
    expected: "Scenario is created, page redirects to /scenarios, and the new card appears with 'Queued' status badge"
    why_human: "Requires a live database connection and full Next.js runtime to verify redirect and DB write"
  - test: "Visit /scenarios/[id] for a scenario with null refinedPrompt and generatedScript"
    expected: "Refined Prompt section shows 'Waiting for AI refinement...' and Generated Script section shows 'Script will appear here after generation...'"
    why_human: "Requires live data; placeholder rendering logic is correct in code but needs visual confirmation"
  - test: "Visit /scenarios/[id] for a scenario with status 'failed'"
    expected: "Error Details section is visible with red styling and displays the errorMessage (or 'An unknown error occurred.' if null)"
    why_human: "Requires a failed scenario record in the database; conditional rendering is correct in code but needs live confirmation"
---

# Phase 4: Scenario Authoring & History Verification Report

**Phase Goal:** Users can write test scenarios in plain English and review past generation attempts with their details
**Verified:** 2026-03-09T23:49:30Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths — Plan 04-01 (Data Layer)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Scenario model exists in Prisma schema with Application and Repository relations and cascade delete | VERIFIED | `prisma/schema.prisma` lines 40-58: model Scenario with `onDelete: Cascade` on both relations |
| 2 | Application and Repository models have reverse `scenarios Scenario[]` relation | VERIFIED | `Application` model has `scenarios Scenario[]`, `Repository` model has `scenarios Scenario[]` |
| 3 | Scenario has nullable fields for refinedPrompt, generatedScript, errorMessage | VERIFIED | All three declared `String?` in schema |
| 4 | createScenario sets status to 'queued' and stores inputText, applicationId, repositoryId | VERIFIED | `lib/scenarios.ts`: `status: "queued"` hardcoded in `prisma.scenario.create` data block |
| 5 | listScenarios returns scenarios ordered by createdAt desc with application name and repository info | VERIFIED | `orderBy: { createdAt: "desc" }`, selects `application: { name }` and `repository: { repoUrl, provider }` |
| 6 | getScenario returns full scenario detail including all nullable fields and related app/repo info | VERIFIED | `findUnique` with full `include` for application (name, testUrl) and repository (repoUrl, provider, outputFolder) |
| 7 | listAllRepositoriesGrouped returns repositories keyed by applicationId for dependent dropdown | VERIFIED | Fetches all repos via `prisma.repository.findMany`, groups into `Record<string, Array<...>>` by `applicationId` |
| 8 | Zod schema validates inputText (min 10, max 5000), applicationId, and repositoryId as required | VERIFIED | `lib/schemas/scenario.ts`: min(10), max(5000) on inputText; min(1) on both IDs |
| 9 | createScenarioAction validates app exists, repo exists, and repo belongs to selected app before creating | VERIFIED | Three-step cross-entity check: `application.findUnique` + `repository.findUnique` + `repository.applicationId !== applicationId` guard |
| 10 | createScenarioAction revalidates /scenarios and / paths after successful creation | VERIFIED | `revalidatePath("/scenarios")` and `revalidatePath("/")` called before `redirect("/scenarios")` |

### Observable Truths — Plan 04-02 (UI)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 11 | TopNav includes 'Scenarios' link between Applications and Coming Soon items | VERIFIED | `app/components/TopNav.tsx`: navItems array has `{ label: "Scenarios", href: "/scenarios", exact: false }` after Applications |
| 12 | /scenarios page shows a list of past scenarios with input text, app name, status badge, and timestamp | VERIFIED | `ScenarioList.tsx`: renders inputText (truncated to 120 chars), `StatusBadge`, `scenario.application.name`, `formatRelativeTime` |
| 13 | /scenarios page shows empty state with 'New Scenario' button when no scenarios exist | VERIFIED | `scenarios.length === 0` branch in `ScenarioList.tsx` renders dashed-border card with "No scenarios yet" and `/scenarios/new` link |
| 14 | StatusBadge renders color-coded badges: queued (gray), in_progress (blue), completed (emerald), failed (red) | VERIFIED | `StatusBadge.tsx`: statusConfig map with all four variants plus queued fallback |
| 15 | /scenarios/new page has a textarea for inputText, application dropdown, and repository dropdown | VERIFIED | `ScenarioForm.tsx`: `<textarea name="inputText">`, `<select name="applicationId">`, `<select name="repositoryId">` |
| 16 | Repository dropdown filters to show only repos belonging to the selected application | VERIFIED | `filteredRepos = repositoriesByApp[selectedAppId] || []`; repo options map over filteredRepos |
| 17 | Selecting a different application resets the repository selection | VERIFIED | Repository `<select>` has `key={selectedAppId}` — React key prop reset causes DOM remount on app change |
| 18 | Form submits via useActionState and createScenarioAction, redirects to /scenarios on success | VERIFIED | `useActionState(createScenarioAction, initialState)`, `<form action={formAction}>`, redirect in server action |
| 19 | /scenarios/[id] page shows full scenario details: original input, refined prompt section, generated script section, error section | VERIFIED | `ScenarioDetailClient.tsx`: four distinct sections with headings "Original Input", "Refined Prompt", "Generated Script", "Error Details" |
| 20 | Detail page shows placeholder text for null refinedPrompt and generatedScript | VERIFIED | Null checks render "Waiting for AI refinement..." and "Script will appear here after generation..." |
| 21 | Generated script section uses monospace pre/code block styling | VERIFIED | `<pre className="...bg-gray-900...text-gray-100..."><code>` dark code block |

**Score: 21/21 truths verified**

---

## Required Artifacts

### Plan 04-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | Scenario model with Application and Repository relations | VERIFIED | `model Scenario` present with both relations, cascade delete, nullable fields |
| `lib/scenarios.ts` | Scenario service with CRUD + grouped repo helper | VERIFIED | 265-line file; exports `createScenario`, `listScenarios`, `getScenario`, `listAllRepositoriesGrouped` |
| `lib/schemas/scenario.ts` | Zod validation schema for scenario creation form | VERIFIED | Exports `scenarioSchema` and `ScenarioInput`; min/max constraints present |
| `lib/actions/scenarios.ts` | Server action for scenario creation | VERIFIED | `"use server"` directive, exports `createScenarioAction`, cross-entity validation implemented |
| `lib/__tests__/scenarios.test.ts` | Unit tests for scenario service (min 80 lines) | VERIFIED | 265 lines; 12 tests covering all four service functions |

### Plan 04-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/TopNav.tsx` | Updated nav with Scenarios link | VERIFIED | Contains "Scenarios" nav item with correct href |
| `app/scenarios/page.tsx` | Server Component for scenario list page | VERIFIED | Exports `ScenariosPage`, fetches via `listScenarios`, renders `ScenarioList` |
| `app/scenarios/components/ScenarioList.tsx` | Renders scenario rows with status badges | VERIFIED | Imports `StatusBadge`, uses `Link`, handles empty/populated states |
| `app/scenarios/components/StatusBadge.tsx` | Color-coded status badge component | VERIFIED | Exports `StatusBadge`, statusConfig map with all four variants |
| `app/scenarios/new/page.tsx` | Server Component for new scenario form page | VERIFIED | Exports `NewScenarioPage`, parallel-fetches apps and grouped repos |
| `app/scenarios/components/ScenarioForm.tsx` | Client Component with textarea, app/repo dropdowns, submit | VERIFIED | `"use client"`, `useActionState`, dependent dropdown, key-reset pattern |
| `app/scenarios/[id]/page.tsx` | Server Component for scenario detail page | VERIFIED | Exports `ScenarioDetailPage`, `params: Promise<{id: string}>`, `notFound()` guard |
| `app/scenarios/[id]/components/ScenarioDetailClient.tsx` | Client Component with multi-section detail layout | VERIFIED | `"use client"`, four content sections, StatusBadge, conditional error section |

---

## Key Link Verification

### Plan 04-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/scenarios.ts` | prisma | `prisma.scenario.*` queries | VERIFIED | `prisma.scenario.create`, `prisma.scenario.findMany`, `prisma.scenario.findUnique`, `prisma.repository.findMany` all present |
| `lib/actions/scenarios.ts` | `lib/scenarios.ts` | `createScenario` call | VERIFIED | `import { createScenario } from "@/lib/scenarios"` and `await createScenario(...)` in action |
| `lib/actions/scenarios.ts` | `lib/schemas/scenario.ts` | `scenarioSchema.safeParse` | VERIFIED | `import { scenarioSchema } from "@/lib/schemas/scenario"` and `scenarioSchema.safeParse(...)` |

### Plan 04-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/scenarios/page.tsx` | `lib/scenarios.ts` | `listScenarios` | VERIFIED | `import { listScenarios } from "@/lib/scenarios"` + `await listScenarios()` |
| `app/scenarios/new/page.tsx` | `lib/applications.ts` | `listApplications` | VERIFIED | `import { listApplications } from "@/lib/applications"` + `await Promise.all([listApplications(), ...])` |
| `app/scenarios/new/page.tsx` | `lib/scenarios.ts` | `listAllRepositoriesGrouped` | VERIFIED | `import { listAllRepositoriesGrouped } from "@/lib/scenarios"` + parallel fetch |
| `app/scenarios/components/ScenarioForm.tsx` | `lib/actions/scenarios.ts` | `useActionState(createScenarioAction, ...)` | VERIFIED | `import { createScenarioAction } from "@/lib/actions/scenarios"` + `useActionState(createScenarioAction, initialState)` |
| `app/scenarios/[id]/page.tsx` | `lib/scenarios.ts` | `getScenario` | VERIFIED | `import { getScenario } from "@/lib/scenarios"` + `await getScenario(id)` |

---

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|----------------|-------------|--------|----------|
| SCEN-01 | 04-01, 04-02 | User can write a test scenario in plain English via text input | SATISFIED | `/scenarios/new` page with textarea + `createScenarioAction` stores `inputText` in DB |
| SCEN-02 | 04-01, 04-02 | User can view list of past scenarios with generation status | SATISFIED | `/scenarios` page renders `ScenarioList` with `StatusBadge` showing queued/in_progress/completed/failed |
| SCEN-03 | 04-01, 04-02 | User can view details of a past scenario (original input, refined prompt, generated script, error details) | SATISFIED | `/scenarios/[id]` page renders all four sections via `ScenarioDetailClient` |

No orphaned requirements — SCEN-01, SCEN-02, SCEN-03 are the only requirements mapped to Phase 4 in REQUIREMENTS.md and all are claimed by the plans.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/scenarios/components/ScenarioDetailClient.tsx` | 188 | "Waiting for AI refinement..." | INFO | Intentional by design — placeholder for null `refinedPrompt` pending Phase 5 (AI Pipeline) |
| `app/scenarios/components/ScenarioDetailClient.tsx` | 204 | "Script will appear here after generation..." | INFO | Intentional by design — placeholder for null `generatedScript` pending Phase 5 |
| `lib/scenarios.ts` | 108 | `return null` | INFO | Correct — `getScenario` returns null when scenario not found, handled by `notFound()` in page |

No blockers or warnings found. All three INFO-level items are expected, correct behavior.

---

## Test Suite Status

All 73 tests pass across 4 test files:
- `lib/__tests__/encryption.test.ts` — 10 tests
- `lib/__tests__/scenarios.test.ts` — 12 tests
- `lib/__tests__/applications.test.ts` — 17 tests
- `lib/__tests__/repositories.test.ts` — 34 tests

TypeScript compiles with zero errors (`npx tsc --noEmit` exits cleanly).

Prisma migration `20260311180128_add_scenario_model` exists and is applied.

All 6 task commits confirmed in git log: `bf689d2`, `958b1ce`, `69f0ba3`, `4ddff04`, `9ab7bb9`, `2db603b`.

---

## Human Verification Required

### 1. Dependent Dropdown Runtime Behavior

**Test:** Visit `/scenarios/new`, select an application from the dropdown
**Expected:** Repository dropdown populates with only that application's repos; switching to a different application resets and repopulates the repo dropdown
**Why human:** The `key={selectedAppId}` prop reset and `filteredRepos` logic are correct in code; browser interaction needed to confirm the dependent dropdown UX works end-to-end

### 2. Scenario Creation Flow

**Test:** Submit `/scenarios/new` with valid inputText (10+ chars), a selected application, and a selected repository
**Expected:** Scenario is created in the database, page redirects to `/scenarios`, new scenario card appears with "Queued" status badge
**Why human:** Requires live database connection and full Next.js runtime; server action redirect cannot be confirmed statically

### 3. Scenario Detail — Null Field Placeholders

**Test:** Visit `/scenarios/[id]` for a newly created scenario (status: queued, no AI output yet)
**Expected:** Original Input shows the inputText; Refined Prompt section shows "Waiting for AI refinement..."; Generated Script shows "Script will appear here after generation..."; Error Details section is absent
**Why human:** Requires a live database record; conditional rendering is verified in code but visual confirmation needed

### 4. Scenario Detail — Failed Status

**Test:** Manually update a scenario's status to "failed" in the database, then visit its detail page
**Expected:** Error Details section appears with red heading and red-background error message block
**Why human:** No failed scenario can be created through normal UI flow at this phase; requires direct DB manipulation or Phase 6 integration

---

## Summary

Phase 4 goal is fully achieved. Both plans delivered substantive, wired implementations:

**Data layer (04-01):** The Prisma schema has the `Scenario` model with cascade-delete relations to `Application` and `Repository`. The service layer exports all four required functions with real Prisma queries. The Zod schema enforces all constraints. The server action performs cross-entity validation (app exists, repo exists, repo belongs to app) before creating. 12 unit tests all pass.

**UI layer (04-02):** All three routes exist and are wired to the data layer. The `/scenarios` list page fetches real data and renders it with status badges. The `/scenarios/new` form has working dependent dropdowns connected to `createScenarioAction`. The `/scenarios/[id]` detail page renders all four sections with correct null-handling. TopNav includes the Scenarios link.

No gaps. Phase is ready to proceed to Phase 5 (AI Pipeline).

---

_Verified: 2026-03-09T23:49:30Z_
_Verifier: Claude (gsd-verifier)_
