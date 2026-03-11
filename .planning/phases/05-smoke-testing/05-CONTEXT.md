# Phase 5: Smoke Testing — Design Context

**Captured:** 2026-03-11
**Source:** User discussion session
**Status:** Ready for research and planning

---

## Navigation Changes

**Old nav:** Dashboard | Applications | Scenarios | (Coming Soon: Smoke Testing, Regression Testing)
**New nav:** Dashboard | Applications | Smoke Testing | Regression Testing | Run History

- Remove `/scenarios` route and nav link entirely
- "Smoke Testing" becomes the primary test generation entry point
- "Regression Testing" is a separate screen (Phase 6)
- "Run History" is the last nav item — shows past runs date-ordered (replaces old /scenarios list)
- The existing Scenario DB model and form components are **reused** — not deleted

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

- Left panel reuses `ScenarioForm` component from Phase 4 (textarea + app + repo dropdowns)
- Right panel is a new streaming chat/activity component — alternates between agent messages, Q&A, prompt display, browser view, and PR link
- After submission, the left panel form becomes read-only (inputs disabled) until the run completes or fails

### Agent Pipeline Bar (below both panels)

```
[Analyst ✓] → [Prompt Builder ⟳] → [Script Generator] → [Reviewer] → [PR Creator]
```

- Linear horizontal step bar
- States per agent: pending (gray) / active (blue, animated) / complete (green checkmark) / failed (red)
- Always visible below the split panel
- On completion: PR link displayed prominently beneath or within the pipeline bar

---

## Agent Pipeline — Decisions

### Agent 1: Analyst
- **Trigger:** User submits the form
- **Purpose:** Understands the scenario; identifies ambiguities
- **Output:** Zero or more clarifying questions in the right panel
- **Q&A format:** Agent decides per question — either a free-text input box OR 2–4 clickable choice buttons
- **User response:** Typed answer or button click; multiple questions handled sequentially
- **Completion:** When no more questions, hands off to Prompt Builder automatically

### Agent 2: Prompt Builder
- **Trigger:** Analyst completes
- **Purpose:** Generates a structured, professional testing prompt from the scenario + analyst answers
- **Output:** Prompt text displayed in right panel with **Accept / Reject** buttons
- **Accept flow:** Prompt locked in, pipeline continues to Script Generator
- **Reject flow:** User must provide a reason (required text field, cannot submit empty); Prompt Builder regenerates incorporating the reason; loop repeats until accepted
- **No limit** on rejection cycles — user can reject as many times as needed

### Agent 3: Script Generator
- **Trigger:** User accepts the prompt
- **Purpose:** Generates a valid Playwright JavaScript test script using MCP
- **Chromium view:** Live embedded browser view shown in the right panel — iframe or screenshot stream of what the agent is doing in Chromium
- **Output:** Playwright `.spec.js` file targeting the selected application and repository's output folder

### Agent 4: Reviewer
- **Trigger:** Script Generator completes
- **Purpose:** Reruns the generated script to check for errors; fixes automatically
- **Behavior:** Fully automatic — no user interaction required
- **Retry limit:** Auto-fix up to 3 times; if still failing after 3 attempts, show error in right panel and surface a "Try Again" option
- **Output:** Final corrected script (or error report after 3 failures)

### Agent 5: PR Creator
- **Trigger:** Reviewer marks script as passing
- **Purpose:** Creates branch, pushes script to configured output folder, opens PR
- **Behavior:** Fully automatic — uses GitHub MCP or ADO MCP based on repository provider
- **Output:** PR URL displayed in right panel and in the pipeline bar
- **Completion:** PR link stored in DB; run status set to "completed"

---

## Data Persistence

### What gets saved (per run)
| Field | Source | When set |
|-------|--------|----------|
| inputText | Left panel textarea | On submit |
| applicationId | Left panel dropdown | On submit |
| repositoryId | Left panel dropdown | On submit |
| status | System | Updated as pipeline progresses: queued → in_progress → completed / failed |
| refinedPrompt | Prompt Builder output | When user accepts the prompt |
| generatedScript | Script Generator output | After Reviewer approves |
| prUrl | PR Creator output | After PR is opened |
| errorMessage | Reviewer / PR Creator | On failure |

### DB model changes from Phase 4
- Add `prUrl String?` field to the Scenario model (was not included in Phase 4)
- Rename concept from "Scenario" to "TestRun" in UI labels only — DB model stays as `Scenario` to avoid migration complexity

---

## Run History Page

- Route: `/run-history` (or reuse `/scenarios` route with updated UI)
- Nav label: "Run History"
- Layout: Date-ordered list of past runs (most recent first)
- Each row shows: truncated input text, application name, status badge, PR link (if completed), timestamp
- Click-through to run detail showing all sections: input, prompt, script (code block), PR link, error (if failed)
- This is a **read-only** page — no new run can be started from here
- Reuses `ScenarioList`, `ScenarioDetailClient`, and `StatusBadge` components from Phase 4

---

## Right Panel — Component Behaviour

The right panel is a single scrollable component that streams different content types as the pipeline progresses:

| Stage | Content type | UI element |
|-------|-------------|------------|
| Analyst asking | Agent message + question | Chat bubble + text input OR button group |
| User answering | User reply shown | Chat bubble (right-aligned) |
| Prompt Builder output | Prompt text | Card with Accept / Reject buttons |
| Reject reason | Required text input | Inline form in card |
| Script Generator active | Live Chromium | Embedded browser iframe / screenshot stream |
| Reviewer running | Status message | Animated text: "Re-running script... fixing errors..." |
| PR Creator running | Status message | "Creating branch... pushing script... opening PR..." |
| Complete | PR link | Highlighted link card with "View Pull Request →" button |
| Failed | Error details | Red error card with "Try Again" option |

Content appends — earlier messages stay visible (scrollable history).

---

## What This Phase Does NOT Include

- Regression Testing screen (Phase 6)
- Real-time streaming via WebSockets (use polling or SSE for agent status — keep it simple)
- Multiple concurrent runs (single run at a time per session for v1)
- Run deletion
- Re-running a completed run from history (out of scope v1)

---

## Deferred Ideas (captured, not planned)

- "Generate Test" shortcut button on Application detail page linking to Smoke Testing with app pre-selected
- Dashboard stat card showing total runs and last run date (minor enhancement, can do in any phase)
- Email/webhook notification when PR is created

---

## Code Context

### Reusable from Phase 4
| Component/File | Where to reuse |
|---------------|----------------|
| `app/scenarios/components/ScenarioForm.tsx` | Left panel of Smoke Testing screen |
| `app/scenarios/components/StatusBadge.tsx` | Pipeline bar agent states + Run History |
| `app/scenarios/components/ScenarioList.tsx` | Run History list page |
| `app/scenarios/[id]/components/ScenarioDetailClient.tsx` | Run History detail page |
| `lib/scenarios.ts` (service) | Extended with prUrl field + status update functions |
| `lib/actions/scenarios.ts` | Extended with updateScenarioStatus, saveRunResult actions |
| Prisma `Scenario` model | Add `prUrl String?` in migration |

### New to build in Phase 5
- `app/smoke-testing/page.tsx` — main split-panel screen
- `app/smoke-testing/components/AgentChatPanel.tsx` — right panel streaming component
- `app/smoke-testing/components/AgentPipelineBar.tsx` — linear agent status bar
- `app/run-history/page.tsx` — run history list (reuses ScenarioList)
- `app/run-history/[id]/page.tsx` — run detail (reuses ScenarioDetailClient)
- `lib/agents/` — agent orchestration logic (analyst, prompt-builder, script-generator, reviewer, pr-creator)
- MCP integration for GitHub / ADO PR creation
