// Migration script to remove startMonth column from cadences table
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  console.log('Starting migration to remove startMonth column from cadences table...');

  // Create database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = postgres(connectionString);

  try {
    // Check if startMonth column exists
    const checkResult = await client`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'cadences'
      AND column_name = 'start_month'
    `;

    if (checkResult.length === 0) {
      console.log('Column start_month does not exist in the cadences table. Nothing to do.');
      await client.end();
      return;
    }
    
    // Remove the startMonth column
    console.log('Removing startMonth column from cadences table...');
    await client`
      ALTER TABLE cadences
      DROP COLUMN start_month
    `;
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await client.end();
  }
}

runMigration();