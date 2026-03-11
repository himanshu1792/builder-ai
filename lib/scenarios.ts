import { prisma } from "./prisma";

// --- Types ---

/** Input for creating a new scenario */
export type ScenarioInput = {
  inputText: string;
  applicationId: string;
  repositoryId: string;
};

/** Scenario list item with related application name and repository info */
export type ScenarioListItem = {
  id: string;
  inputText: string;
  status: string;
  applicationId: string;
  repositoryId: string;
  createdAt: Date;
  updatedAt: Date;
  application: { name: string };
  repository: { repoUrl: string; provider: string };
};

/** Full scenario view including nullable fields and detailed relations */
export type ScenarioView = {
  id: string;
  inputText: string;
  status: string;
  refinedPrompt: string | null;
  generatedScript: string | null;
  errorMessage: string | null;
  applicationId: string;
  repositoryId: string;
  createdAt: Date;
  updatedAt: Date;
  application: { name: string; testUrl: string };
  repository: { repoUrl: string; provider: string; outputFolder: string };
};

/** Repositories grouped by applicationId for dependent dropdown */
export type GroupedRepositories = Record<
  string,
  Array<{ id: string; provider: string; repoUrl: string }>
>;

// --- Service Functions ---

/**
 * Create a new scenario with status "queued".
 * The scenario stores the user's plain-English input text and links to
 * the target application and repository.
 */
export async function createScenario(input: ScenarioInput) {
  return prisma.scenario.create({
    data: {
      inputText: input.inputText,
      applicationId: input.applicationId,
      repositoryId: input.repositoryId,
      status: "queued",
    },
  });
}

/**
 * List all scenarios with application name and repository info.
 * Ordered by most recently created first.
 */
export async function listScenarios(): Promise<ScenarioListItem[]> {
  return prisma.scenario.findMany({
    select: {
      id: true,
      inputText: true,
      status: true,
      applicationId: true,
      repositoryId: true,
      createdAt: true,
      updatedAt: true,
      application: {
        select: { name: true },
      },
      repository: {
        select: { repoUrl: true, provider: true },
      },
    },
    orderBy: { createdAt: "desc" },
  }) as Promise<ScenarioListItem[]>;
}

/**
 * Get a single scenario by ID with full details.
 * Includes application name/testUrl and repository repoUrl/provider/outputFolder.
 * Returns null if not found.
 */
export async function getScenario(id: string): Promise<ScenarioView | null> {
  const scenario = await prisma.scenario.findUnique({
    where: { id },
    include: {
      application: {
        select: { name: true, testUrl: true },
      },
      repository: {
        select: { repoUrl: true, provider: true, outputFolder: true },
      },
    },
  });

  if (!scenario) return null;

  return scenario as unknown as ScenarioView;
}

/**
 * Fetch all repositories and group them by applicationId.
 * Used by the scenario creation form to populate a dependent dropdown:
 * user selects an application, then sees only that application's repositories.
 */
export async function listAllRepositoriesGrouped(): Promise<GroupedRepositories> {
  const repos = await prisma.repository.findMany({
    select: {
      id: true,
      provider: true,
      repoUrl: true,
      applicationId: true,
    },
  });

  const grouped: GroupedRepositories = {};

  for (const repo of repos) {
    if (!grouped[repo.applicationId]) {
      grouped[repo.applicationId] = [];
    }
    grouped[repo.applicationId].push({
      id: repo.id,
      provider: repo.provider,
      repoUrl: repo.repoUrl,
    });
  }

  return grouped;
}
