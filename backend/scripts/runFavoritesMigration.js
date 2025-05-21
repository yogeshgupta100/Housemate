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
        const migrationPath = path.join(__dirname, '..', 'migrations', 'add_favorites_column.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Start a transaction
        await client.query('BEGIN');

        // Run the migration
        await client.query(migrationSQL);

        // Commit the transaction
        await client.query('COMMIT');
        console.log('✅ Favorites migration completed successfully');
    } catch (error) {
        // Rollback in case of error
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

runMigration(); 