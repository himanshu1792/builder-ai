'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Code, Eye } from 'lucide-react';

interface SchemaNode {
  type?: string;
  description?: string;
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
  [key: string]: unknown;
}

function SchemaProperty({
  name,
  schema,
  depth = 0,
}: {
  name: string;
  schema: SchemaNode;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren =
    schema.type === 'object' && schema.properties
      ? Object.keys(schema.properties).length > 0
      : false;
  const isArray = schema.type === 'array';
  const arrayItemsHasChildren =
    isArray && schema.items?.type === 'object' && schema.items?.properties
      ? Object.keys(schema.items.properties).length > 0
      : false;
  const expandable = hasChildren || arrayItemsHasChildren;

  const typeColor = (t?: string) => {
    switch (t) {
      case 'string': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'number': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'boolean': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'array': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'object': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const displayType = isArray
    ? `${schema.items?.type ?? 'any'}[]`
    : schema.type ?? 'any';

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 hover:bg-muted/50 rounded px-2 -mx-2"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {expandable ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 rounded hover:bg-muted"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <span className="font-mono text-sm font-medium">{name}</span>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColor(schema.type)}`}>
          {displayType}
        </Badge>
        {schema.description && (
          <span className="text-xs text-muted-foreground truncate">
            {schema.description}
          </span>
        )}
      </div>
      {expanded && hasChildren && schema.properties && (
        <div>
          {Object.entries(schema.properties).map(([key, value]) => (
            <SchemaProperty
              key={key}
              name={key}
              schema={value as SchemaNode}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
      {expanded && arrayItemsHasChildren && schema.items?.properties && (
        <div>
          {Object.entries(schema.items.properties).map(([key, value]) => (
            <SchemaProperty
              key={key}
              name={key}
              schema={value as SchemaNode}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SchemaViewerProps {
  schema: unknown;
}

export function SchemaViewer({ schema }: SchemaViewerProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const s = schema as SchemaNode;

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <Button
          variant={viewMode === 'visual' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setViewMode('visual')}
        >
          <Eye className="mr-1 h-3 w-3" /> Visual
        </Button>
        <Button
          variant={viewMode === 'json' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setViewMode('json')}
        >
          <Code className="mr-1 h-3 w-3" /> JSON
        </Button>
      </div>

      {viewMode === 'visual' ? (
        <div className="rounded-md border p-3">
          {s.properties ? (
            Object.entries(s.properties).map(([key, value]) => (
              <SchemaProperty
                key={key}
                name={key}
                schema={value as SchemaNode}
                depth={0}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No properties defined</p>
          )}
        </div>
      ) : (
        <pre className="whitespace-pre-wrap rounded bg-muted p-3 text-xs font-mono max-h-64 overflow-y-auto">
          {JSON.stringify(schema, null, 2)}
        </pre>
      )}
    </div>
  );
}
