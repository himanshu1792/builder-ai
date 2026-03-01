# Research Summary: TestForge

**Domain:** AI-powered test automation SaaS platform
**Researched:** 2026-03-01
**Overall confidence:** MEDIUM (stack recommendations are high-confidence, MCP ecosystem maturity is low-confidence)

## Executive Summary

TestForge is an AI-powered testing platform where teams describe test scenarios in plain English and receive ready-to-merge pull requests containing professional Playwright test scripts. The platform integrates with GitHub and Azure DevOps via MCP (Model Context Protocol) servers for repository operations.

The stack is well-defined by user constraints: Next.js full-stack, PostgreSQL, OpenAI GPT, Playwright MCP for browser automation, and GitHub/ADO MCP for repo operations. Research focused on filling gaps: which supporting libraries, what deployment model, how to handle multi-tenancy, and where the MCP ecosystem's maturity poses risks.

The most significant finding is that TestForge is NOT a typical Next.js web app. It has a server-side agent architecture that spawns browser processes, maintains persistent MCP connections, and runs long-running AI generation jobs. This means serverless deployment (Vercel) is incompatible. The platform needs a Docker-based deployment with separate web and worker processes.

The second critical finding is that MCP server availability for GitHub and Azure DevOps operations is uncertain. While Playwright MCP (`@playwright/mcp`) has official Microsoft backing, GitHub and ADO MCP servers may require custom implementation. The architecture should abstract repo operations behind an interface so MCP servers can be swapped in as they mature, with direct API clients (Octokit, azure-devops-node-api) as fallbacks.

## Key Findings

**Stack:** Next.js 15 + Prisma + PostgreSQL + OpenAI SDK + BullMQ + MCP SDK, deployed via Docker on a VPS/cloud VM (not Vercel).

**Architecture:** Two-process system -- Next.js web server handles UI/API, BullMQ worker handles async test generation jobs with MCP server connections.

**Critical pitfall:** MCP server maturity for GitHub/ADO is uncertain. Build an abstraction layer with direct API fallbacks from day one.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation & Multi-Tenancy** - Set up Next.js project, Prisma schema with org-level isolation, authentication, and the encryption module for credentials storage.
   - Addresses: User auth, team management, org isolation, app/repo registration
   - Avoids: The most critical pitfall (tenant data leakage) by establishing isolation patterns first

2. **AI Pipeline** - Implement the scenario-to-script generation pipeline: prompt engineering, OpenAI integration, structured outputs, and basic script generation without browser validation.
   - Addresses: Plain-English input, AI-powered refinement, script generation
   - Avoids: Over-investing in MCP before validating the core AI quality

3. **MCP Integration & Agent** - Connect the Playwright MCP server for script validation, implement GitHub/ADO integration (MCP or fallback), and build the PR creation workflow.
   - Addresses: Browser automation, repo push, PR creation
   - Avoids: The MCP maturity pitfall by tackling it in an isolated phase with clear fallback paths

4. **Job Queue & API** - Add BullMQ for async processing, SSE for progress streaming, and the public API endpoint for programmatic triggering.
   - Addresses: API endpoint, workflow trigger, progress tracking
   - Avoids: Premature optimization -- queue infrastructure is added after the core pipeline works

5. **Hardening & Deployment** - Docker containerization, security hardening, rate limiting, deployment pipeline.
   - Addresses: Production readiness, security requirements
   - Avoids: Deploying without proper credential encryption and tenant isolation verification

**Phase ordering rationale:**
- Foundation first because every subsequent phase depends on tenant-scoped data access
- AI pipeline before MCP because the AI quality is the core value proposition -- validate it early
- MCP integration is isolated because it has the highest uncertainty (server maturity)
- Queue infrastructure comes after the pipeline works synchronously (validate first, optimize second)
- Hardening last because security patterns (encryption, RLS) are baked in from phase 1, but full hardening (rate limiting, deployment) is a separate concern

**Research flags for phases:**
- Phase 3 (MCP Integration): HIGH risk -- needs deep research on GitHub/ADO MCP server availability. May require building custom MCP servers or falling back to direct API clients.
- Phase 2 (AI Pipeline): MEDIUM risk -- prompt engineering for reliable Playwright script generation needs experimentation. Research can't predict prompt quality.
- Phase 1 (Foundation): LOW risk -- standard Next.js + Prisma + Auth patterns, well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core technologies are well-established. Version numbers need verification. |
| Features | HIGH | Requirements are clearly defined in PROJECT.md. Table stakes are obvious for this domain. |
| Architecture | MEDIUM-HIGH | Two-process model is clearly necessary. MCP connection patterns need validation. |
| Pitfalls | MEDIUM | Multi-tenancy and deployment pitfalls are well-known. MCP-specific pitfalls are speculative due to ecosystem immaturity. |

## Gaps to Address

- Exact current stable versions of all npm packages (verify before install)
- GitHub MCP server: Does an official/stable one exist? What tools does it expose?
- Azure DevOps MCP server: Same question -- likely needs custom implementation
- Playwright MCP server API surface: What tools are available? What are the limitations?
- NextAuth v5 release status: Was in beta in early 2025, may be stable now
- OpenAI structured outputs reliability: How well does JSON schema mode work for code generation?
- BullMQ worker deployment patterns: Best practices for running alongside Next.js in Docker
