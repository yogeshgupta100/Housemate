import pool from '../config/postgres.js';

const makePhoneNullable = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting migration: Making phone field nullable...');

    // Drop the existing check constraint
    await client.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_phone_check
    `);

    // Make phone column nullable
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN phone DROP NOT NULL
    `);

    // Add new check constraint that allows empty strings or 10-digit numbers
    await client.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_phone_check 
      CHECK (phone = '' OR phone ~ '^[0-9]{10}$')
    `);

    console.log('Migration completed successfully!');
    console.log('Phone field is now nullable and accepts empty strings or 10-digit numbers.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the migration
makePhoneNullable()
  .then(() => {
    console.log('Migration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  }); 