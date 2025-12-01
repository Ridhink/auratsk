# Schema Migration Guide

This guide explains how to reflect schema changes from `lib/db/schema.ts` to your PostgreSQL database.

## Quick Reference

### Method 1: Push (Fast - Development Only)
```bash
npm run db:push
```
**Use this when:** You're in development and want to quickly sync schema changes.

### Method 2: Generate & Migrate (Recommended - Production)
```bash
npm run db:generate
npm run db:migrate
```
**Use this when:** You want version-controlled migrations (recommended for production).

---

## Step-by-Step Process

### Step 1: Make Changes to Schema

Edit `lib/db/schema.ts` to add/modify tables, columns, or constraints.

**Example:**
```typescript
// Adding a new column
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  // NEW COLUMN
  phone: varchar('phone', { length: 20 }), // Added this
  // ... rest of columns
});
```

### Step 2: Choose Your Migration Method

#### Option A: Push (Development - Fastest)

**Command:**
```bash
npm run db:push
```

**What it does:**
- Directly syncs your schema to the database
- No migration files created
- Fast and convenient for development

**When to use:**
- ✅ Development environment
- ✅ Quick prototyping
- ✅ Testing schema changes

**⚠️ Warning:**
- Not recommended for production
- No migration history
- Can cause data loss if not careful

---

#### Option B: Generate & Migrate (Production - Recommended)

**Step 2a: Generate Migration Files**
```bash
npm run db:generate
```

**What it does:**
- Analyzes your schema changes
- Creates migration SQL files in `./drizzle/` directory
- Generates files like: `0000_<timestamp>_<description>.sql`

**Step 2b: Review Migration Files**

Check the generated migration files in `./drizzle/`:
```bash
ls -la drizzle/
```

**Example migration file:**
```sql
-- Migration: 0000_add_phone_to_users.sql
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);
```

**Step 2c: Apply Migrations**
```bash
npm run db:migrate
```

**What it does:**
- Applies all pending migrations to your database
- Updates the `__drizzle_migrations` table to track applied migrations
- Safe for production use

**When to use:**
- ✅ Production environment
- ✅ Team collaboration
- ✅ Version control
- ✅ Rollback capability

---

## Common Scenarios

### Scenario 1: Adding a New Column

**1. Update schema:**
```typescript
export const tasks = pgTable('tasks', {
  // ... existing columns
  estimatedHours: integer('estimated_hours'), // NEW
});
```

**2. Generate migration:**
```bash
npm run db:generate
```

**3. Apply migration:**
```bash
npm run db:migrate
```

---

### Scenario 2: Adding a New Table

**1. Update schema:**
```typescript
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**2. Generate migration:**
```bash
npm run db:generate
```

**3. Apply migration:**
```bash
npm run db:migrate
```

---

### Scenario 3: Modifying Column Type

**1. Update schema:**
```typescript
// Change from varchar to text
export const tasks = pgTable('tasks', {
  description: text('description'), // Changed from varchar
});
```

**2. Generate migration:**
```bash
npm run db:generate
```

**3. Review the migration file** (important for data type changes!)

**4. Apply migration:**
```bash
npm run db:migrate
```

**⚠️ Warning:** Changing column types may cause data loss. Always backup first!

---

### Scenario 4: Adding Foreign Key

**1. Update schema:**
```typescript
export const tasks = pgTable('tasks', {
  // ... existing columns
  projectId: uuid('project_id').references(() => projects.id), // NEW FK
});
```

**2. Generate migration:**
```bash
npm run db:generate
```

**3. Apply migration:**
```bash
npm run db:migrate
```

---

## Troubleshooting

### Error: "Table already exists"

**Solution:** The table already exists in your database. You can:
- Use `db:push` to sync changes
- Or manually drop the table (⚠️ data loss)
- Or modify the migration file to use `IF NOT EXISTS`

### Error: "Column already exists"

**Solution:** The column was already added. You can:
- Remove the column addition from the migration file
- Or use `db:push` to sync

### Error: "Cannot drop column because it is referenced"

**Solution:** Remove foreign key constraints first, then drop the column.

### Migration Files Not Generated

**Check:**
1. Is `DATABASE_URL` set in `.env.local`?
2. Are there actual schema changes?
3. Check `drizzle.config.ts` points to correct schema file

---

## Best Practices

### ✅ DO:
- **Always backup your database** before migrations in production
- **Review migration files** before applying them
- **Test migrations** in development first
- **Use migrations** (not push) for production
- **Commit migration files** to version control

### ❌ DON'T:
- **Don't edit migration files** after they've been applied
- **Don't use `db:push`** in production
- **Don't skip reviewing** migration files
- **Don't delete migration files** from `./drizzle/` directory

---

## Migration Workflow Summary

### Development Workflow:
```bash
# 1. Make schema changes
# Edit lib/db/schema.ts

# 2. Push changes (fast)
npm run db:push

# OR generate & migrate (better practice)
npm run db:generate
npm run db:migrate
```

### Production Workflow:
```bash
# 1. Make schema changes
# Edit lib/db/schema.ts

# 2. Generate migrations
npm run db:generate

# 3. Review migration files in ./drizzle/

# 4. Test migrations in staging

# 5. Apply to production
npm run db:migrate
```

---

## Additional Commands

### View Database Schema (Drizzle Studio)
```bash
npm run db:studio
```
Opens a visual database browser at `http://localhost:4983`

### Check Current Database State
Connect to your database and run:
```sql
SELECT * FROM __drizzle_migrations;
```
This shows all applied migrations.

---

## Example: Complete Workflow

Let's say you want to add a `status` column to the `invites` table:

**1. Edit `lib/db/schema.ts`:**
```typescript
export const invites = pgTable('invites', {
  // ... existing columns
  status: varchar('status', { length: 50 }).default('PENDING'), // NEW
});
```

**2. Generate migration:**
```bash
npm run db:generate
```

**3. Check generated file:**
```bash
cat drizzle/0000_add_status_to_invites.sql
```

**4. Apply migration:**
```bash
npm run db:migrate
```

**5. Verify in database:**
```bash
npm run db:studio
# Or connect via psql and check the table
```

---

## Need Help?

If you encounter issues:
1. Check `TROUBLESHOOT_DB.md` for common database issues
2. Verify `DATABASE_URL` in `.env.local`
3. Check Drizzle logs for detailed error messages
4. Ensure your database user has proper permissions

