import { pgTable, varchar, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { agents } from './agents';
import { orchestrations } from './orchestrations';

export const executionLogs = pgTable('execution_logs', {
  id: varchar('id', { length: 24 }).primaryKey(),
  agentId: varchar('agent_id', { length: 21 }).references(() => agents.id),
  orchestrationId: varchar('orchestration_id', { length: 21 }).references(() => orchestrations.id),
  orchestrationRunId: varchar('orchestration_run_id', { length: 24 }),
  stepOrder: integer('step_order'),
  inputPayload: jsonb('input_payload').notNull(),
  outputPayload: jsonb('output_payload'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  errorMessage: text('error_message'),
  model: varchar('model', { length: 50 }),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
