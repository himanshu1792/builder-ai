import { z } from 'zod';

export const playgroundRunSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('agent'),
    agentId: z.string().min(1, 'Agent ID is required'),
    payload: z.record(z.string(), z.unknown()).default({}),
  }),
  z.object({
    type: z.literal('orchestration'),
    orchestrationId: z.string().min(1, 'Orchestration ID is required'),
    payload: z.record(z.string(), z.unknown()).default({}),
  }),
]);

export type PlaygroundRunInput = z.infer<typeof playgroundRunSchema>;
