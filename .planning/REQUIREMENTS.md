# Requirements: TestForge

**Defined:** 2026-03-01
**Core Value:** Users describe what to test in plain English and get a ready-to-merge PR with working Playwright scripts — no manual test code writing required.

## v1 Requirements

No authentication for v1. Single-user, runs locally.

### Application Management

- [x] **APP-01**: User can register an application with name, URL, username, and password for testing
- [x] **APP-02**: User can view list of registered applications
- [x] **APP-03**: User can edit application details (name, URL, credentials)
- [x] **APP-04**: User can delete an application
- [x] **APP-05**: Application credentials are stored encrypted at rest (AES-256)

### Repository Management

- [x] **REPO-01**: User can connect a GitHub repo by providing repo URL and Personal Access Token
- [x] **REPO-02**: User can connect an Azure DevOps repo by providing repo URL, PAT, and org name
- [x] **REPO-03**: User can configure output folder path for generated scripts per repo
- [x] **REPO-04**: User can view list of connected repos for an application
- [x] **REPO-05**: User can remove a connected repo

### Test Run History

> The /scenarios page is removed from nav. Run History replaces it as the last nav item,
> surfacing completed runs (input text, prompt, generated script, PR link) date-ordered.
> The underlying Scenario DB model is reused.

- [x] **SCEN-01**: User can write a test scenario in plain English via text input *(form reused inside Smoke Testing screen)*
- [x] **SCEN-02**: User can view list of past runs with generation status *(Run History nav item)*
- [x] **SCEN-03**: User can view details of a past run (original input, refined prompt, generated script, PR link) *(Run History detail)*

### Smoke Testing Screen

> Replaces old "AI Pipeline" + "Async Processing" + "MCP Repository Operations" phases.
> All AI and MCP work happens within a single integrated, human-in-the-loop screen.

**Layout:**
- [ ] **ST-01**: Smoke Testing screen has a left panel (max 1/3 width) for scenario input (text, application, repository) and a right panel (2/3 width) for agent interaction
- [ ] **ST-02**: A linear pipeline bar is shown below both panels indicating which agent is active: `Analyst → Prompt Builder → Script Generator → Reviewer → PR Creator`

**Human-in-the-Loop:**
- [ ] **ST-03**: Analyst agent processes the submitted scenario and can ask the user clarifying questions in the right panel; the agent chooses between free-text input or clickable choice buttons depending on the question
- [ ] **ST-04**: Prompt Builder agent creates a structured test prompt and presents it to the user for approval; user can accept or reject; if rejected, user must provide a reason; system regenerates the prompt incorporating the feedback
- [ ] **ST-05**: When the user accepts the prompt it is passed to the Script Generator agent; the right panel shows a live embedded Chromium browser view of what the agent is doing during script generation

**Automation:**
- [ ] **AI-01**: System refines plain-English scenario into a structured, professional testing prompt (Prompt Builder agent)
- [ ] **AI-02**: System generates a valid, runnable Playwright JavaScript test script from the approved prompt (Script Generator agent via MCP)
- [ ] **AI-03**: Agent pipeline status is visible in real time on the Smoke Testing screen — no polling, no page refresh
- [ ] **AI-04**: Reviewer agent automatically reruns the generated script, fixes errors, and shows the final corrected result to the user
- [ ] **OPS-01**: PR Creator agent creates a new branch in the connected repo via GitHub MCP or ADO MCP
- [ ] **OPS-02**: PR Creator agent pushes the generated script to the user-configured output folder on the new branch
- [ ] **OPS-03**: PR Creator agent opens a pull request with a descriptive title referencing the original scenario
- [ ] **OPS-04**: PR link is displayed on screen after the pipeline completes; the full run (input text, accepted prompt, generated script, PR link) is saved to the database

### Regression Testing Screen

> Uses Playwright's built-in AI agents (see https://playwright.dev/docs/test-agents).
> Three agents are always visible on the screen: Planner, Executor, Healer.

- [ ] **RT-01**: Regression Testing screen has a scenario input box; submitting triggers the Planner agent
- [ ] **RT-02**: Planner agent generates a plain-English step-by-step test plan; plan is saved in DB and presented to the user in a viewer for review before execution
- [ ] **RT-03**: On plan approval, Executor agent generates a Playwright test script
- [ ] **RT-04**: Healer agent monitors for script errors and automatically fixes them

### Programmatic API

- [ ] **API-01**: System exposes a POST endpoint (`/api/generate/:applicationId/:repoId`) to trigger test generation with scenario in payload
- [ ] **API-02**: API returns generation job ID immediately, with a status endpoint to poll for completion
- [ ] **API-03**: Status endpoint returns generation status and PR link when complete

---

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication & Multi-Tenancy

- **AUTH-01**: User can sign up with email and password
- **AUTH-02**: Multi-tenant organization isolation at database level
- **AUTH-03**: Team management — invite members, admin/member roles
- **AUTH-04**: User session persists across browser refresh

### Enhanced Features

- **ENH-01**: Generated script preview before push (review in-app before committing)
- **ENH-02**: Refined prompt transparency (show side-by-side: original vs refined)
- **ENH-03**: Scenario templates and examples for common test patterns
- **ENH-04**: Bulk scenario input (multiple scenarios from single input)
- **ENH-05**: Smart scenario validation (AI pre-check for testability)
- **ENH-06**: Webhook notifications on generation complete / PR created

### Growth

- **GRO-01**: Organization-scoped test knowledge (RAG — learn from past scripts)
- **GRO-02**: Advanced RBAC (fine-grained permissions beyond admin/member)
- **GRO-03**: Dashboard analytics and run history

## Out of Scope

| Feature | Reason |
|---------|--------|
| In-platform script editor | Users edit in their IDE; platform generates, repo owns the code |
| Test execution and reporting | v1 generates scripts only; users run in their own CI/CD |
| CI/CD pipeline integration | Users handle merge and pipeline triggers |
| Visual test recording | Contradicts natural language value proposition; produces brittle tests |
| Cross-browser test variants | Playwright handles this via config, not different script code |
| Mobile native app testing | Different toolchain entirely; web-only for v1 |
| Self-hosted deployment | SaaS-only; no self-hosted support |
| Custom AI model selection | Optimize prompts for one model |
| Cloud deployment (v1) | v1 runs locally on developer machine |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| APP-01 | Phase 2 | Complete |
| APP-02 | Phase 2 | Complete |
| APP-03 | Phase 2 | Complete |
| APP-04 | Phase 2 | Complete |
| APP-05 | Phase 1 | Complete |
| REPO-01 | Phase 3 | Complete |
| REPO-02 | Phase 3 | Complete |
| REPO-03 | Phase 3 | Complete |
| REPO-04 | Phase 3 | Complete |
| REPO-05 | Phase 3 | Complete |
| SCEN-01 | Phase 4 | Complete |
| SCEN-02 | Phase 4 | Complete |
| SCEN-03 | Phase 4 | Complete |
| ST-01 | Phase 5 | Pending |
| ST-02 | Phase 5 | Pending |
| ST-03 | Phase 5 | Pending |
| ST-04 | Phase 5 | Pending |
| ST-05 | Phase 5 | Pending |
| AI-01 | Phase 5 | Pending |
| AI-02 | Phase 5 | Pending |
| AI-03 | Phase 5 | Pending |
| AI-04 | Phase 5 | Pending |
| OPS-01 | Phase 5 | Pending |
| OPS-02 | Phase 5 | Pending |
| OPS-03 | Phase 5 | Pending |
| OPS-04 | Phase 5 | Pending |
| RT-01 | Phase 6 | Pending |
| RT-02 | Phase 6 | Pending |
| RT-03 | Phase 6 | Pending |
| RT-04 | Phase 6 | Pending |
| API-01 | Phase 7 | Pending |
| API-02 | Phase 7 | Pending |
| API-03 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-11 — restructured phases 5-7; added ST-*, RT-* requirements; removed standalone AI Pipeline / Async / MCP phases*
