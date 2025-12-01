import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import postgres from 'postgres';

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

async function fixUserRoleEnum() {
  const sql = postgres(process.env.DATABASE_URL!);

  console.log('🔧 Fixing user_role enum...\n');

  try {
    // Step 1: Check current enum values
    console.log('📋 Step 1: Checking current enum values...');
    const currentEnum = await sql`
      SELECT unnest(enum_range(NULL::user_role)) AS enum_value;
    `;
    console.log('Current enum values:', currentEnum.map((e: any) => e.enum_value).join(', '));

    // Step 2: Check for users with MEMBER role
    console.log('\n📋 Step 2: Checking for users with MEMBER role...');
    const memberUsers = await sql`
      SELECT id, name, email, role FROM users WHERE role = 'MEMBER';
    `;
    
    if (memberUsers.length > 0) {
      console.log(`Found ${memberUsers.length} user(s) with MEMBER role:`);
      memberUsers.forEach((user: any) => {
        console.log(`  - ${user.name} (${user.email})`);
      });
      
      // Step 3: Update MEMBER to EMPLOYEE
      console.log('\n📋 Step 3: Updating MEMBER to EMPLOYEE...');
      const updated = await sql`
        UPDATE users SET role = 'EMPLOYEE' WHERE role = 'MEMBER';
      `;
      console.log(`✅ Updated ${updated.count} user(s) from MEMBER to EMPLOYEE`);
    } else {
      console.log('✅ No users with MEMBER role found');
    }

    // Step 4: Check if MEMBER exists in enum and remove it
    console.log('\n📋 Step 4: Updating enum definition...');
    
    // Check if MEMBER is in the enum
    const hasMember = currentEnum.some((e: any) => e.enum_value === 'MEMBER');
    
    if (hasMember) {
      // We need to recreate the enum without MEMBER
      // This is complex in PostgreSQL, so we'll use ALTER TYPE to rename/add values
      // First, let's check if we can add EMPLOYEE if it doesn't exist
      const hasEmployee = currentEnum.some((e: any) => e.enum_value === 'EMPLOYEE');
      
      if (!hasEmployee) {
        console.log('Adding EMPLOYEE to enum...');
        await sql`
          ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'EMPLOYEE';
        `;
      }
      
      // Note: PostgreSQL doesn't allow removing enum values directly
      // The old MEMBER value will remain but won't be used
      console.log('⚠️  Note: MEMBER enum value cannot be removed (PostgreSQL limitation)');
      console.log('   It will remain in the enum but won\'t be used. This is safe.');
    }

    // Step 5: Verify final state
    console.log('\n📋 Step 5: Verifying final state...');
    const finalEnum = await sql`
      SELECT unnest(enum_range(NULL::user_role)) AS enum_value;
    `;
    console.log('Final enum values:', finalEnum.map((e: any) => e.enum_value).join(', '));
    
    const finalUsers = await sql`
      SELECT role, COUNT(*) as count FROM users GROUP BY role;
    `;
    console.log('\nUser role distribution:');
    finalUsers.forEach((row: any) => {
      console.log(`  - ${row.role}: ${row.count} user(s)`);
    });

    console.log('\n✅ Enum fix complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run db:push');
    console.log('   2. Or run: npm run db:generate && npm run db:migrate');

  } catch (error) {
    console.error('❌ Error fixing enum:', error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

fixUserRoleEnum();

