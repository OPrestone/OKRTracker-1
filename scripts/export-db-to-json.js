/**
 * Database Export Script
 * 
 * This script connects to the database and exports tables to JSON files
 * for easier data management and backup purposes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Handle ES module path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Create output directory
const outputDir = path.join(__dirname, '..', 'public', 'uploads', 'db-json');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Connect to database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Tables to export (can be modified to export specific tables)
const tables = [
  'users', 
  'teams', 
  'objectives', 
  'key_results',
  'initiatives',
  'check_ins',
  'cadences',
  'timeframes',
  'feedback',
  'badges',
  'user_badges',
  'highfives',
  'highfive_recipients'
];

// Function to export a table
async function exportTable(tableName) {
  try {
    console.log(`Exporting table: ${tableName}`);
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    
    // Write data to JSON file
    const filePath = path.join(outputDir, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2));
    
    console.log(`Exported ${result.rows.length} rows from ${tableName}`);
    return result.rows.length;
  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error.message);
    return 0;
  }
}

// Main function
async function main() {
  console.log('Starting database export...');
  
  try {
    let totalRows = 0;
    
    // Export each table
    for (const table of tables) {
      const rowCount = await exportTable(table);
      totalRows += rowCount;
    }
    
    console.log(`Export complete! Total rows exported: ${totalRows}`);
    
    // Create a metadata file with export information
    const metadata = {
      exportDate: new Date().toISOString(),
      tables: tables,
      totalRowsExported: totalRows,
      databaseUrl: process.env.DATABASE_URL.replace(/[:@/].*/, ':*****') // Mask sensitive parts
    };
    
    fs.writeFileSync(
      path.join(outputDir, '_metadata.json'), 
      JSON.stringify(metadata, null, 2)
    );
    
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the export
main().catch(console.error);