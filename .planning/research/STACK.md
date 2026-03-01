# Technology Stack

**Project:** TestForge - AI-Powered Testing Platform
**Researched:** 2026-03-01
**Overall Confidence:** MEDIUM (versions from training data, verify with `npm view <pkg> version` before installing)

## Important: Version Verification

All version numbers below are from training data (cutoff: May 2025). Before running `npm install`, verify current stable versions:

```bash
npm view next version
npm view openai version
npm view @playwright/test version
npm view @modelcontextprotocol/sdk version
npm view prisma version
npm view next-auth version
```

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | ^15.x | Full-stack web framework | App Router with Server Components for UI + API Routes for backend. Single deployment unit. Server Actions reduce boilerplate for mutations. User-specified constraint. | HIGH |
| TypeScript | ^5.5 | Type safety | Non-negotiable for a multi-tenant SaaS. Catches org-isolation bugs at compile time. Playwright scripts output as JS, but platform code must be TS. | HIGH |
| React | ^19.x | UI library | Ships with Next.js 15. Server Components reduce client bundle. Suspense boundaries for streaming AI responses. | HIGH |

**Why Next.js 15 specifically:** App Router is stable and the standard path forward. Server Components reduce client JavaScript (good for a dashboard-heavy app). Route Handlers replace the older API Routes pattern. Server Actions simplify form submissions for scenario input. The `instrumentation.ts` hook is useful for initializing MCP connections at server startup.

### Database & ORM

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | 16+ | Primary database | User-specified. Excellent for multi-tenant with Row-Level Security (RLS). JSONB columns for flexible scenario metadata. Strong ecosystem. | HIGH |
| Prisma | ^6.x | ORM & migrations | Best TypeScript ORM for Next.js. Auto-generated types from schema. Migration system handles multi-tenant schema evolution. Prisma Client handles connection pooling. | HIGH |
| Prisma Accelerate or PgBouncer | latest | Connection pooling | Serverless Next.js deploys open many short-lived connections. Pooling prevents exhausting PostgreSQL's connection limit. Prisma Accelerate is managed; PgBouncer is self-hosted. | MEDIUM |

**Why Prisma over Drizzle:** Prisma has a more mature migration system, which matters for multi-tenant schema evolution. Drizzle is faster at runtime but Prisma's developer experience (auto-generated types, Prisma Studio for debugging tenant data) wins for a team building a SaaS. The performance difference is negligible for this workload (not a high-throughput read-heavy app).

**Why NOT raw SQL / Knex:** Multi-tenant apps need schema migrations, type safety, and consistent query patterns. Raw SQL invites tenant isolation bugs. Knex lacks the type generation that catches these at compile time.

### Authentication & Multi-Tenancy

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| NextAuth.js (Auth.js v5) | ^5.x | Authentication | De facto auth for Next.js. Supports OAuth (GitHub, Microsoft for ADO users), credentials, and magic link. v5 is App Router native. | MEDIUM |
| Custom RBAC middleware | N/A | Authorization & tenant isolation | NextAuth handles "who are you?" but tenant isolation ("which org's data can you see?") needs custom middleware on every data access path. | HIGH |

**Multi-tenancy approach:** Shared database with `organizationId` foreign key on every tenant-scoped table. NOT separate schemas or databases per tenant -- that adds operational complexity with no benefit at early scale. Use Prisma middleware or a custom `withTenantScope(orgId)` wrapper to enforce the `WHERE organizationId = ?` clause on every query. This prevents the most critical multi-tenant bug: data leaking between orgs.

**Why NOT Clerk/WorkOS:** These are excellent hosted auth solutions, but they add cost per MAU and external dependency. NextAuth is free, self-hosted, and sufficient. If the team later wants SSO/SCIM for enterprise customers, migrate to WorkOS at that point.

### AI Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| OpenAI Node.js SDK | ^4.x | GPT API access | User-specified AI provider. Official SDK with streaming, function calling, and structured outputs. TypeScript-first. | HIGH |
| GPT-4o | latest model | Scenario-to-script generation | Best balance of quality and cost for code generation. GPT-4o-mini for scenario refinement (cheaper). GPT-4o for actual Playwright script generation (needs accuracy). | MEDIUM |
| Structured Outputs (JSON mode) | N/A | Reliable AI output parsing | Use `response_format: { type: "json_schema" }` with a defined schema for script generation. Prevents malformed output that breaks downstream PR creation. | HIGH |

**Prompt architecture:**

1. **Scenario refinement** (GPT-4o-mini): User's plain English --> structured test steps with assertions. Fast, cheap.
2. **Script generation** (GPT-4o): Structured steps + app context (URL, auth) --> Playwright JS script. Needs high accuracy.
3. **Script validation** (Playwright MCP): Generated script --> executed against target app --> results back. This validates the AI output before creating a PR.

**Why NOT LangChain:** LangChain adds abstraction over a single LLM provider (OpenAI). TestForge doesn't need chain-of-thought orchestration, vector stores, or agent loops that LangChain provides. Direct OpenAI SDK calls with well-crafted prompts are simpler, more debuggable, and have fewer dependencies. If multi-provider support is needed later, add a thin abstraction layer -- don't adopt a framework.

**Why NOT Vercel AI SDK:** The Vercel AI SDK (`ai` package) is useful for streaming chat UIs, but TestForge's AI interaction is primarily server-side batch processing (generate a script, validate it, create a PR). The streaming UI benefit is minimal. Direct OpenAI SDK gives more control over structured outputs and function calling, which are critical for reliable code generation.

### MCP (Model Context Protocol) Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @modelcontextprotocol/sdk | ^1.x | MCP client implementation | Official TypeScript SDK for connecting to MCP servers. Handles transport, tool discovery, and invocation. | MEDIUM |
| @playwright/mcp | latest | Browser automation MCP server | Official Playwright MCP server. Exposes browser actions as MCP tools. The testing agent calls these to generate and validate scripts. | LOW |
| GitHub MCP server | latest | GitHub repo operations | Pushes generated scripts and creates PRs via MCP tools. User-specified integration method. | LOW |
| Azure DevOps MCP server | latest | ADO repo operations | Same as GitHub MCP but for ADO repos. User-specified integration method. | LOW |

**MCP Architecture:**

The platform runs as an MCP **client** that connects to three MCP **servers**:

1. **Playwright MCP Server** -- Spawned per test generation job. Provides tools like `navigate`, `click`, `fill`, `screenshot`, `evaluate`. The AI agent uses these to validate generated scripts against the target application.
2. **GitHub MCP Server** -- Long-lived connection (or per-job). Provides tools like `create_branch`, `push_files`, `create_pull_request`. Uses the org's stored GitHub token.
3. **ADO MCP Server** -- Same pattern as GitHub MCP. Provides tools for Azure DevOps Git operations.

**Transport:** Use `stdio` transport for locally spawned MCP servers (Playwright). Use `SSE` or `streamable-http` transport for remote/persistent MCP servers if deploying them separately.

**Critical note on MCP server maturity:** The MCP ecosystem is rapidly evolving. The `@playwright/mcp` package was released by Microsoft in early 2025. GitHub and ADO MCP servers may be community-maintained or require custom implementation. **Verify availability and stability before committing to MCP for repo operations.** Fallback: use Octokit (GitHub REST/GraphQL) and azure-devops-node-api directly, wrapped in an MCP-compatible interface for future migration.

### Background Jobs & Queuing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| BullMQ | ^5.x | Job queue for test generation | Script generation is a multi-step async process (AI call + MCP browser automation + repo push + PR creation). Cannot block an HTTP request. BullMQ provides reliable queuing with retries, progress tracking, and concurrency control. | HIGH |
| Redis | ^7.x | BullMQ backend + caching | BullMQ requires Redis. Also useful for caching AI prompts and rate limiting. | HIGH |
| ioredis | ^5.x | Redis client | BullMQ's recommended Redis client. More reliable than node-redis for pub/sub and connection management. | HIGH |

**Why BullMQ over alternatives:**

- **Why NOT `inngest` / `trigger.dev`:** These are hosted workflow platforms. They add external dependency and cost. BullMQ is self-hosted, battle-tested, and the team controls the infrastructure.
- **Why NOT Next.js background functions:** Next.js API routes have execution time limits (especially on Vercel). Test generation can take 30-120 seconds. BullMQ workers run as a separate process with no timeout.
- **Why NOT database-backed queues (pg-boss):** pg-boss uses PostgreSQL as the queue backend. Works, but Redis-backed BullMQ has better performance for job scheduling and doesn't add load to the primary database.

### UI Components & Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.x | Utility-first styling | Standard for Next.js apps. Fast iteration, consistent design, no CSS-in-JS runtime cost. v4 has significant performance improvements. | HIGH |
| shadcn/ui | latest | Component library | Not an npm package -- copy-paste components built on Radix UI primitives. Fully customizable, accessible, TypeScript-first. Avoids version lock-in of traditional component libraries. | HIGH |
| Radix UI | latest | Accessible primitives | Underlying primitive library for shadcn/ui. Handles accessibility, keyboard navigation, focus management. | HIGH |
| Lucide React | latest | Icons | Default icon set for shadcn/ui. Consistent, tree-shakeable. | HIGH |
| React Hook Form | ^7.x | Form handling | For scenario input forms, app registration, repo connection setup. Performant (uncontrolled components), integrates with Zod validation. | HIGH |
| Zod | ^3.x | Schema validation | Single validation schema used across client forms, API routes, and Prisma inputs. "Validate once, use everywhere." | HIGH |

**Why NOT Material UI / Ant Design / Chakra UI:** These are opinionated component libraries with their own design systems. shadcn/ui gives you ownership of the code, uses Radix primitives (best accessibility), and works with Tailwind CSS without runtime CSS-in-JS overhead.

### API & Data Fetching

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js Route Handlers | built-in | REST API endpoints | For the programmatic API (POST to trigger test generation). Standard Next.js pattern. | HIGH |
| Next.js Server Actions | built-in | UI mutations | For form submissions (create app, connect repo, submit scenario). Reduces client-side fetch boilerplate. | HIGH |
| TanStack Query (React Query) | ^5.x | Client-side data fetching | For dashboard data that needs polling (job status, generation progress). Handles caching, refetching, and optimistic updates. | HIGH |
| Server-Sent Events (SSE) | native | Real-time progress updates | Stream test generation progress to the UI. Simpler than WebSockets for one-directional server-to-client updates. | HIGH |

**Why NOT tRPC:** tRPC is excellent for type-safe APIs, but TestForge also needs a public REST API for programmatic triggering. tRPC's type safety doesn't extend to external consumers. Use Zod schemas + Route Handlers for a consistent approach that serves both the UI and the public API.

### Security & Secrets

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| AES-256-GCM encryption | Node.js crypto | Encrypt stored credentials | App test credentials (username/password) and repo tokens must be encrypted at rest. Use Node.js built-in `crypto` module with AES-256-GCM. Store encryption key in environment variable, NOT in database. | HIGH |
| Helmet / security headers | Next.js config | HTTP security headers | CSP, HSTS, X-Frame-Options via `next.config.js` `headers()`. | HIGH |
| Rate limiting | custom middleware | API abuse prevention | Rate limit the public API and AI generation endpoints. Use Redis-backed sliding window. Consider `@upstash/ratelimit` if using Upstash Redis. | MEDIUM |

**Critical security requirement:** TestForge stores sensitive data (GitHub tokens, ADO tokens, app test credentials). Encryption at rest is non-negotiable. Use a dedicated encryption utility module, not ad-hoc encryption in each route.

### Testing (Platform's Own Tests)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | ^2.x | Unit & integration tests | Faster than Jest, native ESM support, compatible with Next.js. | HIGH |
| Playwright | ^1.49+ | E2E tests for the platform itself | Test the TestForge UI flows. Ironic but appropriate -- the platform generates Playwright tests and should itself be tested with Playwright. | HIGH |
| MSW (Mock Service Worker) | ^2.x | API mocking | Mock OpenAI API responses and MCP server interactions in tests. Intercepts at the network level, so tests remain realistic. | HIGH |

### DevOps & Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Docker | latest | Containerization | Package Next.js app, BullMQ workers, and MCP servers. Required for consistent deployment. | HIGH |
| Docker Compose | latest | Local development | Run PostgreSQL, Redis, and MCP servers locally with one command. | HIGH |
| GitHub Actions | N/A | CI/CD | Lint, test, build, deploy pipeline. Natural choice if the team uses GitHub. | MEDIUM |

**Deployment target recommendation:** Self-hosted (VPS/cloud VM) or container orchestration (ECS, Cloud Run, Railway). NOT Vercel -- Vercel's serverless model conflicts with long-running BullMQ workers, persistent MCP server connections, and Playwright browser processes. The platform needs a persistent server process.

**Why NOT Vercel:** Despite using Next.js, TestForge is not a good fit for Vercel because:
1. BullMQ workers need a persistent process (Vercel functions are ephemeral)
2. Playwright MCP server spawns browser processes (Vercel has no browser runtime)
3. MCP connections need persistent stdio/SSE transport (Vercel functions timeout at 60s)
4. A VPS with Docker gives full control over these server-side requirements

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 | Remix / SvelteKit | User constraint specifies Next.js. Remix is excellent but no reason to override user preference. |
| ORM | Prisma | Drizzle ORM | Drizzle has better runtime perf but worse migration story. Prisma's DX and type generation are more important for a multi-tenant app with schema evolution. |
| Auth | NextAuth v5 | Clerk | Clerk costs per MAU and adds external dependency. NextAuth is free and sufficient for v1. |
| AI SDK | OpenAI SDK direct | LangChain / Vercel AI SDK | Direct SDK is simpler for single-provider use. LangChain adds unnecessary abstraction. Vercel AI SDK is for streaming chat UIs, not batch code generation. |
| Queue | BullMQ | Inngest / Trigger.dev | Hosted services add cost and external dependency. BullMQ is battle-tested and self-hosted. |
| CSS | Tailwind + shadcn/ui | Material UI / Chakra | shadcn/ui gives code ownership, uses Radix (best a11y), no runtime CSS-in-JS overhead. |
| Deployment | Docker on VPS | Vercel | Vercel's serverless model conflicts with persistent workers, browser processes, and MCP connections. |
| DB Queue | BullMQ (Redis) | pg-boss (PostgreSQL) | Redis-backed queue has better performance and doesn't load the primary database. |
| Validation | Zod | Yup / Joi | Zod has best TypeScript inference. Single schema for forms, API, and DB validation. |
| Testing | Vitest | Jest | Vitest is faster, native ESM, better DX. Jest is legacy for new projects. |

---

## Full Dependency List

### Production Dependencies

```bash
# Core framework
npm install next@latest react@latest react-dom@latest

# Database
npm install prisma@latest @prisma/client@latest

# Authentication
npm install next-auth@latest

# AI
npm install openai@latest

# MCP
npm install @modelcontextprotocol/sdk@latest

# Job queue
npm install bullmq@latest ioredis@latest

# UI
npm install tailwindcss@latest @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-toast
npm install lucide-react class-variance-authority clsx tailwind-merge

# Forms & validation
npm install react-hook-form@latest @hookform/resolvers zod@latest

# Data fetching
npm install @tanstack/react-query@latest

# Security
# (Node.js crypto is built-in, no install needed)
```

### Development Dependencies

```bash
# TypeScript
npm install -D typescript@latest @types/node @types/react @types/react-dom

# Testing
npm install -D vitest@latest @vitejs/plugin-react @playwright/test@latest msw@latest

# Linting & formatting
npm install -D eslint@latest eslint-config-next@latest prettier@latest

# Prisma CLI (also a dev dep)
npm install -D prisma@latest

# Docker (system-level, not npm)
```

---

## MCP Server Dependencies (External Processes)

These are NOT npm dependencies of the Next.js app. They are separate processes the platform connects to as an MCP client:

| MCP Server | Install Method | Notes |
|------------|---------------|-------|
| @playwright/mcp | `npx @playwright/mcp` or global install | Spawned per job via stdio transport. Needs Chromium installed on server. |
| GitHub MCP | Verify availability | May need custom implementation wrapping Octokit. LOW confidence on official server existence. |
| ADO MCP | Verify availability | Likely needs custom implementation wrapping azure-devops-node-api. LOW confidence on official server existence. |

**Fallback for GitHub/ADO:** If official MCP servers are unavailable or immature, implement repo operations directly:

```bash
# GitHub fallback
npm install @octokit/rest@latest

# Azure DevOps fallback
npm install azure-devops-node-api@latest
```

Wrap these in an MCP-compatible tool interface so the agent architecture remains consistent, and swap in official MCP servers when they mature.

---

## Architecture-Critical Stack Decisions

### 1. Separate Worker Process (Required)

The Next.js app handles HTTP requests. BullMQ workers run as a separate Node.js process that:
- Dequeues test generation jobs
- Connects to MCP servers (Playwright, GitHub/ADO)
- Calls OpenAI API for script generation
- Reports progress back via Redis pub/sub

This separation is **mandatory** because Playwright browser processes and MCP connections cannot live inside serverless/edge functions.

### 2. Encryption Module (Required)

A shared `lib/encryption.ts` module that:
- Encrypts GitHub/ADO tokens before storing in PostgreSQL
- Encrypts app test credentials (username/password)
- Uses AES-256-GCM with a server-side key from `process.env.ENCRYPTION_KEY`
- Exposes `encrypt(plaintext)` and `decrypt(ciphertext)` functions

### 3. Tenant Isolation Layer (Required)

A Prisma middleware or wrapper that:
- Automatically adds `organizationId` to all queries
- Prevents cross-tenant data access
- Is tested with dedicated multi-tenant isolation tests

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Vercel deployment | Serverless model incompatible with persistent workers, browser processes, MCP connections |
| LangChain | Over-abstraction for single-provider AI usage. Adds dependency weight without value. |
| GraphQL | REST is simpler for this API surface. No complex nested queries needed. The API is mostly "trigger a job" and "get job status." |
| WebSockets (Socket.io) | SSE is sufficient for one-directional progress updates. WebSockets add server complexity for no benefit. |
| MongoDB | PostgreSQL is user-specified and better for relational multi-tenant data with RLS. |
| Mongoose / TypeORM | Prisma is the standard ORM for Next.js + TypeScript. TypeORM has worse DX. Mongoose is for MongoDB. |
| CSS Modules / styled-components | Tailwind CSS is more productive and has no runtime cost. CSS-in-JS adds bundle size. |
| Express.js | Next.js Route Handlers replace Express for API needs. Adding Express creates two servers to maintain. |
| Passport.js | NextAuth is the Next.js-native auth solution. Passport requires Express middleware and manual session management. |

---

## Sources & Confidence

| Source Type | What Was Used | Confidence Impact |
|-------------|---------------|-------------------|
| Training data (May 2025) | Version numbers, library recommendations, architecture patterns | MEDIUM -- versions may be outdated |
| Project requirements (PROJECT.md) | Constraints (Next.js, PostgreSQL, OpenAI, MCP, Playwright) | HIGH -- user-specified |
| Ecosystem knowledge | Library comparisons, anti-patterns, deployment considerations | MEDIUM-HIGH -- well-established patterns |

**Gaps requiring verification:**
1. Exact current versions of all packages (run `npm view <pkg> version`)
2. Maturity and availability of GitHub MCP server and ADO MCP server
3. `@playwright/mcp` current API surface and stability
4. NextAuth v5 stable release status (was in beta as of early 2025)
5. Tailwind CSS v4 stable release status
