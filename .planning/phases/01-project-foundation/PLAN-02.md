---
phase: 01-project-foundation
plan: 02
type: execute
wave: 2
depends_on:
  - 01-01
files_modified:
  - prisma/schema.prisma
  - prisma.config.ts
  - lib/prisma.ts
  - generated/prisma/client/index.ts
  - package.json
autonomous: true
requirements:
  - APP-05

must_haves:
  truths:
    - "Prisma migration applies cleanly against the Docker Compose PostgreSQL database"
    - "The Application model exists in the database with all required fields"
    - "Prisma Client can be imported and used to query the database"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "Application model with encrypted credential fields"
      contains: "model Application"
    - path: "prisma.config.ts"
      provides: "Prisma 7 configuration with datasource URL and schema path"
      contains: "defineConfig"
    - path: "lib/prisma.ts"
      provides: "Prisma Client singleton for Next.js hot-reload safety"
      contains: "PrismaPg"
      exports: ["prisma"]
    - path: "generated/prisma/client/index.ts"
      provides: "Auto-generated Prisma Client with typed models"
      min_lines: 10
  key_links:
    - from: "prisma.config.ts"
      to: ".env"
      via: "env('DATABASE_URL') reads connection string from environment"
      pattern: "env\\(\"DATABASE_URL\"\\)"
    - from: "lib/prisma.ts"
      to: "generated/prisma/client"
      via: "imports PrismaClient from generated output path"
      pattern: "from.*generated/prisma"
    - from: "lib/prisma.ts"
      to: "@prisma/adapter-pg"
      via: "PrismaPg adapter for PostgreSQL driver"
      pattern: "PrismaPg"
    - from: "prisma/schema.prisma"
      to: "generated/prisma"
      via: "generator output path directive"
      pattern: 'output.*=.*"../generated/prisma"'
---

<objective>
Set up Prisma 7 ORM with the Application model schema, driver adapter, and database migrations.

Purpose: Establish the database layer that Phase 2 (Application Management) will build CRUD operations on. The Application model includes encrypted credential fields per APP-05. Prisma 7 requires specific configuration that differs significantly from Prisma 6.
Output: Working Prisma setup with migrations applied, Application model in database, and a singleton client ready for use.
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
@.planning/phases/01-project-foundation/01-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install Prisma 7 dependencies and create configuration files</name>
  <files>package.json, prisma.config.ts, prisma/schema.prisma</files>
  <action>
Install Prisma 7 dependencies:

```bash
npm install @prisma/client @prisma/adapter-pg pg dotenv
npm install -D prisma @types/pg
```

IMPORTANT VERSION NOTE: Use Prisma 7.x (^7.4), NOT Prisma 6.x. The research confirms current stable is 7.4. If `npm install prisma` installs v6, use `npm install prisma@7` explicitly.

Create `prisma.config.ts` in the project root:

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

Create `prisma/schema.prisma`:

```prisma
// Prisma 7 schema for TestForge
// Generator uses "prisma-client" (NOT "prisma-client-js" which is Prisma 6)
// Output goes to generated/ directory (NOT node_modules)

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// Phase 1 foundation model -- expanded in Phase 2
model Application {
  id            String   @id @default(cuid())
  name          String
  testUrl       String
  testUsername   String   // Stored encrypted via lib/encryption.ts (AES-256-GCM)
  testPassword   String   // Stored encrypted via lib/encryption.ts (AES-256-GCM)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

Key Prisma 7 differences from Prisma 6 (do NOT use Prisma 6 patterns):
- Generator is `prisma-client` (not `prisma-client-js`)
- Output path is REQUIRED and must be outside node_modules
- `prisma.config.ts` replaces schema-level datasource URL configuration
- `dotenv/config` must be explicitly imported (env vars no longer auto-loaded)
- The datasource block in schema.prisma does NOT contain a `url` field (it is in prisma.config.ts)
  </action>
  <verify>
    <automated>cd "C:/Projects/tester agent" && node -e "const p = require('./package.json'); console.assert(p.dependencies['@prisma/adapter-pg'], '@prisma/adapter-pg missing'); console.assert(p.dependencies.pg, 'pg missing'); console.assert(p.dependencies.dotenv, 'dotenv missing'); console.log('deps OK')" && test -f prisma/schema.prisma && echo "schema OK" && test -f prisma.config.ts && echo "config OK"</automated>
  </verify>
  <done>Prisma 7 dependencies installed. prisma.config.ts and prisma/schema.prisma created with correct Prisma 7 patterns (prisma-client generator, custom output path, driver adapter config).</done>
</task>

<task type="auto">
  <name>Task 2: Run migration, generate client, and create Prisma singleton</name>
  <files>lib/prisma.ts, prisma/migrations/, generated/prisma/</files>
  <action>
Ensure Docker Compose PostgreSQL is running:
```bash
docker compose up -d
```

Wait for healthy status, then run the initial migration:
```bash
npx prisma migrate dev --name init
```

This creates the `prisma/migrations/` directory with the initial migration SQL and applies it to the database.

Then generate the Prisma Client:
```bash
npx prisma generate
```

This writes the generated client to `generated/prisma/` as specified in the schema output path.

Verify the generated client exists:
```bash
ls generated/prisma/
```

Create `lib/prisma.ts` -- the Prisma Client singleton for Next.js:

```typescript
// Prisma Client singleton for Next.js
// Prevents connection pool exhaustion during hot-reload in development
// Source: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Verify the full stack works by running a quick connectivity test:
```bash
npx tsx -e "
import { prisma } from './lib/prisma.ts';
const count = await prisma.application.count();
console.log('Connection OK, application count:', count);
await prisma.\$disconnect();
"
```

If `tsx` is not installed, install it as a dev dependency first: `npm install -D tsx`

Also verify the database has the Application table:
```bash
npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```
  </action>
  <verify>
    <automated>cd "C:/Projects/tester agent" && npx prisma migrate status 2>&1 | head -10 && test -d generated/prisma && echo "generated client OK" && test -f lib/prisma.ts && echo "singleton OK"</automated>
  </verify>
  <done>Prisma migration applied cleanly. Application table exists in PostgreSQL. Generated Prisma Client exists at generated/prisma/. lib/prisma.ts singleton exports a working PrismaClient that connects to the Docker Compose database.</done>
</task>

</tasks>

<verification>
1. `npx prisma migrate status` shows all migrations applied with no pending
2. `generated/prisma/` directory exists with generated client code
3. `lib/prisma.ts` exports a `prisma` singleton that uses PrismaPg adapter
4. Database contains the `Application` table with columns: id, name, testUrl, testUsername, testPassword, createdAt, updatedAt
5. `npx prisma studio` opens and shows the Application model (manual check if needed)
</verification>

<success_criteria>
- Prisma 7 is installed with @prisma/adapter-pg and pg driver
- prisma.config.ts uses defineConfig with DATABASE_URL from env
- schema.prisma uses prisma-client generator with output to ../generated/prisma
- Initial migration applied, Application table created in PostgreSQL
- lib/prisma.ts exports singleton PrismaClient with PrismaPg adapter
- TypeScript can import from generated/prisma/client without errors
</success_criteria>

<output>
After completion, create `.planning/phases/01-project-foundation/01-02-SUMMARY.md`
</output>
