// Script to migrate invites table: add 'used' column and migrate data from 'accepted_at'
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

async function migrateInvitesTable() {
  try {
    const { db } = await import('../lib/db/index');
    const postgres = await import('postgres');
    
    const sql = postgres.default(process.env.DATABASE_URL!);
    
    console.log('🔄 Migrating invites table...\n');
    
    // Check if 'used' column exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invites' 
      AND column_name = 'used'
    `;
    
    if (columnCheck.length > 0) {
      console.log('✅ Column "used" already exists');
    } else {
      // Add 'used' column
      await sql`ALTER TABLE invites ADD COLUMN used BOOLEAN NOT NULL DEFAULT false`;
      console.log('✅ Added "used" column to invites table');
    }
    
    // Check if 'accepted_at' exists and migrate data
    const acceptedAtCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invites' 
      AND column_name = 'accepted_at'
    `;
    
    if (acceptedAtCheck.length > 0) {
      // Migrate data: if accepted_at is not null, set used = true
      const result = await sql`
        UPDATE invites 
        SET used = true 
        WHERE accepted_at IS NOT NULL AND used = false
      `;
      console.log(`✅ Migrated ${result.count} invites from accepted_at to used`);
      
      // Optional: drop accepted_at column
      // Uncomment the next line if you want to remove accepted_at
      // await sql`ALTER TABLE invites DROP COLUMN accepted_at`;
      // console.log('✅ Dropped "accepted_at" column');
    }
    
    console.log('\n✅ Migration complete!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateInvitesTable();

