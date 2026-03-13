import { db } from '@/lib/db';
import { orchestrations, orchestrationSteps, agents } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { executeAgent, type AgentConfig, type ExecutionResult } from './agent-executor';
import { applyInputMapping, type InputMapping } from '@/lib/utils/input-mapper';

export interface StepResult {
  agent: string;
  agentId: string;
  stepOrder: number;
  status: 'completed' | 'failed';
  durationMs: number;
  tokensUsed: number;
  output?: unknown;
  error?: string;
}

export interface OrchestrationResult {
  result: unknown;
  orchestrationRunId: string;
  steps: StepResult[];
  totalDurationMs: number;
  totalTokensUsed: number;
}

export async function executeOrchestration(
  orchestrationId: string,
  payload: Record<string, unknown>
): Promise<OrchestrationResult> {
  const orchestrationRunId = createId();
  const overallStart = Date.now();

  // Load orchestration
  const [orchestration] = await db
    .select()
    .from(orchestrations)
    .where(eq(orchestrations.id, orchestrationId));

  if (!orchestration) {
    throw new Error('Orchestration not found');
  }

  if (!orchestration.isActive) {
    throw new Error('Orchestration is not active');
  }

  // Load steps with agent details, ordered by step_order
  const steps = await db
    .select({
      step: orchestrationSteps,
      agent: agents,
    })
    .from(orchestrationSteps)
    .innerJoin(agents, eq(orchestrationSteps.agentId, agents.id))
    .where(eq(orchestrationSteps.orchestrationId, orchestrationId))
    .orderBy(asc(orchestrationSteps.stepOrder));

  if (steps.length === 0) {
    throw new Error('Orchestration has no steps');
  }

  const stepResults: StepResult[] = [];
  let currentInput = payload;
  let lastResult: ExecutionResult | null = null;

  // Execute each step sequentially
  for (const { step, agent } of steps) {
    try {
      const agentConfig: AgentConfig = {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        systemPrompt: agent.systemPrompt,
        taskPrompt: agent.taskPrompt,
        outputSchema: agent.outputSchema,
        model: agent.model,
        temperature: agent.temperature,
        promptPlaceholders: (agent.promptPlaceholders as string[]) ?? [],
      };

      const result = await executeAgent(agentConfig, currentInput, {
        orchestrationId: orchestration.id,
        orchestrationRunId,
        stepOrder: step.stepOrder,
      });

      lastResult = result;

      stepResults.push({
        agent: agent.slug,
        agentId: agent.id,
        stepOrder: step.stepOrder,
        status: 'completed',
        durationMs: result.durationMs,
        tokensUsed: result.tokensUsed.total,
        output: result.result,
      });

      // Apply input mapping for next step
      const outputForNext = result.result as Record<string, unknown>;
      currentInput = applyInputMapping(
        outputForNext,
        step.inputMapping as InputMapping | null
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      stepResults.push({
        agent: agent.slug,
        agentId: agent.id,
        stepOrder: step.stepOrder,
        status: 'failed',
        durationMs: Date.now() - overallStart,
        tokensUsed: 0,
        error: errorMessage,
      });

      // Stop chain on failure
      const totalDurationMs = Date.now() - overallStart;
      const totalTokensUsed = stepResults.reduce((sum, s) => sum + s.tokensUsed, 0);

      throw {
        error: `Orchestration failed at step ${step.stepOrder}`,
        failedStep: {
          stepOrder: step.stepOrder,
          agent: agent.slug,
          error: errorMessage,
        },
        completedSteps: stepResults.filter((s) => s.status === 'completed'),
        orchestrationRunId,
        totalDurationMs,
        totalTokensUsed,
      };
    }
  }

  const totalDurationMs = Date.now() - overallStart;
  const totalTokensUsed = stepResults.reduce((sum, s) => sum + s.tokensUsed, 0);

  return {
    result: lastResult?.result ?? null,
    orchestrationRunId,
    steps: stepResults,
    totalDurationMs,
    totalTokensUsed,
  };
}
