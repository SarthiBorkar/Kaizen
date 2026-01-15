import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running migration: add_tasks_table.sql...');

    // Read migration file
    const migrationPath = join(__dirname, 'migrations', 'add_tasks_table.sql');
    const migration = readFileSync(migrationPath, 'utf-8');

    // Remove comment lines and split by semicolons
    const cleanedMigration = migration
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanedMigration
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      console.log(`  Executing: ${statement.substring(0, 50)}...`);
      await db.execute(statement);
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('New tables added:');
    console.log('  - tasks');
    console.log('  - task_completions');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
