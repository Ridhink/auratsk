// Load environment variables FIRST, before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env.local first (takes precedence), then .env as fallback
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}

if (existsSync(envPath)) {
  config({ path: envPath });
}

// Verify DATABASE_URL is loaded before importing db
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Demo employee data
const demoEmployees = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'EMPLOYEE' as const,
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    role: 'EMPLOYEE' as const,
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    role: 'EMPLOYEE' as const,
  },
  {
    name: 'David Kim',
    email: 'david.kim@example.com',
    role: 'EMPLOYEE' as const,
  },
  {
    name: 'Jessica Martinez',
    email: 'jessica.martinez@example.com',
    role: 'EMPLOYEE' as const,
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    role: 'EMPLOYEE' as const,
  },
  {
    name: 'Amanda Brown',
    email: 'amanda.brown@example.com',
    role: 'EMPLOYEE' as const,
  },
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@example.com',
    role: 'EMPLOYEE' as const,
  },
];

async function seedDemoEmployees() {
  console.log('🌱 Seeding demo employees...\n');

  try {
    // Dynamic import after env vars are loaded
    const { db } = await import('../lib/db/index');
    const { users, organizations } = await import('../lib/db/schema');
    const { eq } = await import('drizzle-orm');

    // Find admin user
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'ADMIN'))
      .limit(1);

    if (adminUsers.length === 0) {
      console.error('❌ No admin user found. Please create an admin user first.');
      console.log('   Run: npm run seed:admin');
      process.exit(1);
    }

    const admin = adminUsers[0];
    console.log(`✅ Found admin: ${admin.name} (${admin.email})`);
    console.log(`   Organization ID: ${admin.organizationId}\n`);

    // Get organization details
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, admin.organizationId))
      .limit(1);

    if (org.length === 0) {
      console.error('❌ Organization not found');
      process.exit(1);
    }

    console.log(`📦 Organization: ${org[0].name}\n`);

    // Check existing users
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.organizationId, admin.organizationId));

    console.log(`📊 Current users in organization: ${existingUsers.length}`);
    existingUsers.forEach((user) => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });
    console.log('');

    // Create demo employees
    let created = 0;
    let skipped = 0;

    for (const employee of demoEmployees) {
      // Check if user already exists
      const existing = await db
        .select()
        .from(users)
        .where(
          eq(users.email, employee.email)
        )
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Skipping ${employee.name} - already exists`);
        skipped++;
        continue;
      }

      // Create placeholder Clerk ID (format: demo_<timestamp>_<random>)
      const clerkId = `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      try {
        const [newUser] = await db
          .insert(users)
          .values({
            clerkId,
            name: employee.name,
            email: employee.email,
            organizationId: admin.organizationId,
            role: employee.role,
            tasksCount: 0,
          })
          .returning();

        console.log(`✅ Created: ${newUser.name} (${newUser.email})`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating ${employee.name}:`, error);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Summary:`);
    console.log(`   Created: ${created} employee(s)`);
    console.log(`   Skipped: ${skipped} employee(s) (already exist)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show final user count
    const finalUsers = await db
      .select()
      .from(users)
      .where(eq(users.organizationId, admin.organizationId));

    console.log(`👥 Total users in organization: ${finalUsers.length}`);
    console.log(`   - Admin: ${finalUsers.filter(u => u.role === 'ADMIN' || u.role === 'OWNER').length}`);
    console.log(`   - Manager: ${finalUsers.filter(u => u.role === 'MANAGER').length}`);
    console.log(`   - Employee: ${finalUsers.filter(u => u.role === 'EMPLOYEE').length}\n`);

    console.log('✅ Demo employees seeded successfully!');
    console.log('\n📝 Note: These are demo users with placeholder Clerk IDs.');
    console.log('   They cannot sign in via Clerk authentication.');
    console.log('   They are useful for testing task assignments and workload management.\n');

  } catch (error) {
    console.error('❌ Error seeding demo employees:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedDemoEmployees();

