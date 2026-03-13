import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents, modelPricing } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { playgroundRunSchema } from '@/lib/validation/playground';
import { executeAgent } from '@/lib/openai/agent-executor';
import { executeOrchestration } from '@/lib/openai/orchestration-executor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = playgroundRunSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: parsed.error.message },
        { status: 400 }
      );
    }

    if (parsed.data.type === 'agent') {
      // Execute single agent
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, parsed.data.agentId));

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      const result = await executeAgent(
        {
          id: agent.id,
          name: agent.name,
          slug: agent.slug,
          systemPrompt: agent.systemPrompt,
          taskPrompt: agent.taskPrompt,
          outputSchema: agent.outputSchema,
          model: agent.model,
          temperature: agent.temperature,
          promptPlaceholders: (agent.promptPlaceholders as string[]) ?? [],
        },
        parsed.data.payload
      );

      // Calculate estimated cost
      const [pricing] = await db
        .select()
        .from(modelPricing)
        .where(eq(modelPricing.modelId, agent.model));

      let estimatedCost = 0;
      if (pricing) {
        estimatedCost =
          (result.tokensUsed.prompt / 1000) * Number(pricing.inputPricePer1k) +
          (result.tokensUsed.completion / 1000) * Number(pricing.outputPricePer1k);
      }

      return NextResponse.json({
        ...result,
        estimatedCost: `$${estimatedCost.toFixed(6)}`,
      });
    } else {
      // Execute orchestration
      const result = await executeOrchestration(
        parsed.data.orchestrationId,
        parsed.data.payload
      );

      // Calculate total estimated cost
      const pricing = await db.select().from(modelPricing);
      const priceMap = new Map(pricing.map((p) => [p.modelId, p]));

      let totalEstimatedCost = 0;
      for (const step of result.steps) {
        // Look up the agent's model for cost calculation
        const [agent] = await db
          .select()
          .from(agents)
          .where(eq(agents.id, step.agentId));

        if (agent) {
          const price = priceMap.get(agent.model);
          if (price) {
            // We only have total tokens per step; estimate 60/40 prompt/completion split
            const promptTokens = Math.round(step.tokensUsed * 0.6);
            const completionTokens = step.tokensUsed - promptTokens;
            totalEstimatedCost +=
              (promptTokens / 1000) * Number(price.inputPricePer1k) +
              (completionTokens / 1000) * Number(price.outputPricePer1k);
          }
        }
      }

      return NextResponse.json({
        ...result,
        estimatedCost: `$${totalEstimatedCost.toFixed(6)}`,
      });
    }
  } catch (error) {
    // Check if this is a structured orchestration failure
    if (error && typeof error === 'object' && 'failedStep' in error) {
      return NextResponse.json(error, { status: 500 });
    }

    console.error('Playground execution failed:', error);
    return NextResponse.json(
      { error: 'Execution failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    );
  }
}
