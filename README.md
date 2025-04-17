# OKR Management Platform

A comprehensive OKR (Objectives and Key Results) management platform that leverages AI-powered insights to help teams strategically set, track, and optimize their performance.

## Features

- **Strategic OKR Management**: Create, track, and manage objectives and key results at company, department, team, and individual levels
- **Real-time Updates**: WebSocket-based communication for instant updates
- **AI-enhanced Insights**: Get AI-powered analysis and recommendations
- **Team Collaboration**: In-app chat with advanced communication features
- **Progress Tracking**: Visual dashboards and reporting

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Node.js/Express
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS with Shadcn/UI components
- **Real-time Communication**: WebSockets
- **AI Integration**: OpenAI API (GPT-4o)
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v20 or later)
- **npm** (v9 or later)
- **PostgreSQL** (v16 or later)
- **OpenAI API Key** (for AI-powered features)

## Local Development Setup

### One-Step Setup (Recommended)

We've created a comprehensive setup script that handles the entire local development setup process:

```bash
node scripts/setup.js
```

This script will:
1. Check if all necessary prerequisites are installed
2. Install project dependencies
3. Guide you through setting up your `.env` file
4. Create and configure the PostgreSQL database
5. Run database migrations

### Manual Setup

If you prefer to set up the project step-by-step, follow these instructions:

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd okr-management-platform
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Environment and Database Setup

You have two options for environment setup:

##### Option A: Database Initialization Script

```bash
node scripts/init-db.js
```

This script will:
1. Guide you through setting up a PostgreSQL database
2. Create a `.env` file with the proper configuration
3. Generate a secure SESSION_SECRET

##### Option B: Manual Configuration

1. Create a PostgreSQL database for the project
2. Set up your environment variables by copying the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

3. Edit the `.env` file with your specific configuration:

```
# Database Configuration
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>

# API Keys for AI Features
OPENAI_API_KEY=your_openai_api_key_here

# Environment
NODE_ENV=development

# Session secret (generate a random string)
SESSION_SECRET=your_secure_random_string
```

4. Generate a secure random string for the SESSION_SECRET (you can use any random string generator or run this command):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. Database Migration

After setting up the environment, run the database migrations to set up your schema:

```bash
npm run db:push
```

This will create all necessary tables defined in `shared/schema.ts`.

### 5. Start the Development Server

```bash
npm run dev
```

This will start both the backend server and the React frontend development server. The application will be available at http://localhost:5000.

## Database Schema

The application uses a comprehensive database schema to manage:

- Users and authentication
- Teams and organizational hierarchy
- OKRs (Objectives and Key Results)
- Timeframes and cadences
- Initiatives and check-ins
- Chat and communication

The schema is defined in `shared/schema.ts` using Drizzle ORM.

## API and Services

### OpenAI Integration

The application uses OpenAI's GPT-4o model to provide AI-powered recommendations for:

- Generating objective recommendations based on team and existing objectives
- Creating key result recommendations for specific objectives
- Suggesting improvements to existing OKRs

You must have a valid OpenAI API key to use these features. If the API key is not available, the system will fall back to predefined recommendations.

## Project Structure

```
├── client/                  # Frontend code
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Page components
│   │   └── App.tsx          # Main app component
├── server/                  # Backend code
│   ├── auth.ts              # Authentication setup
│   ├── db.ts                # Database connection
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API routes
│   ├── storage.ts           # Data storage interface
│   ├── services/            # Service implementations
│   ├── sample-data/         # Sample data for testing
│   └── vite.ts              # Vite configuration for server
├── shared/                  # Shared code between frontend and backend
│   └── schema.ts            # Database schema and types
├── scripts/                 # Utility scripts
│   ├── init-db.js           # Database initialization script
│   └── setup.js             # One-step setup assistant
├── migrations/              # Database migrations
├── attached_assets/         # Project assets and documentation
├── drizzle.config.ts        # Drizzle ORM configuration
├── .env.example             # Example environment variables
└── package.json             # Project dependencies and scripts
```

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run db:push`: Apply schema changes to the database
- `npm run check`: Run TypeScript type checking

## Troubleshooting

### Environment Variables

If you see an error like `DATABASE_URL must be set` or the application isn't reading your `.env` file:

1. **Check if the `.env` file exists**: Make sure the `.env` file is in the root directory of the project
   ```bash
   ls -la .env  # Should show the file
   ```

2. **Create the `.env` file if missing**: Copy from example and customize
   ```bash
   cp .env.example .env
   nano .env  # or use your preferred editor
   ```

3. **Check file format**: Ensure there are no spaces around equal signs and values are properly formatted
   ```
   # Correct
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   
   # Incorrect (spaces around equals sign)
   DATABASE_URL = postgresql://username:password@localhost:5432/database_name
   ```

4. **Run the automated setup**: Use our setup script for a guided process
   ```bash
   node scripts/setup.js
   ```

5. **Manually check environment loading**: You can verify environment variables are loaded with:
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
   ```

6. **Node.js version**: Make sure you're using Node.js version 18 or higher, as required by the application

### Database Errors

If you encounter errors like `column "X" of relation "Y" does not exist`:

1. Check that your database schema matches what's defined in `shared/schema.ts`
2. Run `npm run db:push` to update your database schema
3. If you encounter data loss warnings, carefully consider the implications before proceeding

### API Key Issues

If AI features are not working:

1. Verify that your OpenAI API key is correctly set in the `.env` file
2. Check that the API key has sufficient permissions and credits
3. The system will use fallback recommendations if the API is unavailable

## Deployment

The application is configured for deployment on Replit and can be easily adapted for other hosting platforms.

## License

MIT