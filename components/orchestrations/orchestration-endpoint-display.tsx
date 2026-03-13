'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface OrchestrationEndpointDisplayProps {
  slug: string;
}

export function OrchestrationEndpointDisplay({ slug }: OrchestrationEndpointDisplayProps) {
  const [copied, setCopied] = useState<'url' | 'curl' | null>(null);
  const endpointUrl = `/api/orchestrations/${slug}/run`;
  const curlExample = `curl -X POST http://localhost:3000${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello"}'`;

  const copy = async (text: string, type: 'url' | 'curl') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">API Endpoint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
            POST {endpointUrl}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => copy(endpointUrl, 'url')}
          >
            {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="relative">
          <pre className="rounded bg-muted p-3 text-xs font-mono overflow-x-auto">
            {curlExample}
          </pre>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => copy(curlExample, 'curl')}
          >
            {copied === 'curl' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
