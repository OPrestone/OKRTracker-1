/**
 * Migration script to convert IDs from sequential integers to ULIDs
 * 
 * This is a major schema change that:
 * 1. Creates new tables with ULID primary keys
 * 2. Migrates data from old tables to new tables
 * 3. Drops old tables
 * 4. Renames new tables to original names
 */

import pg from 'pg';
import { ulid } from 'ulid';

const { Pool } = pg;

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('Error executing query:', query);
    console.error('Error:', error);
    throw error;
  }
}

async function getTableInfo(tableName) {
  const columnsQuery = `
    SELECT column_name, data_type, is_nullable, column_default, udt_name
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position;
  `;
  
  const fkQuery = `
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1;
  `;
  
  const columns = await executeQuery(columnsQuery, [tableName]);
  const foreignKeys = await executeQuery(fkQuery, [tableName]);
  
  return {
    columns: columns.rows,
    foreignKeys: foreignKeys.rows,
  };
}

async function getAllTables() {
  const tablesQuery = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'drizzle%'
    ORDER BY table_name;
  `;
  
  const result = await executeQuery(tablesQuery);
  return result.rows.map(row => row.table_name);
}

async function migrateTable(tableName, idMap) {
  console.log(`Migrating table: ${tableName}`);
  
  // Get table information
  const tableInfo = await getTableInfo(tableName);
  const columns = tableInfo.columns;
  const foreignKeys = tableInfo.foreignKeys;
  
  // Create column definitions for new table
  const columnDefs = columns.map(col => {
    if (col.column_name === 'id') {
      return `id TEXT PRIMARY KEY`; // Change id to TEXT
    } else if (col.column_name.endsWith('_id') && !col.column_name.includes('stripe')) {
      // Foreign key reference
      return `${col.column_name} TEXT${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`;
    } else {
      let type = col.data_type;
      if (type === 'USER-DEFINED') {
        // Handle enum types
        type = `"${col.udt_name}"`;
      }
      
      let def = `${col.column_name} ${type}`;
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      }
      if (col.column_default && !col.column_default.includes('nextval')) {
        def += ` DEFAULT ${col.column_default}`;
      }
      return def;
    }
  }).join(',\n  ');
  
  // Create new table
  const newTableName = `${tableName}_ulid`;
  await executeQuery(`
    CREATE TABLE ${newTableName} (
      ${columnDefs}
    );
  `);
  
  // Retrieve data from old table
  const oldData = await executeQuery(`SELECT * FROM ${tableName};`);
  
  // Generate ULIDs for each row and store in the map
  const tableIdMap = {};
  for (const row of oldData.rows) {
    const oldId = row.id;
    const newId = ulid();
    tableIdMap[oldId] = newId;
  }
  
  // Store the ID map for this table
  idMap[tableName] = tableIdMap;
  
  // Insert data into new table
  for (const row of oldData.rows) {
    const oldId = row.id;
    const newId = tableIdMap[oldId];
    
    // Build column names and values
    const columnNames = [];
    const values = [];
    const placeholders = [];
    let paramCount = 1;
    
    for (const col of columns) {
      const colName = col.column_name;
      let value = row[colName];
      
      // Convert IDs to ULIDs
      if (colName === 'id') {
        value = newId;
      } else if (colName.endsWith('_id') && !colName.includes('stripe') && value !== null) {
        // Look up foreign key in the idMap
        const refTable = foreignKeys.find(fk => fk.column_name === colName)?.foreign_table_name;
        if (refTable && idMap[refTable] && idMap[refTable][value]) {
          value = idMap[refTable][value];
        }
      }
      
      columnNames.push(colName);
      values.push(value);
      placeholders.push(`$${paramCount++}`);
    }
    
    // Insert the row
    const insertQuery = `
      INSERT INTO ${newTableName} (${columnNames.join(', ')})
      VALUES (${placeholders.join(', ')});
    `;
    
    await executeQuery(insertQuery, values);
  }
  
  console.log(`Migrated table ${tableName}: ${oldData.rows.length} rows`);
  
  return tableIdMap;
}

async function main() {
  try {
    console.log('Starting migration to ULID primary keys');
    
    // First, get all tables
    const allTables = await getAllTables();
    console.log(`Found ${allTables.length} tables to migrate`);
    
    // Create a map to store old id -> new ulid mapping
    const idMap = {};
    
    // Define table dependencies to ensure they are migrated in the right order
    // Tables with no foreign keys should be first
    const baseTableNames = ['tenants', 'cadences', 'access_groups', 'badges'];
    
    // Tables that depend on base tables
    const tier1TableNames = ['teams', 'users', 'timeframes'];
    
    // Tables that depend on tier 1 tables
    const tier2TableNames = ['objectives', 'user_badges', 'user_access_groups', 'users_to_tenants'];
    
    // Remaining tables
    const remainingTables = allTables.filter(t => 
      !baseTableNames.includes(t) && 
      !tier1TableNames.includes(t) && 
      !tier2TableNames.includes(t)
    );
    
    // Order of migration
    const migrationOrder = [
      ...baseTableNames,
      ...tier1TableNames,
      ...tier2TableNames,
      ...remainingTables
    ];
    
    console.log(`Migration order: ${migrationOrder.join(', ')}`);
    
    // Disable foreign key checks
    await executeQuery('SET session_replication_role = replica;');
    
    // Migrate all tables in the determined order
    for (const tableName of migrationOrder) {
      await migrateTable(tableName, idMap);
    }
    
    // Drop old tables and rename new tables in reverse order
    // to properly handle foreign key constraints
    for (const tableName of [...migrationOrder].reverse()) {
      await executeQuery(`DROP TABLE ${tableName} CASCADE;`);
      await executeQuery(`ALTER TABLE ${tableName}_ulid RENAME TO ${tableName};`);
    }
    
    // Re-enable foreign key checks
    await executeQuery('SET session_replication_role = DEFAULT;');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
main();