import { pgTable, varchar, text, timestamp, boolean, real, jsonb } from 'drizzle-orm/pg-core';
import { applications } from './applications';

export const agents = pgTable('agents', {
  id: varchar('id', { length: 21 }).primaryKey(),
  applicationId: varchar('application_id', { length: 21 })
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  systemPrompt: text('system_prompt').notNull(),
  taskPrompt: text('task_prompt').notNull(),
  outputSchema: jsonb('output_schema'),
  model: varchar('model', { length: 50 }).notNull().default('gpt-4o-mini'),
  temperature: real('temperature').default(0.7),
  promptPlaceholders: jsonb('prompt_placeholders').default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
