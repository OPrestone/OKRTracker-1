// Simple test to debug the objective creation issue
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { objectives, keyResults } = require('./shared/schema');

async function testObjectiveCreation() {
  console.log("Starting objective creation test...");
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  try {
    // First, create an objective
    console.log("Creating objective...");
    const [objective] = await db.insert(objectives).values({
      title: "Test Objective",
      description: "Test Description",
      level: "company",
      status: "draft",
      tenantId: "01JW54PNX1YFAAHRGC5ZS0J4J0", // Use the actual tenant ID from the logs
      ownerId: "01JW54NC41DQY94XBGRZ2BWFER", // Use the actual user ID from the logs
      teamId: "01JW54PP02SV28STFQ8P2P83PB", // Use the actual team ID from the logs
      timeframeId: "01JW54XDJRC71XXJ2H14YN5DNQ" // Use the actual timeframe ID from the logs
    }).returning();
    
    console.log("Objective created:", objective);
    console.log("Objective ID:", objective.id);
    
    // Now try to create a key result with this objective ID
    console.log("Creating key result...");
    const [keyResult] = await db.insert(keyResults).values({
      title: "Test Key Result",
      description: "Test KR Description",
      objective_id: objective.id, // Use snake_case for database
      start_value: "0",
      current_value: "0",
      target_value: "100",
      progress: 0,
      status: "not_started",
      tenant_id: "01JW54PNX1YFAAHRGC5ZS0J4J0"
    }).returning();
    
    console.log("Key result created:", keyResult);
    console.log("SUCCESS: Objective and key result created successfully!");
    
  } catch (error) {
    console.error("ERROR:", error);
    console.error("Error details:", error.message);
  } finally {
    await pool.end();
  }
}

testObjectiveCreation();