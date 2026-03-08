import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient } from "../../generated/prisma/client";
import { applicationSchema } from "../schemas/application";

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
import {
  createApplication,
  listApplications,
  getApplication,
  updateApplication,
  deleteApplication,
} from "../applications";

const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("applications service", () => {
  beforeEach(() => {
    mockReset(mockPrisma);
  });

  describe("createApplication", () => {
    it("encrypts testUsername and testPassword before storing", async () => {
      const input = {
        name: "My App",
        testUrl: "https://example.com",
        testUsername: "admin",
        testPassword: "secret123",
      };

      mockPrisma.application.create.mockResolvedValue({
        id: "test-id",
        name: input.name,
        testUrl: input.testUrl,
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

    it("returns the created application record", async () => {
      const now = new Date();
      const input = {
        name: "Test App",
        testUrl: "https://test.com",
        testUsername: "user",
        testPassword: "pass",
      };

      const created = {
        id: "cuid-123",
        name: input.name,
        testUrl: input.testUrl,
        testUsername: "encrypted:user",
        testPassword: "encrypted:pass",
        createdAt: now,
        updatedAt: now,
      };

      mockPrisma.application.create.mockResolvedValue(created);

      const result = await createApplication(input);
      expect(result).toEqual(created);
    });
  });

  describe("listApplications", () => {
    it("calls findMany with select excluding credential fields", async () => {
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

    it("returns list items without credential fields", async () => {
      const now = new Date();
      const items = [
        {
          id: "1",
          name: "App 1",
          testUrl: "https://app1.com",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "2",
          name: "App 2",
          testUrl: "https://app2.com",
          createdAt: now,
          updatedAt: now,
        },
      ];

      // findMany with select returns objects matching the select shape
      mockPrisma.application.findMany.mockResolvedValue(items as any);

      const result = await listApplications();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(items[0]);
      expect(result[1]).toEqual(items[1]);
    });
  });

  describe("getApplication", () => {
    it("decrypts testUsername and testPassword from the record", async () => {
      const now = new Date();
      mockPrisma.application.findUnique.mockResolvedValue({
        id: "test-id",
        name: "My App",
        testUrl: "https://example.com",
        testUsername: "encrypted:admin",
        testPassword: "encrypted:secret123",
        createdAt: now,
        updatedAt: now,
      });

      const result = await getApplication("test-id");

      expect(result).not.toBeNull();
      expect(result!.testUsername).toBe("admin");
      expect(result!.testPassword).toBe("secret123");
      expect(result!.name).toBe("My App");
      expect(result!.testUrl).toBe("https://example.com");
    });

    it("returns null when record not found", async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);

      const result = await getApplication("nonexistent-id");
      expect(result).toBeNull();
    });

    it("calls findUnique with the correct id", async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);

      await getApplication("my-app-id");

      expect(mockPrisma.application.findUnique).toHaveBeenCalledWith({
        where: { id: "my-app-id" },
      });
    });
  });

  describe("updateApplication", () => {
    it("only encrypts fields that are explicitly provided", async () => {
      mockPrisma.application.update.mockResolvedValue({
        id: "test-id",
        name: "Updated Name",
        testUrl: "https://example.com",
        testUsername: "encrypted:admin",
        testPassword: "encrypted:secret",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateApplication("test-id", {
        name: "Updated Name",
        testUsername: "newuser",
      });

      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: "test-id" },
        data: {
          name: "Updated Name",
          testUsername: "encrypted:newuser",
        },
      });
    });

    it("does not include undefined fields in Prisma data object", async () => {
      mockPrisma.application.update.mockResolvedValue({
        id: "test-id",
        name: "My App",
        testUrl: "https://new-url.com",
        testUsername: "encrypted:admin",
        testPassword: "encrypted:secret",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateApplication("test-id", {
        testUrl: "https://new-url.com",
      });

      const callArgs = mockPrisma.application.update.mock.calls[0][0];
      expect(callArgs.data).toEqual({ testUrl: "https://new-url.com" });
      expect(callArgs.data).not.toHaveProperty("name");
      expect(callArgs.data).not.toHaveProperty("testUsername");
      expect(callArgs.data).not.toHaveProperty("testPassword");
    });

    it("encrypts testPassword when provided", async () => {
      mockPrisma.application.update.mockResolvedValue({
        id: "test-id",
        name: "My App",
        testUrl: "https://example.com",
        testUsername: "encrypted:admin",
        testPassword: "encrypted:newpass",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateApplication("test-id", {
        testPassword: "newpass",
      });

      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: "test-id" },
        data: {
          testPassword: "encrypted:newpass",
        },
      });
    });
  });

  describe("deleteApplication", () => {
    it("calls prisma.application.delete with the given id", async () => {
      mockPrisma.application.delete.mockResolvedValue({
        id: "test-id",
        name: "My App",
        testUrl: "https://example.com",
        testUsername: "encrypted:admin",
        testPassword: "encrypted:secret",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await deleteApplication("test-id");

      expect(mockPrisma.application.delete).toHaveBeenCalledWith({
        where: { id: "test-id" },
      });
    });
  });
});

describe("application schema (Zod)", () => {
  it("accepts valid input", () => {
    const result = applicationSchema.safeParse({
      name: "My Application",
      testUrl: "https://example.com",
      testUsername: "admin",
      testPassword: "secret123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Application");
      expect(result.data.testUrl).toBe("https://example.com");
      expect(result.data.testUsername).toBe("admin");
      expect(result.data.testPassword).toBe("secret123");
    }
  });

  it("rejects empty name", () => {
    const result = applicationSchema.safeParse({
      name: "",
      testUrl: "https://example.com",
      testUsername: "admin",
      testPassword: "secret123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid URL format", () => {
    const result = applicationSchema.safeParse({
      name: "My App",
      testUrl: "not-a-url",
      testUsername: "admin",
      testPassword: "secret123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty testUsername", () => {
    const result = applicationSchema.safeParse({
      name: "My App",
      testUrl: "https://example.com",
      testUsername: "",
      testPassword: "secret123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty testPassword", () => {
    const result = applicationSchema.safeParse({
      name: "My App",
      testUrl: "https://example.com",
      testUsername: "admin",
      testPassword: "",
    });

    expect(result.success).toBe(false);
  });

  it("infers correct TypeScript types", () => {
    const validInput = {
      name: "Test",
      testUrl: "https://example.com",
      testUsername: "user",
      testPassword: "pass",
    };

    const result = applicationSchema.safeParse(validInput);
    if (result.success) {
      // Type assertion: these should be strings
      const name: string = result.data.name;
      const url: string = result.data.testUrl;
      const user: string = result.data.testUsername;
      const pass: string = result.data.testPassword;
      expect(typeof name).toBe("string");
      expect(typeof url).toBe("string");
      expect(typeof user).toBe("string");
      expect(typeof pass).toBe("string");
    }
  });
});
