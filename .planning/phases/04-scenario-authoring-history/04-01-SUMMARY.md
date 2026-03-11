---
phase: 04-scenario-authoring-history
plan: 01
subsystem: database
tags: [prisma, vitest, zod, server-actions, tdd, scenarios]

# Dependency graph
requires:
  - phase: 01-project-foundation
    provides: Prisma setup, encryption module, Vitest framework
  - phase: 02-application-management
    provides: Application model, service pattern, ActionState type
  - phase: 03-repository-management
    provides: Repository model, service CRUD, Zod schema patterns
provides:
  - Scenario Prisma model with forward-compatible nullable fields
  - Scenario service (createScenario, listScenarios, getScenario, listAllRepositoriesGrouped)
  - Scenario Zod validation schema
  - createScenarioAction server action with cross-entity validation
  - 12 unit tests for scenario service
affects: [05-ai-pipeline, 06-async-processing, 04-02-scenario-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [grouped-repository-helper, cross-entity-validation, forward-compatible-schema]

key-files:
  created:
    - prisma/migrations/20260311180128_add_scenario_model/migration.sql
    - lib/scenarios.ts
    - lib/schemas/scenario.ts
    - lib/actions/scenarios.ts
    - lib/__tests__/scenarios.test.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Forward-compatible nullable fields (refinedPrompt, generatedScript, errorMessage) avoid breaking migrations in Phase 5/6"
  - "listAllRepositoriesGrouped groups repos by applicationId for dependent dropdown in scenario creation form"
  - "Server action validates app existence, repo existence, AND repo-app ownership before creating scenario"

patterns-established:
  - "Grouped helper pattern: listAllRepositoriesGrouped fetches all repos and groups by foreign key for dependent dropdowns"
  - "Cross-entity validation: server action verifies entity relationships (repo belongs to app) before mutation"
  - "Forward-compatible schema: nullable fields for future pipeline phases, no migration needed when populated"

requirements-completed: [SCEN-01, SCEN-02, SCEN-03]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 4 Plan 01: Scenario Data Layer Summary

**Prisma Scenario model with TDD service layer, Zod validation, and cross-entity server action for scenario authoring**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T18:00:37Z
- **Completed:** 2026-03-11T18:04:51Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Scenario model in Prisma schema with Application and Repository cascade-delete relations and forward-compatible nullable fields
- TDD service layer with 4 functions: createScenario, listScenarios, getScenario, listAllRepositoriesGrouped
- Zod schema validates inputText (10-5000 chars), applicationId, repositoryId
- Server action with cross-entity validation (app exists, repo exists, repo belongs to app)
- 12 new unit tests passing, 73 total tests (10 encryption + 17 application + 34 repository + 12 scenario)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Scenario model to Prisma schema and run migration** - `bf689d2` (feat)
2. **Task 2: Write failing tests for scenario service** - `958b1ce` (test)
3. **Task 3: Implement scenario service, Zod schema, and server action** - `69f0ba3` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added Scenario model with Application/Repository relations and scenarios[] reverse relations
- `prisma/migrations/20260311180128_add_scenario_model/migration.sql` - Migration for Scenario table
- `lib/scenarios.ts` - Scenario service with CRUD + grouped repository helper
- `lib/schemas/scenario.ts` - Zod validation schema for scenario creation
- `lib/actions/scenarios.ts` - Server action with cross-entity validation
- `lib/__tests__/scenarios.test.ts` - 12 unit tests for scenario service

## Decisions Made
- Forward-compatible nullable fields (refinedPrompt, generatedScript, errorMessage) avoid breaking migrations when Phase 5/6 populate them
- listAllRepositoriesGrouped returns Record<string, Array> for dependent dropdown (select app, then see its repos)
- Server action validates app existence, repo existence, AND repo-app ownership -- three checks before creating

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Scenario data layer complete, ready for Plan 04-02 (Scenario UI)
- Service functions export all types needed for UI components
- listAllRepositoriesGrouped provides data for dependent dropdown in scenario creation form
- Forward-compatible fields ready for Phase 5 (AI Pipeline) and Phase 6 (Async Processing)

## Self-Check: PASSED

All 6 created/modified files verified on disk. All 3 task commits verified in git log.

---
*Phase: 04-scenario-authoring-history*
*Completed: 2026-03-11*
