# Phase 2: Application Management - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Register, view, edit, and delete applications with encrypted credentials. Users manage the apps they want to generate tests for. Credentials stored securely via AES-256-GCM (already built in Phase 1). This phase delivers the CRUD UI and data layer — no testing agents, no AI pipeline, no repository operations.

</domain>

<decisions>
## Implementation Decisions

### UI Layout & Navigation
- Top navigation bar (not sidebar) with content area below
- Nav items for Phase 2: **Dashboard**, **Manual Testing** (placeholder), **Regression Testing** (placeholder)
- Manual Testing and Regression Testing nav items present but show "Coming Soon" state — actual functionality in future phases
- Color scheme: Light theme with **purple/blue accents** — modern SaaS feel
- Use the `frontend-design` skill for polished, production-grade UI

### Dashboard Design
- Dashboard is the landing page showing:
  - **Applications listed so far** — card or list of registered apps with quick stats
  - **Last run** — placeholder section for most recent test execution (empty state in Phase 2)
  - **Recent scripts** — placeholder section showing few recent generated scripts (empty state in Phase 2)
  - **"Meet Your Agents"** section — list of agents (Planner, Executor, Healer) with subtle animation, placeholder in Phase 2
  - **Useful metrics** — total apps registered, other stats as available
- Sections without data show well-designed empty/placeholder states

### Form Design
- Application registration: **Modal/dialog overlay** (not a separate page)
- Edit application: **Modal** (same pattern as create), pre-filled with existing data
- Fields: name, testUrl, testUsername, testPassword (current schema only, no new columns)
- Validation: **Inline errors below fields** — red text under each invalid field on submit
- Server-side validation with Zod, displayed via `useActionState`

### Application List
- Applications displayed on a dedicated `/applications` page
- List accessible from Dashboard quick-view and top nav
- Each app entry shows: name, URL, created date
- Actions per app: Edit (opens modal), Delete (confirmation dialog)

### Credential Handling
- Passwords **masked with reveal toggle** (eye icon) when viewing app details
- Username visible by default
- Edit form **pre-fills with decrypted values** — user only changes what they need
- No "Test Connection" button — credentials verified when agents run tests later
- Save directly without connection verification

### Delete Behavior
- Delete triggers a **confirmation dialog**: "Are you sure you want to delete [App Name]?"
- Cancel/Delete buttons in dialog
- On confirm: delete from DB, refresh list

### Claude's Discretion
- Loading skeleton/spinner design for dashboard and list
- Exact spacing, typography, and card styling
- Error state handling (network failures, server errors)
- Empty state illustrations and copy
- Dashboard metric card visual design
- Modal animation and transition effects
- Responsive behavior (mobile vs desktop)

</decisions>

<specifics>
## Specific Ideas

- Dashboard should feel like a command center — apps, recent activity, agents overview all visible at a glance
- "Meet Your Agents" section should have subtle animation even as a placeholder — makes the app feel alive
- The 3 nav sections (Dashboard, Manual Testing, Regression Testing) establish the app's identity from Phase 2 even though only Dashboard + Applications are functional
- Light theme with purple/blue accents differentiates from the green/teal LogAnalyzer tool
- Modals for create/edit keep the user in context — no page navigation for quick operations

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/encryption.ts`: AES-256-GCM encrypt/decrypt — use for credential storage on write and retrieval on read
- `lib/prisma.ts`: Prisma singleton with pg adapter — use for all DB operations
- `lib/__tests__/encryption.test.ts`: 10 passing tests — pattern for service layer testing
- `app/layout.tsx`: Root layout with Geist fonts — extend with top nav component
- `app/globals.css`: Tailwind CSS 4 imports — add custom theme colors here

### Established Patterns
- Prisma 7 with custom output to `generated/prisma/` — import from `../../generated/prisma/client`
- TypeScript strict mode with `@/*` path aliases
- Vitest for unit testing with describe/it/expect
- Environment variables via `.env` (DATABASE_URL, ENCRYPTION_KEY)
- ESLint 9 with Next.js core-web-vitals config

### Integration Points
- `app/layout.tsx` — Add top navigation component here
- `app/page.tsx` — Replace landing page with Dashboard
- Prisma `Application` model — Already migrated, ready for CRUD operations
- No existing components directory — Phase 2 establishes component patterns

</code_context>

<deferred>
## Deferred Ideas

### Future Phase: AI Agent Workflow (Phases 4-6 rework)
- **LangGraph + human-in-the-loop**: Human provides instruction in English → AI agent creates better prompt → human approves → testing agent executes in Chromium → agent can ask human when stuck → script passed to PR agent
- **Agent interaction window**: On-screen window for agents to communicate with human during execution
- **Playwright test agents**: Use Playwright's native Planner, Executor, and Healer agents (https://playwright.dev/docs/test-agents)
- **Three phases on screen**: Planning, Execution, and Healer — each with visual status
- **Agent status animations**: Blinking/glowing lights showing which agent is active — planner light blinks during planning, executor during execution, etc.
- **Save agent data in DB**: Plans created by agents, execution time, successful vs failed counts, healer details (which test cases were fixed)

### Future Phase: Manual Testing Tab (Phase 4-5)
- User provides instructions in English for testing a specific functionality
- Agent understands, creates better prompt, gets human approval, then executes

### Future Phase: Regression Testing Tab (Phase 4-5)
- User provides URL of screen for AI agent to do regression planning
- Agent uses same username/password from application onboarding (Phase 2 credentials)
- Planner → Executor → Healer workflow with visual status

### Future Phase: PR Creation (Phase 7)
- Agent creates PR via GitHub/ADO MCP with meaningful name and description details

</deferred>

---

*Phase: 02-application-management*
*Context gathered: 2026-03-08*
