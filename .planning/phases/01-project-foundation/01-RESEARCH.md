# Phase 1: Project Foundation - Research

**Researched:** 2026-03-01
**Domain:** Next.js scaffolding, PostgreSQL + Prisma ORM, AES-256-GCM encryption, local dev environment
**Confidence:** HIGH

## Summary

Phase 1 establishes the development foundation for TestForge: a Next.js 16 application with PostgreSQL via Docker Compose, Prisma 7 ORM for database access and migrations, and an encryption module using Node.js built-in `crypto` for AES-256-GCM credential encryption. The only functional requirement is APP-05 (encrypted credential storage); everything else is infrastructure scaffolding.

The most significant finding is that the stack research document references Next.js 15 and Prisma 6, but the current stable versions are **Next.js 16.1** and **Prisma 7.4**. Both have breaking changes that affect setup. Next.js 16 uses Turbopack by default, removes `next lint` in favor of direct ESLint CLI usage, and uses ESLint flat config format. Prisma 7 ships as ESM-only, requires explicit driver adapters (`@prisma/adapter-pg`), requires a `prisma.config.ts` file, and mandates a custom output path for the generated client (no longer generates into `node_modules`).

**Primary recommendation:** Use `create-next-app@latest` with defaults (Next.js 16, TypeScript, Tailwind, App Router, Turbopack, ESLint), add Prisma 7 with `@prisma/adapter-pg`, Docker Compose for local PostgreSQL 16, and a standalone `lib/encryption.ts` module using Node.js `crypto` with AES-256-GCM.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| APP-05 | Application credentials are stored encrypted at rest (AES-256) | Encryption module pattern using Node.js `crypto` with AES-256-GCM. IV generation via `randomBytes(12)`, auth tag extraction via `getAuthTag()`, combined storage format `iv:tag:ciphertext`. Key from `process.env.ENCRYPTION_KEY` (32-byte hex). Code examples provided. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^16.1 | Full-stack framework (App Router) | Current stable. Turbopack default, `proxy.ts` replaces middleware, ESLint flat config. `create-next-app` scaffolds TypeScript + Tailwind + ESLint. |
| React | ^19.2 (canary) | UI library | Ships with Next.js 16. Server Components, Suspense, View Transitions. App Router uses React canary releases. |
| TypeScript | ^5.5+ | Type safety | Required minimum 5.1 by Next.js 16. Prisma 7 requires 5.4+. Use 5.5+ for best compatibility. |
| Prisma ORM | ^7.4 | Database ORM & migrations | Current stable. ESM-only, driver adapters required, `prisma.config.ts` config file, generated client in custom output path. |
| @prisma/adapter-pg | ^7.x | PostgreSQL driver adapter | Required by Prisma 7 for PostgreSQL connections. Replaces built-in Rust engine with Node.js `pg` driver. |
| pg | ^8.x | Node.js PostgreSQL driver | Underlying driver used by `@prisma/adapter-pg`. Battle-tested, widely adopted. |
| PostgreSQL | 16+ | Primary database | User-specified. Running locally via Docker Compose. |
| Docker Compose | v2+ | Local PostgreSQL | Runs PostgreSQL container for local development. Single command start/stop. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | ^4.x | Utility-first styling | Included by `create-next-app` defaults. Used from Phase 1 for the application shell. |
| ESLint | ^9.x | Linting | Included by `create-next-app`. Uses flat config format (`eslint.config.mjs`). |
| eslint-config-next | ^16.x | Next.js ESLint rules | Core Web Vitals + React + React Hooks + Next.js plugin rules. TypeScript rules via `eslint-config-next/typescript`. |
| dotenv | latest | Environment variables | Required by Prisma 7 -- env vars no longer loaded automatically. Used in `prisma.config.ts`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma 7 | Drizzle ORM | Drizzle has better runtime performance but lacks Prisma's migration system maturity. Prisma is the project's chosen ORM. |
| Docker Compose PostgreSQL | Local PostgreSQL install | Docker is portable and reproducible across developer machines. Native install varies by OS. |
| AES-256-GCM (Node.js crypto) | `aes-256-gcm` npm package | The npm package is a thin wrapper around Node.js crypto. No benefit over using the built-in module directly. Fewer dependencies is better. |
| ESLint | Biome | Biome is faster but has smaller plugin ecosystem. ESLint is the `create-next-app` default and has full Next.js plugin support. |

**Installation:**
```bash
# Scaffold Next.js 16 project (includes React, TypeScript, Tailwind, ESLint)
npx create-next-app@latest testforge --yes

# Database (Prisma 7 + PostgreSQL adapter)
npm install @prisma/client @prisma/adapter-pg pg dotenv
npm install -D prisma @types/pg

# Encryption: No install needed -- uses Node.js built-in crypto module
```

## Architecture Patterns

### Recommended Project Structure

```
testforge/
├── app/                    # Next.js App Router (pages, layouts, routes)
│   ├── layout.tsx          # Root layout (<html>, <body>)
│   ├── page.tsx            # Home page (application shell)
│   └── globals.css         # Global styles (Tailwind directives)
├── lib/                    # Shared utilities
│   ├── encryption.ts       # AES-256-GCM encrypt/decrypt module
│   └── prisma.ts           # Prisma Client singleton
├── prisma/                 # Prisma schema and migrations
│   ├── schema.prisma       # Data model
│   └── migrations/         # Migration history
├── generated/              # Prisma generated client (gitignored)
│   └── prisma/
│       └── client/
├── prisma.config.ts        # Prisma 7 config (datasource URL, schema path)
├── docker-compose.yml      # PostgreSQL container
├── .env                    # Local environment variables (gitignored)
├── .env.example            # Template for .env (committed)
├── eslint.config.mjs       # ESLint flat config
├── next.config.ts          # Next.js config
├── tsconfig.json           # TypeScript config
└── package.json            # type: "module" for Prisma 7 ESM
```

### Pattern 1: Prisma 7 Client Singleton for Next.js

**What:** A singleton pattern that prevents connection pool exhaustion during Next.js hot reloading in development.

**When to use:** Always. Required in any Next.js project using Prisma.

**Why:** Next.js hot-reloads modules during development, which would create a new PrismaClient instance (and a new connection pool) on every file save. The singleton stores the instance on `globalThis` to survive hot reloads.

**Example:**
```typescript
// lib/prisma.ts
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

### Pattern 2: Prisma 7 Configuration File

**What:** The `prisma.config.ts` file required by Prisma 7 that replaces several schema-level datasource options.

**When to use:** Required for all Prisma 7 projects.

**Example:**
```typescript
// prisma.config.ts
// Source: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/postgresql

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

### Pattern 3: Prisma 7 Schema with Driver Adapter

**What:** The `schema.prisma` file updated for Prisma 7's new generator and driver adapter requirements.

**When to use:** Required for all Prisma 7 projects.

**Example:**
```prisma
// prisma/schema.prisma
// Source: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/postgresql

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// Phase 1 minimal schema -- foundation for Phase 2 expansion
model Application {
  id              String   @id @default(cuid())
  name            String
  testUrl         String
  testUsername     String   // encrypted via lib/encryption.ts
  testPassword     String   // encrypted via lib/encryption.ts
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Pattern 4: AES-256-GCM Encryption Module

**What:** A standalone encryption utility using Node.js built-in `crypto` module for encrypting sensitive data at rest.

**When to use:** Before writing any credential to the database, and after reading.

**Why:** APP-05 requires credentials encrypted at rest. AES-256-GCM provides authenticated encryption (confidentiality + integrity + authentication).

**Example:**
```typescript
// lib/encryption.ts
// Source: https://nodejs.org/api/crypto.html

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;    // 12 bytes recommended for GCM
const TAG_LENGTH = 16;   // 16 bytes (128 bits) auth tag
const KEY_LENGTH = 32;   // 32 bytes (256 bits) for AES-256

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is required. " +
      "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters). Got ${key.length} bytes.`
    );
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: iv:tag:ciphertext (all hex-encoded)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, tagHex, encHex] = ciphertext.split(":");

  if (!ivHex || !tagHex || !encHex) {
    throw new Error("Invalid ciphertext format. Expected iv:tag:encrypted");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
```

### Pattern 5: Docker Compose for Local PostgreSQL

**What:** A `docker-compose.yml` that runs PostgreSQL 16 locally for development.

**When to use:** Always for local development. Ensures consistent database environment across developer machines.

**Example:**
```yaml
# docker-compose.yml
# Source: https://www.prisma.io/docs/guides/docker

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

### Pattern 6: ESLint Flat Config for Next.js 16

**What:** The new ESLint configuration format required by Next.js 16.

**When to use:** All Next.js 16 projects. `create-next-app` generates this automatically.

**Example:**
```javascript
// eslint.config.mjs
// Source: https://nextjs.org/docs/app/api-reference/config/eslint

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "generated/**",  // Prisma generated client
  ]),
]);

export default eslintConfig;
```

### Anti-Patterns to Avoid

- **Using `prisma-client-js` generator (Prisma 6 style):** Prisma 7 deprecates the old generator. Use `prisma-client` with an explicit `output` path. Failing to migrate causes confusing import errors.

- **Omitting the driver adapter:** Prisma 7 requires `@prisma/adapter-pg` for PostgreSQL. Without it, PrismaClient instantiation fails at runtime. This is a breaking change from Prisma 6.

- **Storing ENCRYPTION_KEY in the database:** The encryption key must be in environment variables only, never in the database. If the database is breached, the key and ciphertext are in different places.

- **Reusing IVs in AES-GCM:** Every encryption operation MUST generate a fresh random IV. Reusing an IV with the same key completely breaks GCM security. The `randomBytes(12)` call in the encrypt function handles this.

- **Skipping the Prisma singleton in Next.js:** Without the `globalThis` singleton pattern, every hot reload creates a new connection pool. After 10-20 file saves, PostgreSQL runs out of connections and the dev server crashes.

- **Using `next lint` (removed in Next.js 16):** Run `npx eslint .` directly instead. The `next lint` command no longer exists. The `eslint` config option in `next.config.ts` is also removed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Encryption | Custom crypto protocol | Node.js `crypto` with AES-256-GCM | Cryptography is notoriously easy to get wrong. AES-256-GCM is the standard authenticated encryption algorithm. Use the built-in module exactly as documented. |
| Database migrations | Manual SQL scripts | Prisma `migrate dev` / `migrate deploy` | Prisma tracks migration history, generates SQL, handles rollback ordering, and ensures schema consistency across environments. |
| Database connection pooling | Custom pool manager | Prisma Client + `@prisma/adapter-pg` | The adapter manages connection pooling via the `pg` driver. The singleton pattern prevents pool proliferation during dev. |
| PostgreSQL provisioning | Manual install | Docker Compose | One `docker compose up -d` gives a consistent, isolated PostgreSQL instance. Reproducible across machines and CI. |
| TypeScript configuration | Custom tsconfig from scratch | `create-next-app` generated tsconfig | Next.js has specific TypeScript requirements (path aliases, JSX handling, module resolution). The generated config is correct by default. |

**Key insight:** Phase 1 is all infrastructure. Every component has a well-documented standard setup path. The only custom code is the encryption module, and even that follows the exact pattern from Node.js official documentation. Resist any urge to customize the scaffolding -- use defaults everywhere.

## Common Pitfalls

### Pitfall 1: Prisma 7 ESM Migration Failures

**What goes wrong:** TypeScript compilation errors, import resolution failures, or runtime "require is not defined" errors when mixing ESM and CommonJS.

**Why it happens:** Prisma 7 ships as ESM-only. If `package.json` lacks `"type": "module"` or `tsconfig.json` uses `"module": "commonjs"`, imports fail.

**How to avoid:** Ensure `package.json` has `"type": "module"`. Ensure `tsconfig.json` has `"module": "ESNext"` and `"moduleResolution": "bundler"` (which `create-next-app` sets by default). Import from the custom output path, not from `@prisma/client`.

**Warning signs:** Errors mentioning "Cannot use import statement outside a module" or "require() of ES Module".

### Pitfall 2: Missing Prisma Driver Adapter

**What goes wrong:** Runtime error when instantiating PrismaClient: adapter-related error messages or connection failures.

**Why it happens:** Prisma 7 no longer bundles a Rust query engine. All database connections go through explicit driver adapters. Forgetting to install and configure `@prisma/adapter-pg` causes PrismaClient to fail at construction time.

**How to avoid:** Always install `@prisma/adapter-pg` and `pg`. Always pass the adapter to the PrismaClient constructor. Test database connectivity immediately after setup.

**Warning signs:** Error mentioning "adapter" in PrismaClient instantiation, or missing `PrismaPg` import.

### Pitfall 3: Docker Port Conflict

**What goes wrong:** Docker Compose fails to start PostgreSQL with "port already in use" error.

**Why it happens:** A local PostgreSQL installation or another container is already using port 5432.

**How to avoid:** Check for existing PostgreSQL processes before starting Docker. Use a non-standard port in `docker-compose.yml` (e.g., `5433:5432`) if conflicts exist. Update `DATABASE_URL` accordingly.

**Warning signs:** `docker compose up` fails immediately with bind error.

### Pitfall 4: Encryption Key Not Set

**What goes wrong:** Application crashes on first encrypt/decrypt call with "ENCRYPTION_KEY environment variable is required" error.

**Why it happens:** The `.env` file is missing the key, or the key is malformed (wrong length, not valid hex).

**How to avoid:** Generate the key during project setup using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Add it to `.env`. Include a placeholder in `.env.example`. Validate key length at application startup.

**Warning signs:** Crash on first credential save/load attempt.

### Pitfall 5: Forgetting to Run Prisma Generate After Schema Changes

**What goes wrong:** TypeScript compilation errors referencing missing or outdated Prisma types. The generated client does not reflect the schema.

**Why it happens:** Prisma 7 no longer auto-generates the client during `migrate dev` (this behavior was removed). Developers must run `npx prisma generate` explicitly after schema changes.

**How to avoid:** Add a `postmigrate` script or always run `npx prisma migrate dev && npx prisma generate` together. Consider adding `prisma generate` to the `dev` script in `package.json`.

**Warning signs:** TypeScript errors on model names or field names that exist in `schema.prisma` but not in imports.

### Pitfall 6: GCM Auth Tag Length Deprecation Warning

**What goes wrong:** Node.js deprecation warning about GCM auth tag lengths when running on Node.js 20.13+.

**Why it happens:** As of Node.js v20.13.0, using GCM without explicitly specifying `authTagLength` triggers a deprecation warning.

**How to avoid:** The default 128-bit (16-byte) auth tag is correct and standard. The warning can appear but does not affect functionality. To suppress it, you can specify `authTagLength: 16` in the cipher options, but this is optional since 128 bits is already the default.

**Warning signs:** Deprecation warning in console output mentioning `authTagLength`.

## Code Examples

Verified patterns from official sources:

### Generate Encryption Key

```bash
# Generate a 32-byte (256-bit) hex-encoded encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment Variables Template

```bash
# .env.example
# Source: Prisma docs + Node.js crypto docs

# PostgreSQL (Docker Compose)
DATABASE_URL="postgresql://testforge:testforge_dev@localhost:5432/testforge?schema=public"

# Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY="your-64-character-hex-string-here"
```

### npm Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
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

### Prisma Migration Workflow

```bash
# Source: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/postgresql

# 1. Start PostgreSQL
docker compose up -d

# 2. Initialize Prisma (first time only)
npx prisma init --datasource-provider postgresql --output ../generated/prisma

# 3. Create and apply migration
npx prisma migrate dev --name init

# 4. Generate Prisma Client
npx prisma generate

# 5. Verify with Prisma Studio
npx prisma studio
```

### Verifying Encryption Round-Trip

```typescript
// Simple test to verify encrypt/decrypt works
import { encrypt, decrypt } from "./lib/encryption.ts";

const original = "my-secret-password";
const encrypted = encrypt(original);
const decrypted = decrypt(encrypted);

console.assert(decrypted === original, "Encryption round-trip failed!");
console.assert(encrypted !== original, "Encryption did not transform the input!");
console.log("Encryption module works correctly.");
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js 15 (App Router) | Next.js 16 (Turbopack default, `proxy.ts`, Cache Components) | October 2025 | `create-next-app` now scaffolds v16. Turbopack is default bundler. `next lint` removed. ESLint flat config. |
| Prisma 6 (`prisma-client-js`, Rust engine, `node_modules` output) | Prisma 7 (ESM-only, driver adapters, `prisma-client` generator, custom output, `prisma.config.ts`) | Early 2026 | Breaking changes to generator config, client instantiation, and module format. Must use driver adapters. |
| ESLint legacy config (`.eslintrc.*`) | ESLint flat config (`eslint.config.mjs`) | Next.js 16 / ESLint 9 | `@next/eslint-plugin-next` defaults to flat config. Legacy format deprecated. |
| `next lint` command | `npx eslint .` directly | Next.js 16 | `next lint` removed. `next build` no longer runs linter. Use ESLint CLI directly. |
| Prisma auto-generate on `migrate dev` | Explicit `npx prisma generate` required | Prisma 7 | Auto-seeding after migrations also removed. Must run generate manually. |
| Prisma env var auto-loading | Explicit `dotenv/config` import in `prisma.config.ts` | Prisma 7 | Environment variables no longer loaded automatically. Must import `dotenv/config`. |

**Deprecated/outdated:**
- `prisma-client-js` generator: Replaced by `prisma-client` in Prisma 7
- `middleware.ts`: Deprecated in Next.js 16 in favor of `proxy.ts` (still works for now)
- `next lint`: Removed in Next.js 16
- `.eslintrc.*` files: Deprecated in favor of `eslint.config.mjs` flat config
- Prisma Client in `node_modules`: No longer the default; custom output required

## Open Questions

1. **Prisma 7 + Next.js 16 Turbopack compatibility**
   - What we know: There are community reports of Prisma 7 needing specific configuration with Turbopack. A fix guide exists at buildwithmatija.com.
   - What's unclear: Whether the current Prisma 7.4 + Next.js 16.1 combination has resolved all Turbopack issues.
   - Recommendation: Proceed with the standard setup. If Turbopack causes Prisma import issues, fall back to `next dev --webpack` temporarily and track the issue.

2. **Prisma 7 `generated/` directory and Git**
   - What we know: The generated client is written to a custom path (e.g., `generated/prisma/`). It should be gitignored since it's derived from the schema.
   - What's unclear: Whether CI/CD pipelines need to run `prisma generate` before `next build`.
   - Recommendation: Add `generated/` to `.gitignore`. Run `prisma generate` as a `prebuild` script. Not urgent for Phase 1 (local dev only).

3. **`package.json` `"type": "module"` interaction with Next.js 16**
   - What we know: Prisma 7 requires `"type": "module"`. Next.js 16 works with ESM.
   - What's unclear: Whether `create-next-app` already sets `"type": "module"` by default, or if it needs to be added manually.
   - Recommendation: Check after scaffolding. If not present, add it. This should be verified during implementation.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Installation Docs (v16.1.6)](https://nextjs.org/docs/app/getting-started/installation) - Scaffolding commands, project structure, npm scripts, Node.js requirements
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) - Breaking changes, new features, migration from v15
- [Next.js 16 ESLint Configuration](https://nextjs.org/docs/app/api-reference/config/eslint) - Flat config setup, Core Web Vitals, TypeScript rules
- [Prisma PostgreSQL Quickstart](https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/postgresql) - Prisma 7 init, schema, config, adapter setup
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions) - ESM requirement, driver adapters, removed features
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/docker) - Docker Compose config, healthcheck, connection URL
- [Prisma + Next.js Help](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help) - Singleton pattern for hot reload
- [Node.js Crypto API (v25.7.0)](https://nodejs.org/api/crypto.html) - createCipheriv, createDecipheriv, GCM auth tag, IV requirements

### Secondary (MEDIUM confidence)
- [Prisma 7 Release Announcement](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0) - Rust-free architecture, TypeScript rewrite
- [Next.js 16.1 Blog Post](https://nextjs.org/blog/next-16-1) - Turbopack file system caching stable

### Tertiary (LOW confidence)
- [Prisma 7 + Next.js 16 Turbopack Fix Guide](https://www.buildwithmatija.com/blog/migrate-prisma-v7-nextjs-16-turbopack-fix) - Community workaround for Turbopack compatibility; may be resolved in latest versions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified against official documentation and release announcements. Next.js 16.1 and Prisma 7.4 are confirmed current stable releases.
- Architecture: HIGH - Project structure follows official quickstart guides. Prisma singleton pattern from official Next.js help docs. Encryption pattern from Node.js official crypto docs.
- Pitfalls: HIGH - Prisma 7 breaking changes are well-documented in the official upgrade guide. GCM auth tag deprecation verified in Node.js v25.7.0 docs.

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable technologies, 30-day validity)
