/**
 * Migration application script
 * 
 * This script runs the migration to convert all database IDs from
 * sequential integers to ULIDs and then updates the schema accordingly.
 */
import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  return new Promise((resolve, reject) => {
    // Create path to migration script
    const migrationScriptPath = path.join(__dirname, 'migrate-to-ulid.js');
    
    // Spawn the migration script as a child process
    console.log(`Running migration script: ${migrationScriptPath}`);
    
    const child = spawn('node', [migrationScriptPath], {
      env: { ...process.env },
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('Migration completed successfully');
        resolve();
      } else {
        console.error(`Migration failed with code ${code}`);
        reject(new Error(`Migration failed with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      console.error('Failed to start migration script:', err);
      reject(err);
    });
  });
}

async function updateSchema() {
  return new Promise((resolve, reject) => {
    try {
      // Path to schemas
      const oldSchemaPath = path.join(__dirname, '..', 'shared', 'schema.ts');
      const newSchemaPath = path.join(__dirname, '..', 'shared', 'schema-ulid.ts');
      
      console.log('Updating schema...');
      
      // Backup the old schema
      const backupPath = path.join(__dirname, '..', 'shared', 'schema.ts.bak');
      fs.copyFileSync(oldSchemaPath, backupPath);
      console.log(`Backed up schema to ${backupPath}`);
      
      // Replace the old schema with the new one
      fs.copyFileSync(newSchemaPath, oldSchemaPath);
      console.log('Schema updated successfully');
      
      resolve();
    } catch (error) {
      console.error('Failed to update schema:', error);
      reject(error);
    }
  });
}

async function run() {
  try {
    console.log('Starting ULID migration process...');
    
    // Run the migration script
    await runMigration();
    
    // Update the schema
    await updateSchema();
    
    console.log('Migration process completed successfully!');
    console.log('Please restart your application to ensure all changes take effect.');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
}

// Run the migration process
run();