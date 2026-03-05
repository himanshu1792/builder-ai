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
        "unicode: caf\u00e9",
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
