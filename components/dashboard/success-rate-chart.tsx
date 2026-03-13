'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface SuccessRateChartProps {
  successRate: string;
  totalRuns: number;
}

export function SuccessRateChart({ successRate, totalRuns }: SuccessRateChartProps) {
  if (totalRuns === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No execution data yet.
      </div>
    );
  }

  const rate = parseFloat(successRate);
  const data = [
    { name: 'Success', value: rate },
    { name: 'Failure', value: 100 - rate },
  ];

  const COLORS = ['#6ee7b7', '#fca5a5'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `${Number(value).toFixed(1)}%`}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
