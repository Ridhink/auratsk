// Load environment variables FIRST, before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env.local first (takes precedence), then .env as fallback
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  console.log('📄 Loading .env.local...');
  config({ path: envLocalPath });
} else {
  console.log('⚠️  .env.local not found, trying .env...');
}

if (existsSync(envPath)) {
  config({ path: envPath });
}

// Verify DATABASE_URL is loaded before importing db
if (!process.env.DATABASE_URL) {
  console.error('\n❌ Error: DATABASE_URL environment variable is not set');
  console.log('\n📝 Please ensure you have a .env.local file with DATABASE_URL');
  console.log('Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
  console.log('\n💡 Files checked:');
  console.log('  - .env.local:', existsSync(envLocalPath) ? '✅ exists' : '❌ not found');
  console.log('  - .env:', existsSync(envPath) ? '✅ exists' : '❌ not found');
  console.log('\n💡 Make sure DATABASE_URL is set in .env.local (not just a placeholder)');
  process.exit(1);
}

/**
 * Seed script to create an admin user
 * 
 * Usage:
 * npm run seed:admin <clerk-user-id>
 * 
 * Example:
 * npm run seed:admin user_36EaJhP9SbCjRXgCIirVJxn2Jcn
 */

const ADMIN_EMAIL = 'hridhin@explaineddigital.com';
const ADMIN_NAME = 'Hridhin';

async function seedAdmin() {
  try {
    // Dynamic import after env vars are loaded
    const { db } = await import('../lib/db/index');
    const { users, organizations } = await import('../lib/db/schema');
    const { eq } = await import('drizzle-orm');

    console.log('\n🌱 Starting admin user seed...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Get Clerk user ID from command line argument
    const clerkUserId = process.argv[2];
    
    if (!clerkUserId) {
      console.error('❌ Error: Clerk User ID is required');
      console.log('\n📝 Instructions:');
      console.log('1. Sign up/sign in with email:', ADMIN_EMAIL);
      console.log('2. Get your Clerk User ID from Clerk Dashboard');
      console.log('3. Run: npm run seed:admin <clerk-user-id>');
      console.log('\nExample: npm run seed:admin user_36EaJhP9SbCjRXgCIirVJxn2Jcn');
      process.exit(1);
    }

    console.log('📋 Clerk User ID:', clerkUserId);
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('👤 Name:', ADMIN_NAME);
    console.log('');

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (existingUser[0]) {
      console.log('✅ User already exists in database');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('User ID:', existingUser[0].id);
      console.log('Email:', existingUser[0].email);
      console.log('Role:', existingUser[0].role);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Update role and email if needed
      const needsUpdate = 
        existingUser[0].role !== 'ADMIN' && existingUser[0].role !== 'OWNER' ||
        existingUser[0].email !== ADMIN_EMAIL;
      
      if (needsUpdate) {
        await db
          .update(users)
          .set({ 
            role: 'ADMIN',
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser[0].id));
        console.log('\n✅ User updated:');
        console.log('  - Role: ADMIN');
        console.log('  - Email:', ADMIN_EMAIL);
        console.log('  - Name:', ADMIN_NAME);
      } else {
        console.log('\n✅ User already has ADMIN/OWNER role and correct email');
      }
      
      process.exit(0);
    }

    // Check if user exists by email
    const existingUserByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    if (existingUserByEmail[0]) {
      console.log('⚠️  User with this email already exists');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('User ID:', existingUserByEmail[0].id);
      console.log('Clerk ID:', existingUserByEmail[0].clerkId);
      console.log('Role:', existingUserByEmail[0].role);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Update Clerk ID and role
      await db
        .update(users)
        .set({ 
          clerkId: clerkUserId,
          role: 'ADMIN',
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUserByEmail[0].id));
      console.log('\n✅ Clerk ID updated and role set to ADMIN');
      process.exit(0);
    }

    // Get or create organization
    const existingOrg = await db
      .select()
      .from(organizations)
      .limit(1);

    let organizationId: string;

    if (existingOrg[0]) {
      organizationId = existingOrg[0].id;
      console.log('📦 Using existing organization:', existingOrg[0].name);
    } else {
      // Create a default organization
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 20);

      const [newOrg] = await db
        .insert(organizations)
        .values({
          name: 'Main Organization',
          clerkOrganizationId: `org_${Date.now()}`,
          subscriptionStatus: 'TRIAL',
          trialStartDate,
          trialEndDate,
          plan: 'FREE_TRIAL',
        })
        .returning();

      organizationId = newOrg.id;
      console.log('✅ Created new organization:', newOrg.name);
    }

    // Create admin user
    console.log('\n🔨 Creating admin user...');
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: clerkUserId,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        organizationId: organizationId,
        role: 'ADMIN',
        tasksCount: 0,
      })
      .returning();

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User ID:', newUser.id);
    console.log('Clerk ID:', newUser.clerkId);
    console.log('Name:', newUser.name);
    console.log('Email:', newUser.email);
    console.log('Role:', newUser.role);
    console.log('Organization ID:', newUser.organizationId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 You can now log in and access the admin features!');
    console.log('💡 Sign in at: http://localhost:3000/sign-in');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding admin user:');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();
