# Troubleshooting Database Connection Error

## Error Message
```
Failed query: select "id", "clerk_id", ... from "users" where "users"."clerk_id" = $1
```

This error means the database query is failing. Here's how to fix it:

## Step 1: Verify Database Connection

Check if your `.env.local` has the correct `DATABASE_URL`:

```bash
# Should look like:
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

## Step 2: Verify Tables Exist

Run this to check if tables were created:

```bash
# Option 1: Use Drizzle Studio (visual)
npm run db:studio

# Option 2: Use psql command line
psql your_database_name -c "\dt"
```

You should see:
- `organizations`
- `users`
- `tasks`
- `performance_metrics`

## Step 3: Create Tables if Missing

If tables don't exist, create them:

```bash
npm run db:push
```

## Step 4: Test Connection

Create a test file `test-db.js`:

```javascript
require('dotenv').config({ path: '.env.local' });
const { db } = require('./lib/db/index.ts');

async function test() {
  try {
    const result = await db.execute('SELECT NOW()');
    console.log('✅ Connected!', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
```

## Common Issues

### Issue 1: Database Doesn't Exist
```bash
# Create it:
createdb your_database_name
```

### Issue 2: Wrong Credentials
- Check username/password in `DATABASE_URL`
- Make sure they match your PostgreSQL setup

### Issue 3: PostgreSQL Not Running
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Issue 4: Connection String Format
Make sure it's:
```
postgresql://user:pass@host:port/db
```
NOT:
```
postgres://user:pass@host:port/db  # Missing 'ql'
```

## Quick Fix

1. **Verify DATABASE_URL in .env.local**
2. **Run:** `npm run db:push`
3. **Check tables exist:** `npm run db:studio`
4. **Restart dev server**

## Still Not Working?

Check the actual error message in your terminal - it will tell you exactly what's wrong (connection refused, authentication failed, etc.)

