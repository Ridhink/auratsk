# Seed Demo Employees Guide

This guide explains how to create demo employees for testing task management features.

## Quick Start

```bash
npm run seed:demo-employees
```

## What It Does

The script creates **8 demo employees** in your current organization:

1. Sarah Johnson (sarah.johnson@example.com)
2. Michael Chen (michael.chen@example.com)
3. Emily Rodriguez (emily.rodriguez@example.com)
4. David Kim (david.kim@example.com)
5. Jessica Martinez (jessica.martinez@example.com)
6. James Wilson (james.wilson@example.com)
7. Amanda Brown (amanda.brown@example.com)
8. Robert Taylor (robert.taylor@example.com)

## Requirements

- ✅ An admin user must exist in your organization
- ✅ Database connection must be configured (`DATABASE_URL` in `.env.local`)

## Features

- **Automatic Organization Detection**: Finds your admin user and uses their organization
- **Duplicate Prevention**: Skips employees that already exist (by email)
- **Safe to Run Multiple Times**: Won't create duplicates
- **Summary Report**: Shows what was created and what was skipped

## Example Output

```
🌱 Seeding demo employees...

✅ Found admin: HRIDHIN K (hridhinchembakasseri@gmail.com)
   Organization ID: 9b7f4728-ed61-4f79-9fb9-5f865873ae23

📦 Organization: HRIDHIN's Organization

📊 Current users in organization: 2
   - HRIDHIN K (hridhinchembakasseri@gmail.com) - ADMIN
   - HRIDHI K (hridhin@explaineddigital.com) - EMPLOYEE

✅ Created: Sarah Johnson (sarah.johnson@example.com)
✅ Created: Michael Chen (michael.chen@example.com)
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary:
   Created: 8 employee(s)
   Skipped: 0 employee(s) (already exist)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 Total users in organization: 10
   - Admin: 1
   - Manager: 1
   - Employee: 8
```

## Important Notes

### ⚠️ Demo Users Cannot Sign In - NO PASSWORDS

**These demo employees DO NOT have passwords and CANNOT sign in.**

They are **database records only** with placeholder Clerk IDs. They are designed for:

- ✅ Testing task assignments
- ✅ Testing workload balancing
- ✅ Testing member management features
- ✅ Testing performance metrics
- ✅ UI/UX testing

**Why no passwords?**
- They use placeholder Clerk IDs (format: `demo_<timestamp>_<random>`)
- They are not registered in Clerk authentication system
- They exist only in your database for testing purposes
- **You cannot log in as these users**

**To test as an employee:**
1. Create a real user via the invite system
2. Or sign up with a different email to create a new account

### 🔐 For Real Users Who Can Sign In

**Demo employees cannot sign in.** To add real users who can authenticate:

**Option 1: Invite System (Recommended)**
1. Go to `/members` page
2. Click "Invite Member"
3. Enter their email and role (EMPLOYEE or MANAGER)
4. They'll receive an invite link via email
5. They can sign up and create their own password

**Option 2: Direct Sign Up**
- Users can sign up directly at `/sign-up`
- First user in an organization becomes ADMIN
- Subsequent users need invites to join existing organizations

## Use Cases

### Testing Task Assignment
```bash
# 1. Seed demo employees
npm run seed:demo-employees

# 2. Go to dashboard
# 3. Create tasks and assign them to demo employees
# 4. Test workload balancing
```

### Testing Member Management
```bash
# 1. Seed demo employees
npm run seed:demo-employees

# 2. Go to /members page
# 3. View all employees
# 4. Check their workload and performance metrics
```

### Testing AI Workload Balancing
```bash
# 1. Seed demo employees
npm run seed:demo-employees

# 2. Use AI assistant to create tasks
# 3. AI will suggest employees with lighter workloads
```

## Customization

To modify the demo employees, edit `scripts/seed-demo-employees.ts`:

```typescript
const demoEmployees = [
  {
    name: 'Your Name',
    email: 'your.email@example.com',
    role: 'EMPLOYEE' as const,
  },
  // Add more...
];
```

## Troubleshooting

### Error: "No admin user found"
**Solution:** Create an admin user first:
```bash
npm run seed:admin <your-clerk-user-id>
```

### Error: "DATABASE_URL not set"
**Solution:** Ensure `.env.local` exists with `DATABASE_URL`:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### Employees Already Exist
**Solution:** This is normal! The script skips existing employees. If you want to recreate them:
1. Manually delete them from the database, OR
2. Modify the script to use different emails

## FAQ

### Q: What is the password for demo employees?
**A: There is NO password.** Demo employees cannot sign in. They are database records only for testing task assignments and workload management.

### Q: How do I test as an employee?
**A:**
1. Use the invite system to create a real employee account
2. Or sign up with a new email (will create a new organization as ADMIN)

### Q: Can I convert demo employees to real users?
**A:** No, they use placeholder Clerk IDs. You would need to:
1. Delete the demo employee
2. Invite them using their email address
3. They sign up via the invite link

## Related Commands

- `npm run seed:admin` - Create an admin user
- `npm run db:check-members` - Check all members in database
- `npm run db:studio` - View database in Drizzle Studio

