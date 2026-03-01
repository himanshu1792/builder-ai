---
phase: 01-project-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - tsconfig.json
  - next.config.ts
  - eslint.config.mjs
  - app/layout.tsx
  - app/page.tsx
  - app/globals.css
  - .gitignore
  - docker-compose.yml
  - .env
  - .env.example
autonomous: true
requirements:
  - APP-05

must_haves:
  truths:
    - "Running `npm run dev` starts the Next.js development server without errors"
    - "Docker Compose starts PostgreSQL and the container reaches healthy state"
    - "Environment variables for DATABASE_URL and ENCRYPTION_KEY are defined in .env"
  artifacts:
    - path: "package.json"
      provides: "Project manifest with Next.js 16, TypeScript, correct scripts"
      contains: "next"
    - path: "docker-compose.yml"
      provides: "PostgreSQL 16 container definition with healthcheck"
      contains: "postgres:16-alpine"
    - path: ".env"
      provides: "Local environment variables (DATABASE_URL, ENCRYPTION_KEY)"
      contains: "DATABASE_URL"
    - path: ".env.example"
      provides: "Template for .env (committed to git)"
      contains: "ENCRYPTION_KEY"
    - path: ".gitignore"
      provides: "Ignores .env, generated/, .next/, node_modules/"
      contains: "generated/"
  key_links:
    - from: "docker-compose.yml"
      to: ".env"
      via: "DATABASE_URL connection string matches Docker Compose postgres credentials"
      pattern: "postgresql://testforge:testforge_dev@localhost:5432/testforge"
---

<objective>
Scaffold the Next.js 16 project and set up the local development infrastructure (Docker Compose for PostgreSQL, environment variables).

Purpose: Establish the project skeleton that all subsequent plans build on. After this plan, the developer has a running Next.js dev server and a local PostgreSQL database.
Output: A working Next.js 16 project with Docker Compose PostgreSQL and configured environment variables.
</objective>

<execution_context>
@C:/Users/saksh/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/saksh/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-project-foundation/01-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold Next.js 16 project with create-next-app</name>
  <files>package.json, tsconfig.json, next.config.ts, eslint.config.mjs, app/layout.tsx, app/page.tsx, app/globals.css, .gitignore</files>
  <action>
Run `npx create-next-app@latest . --yes` in the project root directory to scaffold a Next.js 16 project. The `--yes` flag accepts all defaults (TypeScript, Tailwind CSS, ESLint, App Router, Turbopack, `src/` directory NO, import alias `@/*`).

IMPORTANT: The project root already has `.planning/` and `.git/` directories. Run create-next-app with `.` as the directory target so it scaffolds into the existing directory.

After scaffolding, verify the following:
1. `package.json` exists and has `next` as a dependency (should be ^16.x)
2. `tsconfig.json` has `"module": "ESNext"` and `"moduleResolution": "bundler"`
3. `eslint.config.mjs` uses flat config format (not legacy `.eslintrc`)
4. `app/layout.tsx` and `app/page.tsx` exist

Post-scaffold adjustments:
- Check if `package.json` has `"type": "module"`. If NOT present, add it (required by Prisma 7 ESM-only).
- Update `.gitignore` to add these entries if not already present:
  ```
  # Prisma generated client
  generated/

  # Environment variables
  .env
  .env.local
  ```
- Update `package.json` scripts to add these convenience scripts (merge with existing):
  ```json
  {
    "scripts": {
      "lint": "eslint .",
      "lint:fix": "eslint . --fix",
      "db:up": "docker compose up -d",
      "db:down": "docker compose down",
      "db:migrate": "npx prisma migrate dev",
      "db:generate": "npx prisma generate",
      "db:studio": "npx prisma studio",
      "db:reset": "npx prisma migrate reset"
    }
  }
  ```
  Keep all existing scripts (dev, build, start) and merge the new ones in.

Run `npm run dev` to confirm the dev server starts without errors, then stop it.
  </action>
  <verify>
    <automated>cd "C:/Projects/tester agent" && node -e "const p = require('./package.json'); console.assert(p.dependencies.next, 'next missing'); console.assert(p.scripts.dev, 'dev script missing'); console.assert(p.scripts['db:up'], 'db:up script missing'); console.log('package.json OK')" && npx tsc --noEmit 2>&1 | head -5</automated>
  </verify>
  <done>Next.js 16 project scaffolded with TypeScript, Tailwind, ESLint flat config, App Router. package.json has "type": "module" and db convenience scripts. .gitignore includes generated/ and .env. `npm run dev` starts successfully.</done>
</task>

<task type="auto">
  <name>Task 2: Create Docker Compose and environment configuration</name>
  <files>docker-compose.yml, .env, .env.example</files>
  <action>
Create `docker-compose.yml` in project root with PostgreSQL 16:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: testforge
      POSTGRES_USER: testforge
      POSTGRES_PASSWORD: testforge_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U testforge -d testforge"]
      interval: 5s
      timeout: 2s
      retries: 20

volumes:
  pgdata:
```

Create `.env.example` (committed to git, template for developers):

```bash
# PostgreSQL (Docker Compose)
DATABASE_URL="postgresql://testforge:testforge_dev@localhost:5432/testforge?schema=public"

# Encryption key (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY="your-64-character-hex-string-here"
```

Create `.env` (gitignored, actual local values):

```bash
# PostgreSQL (Docker Compose)
DATABASE_URL="postgresql://testforge:testforge_dev@localhost:5432/testforge?schema=public"

# Encryption key (auto-generated)
ENCRYPTION_KEY=<GENERATE_THIS>
```

For the ENCRYPTION_KEY value in `.env`, generate a real 32-byte hex key by running:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
and insert the output as the value.

After creating the files, start PostgreSQL:
```bash
docker compose up -d
```

Wait for the healthcheck to pass (container should be healthy within 15 seconds):
```bash
docker compose ps
```

Verify PostgreSQL is accessible:
```bash
docker compose exec postgres pg_isready -U testforge -d testforge
```
  </action>
  <verify>
    <automated>cd "C:/Projects/tester agent" && docker compose ps --format json 2>/dev/null | head -5 && node -e "const fs = require('fs'); console.assert(fs.existsSync('.env'), '.env missing'); console.assert(fs.existsSync('.env.example'), '.env.example missing'); console.assert(fs.existsSync('docker-compose.yml'), 'docker-compose.yml missing'); console.log('env files OK')"</automated>
  </verify>
  <done>Docker Compose starts PostgreSQL 16 container that reaches healthy state. `.env` has real DATABASE_URL and a generated ENCRYPTION_KEY. `.env.example` has placeholder values for documentation.</done>
</task>

</tasks>

<verification>
1. `npm run dev` starts Next.js dev server on localhost:3000
2. `docker compose ps` shows postgres container as healthy
3. `.env` contains DATABASE_URL and ENCRYPTION_KEY with real values
4. `.env.example` exists with placeholder values
5. `.gitignore` includes `generated/`, `.env`
6. `package.json` has `"type": "module"` and db convenience scripts
</verification>

<success_criteria>
- Next.js 16 dev server starts without errors
- PostgreSQL container is running and healthy via Docker Compose
- Environment variables configured for database connection and encryption
- Project structure ready for Prisma and encryption module additions
</success_criteria>

<output>
After completion, create `.planning/phases/01-project-foundation/01-01-SUMMARY.md`
</output>
