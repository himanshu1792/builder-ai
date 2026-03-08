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
import {
  parseGitHubUrl,
  parseAdoUrl,
  extractRepoName,
  slugify,
  validateGitHubPat,
  validateAdoPat,
  createRepository,
  listRepositories,
  getRepository,
  updateRepository,
  deleteRepository,
} from "../repositories";

const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

// Helper to create a mock fetch response
function mockFetchResponse(
  status: number,
  headers: Record<string, string> = {},
  body: unknown = {}
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => body,
  } as Response;
}

describe("URL Parsing", () => {
  describe("parseGitHubUrl", () => {
    it('parses standard GitHub URL into owner and repo', () => {
      const result = parseGitHubUrl("https://github.com/org/repo");
      expect(result).toEqual({ owner: "org", repo: "repo" });
    });

    it('strips .git suffix from repo name', () => {
      const result = parseGitHubUrl("https://github.com/org/repo.git");
      expect(result).toEqual({ owner: "org", repo: "repo" });
    });

    it('throws for URL missing repo segment', () => {
      expect(() => parseGitHubUrl("https://github.com/org")).toThrow();
    });
  });

  describe("parseAdoUrl", () => {
    it('parses dev.azure.com URL into project and repoName', () => {
      const result = parseAdoUrl("https://dev.azure.com/org/project/_git/repo");
      expect(result).toEqual({ project: "project", repoName: "repo" });
    });

    it('parses legacy visualstudio.com URL into project and repoName', () => {
      const result = parseAdoUrl("https://org.visualstudio.com/project/_git/repo");
      expect(result).toEqual({ project: "project", repoName: "repo" });
    });

    it('throws for URL missing _git segment', () => {
      expect(() => parseAdoUrl("https://dev.azure.com/org/project")).toThrow();
    });
  });

  describe("extractRepoName", () => {
    it('returns owner/repo for GitHub URLs', () => {
      const result = extractRepoName("https://github.com/org/repo", "github");
      expect(result).toBe("org/repo");
    });

    it('returns project/repo for ADO URLs', () => {
      const result = extractRepoName("https://dev.azure.com/org/proj/_git/repo", "ado");
      expect(result).toBe("proj/repo");
    });
  });
});

describe("slugify", () => {
  it('converts spaces to hyphens and lowercases', () => {
    expect(slugify("My Web App")).toBe("my-web-app");
  });

  it('removes parentheses and special chars', () => {
    expect(slugify("Test App (v2)")).toBe("test-app-v2");
  });

  it('trims whitespace and collapses spaces', () => {
    expect(slugify("  Hello  World  ")).toBe("hello-world");
  });

  it('collapses multiple hyphens', () => {
    expect(slugify("App---Name")).toBe("app-name");
  });
});

describe("PAT Validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateGitHubPat", () => {
    it('returns valid when 200 response with repo scope', async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockFetchResponse(200, { "X-OAuth-Scopes": "repo, user" })
      );

      const result = await validateGitHubPat("https://github.com/org/repo", "ghp_test123");
      expect(result).toEqual({ valid: true });
    });

    it('returns invalid with error message on 401 response', async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockFetchResponse(401)
      );

      const result = await validateGitHubPat("https://github.com/org/repo", "bad_token");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("Invalid PAT");
      }
    });

    it('returns scope error on 404 without repo scope', async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockFetchResponse(404, { "X-OAuth-Scopes": "user" })
      );

      const result = await validateGitHubPat("https://github.com/org/repo", "ghp_no_scope");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("repo scope");
      }
    });

    it('returns not found error on 404 with repo scope', async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockFetchResponse(404, { "X-OAuth-Scopes": "repo" })
      );

      const result = await validateGitHubPat("https://github.com/org/repo", "ghp_valid");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("not found");
      }
    });

    it('returns scope error on 200 without repo scope', async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockFetchResponse(200, { "X-OAuth-Scopes": "user, gist" })
      );

      const result = await validateGitHubPat("https://github.com/org/repo", "ghp_limited");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("repo scope");
      }
    });
  });

  describe("validateAdoPat", () => {
    it('returns valid on 200 response', async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockFetchResponse(200)
      );

      const result = await validateAdoPat(
        "https://dev.azure.com/org/project/_git/repo",
        "ado_pat_123",
        "org"
      );
      expect(result).toEqual({ valid: true });
    });

    it('returns invalid PAT error on 401 response', async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockFetchResponse(401)
      );

      const result = await validateAdoPat(
        "https://dev.azure.com/org/project/_git/repo",
        "bad_pat",
        "org"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("Invalid PAT");
      }
    });

    it('returns permission error on 403 response', async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockFetchResponse(403)
      );

      const result = await validateAdoPat(
        "https://dev.azure.com/org/project/_git/repo",
        "ado_limited",
        "org"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("Code (Read & Write)");
      }
    });

    it('returns not found error on 404 response', async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockFetchResponse(404)
      );

      const result = await validateAdoPat(
        "https://dev.azure.com/org/project/_git/repo",
        "ado_valid",
        "org"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("not found");
      }
    });
  });
});

describe("Repository CRUD", () => {
  beforeEach(() => {
    mockReset(mockPrisma);
  });

  describe("createRepository", () => {
    it("encrypts PAT before storing", async () => {
      const input = {
        provider: "github" as const,
        repoUrl: "https://github.com/org/repo",
        pat: "ghp_test123",
        organization: null,
        outputFolder: "tests/my-app",
        applicationId: "app-id-1",
      };

      mockPrisma.repository.create.mockResolvedValue({
        id: "repo-id-1",
        ...input,
        pat: "encrypted:ghp_test123",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await createRepository(input);

      expect(mockPrisma.repository.create).toHaveBeenCalledWith({
        data: {
          provider: "github",
          repoUrl: "https://github.com/org/repo",
          pat: "encrypted:ghp_test123",
          organization: null,
          outputFolder: "tests/my-app",
          applicationId: "app-id-1",
        },
      });
    });
  });

  describe("listRepositories", () => {
    it("returns repos for the given application", async () => {
      const now = new Date();
      const repos = [
        {
          id: "repo-1",
          provider: "github",
          repoUrl: "https://github.com/org/repo1",
          organization: null,
          outputFolder: "tests/app",
          applicationId: "app-id-1",
          createdAt: now,
          updatedAt: now,
        },
      ];

      mockPrisma.repository.findMany.mockResolvedValue(repos as any);

      const result = await listRepositories("app-id-1");

      expect(mockPrisma.repository.findMany).toHaveBeenCalledWith({
        where: { applicationId: "app-id-1" },
        select: {
          id: true,
          provider: true,
          repoUrl: true,
          organization: true,
          outputFolder: true,
          applicationId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("getRepository", () => {
    it("decrypts PAT on retrieval", async () => {
      const now = new Date();
      mockPrisma.repository.findUnique.mockResolvedValue({
        id: "repo-1",
        provider: "github",
        repoUrl: "https://github.com/org/repo",
        pat: "encrypted:ghp_test123",
        organization: null,
        outputFolder: "tests/app",
        applicationId: "app-id-1",
        createdAt: now,
        updatedAt: now,
      });

      const result = await getRepository("repo-1");

      expect(result).not.toBeNull();
      expect(result!.pat).toBe("ghp_test123");
    });

    it("returns null when not found", async () => {
      mockPrisma.repository.findUnique.mockResolvedValue(null);

      const result = await getRepository("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("updateRepository", () => {
    it("updates specified fields and encrypts PAT if provided", async () => {
      mockPrisma.repository.update.mockResolvedValue({
        id: "repo-1",
        provider: "github",
        repoUrl: "https://github.com/org/repo",
        pat: "encrypted:new_pat",
        organization: null,
        outputFolder: "tests/updated",
        applicationId: "app-id-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateRepository("repo-1", {
        outputFolder: "tests/updated",
        pat: "new_pat",
      });

      expect(mockPrisma.repository.update).toHaveBeenCalledWith({
        where: { id: "repo-1" },
        data: {
          outputFolder: "tests/updated",
          pat: "encrypted:new_pat",
        },
      });
    });

    it("does not include undefined fields in update data", async () => {
      mockPrisma.repository.update.mockResolvedValue({
        id: "repo-1",
        provider: "github",
        repoUrl: "https://github.com/org/repo",
        pat: "encrypted:ghp_test",
        organization: null,
        outputFolder: "tests/new-folder",
        applicationId: "app-id-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateRepository("repo-1", {
        outputFolder: "tests/new-folder",
      });

      const callArgs = mockPrisma.repository.update.mock.calls[0][0];
      expect(callArgs.data).toEqual({ outputFolder: "tests/new-folder" });
      expect(callArgs.data).not.toHaveProperty("pat");
    });
  });

  describe("deleteRepository", () => {
    it("calls prisma.repository.delete with the given id", async () => {
      mockPrisma.repository.delete.mockResolvedValue({
        id: "repo-1",
        provider: "github",
        repoUrl: "https://github.com/org/repo",
        pat: "encrypted:ghp_test",
        organization: null,
        outputFolder: "tests/app",
        applicationId: "app-id-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await deleteRepository("repo-1");

      expect(mockPrisma.repository.delete).toHaveBeenCalledWith({
        where: { id: "repo-1" },
      });
    });
  });
});

describe("Repository Zod Schema", () => {
  // Import schema lazily to avoid module resolution issues
  let repositorySchema: any;

  beforeEach(async () => {
    const mod = await import("../schemas/repository");
    repositorySchema = mod.repositorySchema;
  });

  it("accepts valid GitHub input", () => {
    const result = repositorySchema.safeParse({
      provider: "github",
      repoUrl: "https://github.com/org/repo",
      pat: "ghp_test123",
      outputFolder: "tests/my-app",
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid ADO input with organization", () => {
    const result = repositorySchema.safeParse({
      provider: "ado",
      repoUrl: "https://dev.azure.com/org/project/_git/repo",
      pat: "ado_pat_123",
      organization: "myorg",
      outputFolder: "tests/my-app",
    });

    expect(result.success).toBe(true);
  });

  it("rejects ADO input without organization", () => {
    const result = repositorySchema.safeParse({
      provider: "ado",
      repoUrl: "https://dev.azure.com/org/project/_git/repo",
      pat: "ado_pat_123",
      outputFolder: "tests/my-app",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid URL format for provider", () => {
    const result = repositorySchema.safeParse({
      provider: "github",
      repoUrl: "not-a-url",
      pat: "ghp_test123",
      outputFolder: "tests/my-app",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty PAT", () => {
    const result = repositorySchema.safeParse({
      provider: "github",
      repoUrl: "https://github.com/org/repo",
      pat: "",
      outputFolder: "tests/my-app",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty outputFolder", () => {
    const result = repositorySchema.safeParse({
      provider: "github",
      repoUrl: "https://github.com/org/repo",
      pat: "ghp_test123",
      outputFolder: "",
    });

    expect(result.success).toBe(false);
  });
});
