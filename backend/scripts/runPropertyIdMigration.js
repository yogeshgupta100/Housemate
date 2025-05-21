import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const client = await pool.connect();
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'fix_property_id_type.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Start transaction
    await client.query('BEGIN');

    // Execute the migration
    await client.query(migrationSQL);

    // Commit transaction
    await client.query('COMMIT');
    console.log('Property ID type migration completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error running property ID type migration:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration(); 