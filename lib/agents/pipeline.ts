import type { AgentName } from "@/lib/scenarios";
import {
  updateScenarioStatus,
  saveRefinedPrompt,
  saveGeneratedScript,
  savePrUrl,
  failScenario,
  getScenario,
} from "@/lib/scenarios";
import { getApplication } from "@/lib/applications";
import { getRepository } from "@/lib/repositories";
import { runAnalyst } from "./analyst";
import { runPromptBuilder } from "./prompt-builder";
import { runScriptGenerator } from "./script-generator";
import { runReviewer } from "./reviewer";
import { runPrCreator } from "./pr-creator";

// --- SSE Event Emitter ---

export type SSEEvent =
  | { event: "agent_start"; data: { agent: AgentName } }
  | { event: "agent_complete"; data: { agent: AgentName } }
  | { event: "agent_message"; data: { agent: AgentName; text: string } }
  | { event: "question"; data: { agent: AgentName; text: string; choices?: string[] } }
  | { event: "prompt_review"; data: { prompt: string } }
  | { event: "script"; data: { code: string } }
  | { event: "pr_created"; data: { url: string } }
  | { event: "error_event"; data: { agent?: AgentName; message: string } }
  | { event: "done"; data: Record<string, never> };

export type EventEmitter = (event: SSEEvent) => void;

/**
 * Per-scenario state for user interactions.
 * The SSE stream endpoint stores pending promises here that get resolved
 * when the user responds via the /respond endpoint.
 */
export type PendingInteraction =
  | { type: "question"; resolve: (answer: string) => void }
  | { type: "prompt_approval"; resolve: (result: { accepted: boolean; reason?: string }) => void };

// Use globalThis to persist across Turbopack HMR / module re-evaluations.
// Without this, the stream route and respond route may get different module
// instances, each with their own empty Map, causing 404s on respond.
const GLOBAL_KEY = "__testforge_pendingInteractions" as const;

function getPendingInteractions(): Map<string, PendingInteraction> {
  const g = globalThis as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new Map<string, PendingInteraction>();
  }
  return g[GLOBAL_KEY] as Map<string, PendingInteraction>;
}

export function setPendingInteraction(scenarioId: string, interaction: PendingInteraction) {
  getPendingInteractions().set(scenarioId, interaction);
}

export function resolvePendingInteraction(scenarioId: string, response: unknown) {
  const map = getPendingInteractions();
  const interaction = map.get(scenarioId);
  if (!interaction) return false;

  map.delete(scenarioId);

  if (interaction.type === "question") {
    interaction.resolve(response as string);
  } else if (interaction.type === "prompt_approval") {
    interaction.resolve(response as { accepted: boolean; reason?: string });
  }
  return true;
}

// --- Pipeline Context ---

export interface PipelineContext {
  scenarioId: string;
  inputText: string;
  applicationName: string;
  applicationUrl: string;
  /** Decrypted application credentials for browser login */
  applicationUsername: string;
  applicationPassword: string;
  repositoryUrl: string;
  repositoryProvider: string;
  outputFolder: string;
  /** Decrypted PAT for git operations */
  repositoryPat: string;
  /** ADO organization name (null for GitHub repos) */
  repositoryOrganization: string | null;
  emit: EventEmitter;
  /** Ask a question and wait for user response */
  askQuestion: (agent: AgentName, text: string, choices?: string[]) => Promise<string>;
  /** Show prompt for approval and wait for user decision */
  requestPromptApproval: (prompt: string) => Promise<{ accepted: boolean; reason?: string }>;
}

// --- Pipeline Runner ---

export async function runPipeline(scenarioId: string, emit: EventEmitter) {
  const scenario = await getScenario(scenarioId);
  if (!scenario) {
    emit({ event: "error_event", data: { message: "Scenario not found" } });
    emit({ event: "done", data: {} });
    return;
  }

  // Fetch full records with decrypted credentials
  const application = await getApplication(scenario.applicationId);
  if (!application) {
    emit({ event: "error_event", data: { message: "Application not found" } });
    emit({ event: "done", data: {} });
    return;
  }

  const repository = await getRepository(scenario.repositoryId);
  if (!repository) {
    emit({ event: "error_event", data: { message: "Repository not found" } });
    emit({ event: "done", data: {} });
    return;
  }

  const ctx: PipelineContext = {
    scenarioId,
    inputText: scenario.inputText,
    applicationName: application.name,
    applicationUrl: application.testUrl,
    applicationUsername: application.testUsername,
    applicationPassword: application.testPassword,
    repositoryUrl: repository.repoUrl,
    repositoryProvider: repository.provider,
    outputFolder: repository.outputFolder,
    repositoryPat: repository.pat,
    repositoryOrganization: repository.organization,
    emit,
    askQuestion: (agent, text, choices) => {
      return new Promise<string>((resolve) => {
        setPendingInteraction(scenarioId, { type: "question", resolve });
        emit({ event: "question", data: { agent, text, choices } });
      });
    },
    requestPromptApproval: (prompt) => {
      return new Promise<{ accepted: boolean; reason?: string }>((resolve) => {
        setPendingInteraction(scenarioId, { type: "prompt_approval", resolve });
        emit({ event: "prompt_review", data: { prompt } });
      });
    },
  };

  try {
    await updateScenarioStatus(scenarioId, "in_progress", "analyst");

    // --- Agent 1: Analyst ---
    emit({ event: "agent_start", data: { agent: "analyst" } });
    const analystResult = await runAnalyst(ctx);
    emit({ event: "agent_complete", data: { agent: "analyst" } });

    // --- Agent 2: Prompt Builder ---
    await updateScenarioStatus(scenarioId, "in_progress", "prompt_builder");
    emit({ event: "agent_start", data: { agent: "prompt_builder" } });
    const refinedPrompt = await runPromptBuilder(ctx, analystResult);
    await saveRefinedPrompt(scenarioId, refinedPrompt);
    emit({ event: "agent_complete", data: { agent: "prompt_builder" } });

    // --- Agent 3: Script Generator ---
    await updateScenarioStatus(scenarioId, "in_progress", "script_generator");
    emit({ event: "agent_start", data: { agent: "script_generator" } });
    const script = await runScriptGenerator(ctx, refinedPrompt);
    await saveGeneratedScript(scenarioId, script);
    emit({ event: "script", data: { code: script } });
    emit({ event: "agent_complete", data: { agent: "script_generator" } });

    // --- Agent 4: Reviewer ---
    await updateScenarioStatus(scenarioId, "in_progress", "reviewer");
    emit({ event: "agent_start", data: { agent: "reviewer" } });
    const reviewedScript = await runReviewer(ctx, script);
    if (reviewedScript !== script) {
      await saveGeneratedScript(scenarioId, reviewedScript);
      emit({ event: "script", data: { code: reviewedScript } });
    }
    emit({ event: "agent_complete", data: { agent: "reviewer" } });

    // --- Agent 5: PR Creator ---
    await updateScenarioStatus(scenarioId, "in_progress", "pr_creator");
    emit({ event: "agent_start", data: { agent: "pr_creator" } });
    const prUrl = await runPrCreator(ctx, reviewedScript);
    await savePrUrl(scenarioId, prUrl);
    emit({ event: "pr_created", data: { url: prUrl } });
    emit({ event: "agent_complete", data: { agent: "pr_creator" } });

    emit({ event: "done", data: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    await failScenario(scenarioId, message);
    emit({ event: "error_event", data: { message } });
    emit({ event: "done", data: {} });
  }
}
