import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient } from "../../generated/prisma/client";

// Mock prisma before importing the module under test
vi.mock("../prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from "../prisma";
import {
  createScenario,
  listScenarios,
  getScenario,
  listAllRepositoriesGrouped,
} from "../scenarios";

const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("scenarios service", () => {
  beforeEach(() => {
    mockReset(mockPrisma);
  });

  describe("createScenario", () => {
    it("creates a scenario with status queued", async () => {
      const input = {
        inputText: "Navigate to the login page and verify the title",
        applicationId: "app-id-1",
        repositoryId: "repo-id-1",
      };

      const now = new Date();
      mockPrisma.scenario.create.mockResolvedValue({
        id: "scenario-id-1",
        type: "smoke",
        inputText: input.inputText,
        status: "queued",
        currentAgent: null,
        refinedPrompt: null,
        testPlan: null,
        generatedScript: null,
        prUrl: null,
        errorMessage: null,
        applicationId: input.applicationId,
        repositoryId: input.repositoryId,
        createdAt: now,
        updatedAt: now,
      });

      await createScenario(input);

      expect(mockPrisma.scenario.create).toHaveBeenCalledWith({
        data: {
          type: "smoke",
          inputText: input.inputText,
          applicationId: input.applicationId,
          repositoryId: input.repositoryId,
          status: "queued",
        },
      });
    });

    it("stores inputText, applicationId, and repositoryId", async () => {
      const input = {
        inputText: "Fill in the search box and click search button",
        applicationId: "app-id-2",
        repositoryId: "repo-id-2",
      };

      const now = new Date();
      mockPrisma.scenario.create.mockResolvedValue({
        id: "scenario-id-2",
        type: "smoke",
        inputText: input.inputText,
        status: "queued",
        currentAgent: null,
        refinedPrompt: null,
        testPlan: null,
        generatedScript: null,
        prUrl: null,
        errorMessage: null,
        applicationId: input.applicationId,
        repositoryId: input.repositoryId,
        createdAt: now,
        updatedAt: now,
      });

      const result = await createScenario(input);

      expect(result.inputText).toBe(input.inputText);
      expect(result.applicationId).toBe(input.applicationId);
      expect(result.repositoryId).toBe(input.repositoryId);
      expect(result.status).toBe("queued");
    });
  });

  describe("listScenarios", () => {
    it("returns scenarios ordered by createdAt descending", async () => {
      mockPrisma.scenario.findMany.mockResolvedValue([]);

      await listScenarios();

      expect(mockPrisma.scenario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });

    it("includes application name in results", async () => {
      const now = new Date();
      const scenarios = [
        {
          id: "s1",
          inputText: "Test scenario",
          status: "queued",
          applicationId: "app-1",
          repositoryId: "repo-1",
          createdAt: now,
          updatedAt: now,
          application: { name: "My App" },
          repository: { repoUrl: "https://github.com/org/repo", provider: "github" },
        },
      ];

      mockPrisma.scenario.findMany.mockResolvedValue(scenarios as any);

      const result = await listScenarios();

      expect(result[0].application.name).toBe("My App");
    });

    it("includes repository URL and provider in results", async () => {
      const now = new Date();
      const scenarios = [
        {
          id: "s1",
          inputText: "Test scenario",
          status: "queued",
          applicationId: "app-1",
          repositoryId: "repo-1",
          createdAt: now,
          updatedAt: now,
          application: { name: "My App" },
          repository: { repoUrl: "https://github.com/org/repo", provider: "github" },
        },
      ];

      mockPrisma.scenario.findMany.mockResolvedValue(scenarios as any);

      const result = await listScenarios();

      expect(result[0].repository.repoUrl).toBe("https://github.com/org/repo");
      expect(result[0].repository.provider).toBe("github");
    });

    it("returns empty array when no scenarios exist", async () => {
      mockPrisma.scenario.findMany.mockResolvedValue([]);

      const result = await listScenarios();

      expect(result).toEqual([]);
    });
  });

  describe("getScenario", () => {
    it("returns full scenario with application and repository details", async () => {
      const now = new Date();
      const scenario = {
        id: "s1",
        inputText: "Navigate to login page",
        status: "completed",
        refinedPrompt: "Refined: Navigate to login page",
        generatedScript: "await page.goto('/login');",
        errorMessage: null,
        applicationId: "app-1",
        repositoryId: "repo-1",
        createdAt: now,
        updatedAt: now,
        application: { name: "My App", testUrl: "https://example.com" },
        repository: { repoUrl: "https://github.com/org/repo", provider: "github", outputFolder: "tests/app" },
      };

      mockPrisma.scenario.findUnique.mockResolvedValue(scenario as any);

      const result = await getScenario("s1");

      expect(result).not.toBeNull();
      expect(result!.application.name).toBe("My App");
      expect(result!.application.testUrl).toBe("https://example.com");
      expect(result!.repository.repoUrl).toBe("https://github.com/org/repo");
      expect(result!.repository.provider).toBe("github");
      expect(result!.repository.outputFolder).toBe("tests/app");
    });

    it("includes nullable fields (refinedPrompt, generatedScript, errorMessage)", async () => {
      const now = new Date();
      const scenario = {
        id: "s1",
        inputText: "Test scenario text",
        status: "queued",
        refinedPrompt: null,
        generatedScript: null,
        errorMessage: null,
        applicationId: "app-1",
        repositoryId: "repo-1",
        createdAt: now,
        updatedAt: now,
        application: { name: "My App", testUrl: "https://example.com" },
        repository: { repoUrl: "https://github.com/org/repo", provider: "github", outputFolder: "tests/app" },
      };

      mockPrisma.scenario.findUnique.mockResolvedValue(scenario as any);

      const result = await getScenario("s1");

      expect(result).not.toBeNull();
      expect(result!.refinedPrompt).toBeNull();
      expect(result!.generatedScript).toBeNull();
      expect(result!.errorMessage).toBeNull();
    });

    it("returns null when scenario not found", async () => {
      mockPrisma.scenario.findUnique.mockResolvedValue(null);

      const result = await getScenario("nonexistent-id");

      expect(result).toBeNull();
    });
  });

  describe("listAllRepositoriesGrouped", () => {
    it("returns repositories grouped by applicationId", async () => {
      const repos = [
        { id: "r1", provider: "github", repoUrl: "https://github.com/org/repo1", applicationId: "app-1" },
        { id: "r2", provider: "ado", repoUrl: "https://dev.azure.com/org/proj/_git/repo2", applicationId: "app-1" },
        { id: "r3", provider: "github", repoUrl: "https://github.com/org/repo3", applicationId: "app-2" },
      ];

      mockPrisma.repository.findMany.mockResolvedValue(repos as any);

      const result = await listAllRepositoriesGrouped();

      expect(Object.keys(result)).toHaveLength(2);
      expect(result["app-1"]).toHaveLength(2);
      expect(result["app-2"]).toHaveLength(1);
    });

    it("returns empty object when no repositories exist", async () => {
      mockPrisma.repository.findMany.mockResolvedValue([]);

      const result = await listAllRepositoriesGrouped();

      expect(result).toEqual({});
    });

    it("includes provider, repoUrl, and id in each grouped item", async () => {
      const repos = [
        { id: "r1", provider: "github", repoUrl: "https://github.com/org/repo1", applicationId: "app-1" },
      ];

      mockPrisma.repository.findMany.mockResolvedValue(repos as any);

      const result = await listAllRepositoriesGrouped();

      expect(result["app-1"][0]).toEqual({
        id: "r1",
        provider: "github",
        repoUrl: "https://github.com/org/repo1",
      });
    });
  });
});
