/**
 * Database initialization script for local development
 * This script helps you set up the PostgreSQL database for local development
 * 
 * Usage:
 * 1. Make sure PostgreSQL is installed and running on your machine
 * 2. Run: node scripts/init-db.js
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default values
const defaults = {
  dbName: 'okr_platform',
  dbUser: 'postgres',
  dbPassword: 'postgres',
  dbHost: 'localhost',
  dbPort: '5432'
};

console.log('OKR Platform - Database Initialization Script');
console.log('============================================');
console.log('This script will help you set up a PostgreSQL database for local development.');
console.log('Press ENTER to accept the default values or type your own.\n');

async function askQuestion(question, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${question} (default: ${defaultValue}): `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

async function main() {
  try {
    // Get database configuration
    const dbName = await askQuestion('Database name', defaults.dbName);
    const dbUser = await askQuestion('Database user', defaults.dbUser);
    const dbPassword = await askQuestion('Database password', defaults.dbPassword);
    const dbHost = await askQuestion('Database host', defaults.dbHost);
    const dbPort = await askQuestion('Database port', defaults.dbPort);

    // Construct the DATABASE_URL
    const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    
    // Check if PostgreSQL is installed
    try {
      console.log('\nChecking PostgreSQL installation...');
      execSync('psql --version', { stdio: 'pipe' });
      console.log('PostgreSQL is installed.');
    } catch (error) {
      console.error('PostgreSQL does not seem to be installed or is not in your PATH.');
      console.error('Please install PostgreSQL and make sure it\'s in your PATH before running this script.');
      process.exit(1);
    }

    // Create database if it doesn't exist
    console.log(`\nCreating database ${dbName} if it doesn't exist...`);
    try {
      execSync(`psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -c "SELECT 1 FROM pg_database WHERE datname='${dbName}'" | grep -q 1 || psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -c "CREATE DATABASE ${dbName}"`, {
        stdio: 'pipe',
        env: { ...process.env, PGPASSWORD: dbPassword }
      });
      console.log(`Database ${dbName} is ready.`);
    } catch (error) {
      console.error('Error creating database:', error.message);
      process.exit(1);
    }

    // Generate a SESSION_SECRET
    const crypto = require('crypto');
    const sessionSecret = crypto.randomBytes(32).toString('hex');

    // Create or update .env file
    console.log('\nUpdating .env file with database configuration...');
    const envPath = path.join(__dirname, '..', '.env');
    const envExample = path.join(__dirname, '..', '.env.example');
    
    let envContent = '';
    
    // If .env.example exists, use it as a template
    if (fs.existsSync(envExample)) {
      envContent = fs.readFileSync(envExample, 'utf8');
      // Replace the placeholder values
      envContent = envContent
        .replace(/DATABASE_URL=.*/, `DATABASE_URL=${databaseUrl}`)
        .replace(/SESSION_SECRET=.*/, `SESSION_SECRET=${sessionSecret}`);
    } else {
      // Create basic .env content
      envContent = `# Database Configuration
DATABASE_URL=${databaseUrl}

# API Keys for AI Features
OPENAI_API_KEY=your_openai_api_key_here

# Environment
NODE_ENV=development

# Session secret (generated randomly)
SESSION_SECRET=${sessionSecret}
`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('.env file updated successfully.');

    console.log('\nDatabase setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run "npm run db:push" to create the database schema');
    console.log('2. Run "npm run dev" to start the development server');
    console.log('\nYou may need to add your OpenAI API key to the .env file for AI features to work.');
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  } finally {
    rl.close();
  }
}

main();