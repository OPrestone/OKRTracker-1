# OKR Management Platform

<div align="center">
  <h3>A comprehensive OKR platform with AI-powered insights</h3>
  <p>Track, manage, and optimize team performance with objectives and key results</p>
</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [Quick Setup (Recommended)](#quick-setup-recommended)
  - [Step-by-Step Setup](#step-by-step-setup)
- [Common Setup Issues](#-common-setup-issues)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Available Commands](#-available-commands)
- [Deployment](#-deployment)
- [License](#-license)

## 🔍 Overview

This OKR (Objectives and Key Results) Management Platform helps organizations track and align strategic goals across company, department, team, and individual levels. The platform leverages AI to provide insights and recommendations for better goal setting and tracking.

## ✨ Features

- **Strategic OKR Management**: Create, track, and manage objectives at all organizational levels
- **Real-time Updates**: Instant updates via WebSockets
- **AI-enhanced Insights**: GPT-4o powered analysis and recommendations
- **Team Collaboration**: In-app chat with messaging and reactions
- **Progress Tracking**: Visual dashboards and comprehensive reporting

## 🛠️ Tech Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Node.js/Express
- **Database**: PostgreSQL (via Neon Database)
- **Styling**: Tailwind CSS with Shadcn/UI components
- **Real-time**: WebSockets
- **AI**: OpenAI API (GPT-4o)
- **Data Layer**: Drizzle ORM, TanStack Query

## 📋 Prerequisites

Before starting, make sure you have:

- **Node.js** (v18 or later)
- **npm** (v8 or later)
- **PostgreSQL** database (local or cloud-hosted)
- **OpenAI API Key** (for AI features)

## 🚀 Getting Started

### Quick Setup (Recommended)

Our automated setup script handles everything for you:

```bash
node scripts/setup.js
```

This interactive script will:
- ✅ Check prerequisites
- ✅ Install dependencies 
- ✅ Configure environment variables
- ✅ Set up database connection
- ✅ Run database migrations

### Step-by-Step Setup

If you prefer manual setup:

#### 1️⃣ Clone and Install Dependencies

```bash
git clone <repository-url>
cd okr-management-platform
npm install
```

#### 2️⃣ Configure Environment

Create and configure your `.env` file:

```bash
# Copy example environment file
cp .env.example .env

# Edit with your specific details
nano .env  # or use your preferred editor
```

Your `.env` file should contain:

```
# Database Configuration
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>

# API Keys for AI Features  
OPENAI_API_KEY=your_openai_api_key

# Environment
NODE_ENV=development

# Session Secret (security)
SESSION_SECRET=generate_a_random_string_here
```

For the SESSION_SECRET, generate a secure random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3️⃣ Initialize Database

For interactive database setup:

```bash
node scripts/init-db.js
```

#### 4️⃣ Run Migrations

Apply the database schema:

```bash
npm run db:push
```

This creates all tables defined in `shared/schema.ts`.

#### 5️⃣ Start Development Server

```bash
npm run dev
```

The application will be available at http://localhost:5000

## ⚠️ Common Setup Issues

### Environment Variables Not Loading

If you see error: `DATABASE_URL must be set` or similar:

1. **Verify .env file location**: It must be in the project root directory
   ```bash
   ls -la | grep .env
   ```

2. **Check .env format**: No spaces around equal signs
   ```
   # Correct
   DATABASE_URL=postgresql://username:password@localhost:5432/database
   
   # Incorrect
   DATABASE_URL = postgresql://username:password@localhost:5432/database
   ```

3. **Test environment loading**:
   ```bash
   node -e "require('dotenv').config(); console.log('DB URL:', !!process.env.DATABASE_URL)"
   ```

### Database Connection Issues

If you see errors like:

- **Certificate expired**: Add SSL parameters to your connection string
  ```
  DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require&sslaccept=accept_invalid_certs
  ```

- **Column does not exist**: Run migrations to update schema
  ```bash
  npm run db:push
  ```

- **Connection refused**: Check database credentials and firewall settings

### OpenAI API Issues

If AI features aren't working:

1. **Verify API key**: Make sure it's correctly formatted in .env file
2. **Check API limits**: Ensure your account has available credits
3. **Network connectivity**: Check if your network allows API calls

## 📊 Database Schema

The application uses Drizzle ORM with the following main entities:

- **Users**: Authentication and user profiles
- **Teams**: Organizational structure
- **Objectives**: Main strategic goals
- **Key Results**: Measurable outcomes for objectives
- **Initiatives**: Actionable tasks for key results
- **Check-ins**: Progress updates and status reports
- **Chat**: Communication between team members

Schema details are in `shared/schema.ts`.

## 📁 Project Structure

```
├── client/                  # Frontend React application
│   └── src/                 # Source files for frontend
│       ├── components/      # UI components
│       ├── hooks/           # React hooks
│       ├── pages/           # Page components
│       └── ...
├── server/                  # Backend Node.js/Express
│   ├── auth.ts              # Authentication
│   ├── db.ts                # Database connection
│   ├── routes.ts            # API endpoints
│   ├── storage.ts           # Data access layer
│   └── ...
├── shared/                  # Shared code
│   └── schema.ts            # Database schema
├── scripts/                 # Utility scripts
│   ├── setup.js             # Setup assistant
│   └── init-db.js           # Database initialization
├── .env.example             # Example environment variables
└── ...
```

## 📝 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production server |
| `npm run db:push` | Update database schema |
| `npm run check` | Run TypeScript checks |

## 🌐 Deployment

The application is configured for:

- **Replit**: Ready to deploy from Replit's interface
- **Other platforms**: Can be adapted for Heroku, Vercel, etc.

## 📄 License

MIT License