# Phase 6: Regression Testing - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Users select an application, repository, and a URL within the application. The Planner agent opens a visible Chromium browser, explores the given URL (auto-logging in with stored credentials), and generates a markdown test plan. Users approve or reject the plan with feedback. On approval, the Generator creates a Playwright test script (headless), the Healer auto-fixes any failures (headless, max 3 retries), and a PR is silently created. The full run is saved and accessible in Run History.

</domain>

<decisions>
## Implementation Decisions

### Planner browser experience
- Planner uses Chromium in **headless:false** — user sees a live browser panel while the agent explores
- Browser panel layout matches Smoke Testing's separate browser panel approach
- Planner **narrates actions in real-time** in the chat panel while browsing (e.g., "Navigating to login page...", "Found checkout form, exploring fields...")
- Planner **auto-logs in** using the selected application's stored username/password if the app requires authentication
- After exploration completes, Planner generates the **full markdown test plan at once** (no incremental reveal)
- Planner does **not** ask clarifying questions — goes straight from exploration to plan generation

### Form inputs
- **Application selector** — provides login credentials and app context
- **Repository selector** — where generated test files will be pushed via PR
- **URL input** — specific page/screen URL within the selected application for the Planner to explore
- **No scenario text input** — the Planner autonomously discovers all testable scenarios on the given page

### Plan review interaction
- Approve/Reject with feedback buttons (same pattern as Phase 5 prompt approval)
- On rejection, user provides text feedback; Planner **regenerates from memory** without re-browsing
- **Unlimited revision rounds** — user can reject and revise as many times as needed
- Approved plan is **saved to the database** as a field on the Scenario model (like `refinedPrompt` in Smoke Testing)

### Generator and Healer flow
- Generator runs in **headless mode** — no visible browser
- Generator streams progress messages to chat panel
- Generator shows the **generated script as a code block** in chat
- Healer runs in **headless mode** — no visible browser
- Healer **auto-retries up to 3 times** (same as Phase 5 Reviewer)
- Healer shows fix attempts and final script in chat

### Pipeline bar and PR creation
- Pipeline bar shows **3 steps**: Planner → Generator → Healer
- PR Creator runs **silently** after Healer completes (not shown as a pipeline step)
- Reuses Phase 5's `git-providers.ts` and `pr-creator.ts` directly
- **PR link shown in chat** as a success message with clickable URL after creation

### Claude's Discretion
- Exact Planner prompt/system message for exploring the page
- How browser screenshots are captured and streamed to the frontend
- Generator's approach to converting markdown plan into Playwright test code
- Healer's error diagnosis and fix strategy
- Loading states and transition animations between pipeline steps

</decisions>

<specifics>
## Specific Ideas

- Playwright's official test agents pattern (Planner/Generator/Healer from playwright.dev/docs/test-agents) should guide the agent design
- Planner uses Playwright MCP tools (same `@playwright/mcp` + `@ai-sdk/mcp` from Phase 5) for browser exploration
- The "URL only" input model means the Planner must be smart enough to discover all testable interactions on the given page autonomously
- Plan format should be structured markdown: test scenario name, steps, expected outcomes — precise enough for the Generator to create actual test code

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AgentPipelineBar` (`app/smoke-testing/components/AgentPipelineBar.tsx`): Reuse with 3 steps instead of 5
- `AgentChatPanel` (`app/smoke-testing/components/AgentChatPanel.tsx`): Reuse for streaming messages, plan review approve/reject
- `SmokeTestForm` pattern (`app/smoke-testing/components/SmokeTestForm.tsx`): Adapt for app + repo + URL inputs
- `SmokeTestClient` (`app/smoke-testing/components/SmokeTestClient.tsx`): SSE connection pattern, state management
- `pipeline.ts` (`lib/agents/pipeline.ts`): Pipeline orchestrator, SSE events, PendingInteraction pattern
- `mcp-client.ts` (`lib/agents/mcp-client.ts`): Persistent Playwright MCP singleton
- `git-providers.ts` (`lib/agents/git-providers.ts`): GitHub + Azure DevOps REST API wrappers
- `pr-creator.ts` (`lib/agents/pr-creator.ts`): Branch/commit/PR creation logic
- `/api/runs/[id]/stream` and `/api/runs/[id]/respond`: SSE and interaction endpoints

### Established Patterns
- SSE streaming for real-time pipeline events
- Promise-based pending interactions for human-in-the-loop (question + approval)
- Vercel AI SDK `generateText()` with MCP tools for browser automation
- Agent functions receiving PipelineContext and emitting SSE events
- `globalThis` persistence for pending interactions across HMR

### Integration Points
- TopNav already has "Regression Testing" nav item (currently "coming soon")
- Scenario model needs `testPlan` field added (new Prisma migration)
- New page at `/regression-testing` with split-panel layout
- New API routes: `/api/regression-runs/` (or reuse `/api/runs/` with a type discriminator)
- Planner MCP client needs headless:false configuration (current singleton is headless)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-regression-testing*
*Context gathered: 2026-03-13*
