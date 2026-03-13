'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useBilling } from '@/hooks/use-billing';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, DollarSign, Zap, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

export default function BillingPage() {
  const { appId } = useParams<{ appId: string }>();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const { billing, isLoading } = useBilling(appId, month);
  const monthOptions = getMonthOptions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Monthly cost breakdown by model and agent</p>
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
              <DollarSign className="h-4 w-4 text-rose-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${billing?.totalCost.toFixed(4) ?? '0.0000'}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billing?.totalTokens.total.toLocaleString() ?? '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {billing?.totalTokens.prompt.toLocaleString() ?? '0'} prompt + {billing?.totalTokens.completion.toLocaleString() ?? '0'} completion
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Models Used</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billing?.byModel.length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost by Model */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cost by Model</CardTitle>
        </CardHeader>
        <CardContent>
          {!billing?.byModel || billing.byModel.length === 0 ? (
            <p className="text-sm text-muted-foreground">No usage this month.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Prompt Tokens</TableHead>
                  <TableHead className="text-right">Completion Tokens</TableHead>
                  <TableHead className="text-right">Input Cost</TableHead>
                  <TableHead className="text-right">Output Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.byModel.map((m) => (
                  <TableRow key={m.model}>
                    <TableCell>
                      <Badge variant="outline">{m.displayName}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {m.promptTokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {m.completionTokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${m.inputCost.toFixed(6)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${m.outputCost.toFixed(6)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">
                      ${m.totalCost.toFixed(6)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cost by Agent */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cost by Agent</CardTitle>
        </CardHeader>
        <CardContent>
          {!billing?.byAgent || billing.byAgent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No usage this month.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Total Tokens</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.byAgent.map((a) => (
                  <TableRow key={a.agentId}>
                    <TableCell className="font-medium">{a.agentName}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {a.totalTokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">
                      ${a.totalCost.toFixed(6)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Daily Cost Trend */}
      {billing?.dailyTrend && billing.dailyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily Cost Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={billing.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: number) => `$${v.toFixed(4)}`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value).toFixed(6)}`,
                      'Cost',
                    ]}
                    labelFormatter={(label) => `Date: ${String(label)}`}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#93c5fd"
                    fill="#93c5fd"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
