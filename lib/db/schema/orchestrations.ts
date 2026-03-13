import { pgTable, varchar, text, timestamp, boolean, integer, jsonb, unique } from 'drizzle-orm/pg-core';
import { applications } from './applications';
import { agents } from './agents';

export const orchestrations = pgTable('orchestrations', {
  id: varchar('id', { length: 21 }).primaryKey(),
  applicationId: varchar('application_id', { length: 21 })
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orchestrationSteps = pgTable(
  'orchestration_steps',
  {
    id: varchar('id', { length: 21 }).primaryKey(),
    orchestrationId: varchar('orchestration_id', { length: 21 })
      .notNull()
      .references(() => orchestrations.id, { onDelete: 'cascade' }),
    agentId: varchar('agent_id', { length: 21 })
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    stepOrder: integer('step_order').notNull(),
    inputMapping: jsonb('input_mapping'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('orchestration_step_order_unique').on(table.orchestrationId, table.stepOrder),
  ]
);
