import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const setupScriptPath = path.join(process.cwd(), 'scripts', 'setup.js');
  
  let errorMessage = "DATABASE_URL environment variable is not set.\n\n";
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    errorMessage += "It looks like you don't have a .env file in your project root.\n";
    errorMessage += "Please create one by copying .env.example:\n\n";
    errorMessage += "cp .env.example .env\n\n";
    errorMessage += "Then edit the .env file to set your database connection string.\n";
  } else if (!fs.existsSync(envPath)) {
    errorMessage += "Please create a .env file in your project root with your database connection string:\n\n";
    errorMessage += "DATABASE_URL=postgresql://username:password@localhost:5432/database_name\n";
  } else {
    errorMessage += "Your .env file exists but the DATABASE_URL variable might be missing or not properly loaded.\n";
    errorMessage += "Make sure your .env file contains a valid DATABASE_URL line like:\n\n";
    errorMessage += "DATABASE_URL=postgresql://username:password@localhost:5432/database_name\n";
  }
  
  if (fs.existsSync(setupScriptPath)) {
    errorMessage += "\nFor automatic setup, you can run our setup script:\n\n";
    errorMessage += "node scripts/setup.js\n";
  }
  
  throw new Error(errorMessage);
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
