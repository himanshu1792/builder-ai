'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DashboardStats } from '@/hooks/use-stats';

interface ExecutionsChartProps {
  data: DashboardStats['executionsOverTime'];
}

export function ExecutionsChart({ data }: ExecutionsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No execution data yet.
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        />
        <Legend />
        <Bar dataKey="completed" name="Completed" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
        <Bar dataKey="failed" name="Failed" fill="#fca5a5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
