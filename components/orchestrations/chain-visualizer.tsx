'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Bot } from 'lucide-react';
import type { OrchestrationStep } from '@/hooks/use-orchestrations';

interface ChainVisualizerProps {
  steps: OrchestrationStep[];
}

export function ChainVisualizer({ steps }: ChainVisualizerProps) {
  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">No steps defined.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, index) => (
        <div key={step.id ?? index} className="flex items-center gap-2">
          <Card className="border-2">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{step.agentName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-xs">
                    Step {step.stepOrder}
                  </Badge>
                  {step.inputMapping !== null && step.inputMapping !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {step.inputMapping.type}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {index < steps.length - 1 && (
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
