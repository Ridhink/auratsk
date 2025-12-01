# Local PostgreSQL Database Setup Guide

## Step 1: Install PostgreSQL (if not already installed)

### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

Or use Docker:
```bash
docker run --name postgres-auratask -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=auratask -p 5432:5432 -d postgres:15
```

## Step 2: Create Database

### Option A: Using psql (Command Line)

1. Connect to PostgreSQL:
```bash
psql postgres
```

2. Create database and user:
```sql
-- Create database
CREATE DATABASE auratask;

-- Create user (optional, or use default 'postgres' user)
CREATE USER auratask_user WITH PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE auratask TO auratask_user;

-- Exit psql
\q
```

### Option B: Using createdb command
```bash
createdb auratask
```

## Step 3: Get Connection String

Your connection string format:
```
postgresql://[username]:[password]@[host]:[port]/[database]
```

### Common Local Connection Strings:

**Using default postgres user:**
```
postgresql://postgres:postgres@localhost:5432/auratask
```

**Using custom user:**
```
postgresql://auratask_user:your_password@localhost:5432/auratask
```

**No password (if configured):**
```
postgresql://postgres@localhost:5432/auratask
```

## Step 4: Set Environment Variable

Create or update `.env.local` file in your project root:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auratask
```

**Important:** Replace `postgres:postgres` with your actual username and password.

## Step 5: Test Connection

### Option A: Using Drizzle Studio
```bash
npm run db:studio
```
This will open a browser interface where you can see your database tables.

### Option B: Create a test script

Create `test-db-connection.ts`:
```typescript
import { db } from './lib/db';

async function testConnection() {
  try {
    // Try a simple query
    const result = await db.execute('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
  process.exit(0);
}

testConnection();
```

Run it:
```bash
npx tsx test-db-connection.ts
```

## Step 6: Initialize Database Schema

### Option A: Push Schema Directly (Recommended for Development)
```bash
npm run db:push
```
This will create all tables directly without migration files.

### Option B: Generate and Run Migrations (Recommended for Production)
```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate
```

## Step 7: Verify Tables Created

Check if tables were created:

```bash
psql auratask -c "\dt"
```

You should see:
- organizations
- users
- tasks
- performance_metrics

Or use Drizzle Studio:
```bash
npm run db:studio
```

## Troubleshooting

### Error: "password authentication failed"
- Check your PostgreSQL password
- Try resetting password:
  ```sql
  ALTER USER postgres WITH PASSWORD 'new_password';
  ```

### Error: "database does not exist"
- Make sure you created the database:
  ```bash
  createdb auratask
  ```

### Error: "connection refused"
- Check if PostgreSQL is running:
  ```bash
  # macOS
  brew services list
  
  # Linux
  sudo systemctl status postgresql
  
  # Start if not running
  brew services start postgresql@15  # macOS
  sudo systemctl start postgresql    # Linux
  ```

### Error: "port 5432 is already in use"
- Check what's using the port:
  ```bash
  lsof -i :5432
  ```
- Or use a different port in your connection string

### Finding Your PostgreSQL Port
Default is 5432. To check:
```bash
psql postgres -c "SHOW port;"
```

## Quick Setup Script (macOS/Linux)

Save this as `setup-db.sh`:

```bash
#!/bin/bash

# Create database
createdb auratask 2>/dev/null || echo "Database already exists or error occurred"

# Check if database was created
if psql -lqt | cut -d \| -f 1 | grep -qw auratask; then
    echo "✅ Database 'auratask' created successfully"
    echo ""
    echo "Add this to your .env.local file:"
    echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auratask"
    echo ""
    echo "Then run: npm run db:push"
else
    echo "❌ Failed to create database"
fi
```

Make it executable and run:
```bash
chmod +x setup-db.sh
./setup-db.sh
```

## Using Docker (Alternative)

If you prefer Docker:

```bash
# Run PostgreSQL container
docker run --name postgres-auratask \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=auratask \
  -p 5432:5432 \
  -d postgres:15

# Connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auratask
```

## Next Steps

Once connected:
1. ✅ Database is ready
2. Run `npm run db:push` to create tables
3. Start your app: `npm run dev`
4. Sign up and create an organization
5. The webhook will sync data to your database

## Verify Everything Works

1. Check connection:
   ```bash
   npm run db:studio
   ```

2. Start app:
   ```bash
   npm run dev
   ```

3. Sign up at http://localhost:3000/sign-up

4. Check database:
   ```bash
   psql auratask -c "SELECT * FROM organizations;"
   ```

You should see your organization record!

