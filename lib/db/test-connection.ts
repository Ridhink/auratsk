// Test database connection
import { db } from './index';
import { users } from './schema';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try a simple query
    const result = await db.execute('SELECT NOW() as time');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result);
    
    // Try to query users table
    try {
      const userCount = await db.select().from(users).limit(1);
      console.log('✅ Users table exists and is accessible');
    } catch (error) {
      console.error('❌ Error accessing users table:', error);
      console.log('💡 Run: npm run db:push');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('\n💡 Check:');
    console.log('1. Is DATABASE_URL set in .env.local?');
    console.log('2. Is PostgreSQL running?');
    console.log('3. Does the database exist?');
    console.log('4. Are the credentials correct?');
  }
  
  process.exit(0);
}

testConnection();

