import { z } from 'zod';

export const createModelPricingSchema = z.object({
  modelId: z.string().min(1, 'Model ID is required').max(50),
  displayName: z.string().min(1, 'Display name is required').max(100),
  inputPricePer1k: z.number().min(0, 'Price must be non-negative'),
  outputPricePer1k: z.number().min(0, 'Price must be non-negative'),
  isActive: z.boolean().default(true),
});

export type CreateModelPricingInput = z.infer<typeof createModelPricingSchema>;
