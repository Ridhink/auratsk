# Connect to Existing PostgreSQL Database (pgAdmin)

## Step 1: Get Your Database Connection Details

From pgAdmin, you need these details:
- **Host/Server**: Usually `localhost` or `127.0.0.1`
- **Port**: Usually `5432` (default PostgreSQL port)
- **Database Name**: The name you gave your database in pgAdmin
- **Username**: Your PostgreSQL username (often `postgres` or your system username)
- **Password**: Your PostgreSQL password (if you set one)

### How to Find These in pgAdmin:

1. **Right-click on your database** → **Properties** → Check the name
2. **Right-click on your server** → **Properties** → Check:
   - **Host**: Usually `localhost`
   - **Port**: Usually `5432`
   - **Username**: Your login username
   - **Password**: The one you use to connect in pgAdmin

## Step 2: Create Connection String

The format is:
```
postgresql://[username]:[password]@[host]:[port]/[database_name]
```

### Examples:

**With password:**
```
postgresql://postgres:mypassword@localhost:5432/auratask
```

**Without password (if you didn't set one):**
```
postgresql://postgres@localhost:5432/auratask
```

**Different username:**
```
postgresql://myuser:mypassword@localhost:5432/auratask
```

## Step 3: Add to .env.local

Create or update `.env.local` file in your project root:

```bash
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/your_database_name
```

**Replace:**
- `your_username` - Your PostgreSQL username
- `your_password` - Your PostgreSQL password
- `your_database_name` - The database name you created in pgAdmin
- `localhost:5432` - Your host and port (usually these are correct)

## Step 4: Test Connection

Run this to test if the connection works:

```bash
npm run db:studio
```

This will open Drizzle Studio. If it connects, you'll see your database schema.

## Step 5: Create Tables

Push the schema to your database:

```bash
npm run db:push
```

This will create all the tables (organizations, users, tasks, performance_metrics) in your existing database.

## Quick Test Script

If you want to test the connection manually, create `test-connection.ts`:

```typescript
import { db } from './lib/db';

async function test() {
  try {
    const result = await db.execute('SELECT NOW() as time');
    console.log('✅ Connected! Current time:', result);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
  process.exit(0);
}

test();
```

Run: `npx tsx test-connection.ts`

## Common Issues

### "password authentication failed"
- Double-check your password in the connection string
- Make sure there are no extra spaces

### "database does not exist"
- Verify the database name matches exactly what you see in pgAdmin
- Database names are case-sensitive in some setups

### "connection refused"
- Make sure PostgreSQL is running
- Check the port number (should be 5432)
- Verify the host is correct (localhost vs 127.0.0.1)

### Special Characters in Password
If your password has special characters, URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- etc.

Example:
```
postgresql://user:p@ssw0rd@localhost:5432/db
```
becomes:
```
postgresql://user:p%40ssw0rd@localhost:5432/db
```

## That's It!

Once you've:
1. ✅ Added `DATABASE_URL` to `.env.local`
2. ✅ Run `npm run db:push` to create tables
3. ✅ Started your app with `npm run dev`

Your application will be connected to your pgAdmin database!

