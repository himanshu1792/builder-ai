---
phase: 04-scenario-authoring-history
plan: 02
subsystem: ui
tags: [next.js, react, tailwind, scenarios, forms, useActionState, dependent-dropdown]

# Dependency graph
requires:
  - phase: 04-scenario-authoring-history
    provides: Scenario Prisma model, service CRUD, listAllRepositoriesGrouped, createScenarioAction
  - phase: 02-application-management
    provides: TopNav component, ApplicationCard patterns, theme tokens, ActionState type
  - phase: 03-repository-management
    provides: RepositoryList empty state pattern, ConnectRepoModal form pattern
provides:
  - /scenarios list page with StatusBadge and empty state
  - /scenarios/new authoring form with dependent app/repo dropdowns
  - /scenarios/[id] detail page with multi-section layout (input, refined prompt, script, errors)
  - StatusBadge reusable component for scenario status display
  - TopNav updated with Scenarios navigation link
affects: [05-ai-pipeline, 06-async-processing]

# Tech tracking
tech-stack:
  added: []
  patterns: [dependent-dropdown-with-key-reset, multi-section-detail-layout, relative-time-formatter]

key-files:
  created:
    - app/scenarios/page.tsx
    - app/scenarios/components/ScenarioList.tsx
    - app/scenarios/components/StatusBadge.tsx
    - app/scenarios/components/ScenarioForm.tsx
    - app/scenarios/new/page.tsx
    - app/scenarios/[id]/page.tsx
    - app/scenarios/[id]/components/ScenarioDetailClient.tsx
  modified:
    - app/components/TopNav.tsx

key-decisions:
  - "Dependent dropdown uses key prop reset: changing app resets repo select by changing its React key"
  - "ScenarioList is a Server Component (no 'use client') using Link for navigation -- no client interactivity needed"
  - "StatusBadge is a pure render component (no 'use client') with fallback to queued config for unknown statuses"
  - "Relative time formatter is inline utility in ScenarioList -- no external date library needed"

patterns-established:
  - "Dependent dropdown pattern: parent select onChange sets state, child select uses key={parentId} for auto-reset, disabled when no parent selected"
  - "Multi-section detail layout: back link, header card with StatusBadge, content sections as separate rounded-xl border cards"
  - "Scenario list card pattern: truncated input text + StatusBadge on top row, metadata icons on bottom row"

requirements-completed: [SCEN-01, SCEN-02, SCEN-03]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 4 Plan 02: Scenario UI Summary

**Three scenario pages (/scenarios list, /scenarios/new form, /scenarios/[id] detail) with dependent app/repo dropdowns, StatusBadge, and TopNav integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T18:09:18Z
- **Completed:** 2026-03-11T18:14:04Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- /scenarios page with scenario list (empty state + populated cards with StatusBadge, app name, provider icon, relative timestamp)
- /scenarios/new authoring form with textarea, dependent application/repository dropdowns, and server action submission
- /scenarios/[id] detail page with Original Input, Refined Prompt (placeholder), Generated Script (monospace code block), and conditional Error Details sections
- TopNav updated with Scenarios link between Applications and Coming Soon items
- All 73 existing tests still pass, TypeScript compiles, build succeeds with all 3 new routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Scenarios to TopNav and create scenario list page with StatusBadge** - `4ddff04` (feat)
2. **Task 2: Create new scenario authoring form with dependent app/repo dropdowns** - `9ab7bb9` (feat)
3. **Task 3: Create scenario detail page with multi-section layout** - `2db603b` (feat)

## Files Created/Modified
- `app/components/TopNav.tsx` - Added Scenarios nav item after Applications
- `app/scenarios/page.tsx` - Server Component list page with header and New Scenario button
- `app/scenarios/components/ScenarioList.tsx` - Scenario card list with empty state, StatusBadge, relative time
- `app/scenarios/components/StatusBadge.tsx` - Color-coded status badge (queued/in_progress/completed/failed)
- `app/scenarios/new/page.tsx` - Server Component fetching apps and grouped repos for form
- `app/scenarios/components/ScenarioForm.tsx` - Client Component with textarea, dependent dropdowns, useActionState
- `app/scenarios/[id]/page.tsx` - Server Component fetching scenario by ID with notFound handling
- `app/scenarios/[id]/components/ScenarioDetailClient.tsx` - Client Component with multi-section detail layout

## Decisions Made
- Dependent dropdown uses React key prop reset: changing selectedAppId changes the key of the repo select, which resets its value automatically without needing useEffect
- ScenarioList stays as Server Component (no "use client") since it only uses Link for navigation
- StatusBadge is a pure render component with fallback to queued config for unknown status values
- Relative time formatter is a simple inline utility -- no date-fns or similar library needed for this use case

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete scenario authoring and history UI ready for user interaction
- Phase 4 (Scenario Authoring & History) is fully complete with both plans done
- Placeholder sections (Refined Prompt, Generated Script) ready for Phase 5 (AI Pipeline) to populate
- Forward-compatible: when refinedPrompt/generatedScript fields get populated, UI automatically shows content instead of placeholders
- Error Details section ready for Phase 6 (Async Processing) failure handling

## Self-Check: PASSED

All 8 created/modified files verified on disk. All 3 task commits verified in git log (4ddff04, 9ab7bb9, 2db603b).

---
*Phase: 04-scenario-authoring-history*
*Completed: 2026-03-11*
