# How to Seed an Admin User

## Quick Start

### Option 1: Using the Seed Script (Recommended)

1. **Sign up/Sign in with Clerk**
   - Go to your application's sign-up page
   - Create an account with email: `hridhin@explaineddigital.com`
   - Or sign in if you already have an account

2. **Get Your Clerk User ID**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Navigate to Users
   - Find the user with email `hridhin@explaineddigital.com`
   - Copy the User ID (starts with `user_`)

3. **Run the Seed Script**
   ```bash
   npm run seed:admin <clerk-user-id>
   ```
   
   Example:
   ```bash
   npm run seed:admin user_2abc123def456
   ```

### Option 2: Manual Database Insert

If you prefer to insert directly into the database:

```sql
-- First, get your Clerk User ID from Clerk Dashboard
-- Then run this SQL (replace <clerk-user-id> and <org-id>):

INSERT INTO users (
  clerk_id,
  name,
  email,
  organization_id,
  role,
  tasks_count
) VALUES (
  '<clerk-user-id>',  -- Get from Clerk Dashboard
  'Hridhin',
  'hridhin@explaineddigital.com',
  '<org-id>',  -- Get from organizations table
  'ADMIN',
  0
);
```

## Step-by-Step Instructions

### Step 1: Ensure Clerk Account Exists

1. Visit your application: `http://localhost:3000/sign-up`
2. Sign up with email: `hridhin@explaineddigital.com`
3. Complete the sign-up process

### Step 2: Get Clerk User ID

**Method A: From Clerk Dashboard**
1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to **Users** in the sidebar
4. Find user with email `hridhin@explaineddigital.com`
5. Click on the user
6. Copy the **User ID** (format: `user_xxxxxxxxxxxxx`)

**Method B: From Browser Console (After Sign In)**
1. Sign in to your application
2. Open browser console (F12)
3. Run: `await fetch('/api/user').then(r => r.json())`
4. Check the `clerkId` field

### Step 3: Run Seed Script

```bash
# Make sure you're in the project root
cd /Users/hridhin/Documents/side-projects/aura-task

# Run the seed script with your Clerk User ID
npm run seed:admin user_YOUR_CLERK_USER_ID_HERE
```

### Step 4: Verify

1. Sign in to your application
2. Go to `/members` page
3. You should see your user listed
4. You should have "Invite Member" button (admin privilege)
5. You can invite Managers and Employees

## What the Script Does

1. ✅ Checks if user already exists (by Clerk ID or email)
2. ✅ Updates existing user to ADMIN role if needed
3. ✅ Creates organization if none exists
4. ✅ Creates admin user with:
   - Email: `hridhin@explaineddigital.com`
   - Role: `ADMIN`
   - Name: `Hridhin`
   - Tasks Count: `0`

## Troubleshooting

### Error: "Clerk User ID is required"
- **Solution**: Make sure you provide the Clerk User ID as an argument
- Format: `npm run seed:admin user_xxxxxxxxxxxxx`

### Error: "User already exists"
- **Solution**: The script will update the existing user to ADMIN role
- Check the output to see what happened

### Error: Database connection failed
- **Solution**: 
  1. Check your `.env.local` file has `DATABASE_URL`
  2. Ensure PostgreSQL is running
  3. Verify database credentials

### Error: "Cannot find module 'tsx'"
- **Solution**: Run `npm install --save-dev tsx` first

### User created but can't access admin features
- **Solution**: 
  1. Sign out and sign back in
  2. Check that role is set to `ADMIN` in database
  3. Verify in `/members` page that you see "Invite Member" button

## Alternative: Direct SQL Insert

If you prefer SQL, here's a complete example:

```sql
-- 1. First, get or create an organization
INSERT INTO organizations (
  name,
  clerk_organization_id,
  subscription_status,
  trial_start_date,
  trial_end_date,
  plan
) VALUES (
  'Main Organization',
  'org_temp_' || extract(epoch from now())::text,
  'TRIAL',
  now(),
  now() + interval '20 days',
  'FREE_TRIAL'
) ON CONFLICT DO NOTHING
RETURNING id;

-- 2. Get the organization ID from above, then insert user
-- Replace <org-id> with the ID from step 1
-- Replace <clerk-user-id> with your Clerk User ID
INSERT INTO users (
  clerk_id,
  name,
  email,
  organization_id,
  role,
  tasks_count
) VALUES (
  '<clerk-user-id>',  -- e.g., 'user_2abc123def456'
  'Hridhin',
  'hridhin@explaineddigital.com',
  '<org-id>',  -- UUID from organizations table
  'ADMIN',
  0
) ON CONFLICT (clerk_id) DO UPDATE
SET 
  role = 'ADMIN',
  email = 'hridhin@explaineddigital.com',
  updated_at = now();
```

## Verification Checklist

After seeding, verify:

- [ ] User appears in `/members` page
- [ ] User role is `ADMIN`
- [ ] "Invite Member" button is visible
- [ ] Can invite both Managers and Employees
- [ ] Can access all dashboard features
- [ ] Can view all members and metrics

## Quick Command Reference

```bash
# Install tsx if not already installed
npm install --save-dev tsx

# Run seed script
npm run seed:admin <clerk-user-id>

# Example
npm run seed:admin user_2abc123def456ghi789
```

## Notes

- The script is idempotent - you can run it multiple times safely
- If user exists, it will update the role to ADMIN
- Organization will be created automatically if none exists
- The script requires a valid Clerk User ID (user must exist in Clerk first)

