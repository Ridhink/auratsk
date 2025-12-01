// Script to check all users and their organizations
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}
if (existsSync(envPath)) {
  config({ path: envPath });
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function checkMembers() {
  try {
    const { db } = await import('../lib/db/index');
    const { users, organizations } = await import('../lib/db/schema');

    console.log('🔍 Checking all users and organizations...\n');

    // Get all organizations
    const allOrgs = await db.select().from(organizations);
    console.log(`📦 Found ${allOrgs.length} organization(s):`);
    allOrgs.forEach((org) => {
      console.log(`  - ${org.name} (ID: ${org.id})`);
      console.log(`    Clerk Org ID: ${org.clerkOrganizationId}`);
    });

    console.log('\n👥 All users in database:');
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} user(s):\n`);

    for (const user of allUsers) {
      const org = allOrgs.find((o) => o.id === user.organizationId);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Clerk ID: ${user.clerkId}`);
      console.log(`Role: ${user.role}`);
      console.log(`Organization: ${org ? org.name : '❌ NOT FOUND'}`);
      console.log(`Organization ID: ${user.organizationId}`);
      console.log(`Tasks Count: ${user.tasksCount}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }

    // Check for the specific user
    const targetUser = allUsers.find((u) => u.email === 'hridhin@explaineddigital.com');
    if (targetUser) {
      console.log('✅ User hridhin@explaineddigital.com found!');
      const targetOrg = allOrgs.find((o) => o.id === targetUser.organizationId);
      console.log(`   Organization: ${targetOrg ? targetOrg.name : 'NOT FOUND'}`);
      console.log(`   Organization ID: ${targetUser.organizationId}`);
    } else {
      console.log('❌ User hridhin@explaineddigital.com NOT found in database');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMembers();

