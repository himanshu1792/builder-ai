# Architecture Patterns

**Domain:** AI-powered test generation platform (SaaS)
**Project:** TestForge
**Researched:** 2026-03-01
**Confidence:** MEDIUM (training data only; no live verification of MCP server APIs available)

## Recommended Architecture

TestForge is a **layered monolith deployed as a Next.js application** with a distinct **background agent subsystem** for long-running test generation work. The key insight is that the web application handles CRUD and user interaction, while a separate worker process handles the computationally expensive and time-consuming AI + browser automation + repo push pipeline.

```
+-------------------------------------------------------------------+
|                        CLIENT (Browser)                           |
|  Next.js App Router (React RSC + Client Components)              |
|  - Dashboard, App Management, Scenario Editor, Job Status        |
+-------------------------------------------------------------------+
        |                    |                       |
        | SSR / RSC          | API Routes            | WebSocket / SSE
        v                    v                       v
+-------------------------------------------------------------------+
|                    NEXT.JS SERVER                                 |
|                                                                   |
|  +------------------+  +------------------+  +-----------------+ |
|  | App Router Pages |  | API Route        |  | Event Stream    | |
|  | (Server Comps)   |  | Handlers         |  | Endpoint        | |
|  +------------------+  +------------------+  +-----------------+ |
|           |                    |                      ^           |
|           v                    v                      |           |
|  +---------------------------------------------------+--------+ |
|  |              SERVICE LAYER (Business Logic)        |        | |
|  |  AuthService | OrgService | AppService | ScenarioService   | |
|  |  JobService  | RepoService                                 | |
|  +------------------------------------------------------------+ |
|           |                    |                                  |
|           v                    v                                  |
|  +------------------+  +------------------+                      |
|  | Data Access       |  | Job Queue        |                     |
|  | (Prisma / Drizzle)|  | (BullMQ / pg-boss)|                    |
|  +------------------+  +------------------+                      |
+-----------|----------------------|--------------------------------+
            v                      v
   +----------------+    +-------------------+
   |  PostgreSQL    |    |  WORKER PROCESS   |
   |  - tenants     |    |  (Testing Agent)  |
   |  - apps        |    |                   |
   |  - scenarios   |    |  +-------------+  |
   |  - jobs        |    |  | AI Pipeline |  |
   |  - credentials |    |  | (OpenAI)    |  |
   |  - repos       |    |  +------+------+  |
   +----------------+    |         |          |
                         |  +------v------+   |
                         |  | Playwright  |   |
                         |  | MCP Client  |   |
                         |  +------+------+   |
                         |         |          |
                         |  +------v------+   |
                         |  | Repo MCP    |   |
                         |  | Client      |   |
                         |  | (GH / ADO)  |   |
                         |  +-------------+   |
                         +-------------------+
```

### Why This Shape

1. **Next.js monolith for the web tier** -- keeps frontend and API in one deployable unit. For a v1 SaaS, this avoids premature microservice complexity. Next.js App Router gives server components for fast page loads and API routes for the programmatic trigger endpoint.

2. **Separate worker process for the testing agent** -- test generation involves multiple minutes of work (AI calls, browser automation, repo operations). This MUST NOT run inside the Next.js request/response cycle. A background worker picks jobs off a queue, runs the pipeline, and updates job status in the database. The web tier polls or subscribes to status changes.

3. **Job queue as the boundary** -- the queue (BullMQ with Redis, or pg-boss with PostgreSQL) decouples the web app from the agent. The web app enqueues a job and returns immediately. The worker dequeues and processes. This is the single most important architectural boundary in the system.

## Component Boundaries

| Component | Responsibility | Communicates With | Deployment |
|-----------|---------------|-------------------|------------|
| **Web UI** | Dashboard, scenario input, job monitoring, settings | Next.js API routes via fetch / server actions | Browser |
| **API Layer** | Auth, CRUD, job submission, status queries, external API trigger | Service Layer, Job Queue | Next.js server |
| **Service Layer** | Business logic, validation, tenant isolation enforcement | Data Access, Job Queue | Next.js server |
| **Data Access** | ORM queries, migrations, connection pooling | PostgreSQL | Next.js server + Worker |
| **Job Queue** | Decouple web from worker, job persistence, retry logic | PostgreSQL (pg-boss) or Redis (BullMQ) | Shared infra |
| **Testing Agent (Worker)** | Orchestrate the full pipeline: refine scenario, generate script, validate, push, create PR | AI Pipeline, Playwright MCP, Repo MCP, Data Access | Separate process |
| **AI Pipeline** | Scenario refinement (GPT), script generation (GPT), script validation | OpenAI API | Inside Worker |
| **Playwright MCP Client** | Browser automation for script validation / context gathering | Playwright MCP Server (subprocess) | Inside Worker |
| **Repo MCP Client** | Push files, create branches, open PRs | GitHub MCP / ADO MCP Server (subprocess) | Inside Worker |

### Component Boundary Rules

1. **Web tier never talks to MCP servers directly.** All MCP communication goes through the worker. This prevents long-running connections from blocking web requests.
2. **Worker never serves HTTP.** It only reads from the queue and writes to the database.
3. **Tenant context propagates via job payload.** When the web tier enqueues a job, it includes `orgId`, `appId`, `repoId`. The worker uses these to load credentials and enforce isolation.
4. **Credentials are read from the database by the worker at execution time.** Never stored in the queue payload (security).

## Data Flow

### Primary Flow: Scenario to Pull Request

```
User writes scenario in UI
        |
        v
[1] API Route receives scenario text + appId + repoId
        |
        v
[2] Service Layer validates:
    - User belongs to org that owns the app
    - App and repo exist and are configured
    - Scenario text is non-empty
        |
        v
[3] JobService creates job record in PostgreSQL (status: QUEUED)
    Enqueues job to queue with: { jobId, orgId, appId, repoId, scenarioText }
        |
        v
[4] API returns jobId to client (HTTP 202 Accepted)
    Client begins polling / subscribes to status updates
        |
        v
[5] Worker dequeues job
    Loads full context from DB: app URL, test credentials, repo connection details
        |
        v
[6] AI PIPELINE - Phase 1: Scenario Refinement
    - Send raw scenario text to OpenAI GPT
    - System prompt instructs: convert plain English to structured test steps
    - Output: refined scenario with explicit steps, assertions, edge cases
    - Update job status: REFINING -> REFINED
        |
        v
[7] AI PIPELINE - Phase 2: Script Generation
    - Send refined scenario + app context to OpenAI GPT
    - System prompt includes: Playwright conventions, assertion patterns,
      app URL, credential handling template
    - Output: complete Playwright test script (.spec.js)
    - Update job status: GENERATING -> GENERATED
        |
        v
[8] VALIDATION (optional, recommended for v2+)
    - Playwright MCP: launch browser, attempt to run generated script
    - Capture errors, feed back to GPT for self-correction
    - Update job status: VALIDATING -> VALIDATED
        |
        v
[9] REPO OPERATIONS via MCP
    a. GitHub/ADO MCP: create branch (e.g., testforge/scenario-{id})
    b. GitHub/ADO MCP: commit script file to user-defined output folder
    c. GitHub/ADO MCP: create pull request with description
    - Update job status: PUSHING -> COMPLETE
        |
        v
[10] Worker updates job record with:
     - PR URL
     - Generated script content (for display in UI)
     - Final status: COMPLETE or FAILED (with error details)
        |
        v
[11] Client sees updated status, displays PR link
```

### Secondary Flow: API Trigger

```
External system POSTs to /api/v1/apps/{appId}/repos/{repoId}/generate
    Body: { scenario: "..." }
    Auth: API key in header
        |
        v
Same flow as steps [2]-[11] above
Response: { jobId, statusUrl }
```

### Data Flow: Status Updates (Real-time)

```
Option A: Polling (simpler, recommended for v1)
  Client polls GET /api/jobs/{jobId} every 3-5 seconds
  Returns: { status, progress, prUrl?, error? }

Option B: Server-Sent Events (better UX, moderate complexity)
  Client connects to GET /api/jobs/{jobId}/stream
  Server pushes status changes as SSE events
  Worker writes status to DB; SSE endpoint polls DB or listens to pg NOTIFY
```

### Data Model (Core Entities)

```
Organization
  |-- has many Users (via membership)
  |-- has many Applications
  |-- has many RepositoryConnections

Application
  |-- belongs to Organization
  |-- has: name, testUrl, testUsername, testPassword (encrypted)
  |-- has many Scenarios

RepositoryConnection
  |-- belongs to Organization
  |-- has: provider (github|ado), repoUrl, authToken (encrypted), outputFolder

Scenario
  |-- belongs to Application
  |-- has: rawText, refinedText, createdBy (User)
  |-- has many Jobs

Job
  |-- belongs to Scenario
  |-- references: Application, RepositoryConnection
  |-- has: status, generatedScript, prUrl, error, timestamps
  |-- status enum: QUEUED | REFINING | REFINED | GENERATING | GENERATED
  |                 | VALIDATING | VALIDATED | PUSHING | COMPLETE | FAILED
```

## Patterns to Follow

### Pattern 1: Queue-Driven Agent Pipeline

**What:** All test generation work flows through a persistent job queue. The web tier enqueues; the worker dequeues and processes.

**When:** Always. Every generation request, whether from UI or API, goes through the queue.

**Why:** Test generation takes 30 seconds to several minutes. HTTP requests cannot stay open that long. The queue provides persistence (jobs survive server restarts), retry logic (if OpenAI rate-limits or MCP crashes), and observability (job status tracking).

**Implementation:**
```typescript
// Web tier: enqueue
import PgBoss from 'pg-boss';

const boss = new PgBoss(DATABASE_URL);

async function submitJob(orgId: string, appId: string, repoId: string, scenario: string) {
  const job = await db.job.create({
    data: { orgId, appId, repoId, scenarioText: scenario, status: 'QUEUED' }
  });

  await boss.send('test-generation', {
    jobId: job.id,
    orgId,
    appId,
    repoId
    // NOTE: scenario text read from DB, not passed in queue payload
  });

  return job.id;
}

// Worker: process
boss.work('test-generation', async (job) => {
  const { jobId, orgId, appId, repoId } = job.data;

  // Load full context from DB (credentials, scenario text, repo config)
  const context = await loadJobContext(jobId);

  // Run pipeline stages
  await refineScenario(context);
  await generateScript(context);
  await pushToRepo(context);
});
```

### Pattern 2: Tenant Isolation via Row-Level Scoping

**What:** Every database query includes `orgId` in its WHERE clause. No query ever returns data from another organization.

**When:** Every database access, without exception.

**Why:** Multi-tenant from v1. A single missed scope is a data breach. This is simpler than Postgres Row-Level Security (RLS) for a v1, and easier to test.

**Implementation:**
```typescript
// Service layer pattern: always scope by org
async function getApplications(orgId: string) {
  return db.application.findMany({
    where: { orgId }  // ALWAYS present
  });
}

// Middleware: extract orgId from auth context, attach to request
function tenantMiddleware(req, res, next) {
  const orgId = req.auth.orgId;
  if (!orgId) throw new UnauthorizedError();
  req.orgId = orgId;
  next();
}
```

### Pattern 3: MCP Client as Subprocess Manager

**What:** The worker spawns MCP servers (Playwright, GitHub, ADO) as child processes and communicates with them over stdio using the MCP protocol.

**When:** During the execution of a test generation job.

**Why:** MCP servers are designed to run as subprocesses. The worker is the MCP client. Each job gets its own MCP server instances, providing isolation between concurrent jobs.

**Implementation:**
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function runWithPlaywrightMCP(callback: (client: Client) => Promise<void>) {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['@playwright/mcp@latest']
  });

  const client = new Client({ name: 'testforge-worker', version: '1.0.0' });
  await client.connect(transport);

  try {
    await callback(client);
  } finally {
    await client.close();
  }
}
```

### Pattern 4: Staged Pipeline with Checkpointing

**What:** The generation pipeline runs in discrete stages. Each stage updates the job status in the database. If a stage fails, the job can be retried from the last successful stage.

**When:** During worker job execution.

**Why:** The pipeline involves external services (OpenAI, MCP servers) that can fail independently. Checkpointing prevents re-doing expensive work. Users see granular progress.

```typescript
async function executeJob(jobId: string) {
  const job = await loadJob(jobId);

  // Resume from last checkpoint
  if (job.status === 'QUEUED' || job.status === 'REFINING') {
    await updateStatus(jobId, 'REFINING');
    const refined = await refineWithGPT(job.scenarioText);
    await saveRefinedScenario(jobId, refined);
    await updateStatus(jobId, 'REFINED');
  }

  if (job.status === 'REFINED' || job.status === 'GENERATING') {
    await updateStatus(jobId, 'GENERATING');
    const script = await generateWithGPT(job.refinedText, job.appContext);
    await saveGeneratedScript(jobId, script);
    await updateStatus(jobId, 'GENERATED');
  }

  // ... continue for push and PR creation
}
```

### Pattern 5: Encrypted Credential Storage

**What:** Test credentials (app username/password) and repo auth tokens are encrypted at rest in PostgreSQL using application-level encryption.

**When:** Before writing any credential to the database, and after reading.

**Why:** These credentials provide access to customer applications and repositories. A database breach must not expose plaintext credentials.

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY; // 32 bytes

function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(encHex, 'hex', 'utf8') + decipher.final('utf8');
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Running Agent Work in API Routes

**What:** Executing the full generation pipeline (AI calls + browser automation + repo push) inside a Next.js API route handler.

**Why bad:** The pipeline takes 1-5+ minutes. HTTP connections will time out. Serverless deployments (Vercel) have hard function execution limits (10-60s). Even on a long-running server, holding connections open blocks the event loop and prevents scaling. If the server restarts mid-pipeline, all work is lost.

**Instead:** Enqueue a job and return immediately with a job ID. Process asynchronously in a worker.

### Anti-Pattern 2: Passing Credentials in Queue Payloads

**What:** Including app passwords or repo auth tokens directly in the job queue message.

**Why bad:** Queue backends (Redis, database tables) may have weaker access controls than the encrypted credential store. Queue messages may be logged, visible in admin UIs, or persisted in unexpected ways.

**Instead:** Pass only IDs (orgId, appId, repoId) in the queue payload. The worker loads credentials from the encrypted database columns at execution time.

### Anti-Pattern 3: Shared MCP Server Instances Across Jobs

**What:** Running a single Playwright MCP server instance and multiplexing multiple concurrent jobs through it.

**Why bad:** Browser state leaks between jobs. One job's failure or hang affects all others. MCP servers are not designed for concurrent multi-session use through a single connection.

**Instead:** Spawn a fresh MCP server subprocess per job. The overhead is minimal (process startup < 1s) compared to the job duration (minutes).

### Anti-Pattern 4: Monolithic Prompt for Script Generation

**What:** Sending one massive prompt to GPT with the raw scenario, all context, and expecting a perfect script back.

**Why bad:** LLMs produce better output with staged reasoning. A single prompt conflates scenario understanding, test structure, selector strategy, and assertion logic. Errors are hard to attribute and fix.

**Instead:** Use the staged pipeline: (1) refine scenario into structured steps, (2) generate script from structured steps. Each stage has a focused system prompt and clear input/output contract.

### Anti-Pattern 5: Tenant Isolation via Application Logic Only

**What:** Relying solely on application-layer WHERE clauses for multi-tenant isolation without any additional safeguards.

**Why bad for the long term:** A single missed scope check leaks cross-tenant data. As the codebase grows, the risk of a missed check grows.

**Acceptable for v1:** Row-scoping with strong service-layer conventions and tests is fine for launch. Plan to add PostgreSQL Row-Level Security (RLS) in a future phase when the data model stabilizes.

## MCP Integration Architecture

This is the most distinctive architectural element of TestForge. The worker acts as an MCP client that connects to multiple MCP servers.

### MCP Server Topology

```
Worker Process (MCP Client)
    |
    |-- stdio --> Playwright MCP Server (child process)
    |             - Controls headless browser
    |             - Used for: page exploration, script validation
    |
    |-- stdio --> GitHub MCP Server (child process)
    |             - Authenticated with user's GitHub token
    |             - Used for: create branch, commit files, create PR
    |
    |-- stdio --> Azure DevOps MCP Server (child process)
                  - Authenticated with user's ADO token
                  - Used for: same operations for ADO repos
```

### MCP Lifecycle Per Job

1. **Job starts:** Worker loads repo connection details (provider, token)
2. **Browser phase:** Spawn Playwright MCP server. Use it to explore the target app (optional: gather page structure to improve script generation). Close when done.
3. **Script generation:** AI generates the Playwright script (no MCP needed here, pure GPT call)
4. **Repo phase:** Spawn the appropriate repo MCP server (GitHub or ADO based on connection type). Create branch, commit script file, open PR. Close when done.
5. **Cleanup:** All MCP server subprocesses terminated.

### Key MCP Design Decisions

| Decision | Rationale |
|----------|-----------|
| Per-job MCP instances | Isolation between jobs; no shared state |
| Stdio transport | Simplest, most reliable MCP transport; no network config needed |
| Short-lived connections | Spawn when needed, close when done; prevents resource leaks |
| Worker is the only MCP client | Web tier never touches MCP; clean separation |

## Scalability Considerations

| Concern | At 10 users | At 1,000 users | At 10,000 users |
|---------|-------------|-----------------|-----------------|
| **Job throughput** | Single worker, sequential jobs | Multiple worker instances, concurrent jobs via queue | Worker pool with autoscaling, rate limiting per tenant |
| **Database load** | Single PostgreSQL instance | Connection pooling (PgBouncer), read replicas for dashboard queries | Sharding by org (unlikely at this scale for test gen) |
| **AI API costs** | Negligible | Rate limit awareness, request queuing to OpenAI | Negotiate enterprise pricing, consider caching common patterns |
| **MCP server overhead** | Minimal (few subprocesses) | Monitor subprocess count, set concurrency limits per worker | Pool management, subprocess recycling |
| **Credential security** | Application-level encryption sufficient | Add key rotation, audit logging | HSM-backed encryption, SOC 2 compliance |
| **Tenant isolation** | Service-layer scoping | Add RLS, automated isolation tests | Dedicated database schemas per tenant (extreme cases) |

## Suggested Build Order

The components have clear dependencies. Build order should respect these.

```
Phase 1: Foundation
  [1] Database schema + ORM setup (Prisma or Drizzle)
  [2] Auth (NextAuth/Auth.js) + Org/User model
  [3] Basic Next.js app shell with navigation

Phase 2: Core Entities
  [4] Application CRUD (register apps with URLs, credentials)
  [5] Repository Connection CRUD (GitHub/ADO tokens, output folder config)
  [6] Credential encryption implementation

Phase 3: Scenario & Queue
  [7] Scenario CRUD (plain English input, linked to app)
  [8] Job queue setup (pg-boss recommended for PostgreSQL-only infra)
  [9] Job status tracking + polling endpoint

Phase 4: Testing Agent (Worker)
  [10] Worker process that dequeues jobs
  [11] AI Pipeline: scenario refinement (OpenAI integration)
  [12] AI Pipeline: script generation (OpenAI integration)
  [13] MCP integration: Playwright MCP client for validation (optional for v1)
  [14] MCP integration: GitHub MCP client for branch/commit/PR
  [15] MCP integration: ADO MCP client for branch/commit/PR

Phase 5: API & Polish
  [16] External API endpoint (POST trigger for programmatic use)
  [17] Real-time status updates (SSE or polling refinement)
  [18] Error handling, retry logic, timeout management

Phase 6: Hardening
  [19] Multi-tenant isolation tests
  [20] Rate limiting
  [21] Credential rotation support
```

**Dependency Chain:**
- [4,5] require [1,2] (schema and auth)
- [7] requires [4] (scenarios belong to apps)
- [8,9] require [1] (jobs table)
- [10] requires [8] (queue to dequeue from)
- [11,12] require [10] (worker to run in)
- [14,15] require [5] (repo connections to use)
- [16] requires [8] (enqueue mechanism)

**Critical Path:** Schema -> Auth -> App CRUD -> Scenarios -> Queue -> Worker -> AI Pipeline -> MCP Repo Integration. This is the minimum path to a working end-to-end flow.

## Deployment Architecture

```
Production (Recommended for v1)
+----------------------------------+
| VPS / VM (e.g., Railway, Render, |
| DigitalOcean App Platform)       |
|                                  |
| [Next.js Server]  port 3000     |
| [Worker Process]  background     |
| [PostgreSQL]      managed addon  |
+----------------------------------+

Note: Cannot deploy the worker on Vercel (no long-running processes).
Must use a platform that supports persistent processes.
```

**Why NOT Vercel for this project:** Vercel serverless functions have execution time limits (10s free, 60s pro, 300s enterprise). The testing agent pipeline runs for minutes. The worker needs a persistent process. Use Railway, Render, Fly.io, DigitalOcean App Platform, or a raw VPS.

**Production topology:**
- Next.js web server: one process, handles HTTP
- Worker: one or more processes, picks jobs from queue
- PostgreSQL: managed instance (Railway Postgres, Render Postgres, or Supabase)
- No Redis needed if using pg-boss (queue backed by PostgreSQL)

## Sources

- Architecture patterns based on established patterns for queue-driven AI pipeline systems
- MCP protocol architecture based on the Model Context Protocol specification (Anthropic, 2024)
- Playwright MCP and GitHub MCP patterns based on official MCP server implementations
- pg-boss patterns based on the pg-boss library documentation
- Multi-tenant SaaS isolation patterns from established best practices

**Confidence note:** MCP server API details (exact tool names, parameters) should be verified against current MCP server documentation during implementation. The architectural patterns (subprocess lifecycle, stdio transport) are stable and well-documented in the MCP specification.
