import { pgTable, varchar, text, timestamp, boolean, numeric, date } from 'drizzle-orm/pg-core';

export const modelPricing = pgTable('model_pricing', {
  id: varchar('id', { length: 21 }).primaryKey(),
  modelId: varchar('model_id', { length: 50 }).notNull().unique(),
  displayName: text('display_name').notNull(),
  inputPricePer1k: numeric('input_price_per_1k', { precision: 10, scale: 6 }).notNull(),
  outputPricePer1k: numeric('output_price_per_1k', { precision: 10, scale: 6 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  effectiveDate: date('effective_date').notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
