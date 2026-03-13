import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const applications = pgTable('applications', {
  id: varchar('id', { length: 21 }).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
