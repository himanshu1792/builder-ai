---
phase: 01-project-foundation
plan: 03
type: tdd
wave: 2
depends_on:
  - 01-01
files_modified:
  - lib/encryption.ts
  - lib/__tests__/encryption.test.ts
  - package.json
autonomous: true
requirements:
  - APP-05

must_haves:
  truths:
    - "encrypt('hello') produces a string in iv:tag:ciphertext hex format"
    - "decrypt(encrypt('hello')) returns 'hello' exactly"
    - "Two encrypt() calls on the same plaintext produce different ciphertexts (unique IVs)"
    - "decrypt() with a wrong key throws an error"
    - "decrypt() with malformed input throws a descriptive error"
    - "Missing ENCRYPTION_KEY env var throws a descriptive error"
    - "ENCRYPTION_KEY with wrong length throws a descriptive error"
  artifacts:
    - path: "lib/encryption.ts"
      provides: "AES-256-GCM encrypt and decrypt functions"
      exports: ["encrypt", "decrypt"]
      min_lines: 40
    - path: "lib/__tests__/encryption.test.ts"
      provides: "Comprehensive tests for encryption module"
      min_lines: 50
  key_links:
    - from: "lib/encryption.ts"
      to: "process.env.ENCRYPTION_KEY"
      via: "reads 32-byte hex key from environment variable"
      pattern: "process\\.env\\.ENCRYPTION_KEY"
    - from: "lib/__tests__/encryption.test.ts"
      to: "lib/encryption.ts"
      via: "imports encrypt and decrypt functions"
      pattern: "import.*encrypt.*decrypt.*from"
---

<objective>
Build the AES-256-GCM encryption module using TDD (test-driven development).

Purpose: APP-05 requires application credentials encrypted at rest. This module provides the encrypt/decrypt primitives that all credential storage will use. TDD is ideal here because the I/O contract is perfectly defined: plaintext in, ciphertext out, roundtrip must match.
Output: A thoroughly tested encryption module at lib/encryption.ts with comprehensive test coverage.
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

<feature>
  <name>AES-256-GCM Encryption Module</name>
  <files>lib/encryption.ts, lib/__tests__/encryption.test.ts</files>
  <behavior>
    Core behaviors (test these):
    - encrypt(plaintext) returns a string in format "hex:hex:hex" (iv:tag:ciphertext)
    - decrypt(encrypt(plaintext)) === plaintext for any input string
    - encrypt(same_input) called twice produces DIFFERENT outputs (unique random IVs)
    - decrypt() with tampered ciphertext throws an error (GCM authentication)
    - decrypt() with malformed format (not "x:y:z") throws "Invalid ciphertext format" error
    - Missing ENCRYPTION_KEY env var throws "ENCRYPTION_KEY environment variable is required" error
    - ENCRYPTION_KEY with wrong byte length throws error mentioning "32 bytes"
    - encrypt/decrypt handles empty string
    - encrypt/decrypt handles unicode characters (emojis, CJK)
    - encrypt/decrypt handles long strings (1000+ characters)
  </behavior>
  <implementation>
    Use Node.js built-in `crypto` module (NOT an npm package):
    - Algorithm: aes-256-gcm
    - IV: 12 bytes random via randomBytes(12)
    - Auth tag: 16 bytes (128 bits), specify authTagLength: 16 to avoid Node.js deprecation warning
    - Key: 32 bytes from process.env.ENCRYPTION_KEY (hex-encoded, so 64 hex chars)
    - Output format: iv_hex:tag_hex:ciphertext_hex
    - Uses createCipheriv / createDecipheriv from "node:crypto"
  </implementation>
</feature>

<tasks>

<task type="auto">
  <name>Task 1: Install Vitest and write failing tests (RED phase)</name>
  <files>package.json, lib/__tests__/encryption.test.ts</files>
  <action>
Install Vitest as a dev dependency:
```bash
npm install -D vitest
```

Add a test script to package.json if not already present:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Create `lib/__tests__/encryption.test.ts` with the following test suite. All tests should FAIL at this point because `lib/encryption.ts` does not exist yet:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";

// Will fail until encryption.ts is created
import { encrypt, decrypt } from "../encryption.js";

describe("encryption module", () => {
  const VALID_KEY = "a".repeat(64); // 32 bytes as hex
  const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    if (ORIGINAL_KEY !== undefined) {
      process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe("encrypt", () => {
    it("returns a string in iv:tag:ciphertext hex format", () => {
      const result = encrypt("hello");
      const parts = result.split(":");
      expect(parts).toHaveLength(3);
      // Each part should be valid hex
      parts.forEach((part) => {
        expect(part).toMatch(/^[0-9a-f]+$/);
      });
      // IV should be 12 bytes = 24 hex chars
      expect(parts[0]).toHaveLength(24);
      // Auth tag should be 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(32);
      // Ciphertext should be non-empty
      expect(parts[2].length).toBeGreaterThan(0);
    });

    it("produces different ciphertexts for the same plaintext (unique IVs)", () => {
      const result1 = encrypt("same-input");
      const result2 = encrypt("same-input");
      expect(result1).not.toEqual(result2);
    });

    it("handles empty string", () => {
      const encrypted = encrypt("");
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe("");
    });

    it("handles unicode characters", () => {
      const input = "Hello world";
      const encrypted = encrypt(input);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(input);
    });

    it("handles long strings", () => {
      const input = "x".repeat(10000);
      const encrypted = encrypt(input);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(input);
    });
  });

  describe("decrypt", () => {
    it("roundtrips correctly: decrypt(encrypt(plaintext)) === plaintext", () => {
      const inputs = [
        "my-secret-password",
        "hello world",
        "special chars: !@#$%^&*()",
        "unicode: cafe\u0301",
        "",
      ];
      for (const input of inputs) {
        expect(decrypt(encrypt(input))).toBe(input);
      }
    });

    it("throws on tampered ciphertext (GCM authentication failure)", () => {
      const encrypted = encrypt("test");
      const parts = encrypted.split(":");
      // Tamper with the ciphertext portion
      const tampered = parts[0] + ":" + parts[1] + ":ff" + parts[2].slice(2);
      expect(() => decrypt(tampered)).toThrow();
    });

    it("throws on malformed input (not iv:tag:ciphertext format)", () => {
      expect(() => decrypt("not-valid")).toThrow("Invalid ciphertext format");
      expect(() => decrypt("only:two")).toThrow("Invalid ciphertext format");
      expect(() => decrypt("")).toThrow("Invalid ciphertext format");
    });
  });

  describe("key validation", () => {
    it("throws when ENCRYPTION_KEY is not set", () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encrypt("test")).toThrow(
        "ENCRYPTION_KEY environment variable is required"
      );
    });

    it("throws when ENCRYPTION_KEY has wrong length", () => {
      process.env.ENCRYPTION_KEY = "tooshort";
      expect(() => encrypt("test")).toThrow("32 bytes");
    });
  });
});
```

Run the tests to confirm they FAIL:
```bash
npm test
```

All tests should fail with an import error since `lib/encryption.ts` does not exist yet. This is the RED phase.

Commit with message: `test(01-03): add failing tests for AES-256-GCM encryption module`
  </action>
  <verify>
    <automated>cd "C:/Projects/tester agent" && npx vitest run 2>&1 | tail -5</automated>
  </verify>
  <done>Vitest installed. Test file created at lib/__tests__/encryption.test.ts with 10+ test cases covering roundtrip, format, uniqueness, edge cases, and key validation. All tests fail (RED phase confirmed).</done>
</task>

<task type="auto">
  <name>Task 2: Implement encryption module to pass all tests (GREEN phase)</name>
  <files>lib/encryption.ts</files>
  <action>
Create `lib/encryption.ts` implementing AES-256-GCM encrypt/decrypt:

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes recommended for GCM
const TAG_LENGTH = 16; // 16 bytes (128 bits) auth tag
const KEY_LENGTH = 32; // 32 bytes (256 bits) for AES-256

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is required. " +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
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
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

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
  const parts = ciphertext.split(":");

  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error("Invalid ciphertext format. Expected iv:tag:encrypted");
  }

  const [ivHex, tagHex, encHex] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
```

Key implementation details:
- Uses `node:crypto` (Node.js built-in, no npm package needed)
- `authTagLength: 16` specified explicitly to avoid Node.js deprecation warning on v20.13+
- IV is 12 bytes (recommended for GCM, generated fresh each call via randomBytes)
- Format is `iv_hex:tag_hex:ciphertext_hex` (colon-separated hex strings)
- getEncryptionKey() validates presence AND length of the key
- Empty string edge case: `cipher.update("", "utf8")` produces empty buffer, `cipher.final()` still produces valid output. The ciphertext portion will be empty hex but iv and tag are still present. NOTE: Actually for empty plaintext, the encrypted buffer will be empty (0 hex chars). Adjust the format validation in decrypt to allow empty ciphertext: change the check to `parts.length !== 3 || !parts[0] || !parts[1]` (parts[2] CAN be empty for empty plaintext). Actually, re-examine: for empty string encrypt, `encrypted.toString("hex")` will be `""`. So format would be `iv:tag:`. When we split "iv:tag:" by ":", we get ["iv", "tag", ""]. `parts[2]` is `""` which is falsy. So we need to handle this case. Update the validation to check `parts.length !== 3 || !parts[0] || !parts[1]` (remove the `!parts[2]` check since empty ciphertext is valid for empty plaintext input).

Run all tests:
```bash
npm test
```

All tests should PASS (GREEN phase).

Commit with message: `feat(01-03): implement AES-256-GCM encryption module`

If any tests fail, debug and fix the implementation until all pass. Do NOT modify the tests -- fix the implementation.
  </action>
  <verify>
    <automated>cd "C:/Projects/tester agent" && npx vitest run 2>&1 | tail -10</automated>
  </verify>
  <done>All encryption tests pass. lib/encryption.ts exports encrypt() and decrypt() functions using AES-256-GCM. Roundtrip works for all test cases including empty strings, unicode, and long strings. Key validation throws descriptive errors.</done>
</task>

</tasks>

<verification>
1. `npm test` passes all encryption tests (10+ test cases)
2. `lib/encryption.ts` exists with encrypt and decrypt exports
3. `lib/__tests__/encryption.test.ts` exists with comprehensive test coverage
4. Roundtrip: decrypt(encrypt("test")) === "test"
5. Security: two encrypt() calls produce different ciphertexts (unique IVs)
6. Validation: missing/invalid ENCRYPTION_KEY throws descriptive errors
</verification>

<success_criteria>
- All Vitest tests pass for the encryption module
- encrypt() produces iv:tag:ciphertext hex format with 12-byte IV and 16-byte auth tag
- decrypt(encrypt(x)) === x for all tested inputs
- Unique IVs per encryption (no IV reuse)
- Descriptive errors for missing key, wrong key length, and malformed ciphertext
- GCM authentication failure detected on tampered ciphertext
</success_criteria>

<output>
After completion, create `.planning/phases/01-project-foundation/01-03-SUMMARY.md`
</output>
