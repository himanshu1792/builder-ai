'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bot, GitBranch, Activity, CheckCircle, Clock, DollarSign } from 'lucide-react';
import type { DashboardStats } from '@/hooks/use-stats';

interface StatsCardsProps {
  summary: DashboardStats['summary'];
}

export function StatsCards({ summary }: StatsCardsProps) {
  const cards = [
    {
      label: 'Agents',
      value: summary.totalAgents,
      icon: Bot,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Orchestrations',
      value: summary.totalOrchestrations,
      icon: GitBranch,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
    {
      label: 'Total Runs',
      value: summary.totalRuns,
      icon: Activity,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Success Rate',
      value: summary.successRate,
      icon: CheckCircle,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-500',
    },
    {
      label: 'Avg Response',
      value: `${summary.avgResponseTimeMs}ms`,
      icon: Clock,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-500',
    },
    {
      label: 'Cost MTD',
      value: summary.costMtd,
      icon: DollarSign,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-400',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.label} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg}`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
