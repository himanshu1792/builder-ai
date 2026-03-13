'use client';

import { useState } from 'react';
import { useModelPricing, upsertModelPricing } from '@/hooks/use-model-pricing';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Pencil, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function ModelPricingPage() {
  const { models, isLoading, mutate } = useModelPricing();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editModel, setEditModel] = useState<{
    modelId: string;
    displayName: string;
    inputPricePer1k: string;
    outputPricePer1k: string;
    isActive: boolean;
  } | null>(null);

  const [modelId, setModelId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inputPrice, setInputPrice] = useState('');
  const [outputPrice, setOutputPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditModel(null);
    setModelId('');
    setDisplayName('');
    setInputPrice('');
    setOutputPrice('');
    setDialogOpen(true);
  };

  const openEdit = (model: typeof models[0]) => {
    setEditModel({
      modelId: model.modelId,
      displayName: model.displayName,
      inputPricePer1k: model.inputPricePer1k,
      outputPricePer1k: model.outputPricePer1k,
      isActive: model.isActive,
    });
    setModelId(model.modelId);
    setDisplayName(model.displayName);
    setInputPrice(model.inputPricePer1k);
    setOutputPrice(model.outputPricePer1k);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!modelId.trim() || !displayName.trim() || !inputPrice || !outputPrice) {
      toast.error('All fields are required');
      return;
    }

    const parsedInput = parseFloat(inputPrice);
    const parsedOutput = parseFloat(outputPrice);
    if (isNaN(parsedInput) || isNaN(parsedOutput)) {
      toast.error('Prices must be valid numbers');
      return;
    }

    setSaving(true);
    try {
      await upsertModelPricing({
        modelId: modelId.trim(),
        displayName: displayName.trim(),
        inputPricePer1k: parsedInput,
        outputPricePer1k: parsedOutput,
        isActive: editModel?.isActive ?? true,
      });
      toast.success(editModel ? 'Model pricing updated' : 'Model pricing added');
      setDialogOpen(false);
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (model: typeof models[0]) => {
    try {
      await upsertModelPricing({
        modelId: model.modelId,
        displayName: model.displayName,
        inputPricePer1k: parseFloat(model.inputPricePer1k),
        outputPricePer1k: parseFloat(model.outputPricePer1k),
        isActive: !model.isActive,
      });
      toast.success(`${model.displayName} ${model.isActive ? 'deactivated' : 'activated'}`);
      mutate();
    } catch {
      toast.error('Failed to toggle status');
    }
  };

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
          <h1 className="text-2xl font-bold">Model Pricing</h1>
          <p className="text-muted-foreground">
            Manage per-token pricing for OpenAI models
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Model
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Pricing Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <p className="text-sm text-muted-foreground">No models configured. Run the seed script or add models manually.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model ID</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead className="text-right">Input / 1K tokens</TableHead>
                  <TableHead className="text-right">Output / 1K tokens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-mono text-sm">{model.modelId}</TableCell>
                    <TableCell>{model.displayName}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${parseFloat(model.inputPricePer1k).toFixed(6)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${parseFloat(model.outputPricePer1k).toFixed(6)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={model.isActive ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(model)}
                      >
                        {model.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(model)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editModel ? 'Edit Model Pricing' : 'Add Model Pricing'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Model ID</Label>
              <Input
                placeholder="gpt-4o"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                disabled={!!editModel}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                placeholder="GPT-4o"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Input Price / 1K tokens ($)</Label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="0.002500"
                  value={inputPrice}
                  onChange={(e) => setInputPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Output Price / 1K tokens ($)</Label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="0.010000"
                  value={outputPrice}
                  onChange={(e) => setOutputPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editModel ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
