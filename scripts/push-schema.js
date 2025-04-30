import dotenv from 'dotenv';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

console.log("Starting schema push to database...");

try {
  // Run drizzle-kit push with auto-confirmation
  execSync('echo "y\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny" | npm run db:push', {
    stdio: 'inherit'
  });
  
  console.log("Schema push completed successfully!");
} catch (error) {
  console.error("Error pushing schema:", error.message);
  process.exit(1);
}