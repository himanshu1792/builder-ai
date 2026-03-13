import { Pool } from 'pg';

async function createDatabase() {
  // Connect to default 'postgres' database to create our database
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'postgres',
  });

  try {
    // Check if database already exists
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'agent_builder'"
    );

    if (result.rows.length === 0) {
      await pool.query('CREATE DATABASE agent_builder');
      console.log('Database "agent_builder" created successfully.');
    } else {
      console.log('Database "agent_builder" already exists.');
    }
  } catch (err) {
    console.error('Failed to create database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createDatabase();
