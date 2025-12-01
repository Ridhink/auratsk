// Script to move a user to a different organization
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

/**
 * Move a user to a different organization
 * 
 * Usage:
 * npm run db:move-user <user-email> <target-org-id>
 * 
 * Or provide as arguments:
 * tsx scripts/move-user-org.ts <user-email> <target-org-id>
 */

async function moveUserToOrg() {
  try {
    const { db } = await import('../lib/db/index');
    const { users, organizations } = await import('../lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const userEmail = process.argv[2];
    const targetOrgId = process.argv[3];

    if (!userEmail || !targetOrgId) {
      console.error('❌ Error: Missing arguments');
      console.log('\n📝 Usage:');
      console.log('  npm run db:move-user <user-email> <target-org-id>');
      console.log('\n📋 Example:');
      console.log('  npm run db:move-user hridhin@explaineddigital.com 9b7f4728-ed61-4f79-9fb9-5f865873ae23');
      console.log('\n💡 To find organization IDs, run: npm run db:check-members');
      process.exit(1);
    }

    console.log('🔄 Moving user to organization...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User Email:', userEmail);
    console.log('Target Organization ID:', targetOrgId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Find user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (userResult.length === 0) {
      console.error(`❌ User with email ${userEmail} not found`);
      process.exit(1);
    }

    const user = userResult[0];
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   Current Organization ID: ${user.organizationId}`);

    // Verify target organization exists
    const orgResult = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, targetOrgId))
      .limit(1);

    if (orgResult.length === 0) {
      console.error(`❌ Organization with ID ${targetOrgId} not found`);
      process.exit(1);
    }

    const targetOrg = orgResult[0];
    console.log(`✅ Target organization: ${targetOrg.name}`);

    if (user.organizationId === targetOrgId) {
      console.log('\n✅ User is already in this organization. No changes needed.');
      process.exit(0);
    }

    // Update user's organization
    await db
      .update(users)
      .set({
        organizationId: targetOrgId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log('\n✅ User moved successfully!');
    console.log(`   User: ${user.name}`);
    console.log(`   New Organization: ${targetOrg.name}`);
    console.log(`   Organization ID: ${targetOrgId}`);
    console.log('\n🎉 The user should now appear in the members list!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

moveUserToOrg();

