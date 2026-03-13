import 'dotenv/config';
import { Pool } from 'pg';

async function fixFK() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Drop the old FK constraint and add the new one with CASCADE
    await pool.query(`
      ALTER TABLE orchestration_steps
      DROP CONSTRAINT IF EXISTS orchestration_steps_agent_id_agents_id_fk;
    `);
    await pool.query(`
      ALTER TABLE orchestration_steps
      ADD CONSTRAINT orchestration_steps_agent_id_agents_id_fk
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
    `);
    console.log('FK constraint updated to CASCADE on agent_id');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await pool.end();
  }
}

fixFK();
