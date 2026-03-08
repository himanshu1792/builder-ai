---
phase: 03-repository-management
plan: 01
subsystem: database, api
tags: [prisma, zod, vitest, github-api, azure-devops-api, encryption, tdd]

# Dependency graph
requires:
  - phase: 01-project-foundation
    provides: "Prisma schema, encryption module, Vitest setup"
  - phase: 02-application-management
    provides: "Application model, service layer pattern, server actions pattern, Zod schema pattern"
provides:
  - "Repository Prisma model with Application relation and cascade delete"
  - "Repository service (CRUD + PAT validation + URL parsing + slugify)"
  - "Repository Zod schema with provider-specific URL validation"
  - "Repository server actions (connect, update, delete)"
  - "34 unit tests covering all repository service behavior"
affects: [03-repository-management, 07-mcp-repository-operations]

# Tech tracking
tech-stack:
  added: []
  patterns: [PAT validation via native fetch, URL parsing with built-in URL class, provider-specific Zod refinements]

key-files:
  created:
    - prisma/migrations/20260308184242_add_repository/migration.sql
    - lib/repositories.ts
    - lib/schemas/repository.ts
    - lib/actions/repositories.ts
    - lib/__tests__/repositories.test.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Native fetch for PAT validation - no Octokit/azure-devops-node-api dependency needed"
  - "Fine-grained GitHub PATs treated as valid on 200 response (no X-OAuth-Scopes header check needed)"
  - "Both ADO URL formats supported: dev.azure.com and visualstudio.com"
  - "Zod refinements for provider-specific URL patterns and conditional ADO organization requirement"

patterns-established:
  - "PAT validation pattern: server-side fetch to provider API, structured ValidationResult return type"
  - "URL parsing pattern: built-in URL class with pathname segment extraction"
  - "Repository service follows same encrypt-on-write/decrypt-on-read pattern as applications"

requirements-completed: [REPO-01, REPO-02, REPO-03, REPO-05]

# Metrics
duration: 4min
completed: 2026-03-08
---

# Phase 3 Plan 01: Repository Data Layer Summary

**Repository service with PAT validation (GitHub/ADO), URL parsing, Zod schema, encrypted CRUD, and 34 unit tests via TDD**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T18:42:01Z
- **Completed:** 2026-03-08T18:46:23Z
- **Tasks:** 3 (Prisma schema, RED tests, GREEN implementation)
- **Files modified:** 6

## Accomplishments
- Repository model added to Prisma schema with Application relation and cascade delete, migration applied
- Full repository service with CRUD, PAT validation for GitHub and ADO, URL parsing, and slugify utility
- Zod schema with provider-specific URL validation and conditional organization field for ADO
- Server actions wiring Zod validation, PAT validation, and service CRUD with revalidatePath
- 34 new unit tests (61 total) all passing; TypeScript clean; build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma Schema + Migration** - `5cabdeb` (chore)
2. **Task 2: Tests (RED phase)** - `99e917e` (test)
3. **Task 3: Implementation (GREEN phase)** - `1c9a343` (feat)

_TDD plan: RED produced failing tests, GREEN made them pass. No REFACTOR needed -- implementation followed established patterns._

## Files Created/Modified
- `prisma/schema.prisma` - Added Repository model with Application relation
- `prisma/migrations/20260308184242_add_repository/migration.sql` - Migration for Repository table
- `lib/repositories.ts` - Repository service with CRUD, PAT validation, URL parsing, slugify
- `lib/schemas/repository.ts` - Zod validation schema with provider-specific refinements
- `lib/actions/repositories.ts` - Server actions for connect, update, delete repository
- `lib/__tests__/repositories.test.ts` - 34 unit tests covering all behavior specifications

## Decisions Made
- Used native `fetch` for PAT validation API calls (no Octokit/azure-devops-node-api dependency)
- Fine-grained GitHub PATs (which don't return X-OAuth-Scopes header) are treated as valid on 200 response
- Both Azure DevOps URL formats supported: `dev.azure.com/{org}/...` and `{org}.visualstudio.com/...`
- Zod schema uses `.refine()` for provider-specific URL pattern validation and conditional organization requirement

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Repository data layer complete and tested, ready for UI consumption in Plans 02 and 03
- Server actions ready for form integration in ConnectRepoModal
- Service functions (listRepositories, getRepository) ready for app detail page data fetching
- All 61 tests passing; no regressions introduced

## Self-Check: PASSED

All 7 files verified present. All 3 commit hashes verified in git log.

---
*Phase: 03-repository-management*
*Completed: 2026-03-08*
