import pool from '../config/postgres.js';

async function addUpdatedByColumn() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Adding updated_by column to properties table...');

    // Check if the column already exists
    const { rows: columnExists } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'properties' 
      AND column_name = 'updated_by'
    `);

    if (columnExists.length === 0) {
      // Add the updated_by column
      await client.query(`
        ALTER TABLE properties 
        ADD COLUMN updated_by INTEGER REFERENCES users(id)
      `);

      // Create index for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_properties_updated_by ON properties(updated_by)
      `);

      console.log('Successfully added updated_by column to properties table');
    } else {
      console.log('updated_by column already exists in properties table');
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding updated_by column:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
addUpdatedByColumn()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  }); 