'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, ArrowDown, Bot } from 'lucide-react';
import type { Agent } from '@/hooks/use-agents';

export interface StepConfig {
  agentId: string;
  inputMapping: {
    type: 'pick' | 'rename' | 'wrap';
    fields?: string[];
    mapping?: Record<string, string>;
    key?: string;
  } | null;
}

interface StepBuilderProps {
  agents: Agent[];
  steps: StepConfig[];
  onChange: (steps: StepConfig[]) => void;
}

export function StepBuilder({ agents, steps, onChange }: StepBuilderProps) {
  const addStep = () => {
    onChange([...steps, { agentId: '', inputMapping: null }]);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, updated: Partial<StepConfig>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updated };
    onChange(newSteps);
  };

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    const newSteps = [...steps];
    const [moved] = newSteps.splice(from, 1);
    newSteps.splice(to, 0, moved);
    onChange(newSteps);
  };

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const agentName = agents.find((a) => a.id === step.agentId)?.name;

        return (
          <div key={index}>
            {index > 0 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="cursor-grab text-muted-foreground hover:text-foreground"
                      onClick={() => moveStep(index, index - 1)}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {index + 1}
                  </div>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex-1">
                    {agentName || 'Select an agent'}
                  </span>
                  <div className="flex gap-1">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveStep(index, index - 1)}
                      >
                        <span className="text-xs">↑</span>
                      </Button>
                    )}
                    {index < steps.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveStep(index, index + 1)}
                      >
                        <span className="text-xs">↓</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Agent</Label>
                  <Select
                    value={step.agentId}
                    onValueChange={(val) => updateStep(index, { agentId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.filter((a) => a.isActive).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} ({a.model})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {index > 0 && (
                  <InputMappingEditor
                    mapping={step.inputMapping}
                    onChange={(m) => updateStep(index, { inputMapping: m })}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}

      <Button type="button" variant="outline" className="w-full" onClick={addStep}>
        <Plus className="mr-2 h-4 w-4" /> Add Step
      </Button>
    </div>
  );
}

function InputMappingEditor({
  mapping,
  onChange,
}: {
  mapping: StepConfig['inputMapping'];
  onChange: (m: StepConfig['inputMapping']) => void;
}) {
  const [type, setType] = useState<'default' | 'pick' | 'rename' | 'wrap'>(
    mapping?.type ?? 'default'
  );
  const [fields, setFields] = useState(mapping?.fields?.join(', ') ?? '');
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [wrapKey, setWrapKey] = useState(mapping?.key ?? '');

  const handleTypeChange = (newType: string) => {
    setType(newType as typeof type);
    if (newType === 'default') {
      onChange(null);
    } else if (newType === 'pick') {
      const fieldList = fields.split(',').map((f) => f.trim()).filter(Boolean);
      onChange({ type: 'pick', fields: fieldList });
    } else if (newType === 'rename') {
      onChange({ type: 'rename', mapping: mapping?.mapping ?? {} });
    } else if (newType === 'wrap') {
      onChange({ type: 'wrap', key: wrapKey || 'input' });
    }
  };

  const handleFieldsChange = (val: string) => {
    setFields(val);
    const fieldList = val.split(',').map((f) => f.trim()).filter(Boolean);
    onChange({ type: 'pick', fields: fieldList });
  };

  const addRenameMapping = () => {
    if (!renameFrom.trim() || !renameTo.trim()) return;
    const current = mapping?.mapping ?? {};
    onChange({ type: 'rename', mapping: { ...current, [renameFrom.trim()]: renameTo.trim() } });
    setRenameFrom('');
    setRenameTo('');
  };

  const removeRenameKey = (key: string) => {
    const current = { ...(mapping?.mapping ?? {}) };
    delete current[key];
    onChange({ type: 'rename', mapping: current });
  };

  return (
    <div className="space-y-2 border-t pt-2">
      <Label className="text-xs">Input Mapping</Label>
      <Select value={type} onValueChange={handleTypeChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default (pass all)</SelectItem>
          <SelectItem value="pick">Pick fields</SelectItem>
          <SelectItem value="rename">Rename keys</SelectItem>
          <SelectItem value="wrap">Wrap under key</SelectItem>
        </SelectContent>
      </Select>

      {type === 'pick' && (
        <Input
          placeholder="field1, field2, field3"
          value={fields}
          onChange={(e) => handleFieldsChange(e.target.value)}
          className="h-8 text-xs"
        />
      )}

      {type === 'rename' && (
        <div className="space-y-2">
          {mapping?.mapping && Object.entries(mapping.mapping).map(([from, to]) => (
            <div key={from} className="flex items-center gap-1 text-xs">
              <code className="rounded bg-muted px-1">{from}</code>
              <span>→</span>
              <code className="rounded bg-muted px-1">{to}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => removeRenameKey(from)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <div className="flex gap-1">
            <Input
              placeholder="from"
              value={renameFrom}
              onChange={(e) => setRenameFrom(e.target.value)}
              className="h-7 text-xs"
            />
            <Input
              placeholder="to"
              value={renameTo}
              onChange={(e) => setRenameTo(e.target.value)}
              className="h-7 text-xs"
            />
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addRenameMapping}>
              Add
            </Button>
          </div>
        </div>
      )}

      {type === 'wrap' && (
        <Input
          placeholder="key name (e.g. input)"
          value={wrapKey}
          onChange={(e) => {
            setWrapKey(e.target.value);
            onChange({ type: 'wrap', key: e.target.value || 'input' });
          }}
          className="h-8 text-xs"
        />
      )}
    </div>
  );
}
