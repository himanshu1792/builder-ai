import { z } from 'zod';

const inputMappingSchema = z.object({
  type: z.enum(['pick', 'rename', 'wrap']),
  fields: z.array(z.string()).optional(),
  mapping: z.record(z.string(), z.string()).optional(),
  key: z.string().optional(),
}).nullable().optional();

const stepSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  stepOrder: z.number().int().min(1),
  inputMapping: inputMappingSchema,
});

export const createOrchestrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  steps: z.array(stepSchema).min(1, 'At least one step is required'),
});

export const updateOrchestrationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
  steps: z.array(stepSchema).min(1).optional(),
});

export type CreateOrchestrationInput = z.infer<typeof createOrchestrationSchema>;
export type UpdateOrchestrationInput = z.infer<typeof updateOrchestrationSchema>;
