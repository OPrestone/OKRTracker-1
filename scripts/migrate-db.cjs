// Using CommonJS to avoid ES module issues
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { sql } = require('drizzle-orm');
const ws = require('ws');
require('dotenv').config();

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Create database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});
const db = drizzle(pool);

async function runMigration() {
  console.log("Starting database migration...");

  try {
    // Create tenant plan enum if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_plan') THEN
          CREATE TYPE tenant_plan AS ENUM ('free', 'starter', 'professional', 'enterprise');
        END IF;
      END
      $$;
    `);
    console.log("Created tenant_plan enum");

    // Create tenant status enum if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN
          CREATE TYPE tenant_status AS ENUM ('active', 'inactive', 'trial', 'past_due', 'cancelled');
        END IF;
      END
      $$;
    `);
    console.log("Created tenant_status enum");

    // Create tenants table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo TEXT,
        primary_color TEXT DEFAULT '#3B82F6',
        plan tenant_plan DEFAULT 'free',
        status tenant_status DEFAULT 'trial',
        custom_domain TEXT,
        max_users INTEGER DEFAULT 5,
        trial_ends_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created tenants table");

    // Create users_to_tenants table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users_to_tenants (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        role TEXT DEFAULT 'member',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created users_to_tenants table");

    // Create subscriptions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        stripe_subscription_id TEXT,
        stripe_customer_id TEXT,
        plan_id TEXT,
        status TEXT,
        quantity INTEGER DEFAULT 1,
        trial_start TIMESTAMP,
        trial_end TIMESTAMP,
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at TIMESTAMP,
        canceled_at TIMESTAMP,
        ended_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created subscriptions table");

    // Create payments table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        subscription_id INTEGER REFERENCES subscriptions(id),
        stripe_payment_intent_id TEXT,
        stripe_invoice_id TEXT,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created payments table");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    process.exit(0);
  }
}

runMigration();