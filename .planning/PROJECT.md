# TestForge

## What This Is

An AI-powered testing platform where teams add their web applications, connect GitHub or Azure DevOps repos, and write test scenarios in plain English. The platform converts those scenarios into professional Playwright test scripts using AI, then pushes the scripts to the connected repo and creates a pull request for review.

## Core Value

Users describe what to test in plain English and get a ready-to-merge PR with working Playwright scripts — no manual test code writing required.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-tenant web application with org-level isolation
- [ ] User authentication and team management
- [ ] Application management (register apps with URL, test credentials)
- [ ] Repository connections (GitHub and Azure DevOps with auth tokens)
- [ ] Plain-English test scenario input
- [ ] AI-powered scenario-to-prompt refinement (OpenAI GPT)
- [ ] Playwright test script generation via testing agent
- [ ] Script push to connected repo via MCP servers (GitHub MCP, ADO MCP)
- [ ] Pull request creation for generated scripts
- [ ] API endpoint for triggering workflows programmatically
- [ ] User-defined output folder for generated scripts

### Out of Scope

- Mobile native app testing — web and API only for v1
- CI/CD pipeline integration — users handle merge and pipeline triggers
- Test execution and reporting — v1 generates scripts only, doesn't run them
- Script editing within the platform — users review in their repo via PR
- Dashboard analytics and run history — deferred to v2

## Context

- **Target users:** QA teams and developers on the same team, different workflows. QA writes detailed scenarios, devs write quick checks.
- **Multi-tenant:** Multiple organizations using the same platform instance, each with isolated apps, repos, and scenarios.
- **Agent architecture:** A server-side testing agent connects to Playwright MCP server for script generation, and GitHub/ADO MCP servers for repo operations (push + PR creation).
- **Workflow trigger:** Both UI (click a button in the web app) and API (POST with applicationId and repoId in URL, scenario in payload).
- **Credentials storage:** Each application stores its test URL, username, and password. These are passed to the testing agent so it can authenticate against the app under test.
- **PR flow:** Agent creates the PR, user reviews and merges manually in their repo.

## Constraints

- **Database:** PostgreSQL — chosen by user
- **Frontend/Backend:** Next.js — full-stack framework
- **AI Provider:** OpenAI GPT — for scenario refinement and script generation
- **Script Language:** JavaScript — Playwright scripts output in JS
- **MCP Servers:** Playwright MCP, GitHub MCP, Azure DevOps MCP — agent connects to these for browser automation and repo operations
- **Execution:** Testing agent runs on platform's server infrastructure, not user's machine

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js full-stack | Single framework for frontend and API routes, good DX | — Pending |
| OpenAI GPT for AI | User preference for scenario refinement and script gen | — Pending |
| MCP for repo ops | User prefers MCP servers over direct REST APIs for GitHub/ADO | — Pending |
| PostgreSQL | User-selected database | — Pending |
| Server-side agent | Agent runs on platform infra, user sees results only | — Pending |
| Multi-tenant from v1 | Multiple orgs need isolation from the start | — Pending |

---
*Last updated: 2026-03-01 after initialization*
