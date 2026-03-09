---
phase: 03-repository-management
plan: 03
subsystem: ui
tags: [next.js, react, repository-modal, provider-toggle, inline-editing, delete-dialog, client-server-boundary]

# Dependency graph
requires:
  - phase: 03-repository-management plan 01
    provides: Repository service CRUD, PAT validation, URL parsing, Zod schema, server actions
  - phase: 03-repository-management plan 02
    provides: Application detail page with AppDetailClient wrapper and Connected Repositories placeholder
  - phase: 02-application-management
    provides: ApplicationModal, PasswordField, DeleteDialog component patterns
provides:
  - ConnectRepoModal with GitHub/ADO provider toggle and form
  - RepositoryList with empty state and count badge
  - RepositoryRow with provider icon, extracted name, output folder, hover actions
  - EditRepoRow for inline output folder editing
  - DeleteRepoDialog for repository removal confirmation
  - Client-safe repository-utils.ts for utility functions in client components
affects: [future test generation UI, Phase 4 scenario authoring]

# Tech tracking
tech-stack:
  added: []
  patterns: [client-server-boundary-separation, provider-toggle-segmented-control, inline-row-editing, hover-reveal-actions]

key-files:
  created:
    - app/applications/[id]/components/ConnectRepoModal.tsx
    - app/applications/[id]/components/RepositoryList.tsx
    - app/applications/[id]/components/RepositoryRow.tsx
    - app/applications/[id]/components/EditRepoRow.tsx
    - app/applications/[id]/components/DeleteRepoDialog.tsx
    - lib/repository-utils.ts
  modified:
    - app/applications/[id]/components/AppDetailClient.tsx

key-decisions:
  - "Client/server boundary: Created lib/repository-utils.ts to separate client-safe utilities (slugify, extractRepoName, RepositoryListItem type) from server-only lib/repositories.ts"
  - "Provider toggle: Segmented control with hidden input, local state for provider selection, conditional ADO organization field"
  - "Inline editing pattern: EditRepoRow replaces RepositoryRow when isEditing=true, only output folder editable post-connection"
  - "Hover-reveal actions: Edit/delete buttons on repo rows use group-hover:opacity-100 for clean UX"
  - "Disconnect terminology: Delete dialog says 'Disconnect Repository' with messaging that the repository itself is unaffected"

patterns-established:
  - "Client/server utility separation: Pure utility functions used by client components must be in separate files from Prisma-importing service modules"
  - "Provider toggle: Segmented control with hidden input for provider selection in forms"
  - "Hover-reveal row actions: group + group-hover:opacity-100 pattern for action buttons on list rows"
  - "Inline row editing: isEditing state delegates from display row component to edit row component"

requirements-completed: [REPO-01, REPO-02, REPO-03, REPO-04, REPO-05]

# Metrics
duration: 11min
completed: 2026-03-09
---

# Phase 3 Plan 03: Repository Connection UI Summary

**ConnectRepoModal with GitHub/ADO toggle, RepositoryList with provider icons and hover actions, inline output folder editing, and disconnect confirmation -- with client-safe utility separation**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-09T09:44:14Z
- **Completed:** 2026-03-09T09:55:26Z
- **Tasks:** 3 (2 auto + 1 checkpoint verification)
- **Files modified:** 7

## Accomplishments
- Built ConnectRepoModal with GitHub/ADO segmented toggle that dynamically shows/hides organization field, pre-fills output folder with slugified app name, and surfaces PAT validation errors prominently
- Created RepositoryList with empty state (dashed border, "No repositories connected"), count badge, and "Connect Repository" button in header
- Built RepositoryRow with provider-specific SVG icons (GitHub octocat, ADO diamond), extracted repo name display, output folder path, and hover-visible edit/delete buttons
- Implemented inline output folder editing via EditRepoRow with Save/Cancel using useActionState
- Created DeleteRepoDialog following existing DeleteDialog pattern with "Disconnect" terminology
- Wired all repository components into AppDetailClient with connect modal, delete dialog, and inline edit state management
- Established client/server boundary separation pattern with lib/repository-utils.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ConnectRepoModal with provider toggle and form** - `8e864a6` (feat)
2. **Task 2: Build RepositoryList, RepositoryRow, EditRepoRow, DeleteRepoDialog, and wire into AppDetailClient** - `f2db8e4` (feat)
3. **Task 3: Visual and functional verification** - checkpoint approved by user

## Files Created/Modified
- `app/applications/[id]/components/ConnectRepoModal.tsx` - Modal with GitHub/ADO toggle, form fields, PAT input, output folder, useActionState submission
- `app/applications/[id]/components/RepositoryList.tsx` - Card section with header, count badge, empty state, list of RepositoryRow components
- `app/applications/[id]/components/RepositoryRow.tsx` - Compact row with provider icon, extracted name, output folder, hover edit/delete buttons
- `app/applications/[id]/components/EditRepoRow.tsx` - Inline edit form for output folder with Save/Cancel and useActionState
- `app/applications/[id]/components/DeleteRepoDialog.tsx` - Disconnect confirmation dialog with loading state
- `app/applications/[id]/components/AppDetailClient.tsx` - Updated to wire all repository components with state management
- `lib/repository-utils.ts` - Client-safe utility functions extracted from lib/repositories.ts

## Decisions Made
- Created lib/repository-utils.ts to separate client-safe utilities from server-only repository service -- avoids Prisma/pg modules leaking into client bundle
- Provider toggle uses segmented control with hidden input rather than radio buttons for cleaner UX
- Edit mode only exposes output folder (not repo URL or PAT) since those are set at connection time
- Delete dialog uses "Disconnect" language to clarify the repository itself is unaffected
- Hover-reveal pattern for row actions keeps the list clean while making actions discoverable

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created lib/repository-utils.ts for client/server boundary separation**
- **Found during:** Task 2 (build verification)
- **Issue:** Client components imported slugify and extractRepoName from lib/repositories.ts, which transitively imports Prisma and pg modules (dns, fs, net, tls). Next.js build failed with "Module not found" errors for Node.js-only modules in the client bundle.
- **Fix:** Created lib/repository-utils.ts containing only pure utility functions (slugify, extractRepoName, parseGitHubUrl, parseAdoUrl) and the RepositoryListItem type. Updated all client component imports to use this new file instead of lib/repositories.ts.
- **Files modified:** lib/repository-utils.ts (created), ConnectRepoModal.tsx, RepositoryRow.tsx, AppDetailClient.tsx, RepositoryList.tsx, EditRepoRow.tsx
- **Verification:** npm run build succeeds, npx tsc --noEmit passes, all 61 tests pass
- **Committed in:** f2db8e4 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for build correctness. No scope creep. The plan specified importing from lib/repositories.ts but did not account for the client/server boundary issue in Next.js.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 (Repository Management) is now fully complete
- All 5 REPO requirements satisfied: connect GitHub (REPO-01), connect ADO (REPO-02), configure output folder (REPO-03), view repos (REPO-04), remove repos (REPO-05)
- The application detail page at /applications/[id] is the central hub for both application management and repository management
- The client/server utility separation pattern (lib/repository-utils.ts) is established for future phases
- Phase 4 (Scenario Authoring) can build on this foundation to add test scenario submission from the application detail page

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 03-repository-management*
*Completed: 2026-03-09*
