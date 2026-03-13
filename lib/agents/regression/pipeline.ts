import type { RegressionAgentName } from "@/lib/scenarios";
import {
  updateScenarioStatus,
  saveTestPlan,
  saveGeneratedScript,
  savePrUrl,
  failScenario,
  getScenario,
} from "@/lib/scenarios";
import { getApplication } from "@/lib/applications";
import { getRepository } from "@/lib/repositories";
import { runPlanner, regeneratePlan } from "./planner";
import { runGenerator } from "./generator";
import { runHealer } from "./healer";
import { runPrCreator } from "../pr-creator";
import {
  setPendingInteraction,
  resolvePendingInteraction,
  type PendingInteraction,
} from "../pipeline";

// --- SSE Event Emitter ---

export type RegressionSSEEvent =
  | { event: "agent_start"; data: { agent: RegressionAgentName } }
  | { event: "agent_complete"; data: { agent: RegressionAgentName } }
  | { event: "agent_message"; data: { agent: RegressionAgentName; text: string } }
  | { event: "plan_review"; data: { plan: string } }
  | { event: "script"; data: { code: string } }
  | { event: "pr_created"; data: { url: string } }
  | { event: "error_event"; data: { agent?: RegressionAgentName; message: string } }
  | { event: "done"; data: Record<string, never> };

export type RegressionEventEmitter = (event: RegressionSSEEvent) => void;

// Re-export for API routes
export { resolvePendingInteraction };

// --- Pipeline Context ---

export interface RegressionPipelineContext {
  scenarioId: string;
  targetUrl: string;
  applicationName: string;
  applicationUrl: string;
  applicationUsername: string;
  applicationPassword: string;
  repositoryUrl: string;
  repositoryProvider: string;
  outputFolder: string;
  repositoryPat: string;
  repositoryOrganization: string | null;
  emit: RegressionEventEmitter;
  /** Show plan for approval and wait for user decision */
  requestPlanApproval: (plan: string) => Promise<{ accepted: boolean; reason?: string }>;
}

// --- Pipeline Runner ---

export async function runRegressionPipeline(
  scenarioId: string,
  emit: RegressionEventEmitter
) {
  const scenario = await getScenario(scenarioId);
  if (!scenario) {
    emit({ event: "error_event", data: { message: "Scenario not found" } });
    emit({ event: "done", data: {} });
    return;
  }

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

  const ctx: RegressionPipelineContext = {
    scenarioId,
    targetUrl: scenario.inputText, // For regression, inputText stores the target URL
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
    requestPlanApproval: (plan) => {
      return new Promise<{ accepted: boolean; reason?: string }>((resolve) => {
        setPendingInteraction(scenarioId, {
          type: "prompt_approval",
          resolve,
        } as PendingInteraction);
        emit({ event: "plan_review", data: { plan } });
      });
    },
  };

  try {
    // --- Agent 1: Planner ---
    await updateScenarioStatus(scenarioId, "in_progress", "planner");
    emit({ event: "agent_start", data: { agent: "planner" } });

    let testPlan = await runPlanner(ctx);

    // Plan approval loop (unlimited revisions)
    while (true) {
      const result = await ctx.requestPlanApproval(testPlan);

      if (result.accepted) {
        await saveTestPlan(scenarioId, testPlan);
        emit({
          event: "agent_message",
          data: { agent: "planner", text: "Plan approved. Proceeding to script generation." },
        });
        break;
      }

      // Regenerate from memory (no re-browsing)
      testPlan = await regeneratePlan(ctx, testPlan, result.reason || "Please revise");
    }

    emit({ event: "agent_complete", data: { agent: "planner" } });

    // --- Agent 2: Generator ---
    await updateScenarioStatus(scenarioId, "in_progress", "generator");
    emit({ event: "agent_start", data: { agent: "generator" } });
    const script = await runGenerator(ctx, testPlan);
    await saveGeneratedScript(scenarioId, script);
    emit({ event: "script", data: { code: script } });
    emit({ event: "agent_complete", data: { agent: "generator" } });

    // --- Agent 3: Healer ---
    await updateScenarioStatus(scenarioId, "in_progress", "healer");
    emit({ event: "agent_start", data: { agent: "healer" } });
    const healedScript = await runHealer(ctx, script);
    if (healedScript !== script) {
      await saveGeneratedScript(scenarioId, healedScript);
      emit({ event: "script", data: { code: healedScript } });
    }
    emit({ event: "agent_complete", data: { agent: "healer" } });

    // --- Silent PR Creation (not shown in pipeline bar) ---
    emit({
      event: "agent_message",
      data: { agent: "healer", text: "Creating pull request..." },
    });

    // Reuse the smoke testing PR Creator with an adapted context
    const prCompatCtx = {
      ...ctx,
      inputText: ctx.targetUrl,
      emit: ctx.emit as unknown as import("../pipeline").EventEmitter,
      askQuestion: () => Promise.resolve(""),
      requestPromptApproval: () => Promise.resolve({ accepted: true }),
    };
    const prUrl = await runPrCreator(prCompatCtx, healedScript, "regression");
    await savePrUrl(scenarioId, prUrl);
    emit({ event: "pr_created", data: { url: prUrl } });

    emit({ event: "done", data: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    await failScenario(scenarioId, message);
    emit({ event: "error_event", data: { message } });
    emit({ event: "done", data: {} });
  }
}
