# Requirements: TestForge

**Defined:** 2026-03-01
**Core Value:** Users describe what to test in plain English and get a ready-to-merge PR with working Playwright scripts — no manual test code writing required.

## v1 Requirements

No authentication for v1. Single-user, runs locally.

### Application Management

- [ ] **APP-01**: User can register an application with name, URL, username, and password for testing
- [ ] **APP-02**: User can view list of registered applications
- [ ] **APP-03**: User can edit application details (name, URL, credentials)
- [ ] **APP-04**: User can delete an application
- [ ] **APP-05**: Application credentials are stored encrypted at rest (AES-256)

### Repository Management

- [ ] **REPO-01**: User can connect a GitHub repo by providing repo URL and Personal Access Token
- [ ] **REPO-02**: User can connect an Azure DevOps repo by providing repo URL, PAT, and org name
- [ ] **REPO-03**: User can configure output folder path for generated scripts per repo
- [ ] **REPO-04**: User can view list of connected repos for an application
- [ ] **REPO-05**: User can remove a connected repo

### Test Scenarios

- [ ] **SCEN-01**: User can write a test scenario in plain English via text input
- [ ] **SCEN-02**: User can view list of past scenarios with generation status (queued, in progress, completed, failed)
- [ ] **SCEN-03**: User can view details of a past scenario (original input, refined prompt, generated script, error details)

### AI Pipeline

- [ ] **AI-01**: System refines plain-English scenario into a structured, professional testing prompt using OpenAI GPT
- [ ] **AI-02**: System generates a valid, runnable Playwright JavaScript test script from the refined prompt
- [ ] **AI-03**: Generation runs asynchronously via job queue — user sees real-time status updates
- [ ] **AI-04**: Failed generations show actionable error messages

### Repository Operations (MCP)

- [ ] **OPS-01**: System creates a new branch in the connected repo via GitHub MCP or ADO MCP
- [ ] **OPS-02**: System pushes generated script to the user-configured output folder on the new branch
- [ ] **OPS-03**: System creates a pull request with descriptive title and scenario context
- [ ] **OPS-04**: User can see the PR link after successful generation

### API

- [ ] **API-01**: System exposes a POST endpoint (`/api/generate/:applicationId/:repoId`) to trigger test generation with scenario in payload
- [ ] **API-02**: API returns generation job ID immediately, with a status endpoint to poll for completion
- [ ] **API-03**: Status endpoint returns generation status and PR link when complete

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
| AI chat interface | Structured input beats open-ended chat for test scenario writing |
| Mobile native app testing | Different toolchain entirely; web-only for v1 |
| Self-hosted deployment | SaaS-only; no self-hosted support |
| Custom AI model selection | Optimize prompts for one model (OpenAI GPT) |
| Cloud deployment (v1) | v1 runs locally on developer machine |

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| APP-01 | — | Pending |
| APP-02 | — | Pending |
| APP-03 | — | Pending |
| APP-04 | — | Pending |
| APP-05 | — | Pending |
| REPO-01 | — | Pending |
| REPO-02 | — | Pending |
| REPO-03 | — | Pending |
| REPO-04 | — | Pending |
| REPO-05 | — | Pending |
| SCEN-01 | — | Pending |
| SCEN-02 | — | Pending |
| SCEN-03 | — | Pending |
| AI-01 | — | Pending |
| AI-02 | — | Pending |
| AI-03 | — | Pending |
| AI-04 | — | Pending |
| OPS-01 | — | Pending |
| OPS-02 | — | Pending |
| OPS-03 | — | Pending |
| OPS-04 | — | Pending |
| API-01 | — | Pending |
| API-02 | — | Pending |
| API-03 | — | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 0
- Unmapped: 24 ⚠️ (awaiting roadmap)

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after initial definition*
