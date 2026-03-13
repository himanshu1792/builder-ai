import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applications, agents, orchestrations, executionLogs, modelPricing } from '@/lib/db/schema';
import { eq, and, sql, gte, inArray, count } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params;

    // Verify application exists
    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, appId));

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Count agents
    const [agentCount] = await db
      .select({ count: count() })
      .from(agents)
      .where(eq(agents.applicationId, appId));

    // Count orchestrations
    const [orchCount] = await db
      .select({ count: count() })
      .from(orchestrations)
      .where(eq(orchestrations.applicationId, appId));

    // Get agent IDs for this application
    const appAgents = await db
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.applicationId, appId));

    const agentIds = appAgents.map((a) => a.id);

    let totalRuns = 0;
    let successCount = 0;
    let failCount = 0;
    let avgDuration = 0;
    let costMtd = 0;

    const agentPerformance: Array<{
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
      totalRuns: number;
      successRuns: number;
      failedRuns: number;
      avgDurationMs: number;
      lastRunAt: Date | null;
    }> = [];

    if (agentIds.length > 0) {
      // Total execution stats
      const execStats = await db
        .select({
          total: count(),
          completed: sql<number>`COUNT(CASE WHEN ${executionLogs.status} = 'completed' THEN 1 END)`,
          failed: sql<number>`COUNT(CASE WHEN ${executionLogs.status} = 'failed' THEN 1 END)`,
          avgDuration: sql<number>`COALESCE(AVG(${executionLogs.durationMs}), 0)`,
        })
        .from(executionLogs)
        .where(inArray(executionLogs.agentId, agentIds));

      totalRuns = execStats[0]?.total ?? 0;
      successCount = Number(execStats[0]?.completed ?? 0);
      failCount = Number(execStats[0]?.failed ?? 0);
      avgDuration = Math.round(Number(execStats[0]?.avgDuration ?? 0));

      // Cost MTD
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const mtdLogs = await db
        .select()
        .from(executionLogs)
        .where(
          and(
            inArray(executionLogs.agentId, agentIds),
            gte(executionLogs.createdAt, monthStart),
            eq(executionLogs.status, 'completed')
          )
        );

      const pricing = await db.select().from(modelPricing);
      const priceMap = new Map(pricing.map((p) => [p.modelId, p]));

      for (const log of mtdLogs) {
        if (log.model && log.promptTokens && log.completionTokens) {
          const price = priceMap.get(log.model);
          if (price) {
            costMtd +=
              (log.promptTokens / 1000) * Number(price.inputPricePer1k) +
              (log.completionTokens / 1000) * Number(price.outputPricePer1k);
          }
        }
      }

      // Per-agent performance
      const allAgents = await db
        .select()
        .from(agents)
        .where(eq(agents.applicationId, appId));

      for (const agent of allAgents) {
        const [stats] = await db
          .select({
            total: count(),
            completed: sql<number>`COUNT(CASE WHEN ${executionLogs.status} = 'completed' THEN 1 END)`,
            failed: sql<number>`COUNT(CASE WHEN ${executionLogs.status} = 'failed' THEN 1 END)`,
            avgDuration: sql<number>`COALESCE(AVG(${executionLogs.durationMs}), 0)`,
            lastRun: sql<Date>`MAX(${executionLogs.createdAt})`,
          })
          .from(executionLogs)
          .where(eq(executionLogs.agentId, agent.id));

        agentPerformance.push({
          id: agent.id,
          name: agent.name,
          slug: agent.slug,
          isActive: agent.isActive,
          totalRuns: stats?.total ?? 0,
          successRuns: Number(stats?.completed ?? 0),
          failedRuns: Number(stats?.failed ?? 0),
          avgDurationMs: Math.round(Number(stats?.avgDuration ?? 0)),
          lastRunAt: stats?.lastRun ?? null,
        });
      }
    }

    // Orchestration performance
    const orchList = await db
      .select()
      .from(orchestrations)
      .where(eq(orchestrations.applicationId, appId));

    const orchestrationPerformance = await Promise.all(
      orchList.map(async (orch) => {
        const [stats] = await db
          .select({
            total: sql<number>`COUNT(DISTINCT ${executionLogs.orchestrationRunId})`,
            completed: sql<number>`COUNT(DISTINCT CASE WHEN ${executionLogs.status} = 'completed' THEN ${executionLogs.orchestrationRunId} END)`,
            avgDuration: sql<number>`COALESCE(AVG(${executionLogs.durationMs}), 0)`,
            lastRun: sql<Date>`MAX(${executionLogs.createdAt})`,
          })
          .from(executionLogs)
          .where(eq(executionLogs.orchestrationId, orch.id));

        return {
          id: orch.id,
          name: orch.name,
          slug: orch.slug,
          isActive: orch.isActive,
          totalRuns: Number(stats?.total ?? 0),
          successRuns: Number(stats?.completed ?? 0),
          avgDurationMs: Math.round(Number(stats?.avgDuration ?? 0)),
          lastRunAt: stats?.lastRun ?? null,
        };
      })
    );

    // Executions over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let executionsOverTime: Array<{ date: string; completed: number; failed: number }> = [];

    if (agentIds.length > 0) {
      const dailyExecs = await db
        .select({
          date: sql<string>`DATE(${executionLogs.createdAt})`,
          completed: sql<number>`COUNT(CASE WHEN ${executionLogs.status} = 'completed' THEN 1 END)`,
          failed: sql<number>`COUNT(CASE WHEN ${executionLogs.status} = 'failed' THEN 1 END)`,
        })
        .from(executionLogs)
        .where(
          and(
            inArray(executionLogs.agentId, agentIds),
            gte(executionLogs.createdAt, thirtyDaysAgo)
          )
        )
        .groupBy(sql`DATE(${executionLogs.createdAt})`)
        .orderBy(sql`DATE(${executionLogs.createdAt})`);

      executionsOverTime = dailyExecs.map((d) => ({
        date: String(d.date),
        completed: Number(d.completed),
        failed: Number(d.failed),
      }));
    }

    const successRate = totalRuns > 0 ? ((successCount / totalRuns) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      application: app,
      summary: {
        totalAgents: agentCount?.count ?? 0,
        totalOrchestrations: orchCount?.count ?? 0,
        totalRuns,
        successRate: `${successRate}%`,
        avgResponseTimeMs: avgDuration,
        costMtd: `$${costMtd.toFixed(2)}`,
      },
      agentPerformance,
      orchestrationPerformance,
      executionsOverTime,
    });
  } catch (error) {
    console.error('Failed to get stats:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
