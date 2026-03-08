# Phase 3: Repository Management - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can connect their GitHub and Azure DevOps repositories to applications and configure where generated scripts should be placed. This phase covers connecting repos (with PAT validation), viewing connected repos, editing repo settings, removing repos, and the output folder configuration. Script generation, pushing, and PR creation are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Navigation & placement
- Clicking an ApplicationCard navigates to an app detail page (`/applications/[id]`)
- App detail page shows full app details at the top (name, URL, credentials with reveal) plus connected repos below
- Edit/delete for the application moves to the detail page — inline editing (click field or "Edit" button makes fields editable), replacing the current modal-based edit flow
- ApplicationCard becomes a clickable link; hover edit/delete icons are removed from the card

### Connect repo form
- Single "Connect Repository" modal/form with a GitHub/Azure DevOps toggle/selector at the top
- Form fields adjust based on provider: GitHub shows URL + PAT; ADO shows URL + PAT + organization name
- Repo URL field accepts full URLs only (e.g., `https://github.com/org/repo`) — no shorthand parsing
- Output folder is a field in the connect form (set during connection, editable later)
- On submit, the PAT is validated by making a test API call to the provider
- If PAT has insufficient permissions, show specific missing permissions (e.g., "PAT needs 'repo' scope for GitHub" or "Needs Code Read & Write for ADO")
- Reuse existing PasswordField component for PAT input
- PAT is encrypted at rest using the existing encryption module

### Repo list display
- Compact list rows on the app detail page (not cards)
- Each row shows: provider icon (GitHub/ADO), repo name extracted from URL, output folder path, edit/delete action buttons on hover
- Empty state: dashed border area with "No repositories connected" + "Connect Repository" button (matches existing ApplicationsClient empty state pattern)
- No limit on repos per application — list scrolls if long

### Output folder configuration
- Output folder is set during repo connection (field in the connect form)
- Default value: `tests/{application-name}` (slugified from app name, e.g., "My Web App" → `tests/my-web-app`)
- No validation against actual repo contents — folder will be created when scripts are pushed (Phase 7)
- Duplicates allowed — multiple repos can share the same output folder path
- User can edit the output folder after connection from the repo row

### Claude's Discretion
- Exact inline editing UX on the detail page (toggle mode vs click-to-edit)
- Provider toggle/selector design in the connect form
- Repo name extraction logic from full URL
- Slugification algorithm for default output folder
- Loading states and error handling patterns
- Database schema design for Repository model (relation to Application)

</decisions>

<specifics>
## Specific Ideas

- Default output folder should be per-application: `tests/{app-name}` so multiple apps don't collide in the same repo
- The app detail page is a full profile page for the application — not just a repo list
- PAT validation should give actionable feedback about specific missing permissions, not just pass/fail

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ApplicationCard` (`app/applications/components/ApplicationCard.tsx`): Card pattern to adapt into a clickable link to detail page
- `ApplicationModal` (`app/applications/components/ApplicationModal.tsx`): Modal pattern with Zod validation + useActionState — reusable for connect repo form
- `PasswordField` (`app/applications/components/PasswordField.tsx`): Sensitive field with show/hide toggle — reuse for PAT input
- `DeleteDialog` (`app/applications/components/DeleteDialog.tsx`): Confirmation dialog pattern — reuse for repo removal
- `lib/encryption.ts`: AES-256-GCM encrypt/decrypt — reuse for PAT storage
- `lib/applications.ts`: Service module pattern (Prisma CRUD with encrypt/decrypt) — follow for repository service
- `lib/actions/applications.ts`: Server actions pattern (Zod validate + service call + revalidatePath) — follow for repo actions
- `lib/schemas/application.ts`: Zod schema pattern — follow for repository schema

### Established Patterns
- Server Components for data fetching, Client Components for interactivity
- useActionState + server actions for form submissions
- Zod schemas in `lib/schemas/` for validation
- Service modules in `lib/` with Prisma queries
- Tailwind CSS with custom theme tokens (text-primary, text-secondary, bg-surface, border-border, etc.)
- Grid layout for card lists, empty states with dashed border + illustration

### Integration Points
- New route: `/applications/[id]` for app detail page
- Prisma schema: Add Repository model with relation to Application (applicationId foreign key)
- TopNav: No changes needed (app detail is a sub-route of /applications)
- Dashboard stats: May update repo count on dashboard (DashboardStats component)
- Encryption: PAT fields use same encrypt/decrypt as application credentials

</code_context>

<deferred>
## Deferred Ideas

- Temp file for generated scripts (create temp file, delete after PR created) — Phase 7: MCP Repository Operations
- Running generated scripts via agents with Playwright libraries installed — Add to v2 backlog (v1 generates scripts only, doesn't execute them)

</deferred>

---

*Phase: 03-repository-management*
*Context gathered: 2026-03-08*
