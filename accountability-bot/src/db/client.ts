import { createClient } from '@libsql/client';
import { config } from '../config.js';

// Initialize Turso database client
export const db = createClient({
  url: config.tursoUrl,
  authToken: config.tursoToken,
});

// Test database connection
export async function testConnection() {
  try {
    await db.execute('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
