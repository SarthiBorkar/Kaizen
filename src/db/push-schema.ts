import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function pushSchema() {
  try {
    console.log('📦 Reading schema.sql...');

    // Read schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      await db.execute(statement);
    }

    console.log('✅ Database schema pushed successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - groups');
    console.log('  - memberships');
    console.log('  - checkins');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error pushing schema:', error);
    process.exit(1);
  }
}

pushSchema();
