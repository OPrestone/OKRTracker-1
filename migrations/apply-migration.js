import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Add tenant_id column to objectives table if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'objectives' AND column_name = 'tenant_id'
        ) THEN
          ALTER TABLE objectives ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
        END IF;
      END $$;
    `);
    console.log('✅ Added tenant_id to objectives table (if needed)');
    
    // Add tenant_id column to key_results table if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'key_results' AND column_name = 'tenant_id'
        ) THEN
          ALTER TABLE key_results ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
        END IF;
      END $$;
    `);
    console.log('✅ Added tenant_id to key_results table (if needed)');
    
    // Add tenant_id column to initiatives table if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'initiatives' AND column_name = 'tenant_id'
        ) THEN
          ALTER TABLE initiatives ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
        END IF;
      END $$;
    `);
    console.log('✅ Added tenant_id to initiatives table (if needed)');
    
    // Add tenant_id column to check_ins table if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'check_ins' AND column_name = 'tenant_id'
        ) THEN
          ALTER TABLE check_ins ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
        END IF;
      END $$;
    `);
    console.log('✅ Added tenant_id to check_ins table (if needed)');

    // Initialize existing records to tenant_id = 1 if they're null
    await pool.query(`
      UPDATE objectives SET tenant_id = 1 WHERE tenant_id IS NULL;
      UPDATE key_results SET tenant_id = 1 WHERE tenant_id IS NULL;
      UPDATE initiatives SET tenant_id = 1 WHERE tenant_id IS NULL;
      UPDATE check_ins SET tenant_id = 1 WHERE tenant_id IS NULL;
    `);
    console.log('✅ Initialized existing records with tenant_id = 1');

    console.log('✅ All database migrations completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

run();