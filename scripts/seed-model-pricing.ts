import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { nanoid } from 'nanoid';
import { modelPricing } from '../lib/db/schema/model-pricing';

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  const models = [
    {
      id: nanoid(),
      modelId: 'gpt-4o',
      displayName: 'GPT-4o',
      inputPricePer1k: '0.002500',
      outputPricePer1k: '0.010000',
    },
    {
      id: nanoid(),
      modelId: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini',
      inputPricePer1k: '0.000150',
      outputPricePer1k: '0.000600',
    },
    {
      id: nanoid(),
      modelId: 'gpt-4-turbo',
      displayName: 'GPT-4 Turbo',
      inputPricePer1k: '0.010000',
      outputPricePer1k: '0.030000',
    },
    {
      id: nanoid(),
      modelId: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      inputPricePer1k: '0.000500',
      outputPricePer1k: '0.001500',
    },
  ];

  console.log('Seeding model pricing...');

  for (const model of models) {
    await db
      .insert(modelPricing)
      .values(model)
      .onConflictDoUpdate({
        target: modelPricing.modelId,
        set: {
          displayName: model.displayName,
          inputPricePer1k: model.inputPricePer1k,
          outputPricePer1k: model.outputPricePer1k,
        },
      });
    console.log(`  Seeded: ${model.modelId} (${model.displayName})`);
  }

  console.log('Done!');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
