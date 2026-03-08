---
phase: 01-project-foundation
plan: 04
type: execute
wave: 3
depends_on:
  - 01-02
  - 01-03
files_modified:
  - app/page.tsx
  - app/layout.tsx
  - app/globals.css
autonomous: true
requirements:
  - APP-05

must_haves:
  truths:
    - "Visiting localhost:3000 shows the TestForge application shell with the project name"
    - "TypeScript compiles with zero errors across the entire project"
    - "ESLint passes with zero errors across the entire project"
    - "The Next.js build completes successfully"
  artifacts:
    - path: "app/page.tsx"
      provides: "TestForge home page with application branding"
      min_lines: 10
    - path: "app/layout.tsx"
      provides: "Root layout with TestForge metadata and structure"
      contains: "TestForge"
  key_links:
    - from: "app/layout.tsx"
      to: "app/page.tsx"
      via: "Next.js App Router renders page inside layout"
      pattern: "children"
    - from: "app/page.tsx"
      to: "TestForge branding"
      via: "Visible application name and purpose on the home page"
      pattern: "TestForge"
---

<objective>
Customize the application shell for TestForge branding and run final validation (TypeScript, ESLint, build) to confirm the entire Phase 1 foundation is working.

Purpose: This is the capstone plan for Phase 1. It replaces the create-next-app boilerplate with TestForge-specific content and validates that all components (Next.js, Prisma, encryption, TypeScript, ESLint) work together without errors.
Output: A branded application shell and a fully validated, zero-error project foundation.
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
@.planning/phases/01-project-foundation/01-02-SUMMARY.md
@.planning/phases/01-project-foundation/01-03-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Customize application shell with TestForge branding</name>
  <files>app/page.tsx, app/layout.tsx</files>
  <action>
Update `app/layout.tsx` to set TestForge metadata. Replace the default Next.js metadata with:

```typescript
export const metadata: Metadata = {
  title: "TestForge",
  description: "AI-powered test generation platform — describe what to test in plain English and get a ready-to-merge PR with working Playwright scripts",
};
```

Keep the rest of the layout structure (html, body, font setup) from create-next-app. Do NOT remove the Tailwind CSS import from globals.css.

Update `app/page.tsx` to replace the entire create-next-app boilerplate with a clean TestForge landing/dashboard shell. Create a simple, clean page using Tailwind CSS:

```tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            TestForge
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            AI-powered test generation platform
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h2 className="text-lg font-medium text-gray-900">
            Welcome to TestForge
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Describe what to test in plain English and get a ready-to-merge PR
            with working Playwright scripts.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Phase 1 foundation complete. Application management coming in Phase
            2.
          </p>
        </div>
      </main>
    </div>
  );
}
```

This is intentionally minimal -- Phase 2 will add real application management UI. The purpose here is to replace the generic Next.js starter page with TestForge branding so the success criterion "see the Next.js application shell" is meaningful.

Clean up `app/globals.css` to remove any create-next-app custom styles, keeping only the Tailwind directives:

```css
@import "tailwindcss";
```

(Next.js 16 with Tailwind v4 uses `@import "tailwindcss"` instead of the old `@tailwind base; @tailwind components; @tailwind utilities;` directives. Keep whatever create-next-app generated -- it should be correct for the version.)
  </action>
  <verify>
    <automated>cd "C:/Projects/tester agent" && node -e "const fs = require('fs'); const page = fs.readFileSync('app/page.tsx', 'utf8'); console.assert(page.includes('TestForge'), 'page missing TestForge'); const layout = fs.readFileSync('app/layout.tsx', 'utf8'); console.assert(layout.includes('TestForge'), 'layout missing TestForge'); console.log('branding OK')"</automated>
  </verify>
  <done>app/page.tsx shows TestForge branding with project description. app/layout.tsx has TestForge metadata. The create-next-app boilerplate is replaced with clean, minimal TestForge-specific content.</done>
</task>

<task type="auto">
  <name>Task 2: Final validation — TypeScript, ESLint, build, and dev server</name>
  <files></files>
  <action>
This task runs validation commands across the entire project. It does not create new files, but may require fixing issues found in files from previous plans.

Step 1: TypeScript compilation check
```bash
npx tsc --noEmit
```
Must produce zero errors. If there are errors:
- Fix them in the source files
- Common issues: missing type imports, wrong import paths for generated Prisma client
- Ensure tsconfig.json includes paths that cover lib/ and generated/

Step 2: ESLint check
```bash
npx eslint .
```
IMPORTANT: Next.js 16 removed `next lint`. Use `npx eslint .` directly.
Must produce zero errors. Warnings are acceptable but errors must be fixed.
If there are errors:
- Fix them in the source files
- If eslint.config.mjs needs adjustments (e.g., ignoring generated/ directory), update it
- Ensure generated/ is in the ESLint ignore list (should be in eslint.config.mjs globalIgnores)

Step 3: Add generated/ to ESLint ignores if not already present
Check `eslint.config.mjs` and ensure `globalIgnores` includes `"generated/**"`. If create-next-app did not add this, update the config:
```javascript
globalIgnores([
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
  "generated/**",
])
```

Step 4: Next.js build
```bash
npm run build
```
Must complete successfully. This validates that:
- TypeScript compiles in the Next.js build pipeline
- All imports resolve (including Prisma generated client)
- Pages render without errors

NOTE: The build requires `prisma generate` to have been run (from Plan 02). If the build fails with missing generated client, run `npx prisma generate` first. Consider adding a `prebuild` script to package.json:
```json
{
  "scripts": {
    "prebuild": "prisma generate"
  }
}
```

Step 5: Dev server smoke test
```bash
npm run dev &
sleep 5
curl -s http://localhost:3000 | head -20
# Should contain "TestForge" in the HTML
kill %1
```
Verify the response contains "TestForge".

Step 6: Run all tests
```bash
npm test
```
All encryption tests from Plan 03 must still pass.

If ANY step fails, fix the issue and re-run. Do not leave the project in a broken state.
  </action>
  <verify>
    <automated>cd "C:/Projects/tester agent" && npx tsc --noEmit 2>&1 && npx eslint . 2>&1 | tail -3 && npm test 2>&1 | tail -5</automated>
  </verify>
  <done>TypeScript compiles with zero errors. ESLint passes with zero errors. All tests pass. Next.js build completes successfully. Dev server starts and shows TestForge application shell at localhost:3000.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` exits with code 0 (zero TypeScript errors)
2. `npx eslint .` exits with code 0 (zero ESLint errors)
3. `npm run build` completes successfully
4. `npm test` passes all tests (encryption module)
5. `npm run dev` starts and localhost:3000 shows "TestForge" branded page
6. `docker compose ps` shows postgres as healthy

These 6 checks correspond directly to the Phase 1 success criteria from the roadmap.
</verification>

<success_criteria>
- Phase 1 Success Criterion 1: Developer can run `npm run dev` and see the TestForge application shell in the browser (verified by curl or browser)
- Phase 1 Success Criterion 2: PostgreSQL database is running locally via Docker Compose and Prisma migrations apply cleanly (verified by `docker compose ps` and `npx prisma migrate status`)
- Phase 1 Success Criterion 3: The encryption module can encrypt a plaintext string and decrypt it back to the original value using AES-256-GCM (verified by `npm test`)
- Phase 1 Success Criterion 4: Project TypeScript compiles with zero errors and linting passes (verified by `npx tsc --noEmit` and `npx eslint .`)
</success_criteria>

<output>
After completion, create `.planning/phases/01-project-foundation/01-04-SUMMARY.md`
</output>
