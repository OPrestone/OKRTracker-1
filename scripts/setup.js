/**
 * Local environment setup script
 * Automates the setup process for local development
 * 
 * Usage:
 * node scripts/setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

async function setupEnvironment() {
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│  OKR Management Platform - Setup Assistant   │');
  console.log('└─────────────────────────────────────────────┘');
  console.log('This script will help you set up your local development environment.');

  // Step 1: Check prerequisites
  try {
    console.log('\nStep 1: Checking prerequisites...');
    checkPrerequisites();
  } catch (error) {
    console.error(`\n❌ ${error.message}`);
    process.exit(1);
  }

  // Step 2: Install dependencies
  try {
    console.log('\nStep 2: Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully.');
  } catch (error) {
    console.error('\n❌ Failed to install dependencies.');
    console.error(error.message);
    process.exit(1);
  }

  // Step 3: Set up environment variables
  const setupEnvFile = await askQuestion(
    '\nStep 3: Would you like to set up the .env file? (y/n)',
    'y'
  );

  if (setupEnvFile.toLowerCase() === 'y') {
    try {
      await createEnvFile();
      console.log('✅ .env file created successfully.');
    } catch (error) {
      console.error('\n❌ Failed to create .env file.');
      console.error(error.message);
    }
  }

  // Step 4: Set up database
  const setupDatabase = await askQuestion(
    '\nStep 4: Would you like to set up the database? (y/n)',
    'y'
  );

  if (setupDatabase.toLowerCase() === 'y') {
    try {
      console.log('\nRunning database setup script...');
      execSync('node scripts/init-db.js', { stdio: 'inherit' });
    } catch (error) {
      console.error('\n❌ Failed to set up database.');
      console.error(error.message);
    }
  }

  // Step 5: Run database migrations
  const runMigrations = await askQuestion(
    '\nStep 5: Would you like to run database migrations? (y/n)',
    'y'
  );

  if (runMigrations.toLowerCase() === 'y') {
    try {
      console.log('\nRunning database migrations...');
      execSync('npm run db:push', { stdio: 'inherit' });
      console.log('✅ Database migrations completed successfully.');
    } catch (error) {
      console.error('\n❌ Failed to run database migrations.');
      console.error(error.message);
    }
  }

  console.log('\n┌─────────────────────────────────────────────┐');
  console.log('│               Setup Complete!               │');
  console.log('└─────────────────────────────────────────────┘');
  console.log('You can now start the development server with:');
  console.log('  npm run dev');

  rl.close();
}

function checkPrerequisites() {
  // Check Node.js version
  const nodeVersion = process.version;
  console.log(`Node.js version: ${nodeVersion}`);
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (majorVersion < 20) {
    throw new Error(`Node.js version 20 or higher is required. Current version: ${nodeVersion}`);
  }

  // Check npm version
  try {
    const npmVersion = execSync('npm --version').toString().trim();
    console.log(`npm version: ${npmVersion}`);
    const npmMajorVersion = parseInt(npmVersion.split('.')[0], 10);
    if (npmMajorVersion < 9) {
      console.warn(`⚠️ Warning: npm version 9 or higher is recommended. Current version: ${npmVersion}`);
    }
  } catch (error) {
    console.warn('⚠️ Warning: Unable to check npm version.');
  }

  // Check PostgreSQL
  try {
    const pgVersion = execSync('psql --version').toString().trim();
    console.log(`PostgreSQL: ${pgVersion}`);
  } catch (error) {
    console.warn('⚠️ Warning: PostgreSQL does not seem to be installed or is not in your PATH.');
    console.warn('You may need to install PostgreSQL or run the database on a remote server.');
  }

  console.log('✅ Prerequisite check completed.');
}

async function createEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  if (!fs.existsSync(envExamplePath)) {
    throw new Error('.env.example file not found.');
  }

  if (fs.existsSync(envPath)) {
    const overwrite = await askQuestion('.env file already exists. Overwrite? (y/n)', 'n');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Skipping .env file creation.');
      return;
    }
  }

  // Read the example file
  let envContent = fs.readFileSync(envExamplePath, 'utf8');

  // Ask for database config
  console.log('\nDatabase Configuration:');
  const dbUser = await askQuestion('Database username', 'postgres');
  const dbPassword = await askQuestion('Database password', 'postgres');
  const dbHost = await askQuestion('Database host', 'localhost');
  const dbPort = await askQuestion('Database port', '5432');
  const dbName = await askQuestion('Database name', 'okr_platform');

  const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  
  // Ask for OpenAI API key
  console.log('\nOpenAI Configuration:');
  const openaiKey = await askQuestion('OpenAI API Key (leave blank to set later)');

  // Generate session secret
  const crypto = require('crypto');
  const sessionSecret = crypto.randomBytes(32).toString('hex');

  // Replace values in the env content
  envContent = envContent
    .replace(/DATABASE_URL=.*/, `DATABASE_URL=${databaseUrl}`)
    .replace(/OPENAI_API_KEY=.*/, `OPENAI_API_KEY=${openaiKey}`)
    .replace(/SESSION_SECRET=.*/, `SESSION_SECRET=${sessionSecret}`);

  // Write the file
  fs.writeFileSync(envPath, envContent);
}

setupEnvironment();