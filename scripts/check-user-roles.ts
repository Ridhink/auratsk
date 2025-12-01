import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import postgres from 'postgres';

// Load environment variables FIRST
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

async function checkUserRoles() {
  const sql = postgres(process.env.DATABASE_URL!);
  console.log('🔍 Checking user roles in database...\n');

  try {
    // Check what roles exist in the database
    const roleCheck = await sql`
      SELECT DISTINCT role FROM users;
    `;

    console.log('📊 Current roles in users table:');
    if (roleCheck.length > 0) {
      roleCheck.forEach((row: any) => {
        console.log(`  - ${row.role}`);
      });
    } else {
      console.log('  No users found');
    }

    // Check enum values in database
    const enumCheck = await sql`
      SELECT unnest(enum_range(NULL::user_role)) AS enum_value;
    `;

    console.log('\n📋 Current enum values in database:');
    if (enumCheck.length > 0) {
      enumCheck.forEach((row: any) => {
        console.log(`  - ${row.enum_value}`);
      });
    }

    // Check for users with MEMBER role
    const memberUsers = await sql`
      SELECT id, name, email, role FROM users WHERE role = 'MEMBER';
    `;

    if (memberUsers.length > 0) {
      console.log(`\n⚠️  Found ${memberUsers.length} user(s) with 'MEMBER' role:`);
      memberUsers.forEach((row: any) => {
        console.log(`  - ${row.name} (${row.email}) - Role: ${row.role}`);
      });
    } else {
      console.log('\n✅ No users with MEMBER role found');
    }

  } catch (error) {
    console.error('❌ Error checking roles:', error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

checkUserRoles();

