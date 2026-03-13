import { z } from 'zod';

export const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  taskPrompt: z.string().min(1, 'Task prompt is required'),
  outputSchema: z.any().optional().nullable(),
  model: z.string().max(50).default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.7),
  promptPlaceholders: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  systemPrompt: z.string().min(1).optional(),
  taskPrompt: z.string().min(1).optional(),
  outputSchema: z.any().optional().nullable(),
  model: z.string().max(50).optional(),
  temperature: z.number().min(0).max(2).optional(),
  promptPlaceholders: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
