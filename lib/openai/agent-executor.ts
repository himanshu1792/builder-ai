import { openai } from './client';
import { db } from '@/lib/db';
import { executionLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { validatePlaceholders, replacePlaceholders } from '@/lib/utils/prompt-placeholders';

export interface AgentConfig {
  id: string;
  name: string;
  slug: string;
  systemPrompt: string;
  taskPrompt: string;
  outputSchema: unknown;
  model: string;
  temperature: number | null;
  promptPlaceholders: string[];
}

export interface ExecutionResult {
  result: unknown;
  executionId: string;
  model: string;
  durationMs: number;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface ExecutionContext {
  orchestrationId?: string;
  orchestrationRunId?: string;
  stepOrder?: number;
}

/**
 * Recursively enforces OpenAI strict structured outputs requirements:
 * - "additionalProperties": false on every object
 * - "required": [...all property keys] on every object with properties
 */
function enforceStrictSchema(schema: unknown): unknown {
  if (schema === null || schema === undefined || typeof schema !== 'object') {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(enforceStrictSchema);
  }

  const obj = schema as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    result[key] = enforceStrictSchema(value);
  }

  // If this looks like an object type schema, enforce strict requirements
  if (result['type'] === 'object' || result['properties']) {
    result['additionalProperties'] = false;

    // Add "required" with all property keys if properties exist
    if (result['properties'] && typeof result['properties'] === 'object' && !Array.isArray(result['properties'])) {
      result['required'] = Object.keys(result['properties'] as Record<string, unknown>);
    }
  }

  return result;
}

export async function executeAgent(
  agent: AgentConfig,
  payload: Record<string, unknown>,
  context?: ExecutionContext
): Promise<ExecutionResult> {
  const executionId = createId();
  const startTime = Date.now();

  // Create initial log entry
  await db.insert(executionLogs).values({
    id: executionId,
    agentId: agent.id,
    orchestrationId: context?.orchestrationId ?? null,
    orchestrationRunId: context?.orchestrationRunId ?? null,
    stepOrder: context?.stepOrder ?? null,
    inputPayload: payload,
    status: 'running',
    model: agent.model,
  });

  try {
    // Validate and replace placeholders
    const placeholders = agent.promptPlaceholders ?? [];
    if (placeholders.length > 0) {
      const validation = validatePlaceholders(placeholders, payload);
      if (!validation.valid) {
        throw new Error(
          `Missing required placeholders: ${validation.missing.join(', ')}`
        );
      }
    }

    // Replace placeholders in prompts and separate placeholder values from remaining payload
    let resolvedSystemPrompt = agent.systemPrompt;
    let resolvedTaskPrompt = agent.taskPrompt;
    let remainingPayload = payload;

    if (placeholders.length > 0) {
      resolvedSystemPrompt = replacePlaceholders(agent.systemPrompt, payload);
      resolvedTaskPrompt = replacePlaceholders(agent.taskPrompt, payload);

      // Remove placeholder keys from payload — remaining fields go as Input JSON
      remainingPayload = Object.fromEntries(
        Object.entries(payload).filter(([key]) => !placeholders.includes(key))
      );
    }

    // Build messages
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      { role: 'system', content: resolvedSystemPrompt },
      {
        role: 'user',
        content: Object.keys(remainingPayload).length > 0
          ? `${resolvedTaskPrompt}\n\nInput:\n${JSON.stringify(remainingPayload, null, 2)}`
          : resolvedTaskPrompt,
      },
    ];

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: agent.model,
      messages,
      temperature: agent.temperature ?? 0.7,
      ...(agent.outputSchema
        ? {
            response_format: {
              type: 'json_schema' as const,
              json_schema: {
                name: 'agent_output',
                strict: true,
                schema: enforceStrictSchema(agent.outputSchema) as Record<string, unknown>,
              },
            },
          }
        : {
            response_format: { type: 'json_object' as const },
          }),
    });

    const durationMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content ?? '{}';
    const usage = response.usage;

    // Parse output
    let result: unknown;
    try {
      result = JSON.parse(content);
    } catch {
      result = { raw: content };
    }

    const tokensUsed = {
      prompt: usage?.prompt_tokens ?? 0,
      completion: usage?.completion_tokens ?? 0,
      total: usage?.total_tokens ?? 0,
    };

    // Update log with success
    await db
      .update(executionLogs)
      .set({
        outputPayload: result as Record<string, unknown>,
        status: 'completed',
        promptTokens: tokensUsed.prompt,
        completionTokens: tokensUsed.completion,
        totalTokens: tokensUsed.total,
        durationMs,
      })
      .where(eq(executionLogs.id, executionId));

    return {
      result,
      executionId,
      model: agent.model,
      durationMs,
      tokensUsed,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update log with failure
    await db
      .update(executionLogs)
      .set({
        status: 'failed',
        errorMessage,
        durationMs,
      })
      .where(eq(executionLogs.id, executionId));

    throw error;
  }
}
