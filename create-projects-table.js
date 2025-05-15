// Create the projects table directly using SQL
import pg from 'pg';
const { Pool } = pg;

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createProjectsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Starting transaction...');
    await client.query('BEGIN');
    
    // Check if the project_status enum exists
    const checkEnumQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'project_status'
      );
    `;
    
    const enumExists = await client.query(checkEnumQuery);
    
    // Create the enum if it doesn't exist
    if (!enumExists.rows[0].exists) {
      console.log('Creating project_status enum...');
      await client.query(`
        CREATE TYPE project_status AS ENUM (
          'backlog', 'todo', 'in_progress', 'review', 'done'
        );
      `);
    }
    
    // Check if the projects table already exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
      );
    `;
    
    const tableExists = await client.query(checkTableQuery);
    
    // Create the table if it doesn't exist
    if (!tableExists.rows[0].exists) {
      console.log('Creating projects table...');
      await client.query(`
        CREATE TABLE projects (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status project_status NOT NULL DEFAULT 'backlog',
          priority INTEGER,
          assigned_to_id TEXT,
          team_id TEXT,
          created_by_id TEXT,
          tenant_id TEXT NOT NULL,
          start_date TIMESTAMP,
          due_date TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          tags TEXT[],
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        );
      `);
      
      console.log('Projects table created successfully!');
    } else {
      console.log('Projects table already exists.');
    }
    
    await client.query('COMMIT');
    console.log('Transaction completed successfully.');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating projects table:', err);
    throw err;
  } finally {
    client.release();
    console.log('Database client released.');
  }
}

// Execute the function
createProjectsTable()
  .then(() => console.log('Script completed successfully.'))
  .catch(err => console.error('Script failed:', err))
  .finally(() => pool.end());

// Export for ES module compatibility
export {};