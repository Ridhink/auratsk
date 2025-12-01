import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Optimize connection pool for better performance
const client = postgres(process.env.DATABASE_URL, { 
  max: 10, // Increase connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

// Export schema for use in migrations
export { schema };

