import { db } from '@/lib/db';
import { executionLogs, modelPricing, agents } from '@/lib/db/schema';
import { eq, and, gte, lt, inArray } from 'drizzle-orm';

export interface ModelCostBreakdown {
  model: string;
  displayName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface AgentCostBreakdown {
  agentId: string;
  agentName: string;
  totalTokens: number;
  totalCost: number;
}

export interface DailyCostTrend {
  date: string;
  tokens: number;
  cost: number;
}

export interface BillingBreakdown {
  applicationId: string;
  month: string;
  totalCost: number;
  totalTokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  byModel: ModelCostBreakdown[];
  byAgent: AgentCostBreakdown[];
  dailyTrend: DailyCostTrend[];
}

export async function calculateBilling(
  applicationId: string,
  month: string // YYYY-MM format
): Promise<BillingBreakdown> {
  const startDate = new Date(`${month}-01T00:00:00Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  // Get all agent IDs for this application
  const appAgents = await db
    .select({ id: agents.id, name: agents.name })
    .from(agents)
    .where(eq(agents.applicationId, applicationId));

  const agentIds = appAgents.map((a) => a.id);

  if (agentIds.length === 0) {
    return {
      applicationId,
      month,
      totalCost: 0,
      totalTokens: { prompt: 0, completion: 0, total: 0 },
      byModel: [],
      byAgent: [],
      dailyTrend: [],
    };
  }

  // Get all execution logs for these agents in the given month
  const logs = await db
    .select()
    .from(executionLogs)
    .where(
      and(
        inArray(executionLogs.agentId, agentIds),
        gte(executionLogs.createdAt, startDate),
        lt(executionLogs.createdAt, endDate),
        eq(executionLogs.status, 'completed')
      )
    );

  // Get all model pricing
  const pricing = await db.select().from(modelPricing);
  const priceMap = new Map(pricing.map((p) => [p.modelId, p]));

  // Aggregate by model
  const modelMap = new Map<string, ModelCostBreakdown>();
  for (const log of logs) {
    if (!log.model || !log.promptTokens || !log.completionTokens) continue;

    const price = priceMap.get(log.model);
    const inputPrice = price ? Number(price.inputPricePer1k) : 0;
    const outputPrice = price ? Number(price.outputPricePer1k) : 0;

    const existing = modelMap.get(log.model) ?? {
      model: log.model,
      displayName: price?.displayName ?? log.model,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
    };

    existing.promptTokens += log.promptTokens;
    existing.completionTokens += log.completionTokens;
    existing.totalTokens += (log.totalTokens ?? 0);
    existing.inputCost += (log.promptTokens / 1000) * inputPrice;
    existing.outputCost += (log.completionTokens / 1000) * outputPrice;
    existing.totalCost = existing.inputCost + existing.outputCost;

    modelMap.set(log.model, existing);
  }

  // Aggregate by agent
  const agentMap = new Map<string, AgentCostBreakdown>();
  const agentNameMap = new Map(appAgents.map((a) => [a.id, a.name]));

  for (const log of logs) {
    if (!log.agentId || !log.model) continue;

    const price = priceMap.get(log.model);
    const inputPrice = price ? Number(price.inputPricePer1k) : 0;
    const outputPrice = price ? Number(price.outputPricePer1k) : 0;
    const logCost =
      ((log.promptTokens ?? 0) / 1000) * inputPrice +
      ((log.completionTokens ?? 0) / 1000) * outputPrice;

    const existing = agentMap.get(log.agentId) ?? {
      agentId: log.agentId,
      agentName: agentNameMap.get(log.agentId) ?? 'Unknown',
      totalTokens: 0,
      totalCost: 0,
    };

    existing.totalTokens += (log.totalTokens ?? 0);
    existing.totalCost += logCost;

    agentMap.set(log.agentId, existing);
  }

  // Aggregate by day
  const dayMap = new Map<string, DailyCostTrend>();
  for (const log of logs) {
    if (!log.createdAt || !log.model) continue;

    const dateStr = log.createdAt.toISOString().split('T')[0];
    const price = priceMap.get(log.model);
    const inputPrice = price ? Number(price.inputPricePer1k) : 0;
    const outputPrice = price ? Number(price.outputPricePer1k) : 0;
    const logCost =
      ((log.promptTokens ?? 0) / 1000) * inputPrice +
      ((log.completionTokens ?? 0) / 1000) * outputPrice;

    const existing = dayMap.get(dateStr) ?? {
      date: dateStr,
      tokens: 0,
      cost: 0,
    };

    existing.tokens += (log.totalTokens ?? 0);
    existing.cost += logCost;

    dayMap.set(dateStr, existing);
  }

  // Calculate totals
  const totalPrompt = logs.reduce((sum, l) => sum + (l.promptTokens ?? 0), 0);
  const totalCompletion = logs.reduce((sum, l) => sum + (l.completionTokens ?? 0), 0);
  const totalTokensVal = logs.reduce((sum, l) => sum + (l.totalTokens ?? 0), 0);
  const totalCost = Array.from(modelMap.values()).reduce((sum, m) => sum + m.totalCost, 0);

  return {
    applicationId,
    month,
    totalCost,
    totalTokens: {
      prompt: totalPrompt,
      completion: totalCompletion,
      total: totalTokensVal,
    },
    byModel: Array.from(modelMap.values()),
    byAgent: Array.from(agentMap.values()),
    dailyTrend: Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };
}
