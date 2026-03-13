# Phase 5: Smoke Testing — Design Context & Implementation Record

**Captured:** 2026-03-11
**Implemented:** 2026-03-12
**Source:** User discussion session + direct coding (no formal plans)
**Status:** Complete (UI + pipeline architecture); AI integration pending

---

## Implementation Approach

Phase 5 was built directly without formal PLAN.md files — the user chose to skip planning/research and code immediately. The design context below served as the spec.

---

## Navigation Changes

**Old nav:** Dashboard | Applications | Scenarios | (Coming Soon: Smoke Testing, Regression Testing)
**New nav:** Dashboard | Applications | Smoke Testing | Run History | Regression Testing (Soon)

- Removed `/scenarios` from nav (route still exists for backwards compatibility)
- "Smoke Testing" is the primary test generation entry point
- "Regression Testing" shows "Soon" badge (Phase 6)
- "Run History" shows past runs date-ordered

---

## Smoke Testing Screen Layout

### Split Panel (top half of screen)

```
┌─────────────────────┬────────────────────────────────────┐
│   LEFT PANEL        │   RIGHT PANEL (Agent Chat)         │
│   (max 1/3 width)   │   (2/3 width)                      │
│                     │                                    │
│  Scenario textarea  │  Agent messages appear here        │
│  Application select │  Clarifying questions (text/btns)  │
│  Repository select  │  Prompt shown for approval         │
│  [Submit]           │  Live Chromium view during gen     │
│                     │  PR link after completion          │
└─────────────────────┴────────────────────────────────────┘
```

### Agent Pipeline Bar (below both panels)

```
[Analyst ✓] → [Prompt Builder ⟳] → [Script Generator] → [Reviewer] → [PR Creator]
```

States per agent: pending (gray) / active (blue, animated pulse) / complete (green checkmark) / failed (red X)

---

## Agent Pipeline — Decisions

### Agent 1: Analyst
- **Trigger:** User submits the form
- **Purpose:** Understands the scenario; identifies ambiguities
- **Output:** Zero or more clarifying questions in the right panel
- **Q&A format:** Agent decides per question — either a free-text input box OR 2–4 clickable choice buttons
- **Completion:** When no more questions, hands off to Prompt Builder automatically

### Agent 2: Prompt Builder
- **Trigger:** Analyst completes
- **Purpose:** Generates a structured testing prompt from scenario + analyst answers
- **Output:** Prompt text displayed with **Accept / Reject** buttons
- **Reject flow:** User must provide a reason (required); Prompt Builder regenerates; loop repeats until accepted
- **No limit** on rejection cycles

### Agent 3: Script Generator
- **Trigger:** User accepts the prompt
- **Purpose:** Generates a valid Playwright JavaScript test script
- **Chromium view:** Live embedded browser view (Phase 5.1 - not yet implemented)
- **Output:** Playwright `.spec.js` file

### Agent 4: Reviewer
- **Trigger:** Script Generator completes
- **Purpose:** Reruns the generated script to check for errors; fixes automatically
- **Behavior:** Fully automatic — no user interaction
- **Retry limit:** Auto-fix up to 3 times; shows thinking process and Chromium activity in agent chat
- **Output:** Final corrected script (or error after 3 failures)

### Agent 5: PR Creator
- **Trigger:** Reviewer marks script as passing
- **Purpose:** Creates branch, pushes script, opens PR
- **Output:** PR URL displayed in right panel and pipeline bar

---

## Tech Stack Decisions (Phase 5)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI framework | **Vercel AI SDK** (`ai` + `@ai-sdk/azure`) | Next.js native, provider-agnostic, streaming built-in, lightweight |
| NOT LangGraph | Rejected | Pipeline is linear with one loop — LangGraph adds heavyweight deps for a while loop |
| Real-time updates | **SSE** (Server-Sent Events) | Simple, HTTP-based, no WebSocket server needed |
| Human-in-the-loop | **In-memory pending interactions** | Promise-based: SSE stream pauses, `/respond` endpoint resolves |
| Agent architecture | **Pipeline orchestrator** + individual agent modules | Each agent is a function receiving `PipelineContext`, emitting SSE events |
| Azure OpenAI | Supported via `@ai-sdk/azure` | Drop-in provider swap, same API surface |
| Form component | **New SmokeTestForm** (not reusing ScenarioForm) | Different behavior: client-side validation, no redirect, triggers pipeline |
| Run History | **New pages** reusing StatusBadge | `/run-history` list + `/run-history/[id]` detail |

---

## Data Persistence

### What gets saved (per run)
| Field | Source | When set |
|-------|--------|----------|
| inputText | Left panel textarea | On submit |
| applicationId | Left panel dropdown | On submit |
| repositoryId | Left panel dropdown | On submit |
| status | System | queued → in_progress → completed / failed |
| currentAgent | System | Active agent name during pipeline run |
| refinedPrompt | Prompt Builder output | When user accepts the prompt |
| generatedScript | Script Generator output | After Reviewer approves |
| prUrl | PR Creator output | After PR is opened |
| errorMessage | Reviewer / PR Creator | On failure |

### DB model changes from Phase 4
- Added `prUrl String?` field to Scenario model
- Added `currentAgent String?` field to track active pipeline agent
- Migration: `20260311191047_add_pr_url_and_current_agent`

---

## Files Created in Phase 5

### New Pages & Components
- `app/smoke-testing/page.tsx` — server page, fetches apps + repos
- `app/smoke-testing/components/SmokeTestClient.tsx` — orchestrator client component
- `app/smoke-testing/components/SmokeTestForm.tsx` — left panel form (client-side validation)
- `app/smoke-testing/components/AgentChatPanel.tsx` — right panel streaming chat
- `app/smoke-testing/components/AgentPipelineBar.tsx` — linear 5-step progress bar
- `app/run-history/page.tsx` — run history list with empty state
- `app/run-history/[id]/page.tsx` — run detail server page
- `app/run-history/[id]/components/RunDetailClient.tsx` — run detail with PR link section

### API Routes
- `app/api/runs/route.ts` — POST: create scenario run, return ID
- `app/api/runs/[id]/stream/route.ts` — GET: SSE stream for pipeline events
- `app/api/runs/[id]/respond/route.ts` — POST: user answers/prompt approval

### Agent Pipeline
- `lib/agents/pipeline.ts` — orchestrator, SSE event types, pending interaction state
- `lib/agents/analyst.ts` — clarifying question logic (stub)
- `lib/agents/prompt-builder.ts` — prompt generation + approval loop (stub)
- `lib/agents/script-generator.ts` — Playwright script generation (stub)
- `lib/agents/reviewer.ts` — script validation + auto-fix (stub)
- `lib/agents/pr-creator.ts` — branch/push/PR creation (stub)

### Modified Files
- `prisma/schema.prisma` — added prUrl, currentAgent to Scenario
- `app/components/TopNav.tsx` — updated navigation items
- `lib/scenarios.ts` — added update/save/fail functions + AgentName type

---

## What This Phase Does NOT Include

- Regression Testing screen (Phase 6)
- Multiple concurrent runs (single run at a time per session for v1)
- Run deletion
- Re-running a completed run from history

---

## Pending (AI Integration)

The following needs to be wired up to make agents produce real output:
1. Install `ai` + `@ai-sdk/azure` packages
2. Replace analyst stub with real LLM calls (analyze scenario, generate questions)
3. Replace prompt-builder stub with real LLM calls (generate structured prompt)
4. Replace script-generator stub with Playwright MCP / browser automation
5. Replace reviewer stub with real Playwright execution + AI error analysis
6. Replace pr-creator stub with real GitHub/ADO API calls
7. Add live Chromium screenshot streaming for Script Generator + Reviewer
