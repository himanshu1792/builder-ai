# Roadmap: TestForge

## Overview

TestForge transforms plain-English test scenarios into ready-to-merge pull requests containing professional Playwright scripts. The roadmap progresses from project foundation through CRUD management of applications and repositories, into scenario authoring and AI-powered script generation, then async job processing, MCP-driven repository operations, and finally a programmatic API. Each phase delivers a complete, verifiable capability that builds toward the end-to-end pipeline: describe a test, get a PR.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Project Foundation** - Next.js scaffold, database schema, encryption module, and local dev environment
- [ ] **Phase 2: Application Management** - Register, view, edit, and delete applications with encrypted credentials
- [ ] **Phase 3: Repository Management** - Connect GitHub and Azure DevOps repos with tokens and output folder configuration
- [ ] **Phase 4: Scenario Authoring & History** - Write test scenarios in plain English and browse past generations
- [ ] **Phase 5: AI Pipeline** - Refine scenarios into structured prompts and generate Playwright scripts via OpenAI
- [ ] **Phase 6: Async Processing & Status** - Job queue for background generation with real-time status updates and error reporting
- [ ] **Phase 7: MCP Repository Operations** - Create branches, push scripts, and open pull requests via GitHub MCP and ADO MCP
- [ ] **Phase 8: Programmatic API** - REST endpoint for triggering test generation and polling job status externally

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
- [ ] PLAN-02 — Prisma 7 ORM setup, Application schema, and database migration
- [ ] PLAN-03 — AES-256-GCM encryption module (TDD)
- [ ] PLAN-04 — Application shell branding + final validation (TypeScript, ESLint, build)

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
- [ ] 02-01-PLAN.md -- Data layer: Application service module + Zod schema + Server Actions (TDD)
- [ ] 02-02-PLAN.md -- Navigation shell: TopNav component + purple/blue theme + layout
- [ ] 02-03-PLAN.md -- Application CRUD UI: list page + create/edit modal + delete dialog
- [ ] 02-04-PLAN.md -- Dashboard: stats, app overview, placeholders, Meet Your Agents

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
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: AI Pipeline
**Goal**: The system can transform a plain-English scenario into a professional, runnable Playwright test script through a two-stage AI process
**Depends on**: Phase 4
**Requirements**: AI-01, AI-02
**Success Criteria** (what must be TRUE):
  1. Given a plain-English scenario, the system produces a refined, structured testing prompt that expands vague instructions into explicit steps with assertions
  2. Given a refined prompt, the system generates a syntactically valid Playwright JavaScript test file that uses modern Playwright APIs (locators, expect assertions, proper waits)
  3. The generated script includes the target application's URL and uses credential variables (not hardcoded passwords) for authentication steps
  4. The refinement and generation stages are observable as separate steps, with the refined prompt and generated script both stored and viewable
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Async Processing & Status
**Goal**: Test generation runs asynchronously in the background with real-time progress visible to the user and clear error reporting on failure
**Depends on**: Phase 5
**Requirements**: AI-03, AI-04
**Success Criteria** (what must be TRUE):
  1. When a user submits a scenario, the UI returns immediately and shows the job as "queued" without blocking
  2. As the job progresses through pipeline stages (refining, generating), the user sees real-time status updates in the UI without manually refreshing
  3. When generation fails, the user sees an actionable error message indicating what went wrong (e.g., "OpenAI API rate limited -- try again in 60 seconds" or "Could not connect to application URL")
  4. Multiple jobs can be queued and process sequentially without interfering with each other
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: MCP Repository Operations
**Goal**: The system can automatically push generated scripts to the user's repository and create a pull request for review, using MCP servers for all repo interactions
**Depends on**: Phase 6
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04
**Success Criteria** (what must be TRUE):
  1. After script generation completes, a new branch is automatically created in the connected repository (GitHub or ADO) with a descriptive name
  2. The generated Playwright script file is pushed to the user-configured output folder on the new branch
  3. A pull request is created with a title and description that reference the original test scenario
  4. After the full pipeline completes, the user can see and click a direct link to the created pull request
  5. MCP server connections are properly cleaned up after each job (no zombie processes or leaked connections)
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Programmatic API
**Goal**: External tools and scripts can trigger test generation and check results without using the web UI
**Depends on**: Phase 7
**Requirements**: API-01, API-02, API-03
**Success Criteria** (what must be TRUE):
  1. A POST request to `/api/generate/:applicationId/:repoId` with a scenario in the request body triggers a test generation job
  2. The POST response returns immediately with a job ID and a URL for checking status
  3. A GET request to the status endpoint returns the current generation status, and includes the PR link when the job completes successfully
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 --> 2 --> 3 --> 4 --> 5 --> 6 --> 7 --> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Foundation | 4/4 | Complete | 2026-03-05 |
| 2. Application Management | 4/4 | Complete | 2026-03-08 |
| 3. Repository Management | 3/3 | Complete | 2026-03-09 |
| 4. Scenario Authoring & History | 0/2 | Not started | - |
| 5. AI Pipeline | 0/2 | Not started | - |
| 6. Async Processing & Status | 0/2 | Not started | - |
| 7. MCP Repository Operations | 0/2 | Not started | - |
| 8. Programmatic API | 0/1 | Not started | - |
