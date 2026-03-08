# Phase 2: Application Management - Research

**Researched:** 2026-03-05
**Domain:** CRUD application management with encrypted credentials, Next.js App Router + Prisma 7 + Server Actions
**Confidence:** HIGH

## Summary

Phase 2 builds the core application management UI and data layer on top of Phase 1's foundation: the Prisma `Application` model (already migrated), the AES-256-GCM encryption module (`lib/encryption.ts`), and the Prisma Client singleton (`lib/prisma.ts`). The work is a standard CRUD feature set -- create, read, update, delete applications -- with the added constraint that `testUsername` and `testPassword` must be encrypted before storage and decrypted on read.

The recommended approach uses **Next.js Server Actions** (not Route Handlers) for all mutations, **Zod v4** for server-side validation, and **React `useActionState`** for form state and pending indicators. The existing Prisma schema already has the `Application` model with all required fields (`name`, `testUrl`, `testUsername`, `testPassword`, `createdAt`, `updatedAt`), so no migration is needed. The data layer involves creating a service module that wraps Prisma CRUD calls with encrypt-on-write and decrypt-on-read logic.

**Primary recommendation:** Use Server Actions with Zod validation for form mutations, a `lib/applications.ts` service module for encrypt/decrypt + Prisma CRUD, and `revalidatePath` for cache invalidation. Test the service module (pure functions) with Vitest + vitest-mock-extended for Prisma mocking; test UI components with React Testing Library where beneficial.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| APP-01 | User can register an application with name, URL, username, and password for testing | Server Actions + Zod validation + Prisma `create` + encrypt credentials before write |
| APP-02 | User can view list of registered applications | Prisma `findMany` with field selection (exclude encrypted fields or decrypt on read) |
| APP-03 | User can edit application details (name, URL, credentials) | Server Actions + Zod validation + Prisma `update` + re-encrypt changed credentials |
| APP-04 | User can delete an application | Server Actions + Prisma `delete` with confirmation UX pattern |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, Server Actions, `revalidatePath` | Project foundation, already installed |
| React | 19.2.3 | `useActionState`, `useFormStatus`, forms | Already installed, React 19 has built-in action support |
| Prisma | 7.4.2 | ORM -- `create`, `findMany`, `findUnique`, `update`, `delete` | Already installed with Application model migrated |
| Vitest | 4.0.18 | Unit testing for service layer and actions | Already installed, 10 encryption tests passing |
| Tailwind CSS | 4 | UI styling for application forms and lists | Already installed |

### To Install
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^4.3 | Server-side form validation with `safeParse`, type inference | Official Next.js recommendation for Server Action validation; 6.5x faster than v3 |
| vitest-mock-extended | ^3.1 | Deep mocking of Prisma Client (`mockDeep<PrismaClient>()`) | Standard approach for Prisma unit testing; enables `prisma.application.create.mockResolvedValue()` |

### Supporting (for UI testing, install only if needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | ^16 | Component rendering in tests | If testing form components directly |
| @vitejs/plugin-react | latest | Vitest JSX transform for component tests | Required only if rendering React components in Vitest |
| @testing-library/dom | latest | DOM query utilities | Paired with @testing-library/react |
| vite-tsconfig-paths | latest | Resolve `@/*` path aliases in Vitest | Required if tests use `@/lib/...` imports |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Actions | Route Handlers (`app/api/...`) | Route Handlers needed for external API consumers (Phase 8), but Server Actions are simpler for internal CRUD with automatic CSRF protection and type safety |
| Zod | Yup, Valibot | Zod is the Next.js official recommendation, TypeScript-first, v4 is fastest; Valibot is smaller but less ecosystem support |
| vitest-mock-extended | Manual `vi.fn()` mocks | Manual mocking is tedious for deeply nested Prisma methods like `prisma.application.create()` |

**Installation:**
```bash
npm install zod
npm install -D vitest-mock-extended
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── applications/              # Application management routes
│   ├── page.tsx               # List all applications (APP-02)
│   ├── new/
│   │   └── page.tsx           # Create application form (APP-01)
│   └── [id]/
│       ├── edit/
│           └── page.tsx       # Edit application form (APP-03)
├── layout.tsx                 # Root layout (existing)
├── page.tsx                   # Landing page (existing)
lib/
├── applications.ts            # Application service: CRUD + encrypt/decrypt
├── schemas/
│   └── application.ts         # Zod schemas for application validation
├── actions/
│   └── applications.ts        # Server Actions for application mutations
├── encryption.ts              # AES-256-GCM (existing from Phase 1)
├── prisma.ts                  # Prisma singleton (existing from Phase 1)
├── __tests__/
│   ├── encryption.test.ts     # Existing (10 tests)
│   ├── applications.test.ts   # Service layer tests
│   └── application-actions.test.ts  # Server Action tests (optional)
├── __mocks__/
│   └── prisma.ts              # Deep mock of PrismaClient for tests
```

### Pattern 1: Service Layer with Encrypt/Decrypt
**What:** A `lib/applications.ts` module that wraps Prisma calls and handles encryption transparently. All Server Actions call this service -- never Prisma directly.
**When to use:** Always for Application CRUD operations.
**Example:**
```typescript
// Source: Project convention + Prisma CRUD docs
// lib/applications.ts
import { prisma } from "./prisma";
import { encrypt, decrypt } from "./encryption";

export type ApplicationInput = {
  name: string;
  testUrl: string;
  testUsername: string;
  testPassword: string;
};

export type ApplicationView = {
  id: string;
  name: string;
  testUrl: string;
  testUsername: string;  // decrypted
  testPassword: string; // decrypted
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationListItem = {
  id: string;
  name: string;
  testUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function createApplication(input: ApplicationInput) {
  return prisma.application.create({
    data: {
      name: input.name,
      testUrl: input.testUrl,
      testUsername: encrypt(input.testUsername),
      testPassword: encrypt(input.testPassword),
    },
  });
}

export async function listApplications(): Promise<ApplicationListItem[]> {
  return prisma.application.findMany({
    select: {
      id: true,
      name: true,
      testUrl: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getApplication(id: string): Promise<ApplicationView | null> {
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return null;
  return {
    ...app,
    testUsername: decrypt(app.testUsername),
    testPassword: decrypt(app.testPassword),
  };
}

export async function updateApplication(id: string, input: Partial<ApplicationInput>) {
  const data: Record<string, string> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.testUrl !== undefined) data.testUrl = input.testUrl;
  if (input.testUsername !== undefined) data.testUsername = encrypt(input.testUsername);
  if (input.testPassword !== undefined) data.testPassword = encrypt(input.testPassword);

  return prisma.application.update({
    where: { id },
    data,
  });
}

export async function deleteApplication(id: string) {
  return prisma.application.delete({ where: { id } });
}
```

### Pattern 2: Server Actions with Zod Validation
**What:** Dedicated action files with `"use server"` directive, Zod validation, and `revalidatePath` for cache invalidation.
**When to use:** For all form submissions (create, edit, delete).
**Example:**
```typescript
// Source: Next.js 16.1.6 official docs (forms guide + updating data guide)
// lib/actions/applications.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { applicationSchema } from "@/lib/schemas/application";
import {
  createApplication,
  updateApplication,
  deleteApplication,
} from "@/lib/applications";

export type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createApplicationAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validatedFields = applicationSchema.safeParse({
    name: formData.get("name"),
    testUrl: formData.get("testUrl"),
    testUsername: formData.get("testUsername"),
    testPassword: formData.get("testPassword"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await createApplication(validatedFields.data);
  } catch (error) {
    return { success: false, message: "Failed to create application." };
  }

  revalidatePath("/applications");
  redirect("/applications");
}
```

### Pattern 3: Form Component with useActionState
**What:** Client component using React 19's `useActionState` for form state, pending indicator, and error display.
**When to use:** For create and edit forms.
**Example:**
```typescript
// Source: Next.js 16.1.6 forms guide + React 19 useActionState docs
// app/applications/new/page.tsx (simplified)
"use client";

import { useActionState } from "react";
import { createApplicationAction, ActionState } from "@/lib/actions/applications";

const initialState: ActionState = { success: false };

export default function NewApplicationPage() {
  const [state, formAction, pending] = useActionState(
    createApplicationAction,
    initialState
  );

  return (
    <form action={formAction}>
      <div>
        <label htmlFor="name">Application Name</label>
        <input type="text" id="name" name="name" required />
        {state.errors?.name && <p>{state.errors.name[0]}</p>}
      </div>
      {/* ... other fields ... */}
      <button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create Application"}
      </button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

### Pattern 4: Prisma Mock Setup for Testing
**What:** Deep mock of PrismaClient using `vitest-mock-extended` placed in `__mocks__` directory.
**When to use:** All service layer unit tests.
**Example:**
```typescript
// Source: Prisma testing guide + vitest-mock-extended docs
// lib/__mocks__/prisma.ts
import { PrismaClient } from "../../generated/prisma/client";
import { beforeEach } from "vitest";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";

const prisma = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prisma);
});

export { prisma };
export type MockPrismaClient = DeepMockProxy<PrismaClient>;
```

### Anti-Patterns to Avoid
- **Calling Prisma directly from Server Actions:** Always go through the service layer so encryption logic is centralized and testable in isolation.
- **Storing plaintext credentials, even temporarily:** Never pass raw credentials to Prisma -- always encrypt first in the service module.
- **Using `router.refresh()` instead of `revalidatePath`:** `revalidatePath` purges both Data Cache and Full Route Cache; `router.refresh()` only refreshes the Router Cache client-side.
- **Catching errors from `redirect()`:** `redirect()` throws a special exception (framework control flow) -- do NOT wrap it in try/catch. Call `revalidatePath` before `redirect`.
- **Using Zod v3 syntax with Zod v4:** Zod v4 uses `{ error: "..." }` instead of `{ message: "..." }`. Top-level `z.email()` replaces `z.string().email()`.
- **Testing async Server Components with Vitest:** Vitest does not yet support async Server Components. Test the data-fetching service functions instead, and use the Server Component only for rendering.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom field validators | Zod `safeParse` + `flatten().fieldErrors` | Handles edge cases (empty strings, type coercion), provides TypeScript type inference, 14.7x faster in v4 |
| CSRF protection | Token generation/validation | Server Actions (built-in CSRF) | Next.js Server Actions automatically include CSRF protection; no manual tokens needed |
| Form pending state | Custom loading state management | React `useActionState` (returns `pending` boolean) | Built into React 19, works with progressive enhancement, handles race conditions |
| Deep Prisma mocking | Manual `vi.fn()` for each method | `vitest-mock-extended` `mockDeep<PrismaClient>()` | Prisma Client has deeply nested methods (`prisma.application.create`) that can't be auto-mocked |
| Cache invalidation | Manual refetch or state updates | `revalidatePath("/applications")` | Framework-level cache purging; single function call refreshes the page data |

**Key insight:** The entire CRUD flow is well-served by Next.js built-in patterns (Server Actions + `revalidatePath` + `useActionState`). The only custom work is the encryption integration in the service layer, which Phase 1 already built.

## Common Pitfalls

### Pitfall 1: Forgetting to Encrypt on Update
**What goes wrong:** When updating an application, only changed credential fields should be re-encrypted. If you encrypt an already-encrypted value, you get double-encryption. If you skip encryption on a changed value, plaintext ends up in the database.
**Why it happens:** The update function receives partial data -- some fields may be unchanged.
**How to avoid:** The service layer `updateApplication` function should only encrypt fields that are explicitly provided in the input. Use conditional logic: if `input.testUsername !== undefined`, encrypt it; otherwise don't include it in the Prisma `data` object.
**Warning signs:** Database inspection shows obviously-wrong ciphertext lengths, or decryption fails on updated records.

### Pitfall 2: Leaking Encrypted Fields to the Application List
**What goes wrong:** The application list page (APP-02) fetches all fields including encrypted `testUsername` and `testPassword`, sending unnecessary ciphertext to the client.
**Why it happens:** Using `findMany()` without `select` returns all columns.
**How to avoid:** Use Prisma `select` to only fetch `id`, `name`, `testUrl`, `createdAt`, `updatedAt` for the list view. Only decrypt credentials when viewing/editing a single application.
**Warning signs:** Large response payloads on the list page; encrypted strings visible in browser DevTools.

### Pitfall 3: redirect() Inside try/catch
**What goes wrong:** `redirect()` from `next/navigation` throws a special Next.js error (`NEXT_REDIRECT`). Wrapping it in try/catch swallows the redirect.
**Why it happens:** Developers naturally wrap mutation logic in try/catch and place redirect inside.
**How to avoid:** Call `redirect()` outside the try/catch block, after `revalidatePath`. Structure: try { mutation } catch { return error state } then revalidatePath + redirect.
**Warning signs:** Form submits successfully but page doesn't navigate; no errors in console.

### Pitfall 4: Missing revalidatePath After Mutations
**What goes wrong:** After creating, updating, or deleting an application, the list page shows stale data because Next.js serves cached content.
**Why it happens:** Next.js aggressively caches page data. Without `revalidatePath`, the cache isn't purged.
**How to avoid:** Always call `revalidatePath("/applications")` after every mutation, before any `redirect()`.
**Warning signs:** Changes appear after manual page refresh but not immediately after form submission.

### Pitfall 5: Zod v4 API Differences from v3
**What goes wrong:** Using v3 syntax (`{ message: "..." }`, `z.string().email()`) with Zod v4 causes deprecation warnings or unexpected behavior.
**Why it happens:** Most tutorials and Stack Overflow answers still show Zod v3 syntax.
**How to avoid:** Use v4 syntax: `{ error: "..." }` for error customization, `z.email()` as top-level (though `z.string().email()` still works with deprecation warning). Reference https://zod.dev/v4 for migration notes.
**Warning signs:** Console deprecation warnings mentioning "Zod v3 compatibility".

### Pitfall 6: Not Handling Prisma "Record Not Found" Errors
**What goes wrong:** Prisma `update` and `delete` throw `PrismaClientKnownRequestError` with code `P2025` when the record doesn't exist. Unhandled, this crashes the Server Action.
**Why it happens:** Race conditions (another tab deleted the record) or stale URLs with invalid IDs.
**How to avoid:** Wrap Prisma calls in try/catch and check for error code `P2025`. Return a user-friendly error message.
**Warning signs:** 500 errors on edit/delete for records that were just deleted.

## Code Examples

Verified patterns from official sources:

### Zod Schema for Application
```typescript
// Source: Zod v4 docs (https://zod.dev/api) + Next.js forms guide
// lib/schemas/application.ts
import { z } from "zod";

export const applicationSchema = z.object({
  name: z.string().min(1, { error: "Application name is required" }).max(100),
  testUrl: z.string().url({ error: "Must be a valid URL" }),
  testUsername: z.string().min(1, { error: "Username is required" }),
  testPassword: z.string().min(1, { error: "Password is required" }),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
```

### Delete Action with Confirmation
```typescript
// Source: Next.js updating data guide
// lib/actions/applications.ts (delete portion)
"use server";

import { revalidatePath } from "next/cache";
import { deleteApplication } from "@/lib/applications";

export async function deleteApplicationAction(id: string): Promise<ActionState> {
  try {
    await deleteApplication(id);
  } catch (error) {
    return { success: false, message: "Failed to delete application." };
  }

  revalidatePath("/applications");
  return { success: true };
}
```

### Service Layer Test Example
```typescript
// Source: Prisma testing guide + vitest-mock-extended
// lib/__tests__/applications.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient } from "../../generated/prisma/client";

// Mock prisma before importing the module under test
vi.mock("../prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

// Mock encryption to isolate service logic
vi.mock("../encryption", () => ({
  encrypt: vi.fn((val: string) => `encrypted:${val}`),
  decrypt: vi.fn((val: string) => val.replace("encrypted:", "")),
}));

import { prisma } from "../prisma";
import { createApplication, listApplications, getApplication } from "../applications";

const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("applications service", () => {
  beforeEach(() => {
    mockReset(mockPrisma);
  });

  it("createApplication encrypts credentials before storing", async () => {
    const input = {
      name: "My App",
      testUrl: "https://example.com",
      testUsername: "admin",
      testPassword: "secret123",
    };

    mockPrisma.application.create.mockResolvedValue({
      id: "test-id",
      ...input,
      testUsername: "encrypted:admin",
      testPassword: "encrypted:secret123",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await createApplication(input);

    expect(mockPrisma.application.create).toHaveBeenCalledWith({
      data: {
        name: "My App",
        testUrl: "https://example.com",
        testUsername: "encrypted:admin",
        testPassword: "encrypted:secret123",
      },
    });
  });

  it("listApplications does not return credential fields", async () => {
    mockPrisma.application.findMany.mockResolvedValue([]);
    await listApplications();

    expect(mockPrisma.application.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        testUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API Route Handlers for CRUD | Server Actions for internal mutations | Next.js 14+ (stable) | Simpler code, automatic CSRF, type safety, progressive enhancement |
| `router.refresh()` for cache | `revalidatePath()` after mutations | Next.js 14+ | Purges both Data Cache and Full Route Cache |
| `getServerSideProps` data fetch | Server Components with async data fetching | Next.js 13+ App Router | No API layer needed for reads; component fetches directly |
| Zod v3 `z.string().email()` | Zod v4 `z.email()` (or `z.string().email()` deprecated) | Zod 4.0 (2025) | 6.5x faster object parsing, 57% smaller bundle |
| `useFormState` (React canary) | `useActionState` (React 19 stable) | React 19 | Renamed hook; returns `[state, formAction, pending]` tuple |

**Deprecated/outdated:**
- `useFormState` from `react-dom`: Renamed to `useActionState` in React 19 (now from `react`, not `react-dom`)
- Zod v3 `{ message: "..." }`: Replaced by `{ error: "..." }` in Zod v4
- Pages Router API Routes for internal mutations: Server Actions are the standard for App Router

## Open Questions

1. **vitest-mock-extended compatibility with Vitest 4**
   - What we know: vitest-mock-extended latest is v3.1.0 (last published ~1 year ago). Vitest 4.0.18 is installed in the project.
   - What's unclear: Whether vitest-mock-extended 3.1 is fully compatible with Vitest 4. The peer dependency range may or may not cover Vitest 4.
   - Recommendation: Install and test during implementation. If incompatible, fall back to manual `vi.fn()` mocking or use Vitest's built-in `vi.mocked()` with manual deep mock setup. Alternatively, the `prisma-mock-vitest` package may be an option.

2. **Zod v4 vs v3 `safeParse().error.flatten()` API stability**
   - What we know: `flatten()` exists in both v3 and v4. The `fieldErrors` structure should be the same.
   - What's unclear: Whether any subtle changes in error formatting affect the `ActionState` pattern.
   - Recommendation: Use `safeParse` + `flatten().fieldErrors` as shown in Next.js official docs. Test with actual forms during implementation.

3. **UI Component Complexity**
   - What we know: Requirements call for list view, create form, edit form, and delete capability. No specific UI framework (e.g., shadcn/ui, Headless UI) has been decided.
   - What's unclear: Whether to use a component library or build with raw Tailwind CSS.
   - Recommendation: Use raw Tailwind CSS (already installed) for Phase 2. The forms are simple (4 fields). This avoids adding a component library dependency. Can revisit for later phases if UI becomes more complex.

## Sources

### Primary (HIGH confidence)
- [Next.js 16.1.6 Updating Data Guide](https://nextjs.org/docs/app/getting-started/updating-data) - Server Actions, revalidatePath, redirect, useActionState
- [Next.js 16.1.6 Forms Guide](https://nextjs.org/docs/app/guides/forms) - Form handling, Zod validation, useActionState, useFormStatus, progressive enhancement
- [Prisma CRUD Reference](https://www.prisma.io/docs/orm/prisma-client/queries/crud) - create, findMany, findUnique, update, delete operations
- [Zod v4 API Docs](https://zod.dev/api) - z.object, z.string, safeParse, flatten, type inference
- [Zod v4 Release Notes](https://zod.dev/v4) - Breaking changes, migration guide, performance improvements
- [Next.js Vitest Testing Guide](https://nextjs.org/docs/app/guides/testing/vitest) - Vitest setup, configuration, component testing

### Secondary (MEDIUM confidence)
- [Prisma Testing Guide (Mocking)](https://www.prisma.io/blog/testing-series-1-8eRB5p0Y8o) - vitest-mock-extended, __mocks__ folder, deep mocking pattern
- [Server Actions vs Route Handlers](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers) - When to use each, CSRF protection, performance

### Tertiary (LOW confidence)
- vitest-mock-extended v3.1 compatibility with Vitest 4 - npm registry shows last publish ~1 year ago; compatibility unverified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries already installed and validated in Phase 1; only Zod and vitest-mock-extended are new
- Architecture: HIGH - Patterns are directly from Next.js 16.1.6 official docs (fetched and verified)
- Pitfalls: HIGH - Well-documented patterns from official sources; encryption pitfalls specific to project design

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (30 days -- stable technology domain, no fast-moving changes expected)
