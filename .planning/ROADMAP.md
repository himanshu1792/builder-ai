# Roadmap: TestForge

## Overview

TestForge transforms plain-English test scenarios into ready-to-merge pull requests containing professional Playwright scripts. The roadmap builds from project foundation through application and repository management, then delivers two human-in-the-loop testing experiences (Smoke Testing and Regression Testing) and finally a programmatic API. Each phase delivers a complete, verifiable capability that builds toward the end-to-end pipeline: describe a test, watch AI agents generate it, get a PR.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Foundation** - Next.js scaffold, database schema, encryption module, and local dev environment
- [x] **Phase 2: Application Management** - Register, view, edit, and delete applications with encrypted credentials
- [x] **Phase 3: Repository Management** - Connect GitHub and Azure DevOps repos with tokens and output folder configuration
- [x] **Phase 4: Scenario Authoring & History** - Data layer and form components reused by Phase 5; Run History nav item
- [x] **Phase 5: Smoke Testing** - Human-in-the-loop agent pipeline UI, SSE streaming, agent stubs (AI integration pending)
- [ ] **Phase 6: Regression Testing** - Playwright built-in agents (Planner, Executor, Healer) with plan review before execution
- [ ] **Phase 7: Programmatic API** - REST endpoint for triggering test generation and polling job status externally

## Phase Details

### Phase 1: Project Foundation
**Goal**: The project has a working local development environment with database, schema, and a security foundation for credential storage
**Depends on**: Nothing (first phase)
**Requirements**: APP-05
**Success Criteria** (what must be TRUE):
  1. Developer can run `npm run dev` and see the Next.js application shell in the browser
  2. PostgreSQL database is running locally via Docker Compose and Prisma migrations apply cleanly
  3. The encryption module can encrypt a plaintext string and decrypt it back to the original value using AES-256-GCM
  4. Project TypeScript compiles with zero errors and linting passes
**Plans**: 4 plans

Plans:
- [x] PLAN-01 — Next.js 16 scaffold + local PostgreSQL + environment setup
- [x] PLAN-02 — Prisma 7 ORM setup, Application schema, and database migration
- [x] PLAN-03 — AES-256-GCM encryption module (TDD)
- [x] PLAN-04 — Application shell branding + final validation (TypeScript, ESLint, build)

### Phase 2: Application Management
**Goal**: Users can manage the applications they want to generate tests for, with credentials stored securely
**Depends on**: Phase 1
**Requirements**: APP-01, APP-02, APP-03, APP-04
**Success Criteria** (what must be TRUE):
  1. User can register an application by providing a name, URL, username, and password, and the application appears in their list
  2. User can view a list of all registered applications showing name and URL
  3. User can edit any application's name, URL, or credentials and see the changes reflected immediately
  4. User can delete an application and it no longer appears in the list
  5. Stored credentials are never visible as plaintext in the database (verified by direct DB query)
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md -- Data layer: Application service module + Zod schema + Server Actions (TDD)
- [x] 02-02-PLAN.md -- Navigation shell: TopNav component + purple/blue theme + layout
- [x] 02-03-PLAN.md -- Application CRUD UI: list page + create/edit modal + delete dialog
- [x] 02-04-PLAN.md -- Dashboard: stats, app overview, placeholders, Meet Your Agents

### Phase 3: Repository Management
**Goal**: Users can connect their GitHub and Azure DevOps repositories and configure where generated scripts should be placed
**Depends on**: Phase 2
**Requirements**: REPO-01, REPO-02, REPO-03, REPO-04, REPO-05
**Success Criteria** (what must be TRUE):
  1. User can connect a GitHub repository by providing a repo URL and Personal Access Token
  2. User can connect an Azure DevOps repository by providing a repo URL, PAT, and organization name
  3. User can set a custom output folder path for generated scripts on each connected repo
  4. User can view all connected repositories for a given application
  5. User can remove a connected repository and it no longer appears in the list
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md -- Repository data layer: Prisma model, service with PAT validation + URL parsing (TDD), Zod schema, server actions
- [x] 03-02-PLAN.md -- Application detail page with inline editing + ApplicationCard refactor to clickable link
- [x] 03-03-PLAN.md -- Repository connection modal (GitHub/ADO toggle), repo list display, inline output folder editing, delete dialog

### Phase 4: Scenario Authoring & History
**Goal**: Users can write test scenarios in plain English and review past generation attempts with their details
**Depends on**: Phase 3
**Requirements**: SCEN-01, SCEN-02, SCEN-03
**Success Criteria** (what must be TRUE):
  1. User can write a test scenario in a text input, select an application and repository, and submit it
  2. User can view a list of past scenarios showing the original input text and current generation status (queued, in progress, completed, failed)
  3. User can click into a past scenario and see full details: original input, refined prompt (once generated), generated script (once complete), and error details (if failed)
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md -- Scenario data layer: Prisma model (forward-compatible), service (TDD), Zod schema, server action with cross-entity validation
- [x] 04-02-PLAN.md -- Scenario UI: list page, authoring form with dependent app/repo dropdowns, detail page with multi-section layout, TopNav update

### Phase 5: Smoke Testing
**Goal**: Users submit a plain-English scenario, watch a human-in-the-loop AI agent pipeline generate a Playwright script and open a PR, with prompt approval at the midpoint
**Depends on**: Phase 4
**Requirements**: ST-01, ST-02, ST-03, ST-04, ST-05, AI-01, AI-02, AI-03, AI-04, OPS-01, OPS-02, OPS-03, OPS-04
**Success Criteria** (what must be TRUE):
  1. User fills in scenario text, application, and repository in the left panel and submits
  2. Analyst agent asks clarifying questions in the right panel; user responds via text or buttons
  3. Prompt Builder agent creates a structured prompt; user can accept or reject it with a reason; rejected prompts are regenerated
  4. Script Generator agent generates a Playwright script using MCP; live embedded Chromium browser activity is shown in the right panel
  5. Reviewer agent automatically reruns and fixes any script errors; the corrected result is shown
  6. PR Creator agent creates a branch, pushes the script, opens a PR; the PR link is visible on screen
  7. The full run (input, accepted prompt, script, PR link) is saved and accessible in Run History
  8. The linear pipeline bar (Analyst → Prompt Builder → Script Generator → Reviewer → PR Creator) shows which agent is active at all times
**Completed**: 2026-03-12 (UI + pipeline architecture; AI integration pending)

**What was built:**
- Smoke Testing split-panel page (`/smoke-testing`) with left form + right agent chat
- Agent Pipeline Bar with 5-step visual progress (pending/active/complete/failed states)
- Agent Chat Panel with streaming messages, Q&A input, prompt approval/rejection
- Run History pages (`/run-history` list + `/run-history/[id]` detail)
- SSE streaming API (`/api/runs/[id]/stream`) for real-time pipeline events
- User interaction API (`/api/runs/[id]/respond`) for answering questions and approving prompts
- Pipeline orchestrator (`lib/agents/pipeline.ts`) with in-memory interaction state
- 5 agent stubs (analyst, prompt-builder, script-generator, reviewer, pr-creator)
- DB migration: added `prUrl` and `currentAgent` fields to Scenario model
- Updated TopNav: removed Scenarios, added Smoke Testing + Run History + Regression Testing (coming soon)
- Extended scenarios service with `updateScenarioStatus`, `saveRefinedPrompt`, `saveGeneratedScript`, `savePrUrl`, `failScenario`

**Pending (AI integration):**
- Wire agents to Vercel AI SDK (`ai` + `@ai-sdk/azure`) for real LLM calls
- Playwright integration for Script Generator (live Chromium)
- Playwright execution in Reviewer for script validation + auto-fix
- Real GitHub/ADO API calls in PR Creator

### Phase 6: Regression Testing
**Goal**: Users submit a scenario, review a plain-English plan from the Planner agent, then watch Playwright's built-in Executor and Healer agents generate and stabilize the test script
**Depends on**: Phase 5
**Requirements**: RT-01, RT-02, RT-03, RT-04
**Success Criteria** (what must be TRUE):
  1. Regression Testing screen shows three agent cards (Planner, Executor, Healer) and a scenario input
  2. Planner generates a plain-English step-by-step plan, saves it to DB, and presents it for user review
  3. On approval, Executor generates a Playwright test script using Playwright's built-in agent
  4. Healer agent automatically detects and fixes script errors
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Programmatic API
**Goal**: External tools and scripts can trigger test generation and check results without using the web UI
**Depends on**: Phase 6
**Requirements**: API-01, API-02, API-03
**Success Criteria** (what must be TRUE):
  1. A POST request to `/api/generate/:applicationId/:repoId` with a scenario in the request body triggers a test generation job
  2. The POST response returns immediately with a job ID and a URL for checking status
  3. A GET request to the status endpoint returns the current generation status, and includes the PR link when the job completes successfully
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

## Requirements Coverage

### Phase 5: Smoke Testing — Requirements Breakdown

| Requirement | Description | Status |
|-------------|-------------|--------|
| **UI Architecture** | Split-panel layout, agent chat, pipeline bar | Done |
| **Analyst Agent** | LLM analyzes scenario, asks clarifying Qs (text or buttons) | Stub (needs AI SDK) |
| **Prompt Builder** | LLM generates structured prompt, user approves/rejects with reason | Stub (needs AI SDK) |
| **Script Generator** | LLM + Playwright generates .spec.js, shows live Chromium in chat | Stub (needs AI SDK + Playwright) |
| **Reviewer** | Runs script in Playwright, AI analyzes errors, auto-fixes up to 3x, shows thinking + Chromium | Stub (needs AI SDK + Playwright) |
| **PR Creator** | Creates branch, pushes script, opens PR via GitHub/ADO API | Stub (needs real API calls) |
| **Run History** | List + detail pages showing all past runs with PR links | Done |
| **SSE Streaming** | Real-time pipeline events from server to client | Done |
| **Human-in-the-loop** | Q&A interaction + prompt approval/rejection loop | Done (architecture) |
| **DB Persistence** | prUrl, currentAgent, status tracking throughout pipeline | Done |
| **AI Framework** | Vercel AI SDK (`ai` + `@ai-sdk/azure`) | Decided, not installed |

### Phase 5 AI Integration — What's Needed

These items complete Phase 5's full functionality:

1. **Install packages:** `ai`, `@ai-sdk/azure`, `playwright`
2. **Analyst:** Replace stub with `generateText()` call to analyze scenario and produce questions
3. **Prompt Builder:** Replace stub with `generateText()` to build structured prompt from scenario + Q&A
4. **Script Generator:** Use Playwright MCP or direct Playwright API + AI to navigate app and generate script; stream Chromium screenshots to agent chat panel
5. **Reviewer:** Run generated script via Playwright, capture errors, use AI to diagnose and fix; show thinking process ("Found error on line X... fixing selector...") and Chromium activity in agent chat
6. **PR Creator:** Use GitHub REST API (Octokit) or ADO REST API to create branch, commit file, open PR
7. **Environment:** Need `AZURE_OPENAI_RESOURCE_NAME`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT` in `.env`

### Phase 6: Regression Testing — Requirements

| Requirement | Description | Covered By |
|-------------|-------------|------------|
| Regression Testing screen | Split-panel with 3-agent pipeline (Planner, Executor, Healer) | Phase 6 UI |
| Planner agent | LLM generates plain-English step-by-step plan, user reviews | Phase 6 |
| Executor agent | Playwright built-in agent generates script from approved plan | Phase 6 |
| Healer agent | Detects + auto-fixes script errors, shows Chromium | Phase 6 |
| Reuses Phase 5 components | AgentPipelineBar (3 steps), AgentChatPanel, SSE, StatusBadge | Phase 5 (done) |

### Phase 7: Programmatic API — Requirements

| Requirement | Description | Covered By |
|-------------|-------------|------------|
| POST trigger | `/api/generate/:appId/:repoId` starts test generation job | Phase 7 |
| Job ID response | Immediate response with job ID + status URL | Phase 7 |
| Status polling | GET endpoint returns status + PR link on completion | Phase 7 |

## Progress

**Execution Order:**
Phases execute in numeric order: 1 --> 2 --> 3 --> 4 --> 5 --> 6 --> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Foundation | 4/4 | Complete | 2026-03-05 |
| 2. Application Management | 4/4 | Complete | 2026-03-08 |
| 3. Repository Management | 3/3 | Complete | 2026-03-09 |
| 4. Scenario Authoring & History | 2/2 | Complete | 2026-03-11 |
| 5. Smoke Testing | N/A (direct) | Complete (UI+arch) | 2026-03-12 |
| 6. Regression Testing | 0/2 | Not started | - |
| 7. Programmatic API | 0/1 | Not started | - |
