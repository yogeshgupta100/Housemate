import pool from '../config/postgres.js';

async function addGoogleOAuthColumns() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Adding Google OAuth columns to users table...');

    // Check if google_id column exists
    const { rows: googleIdExists } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'google_id'
    `);

    if (googleIdExists.length === 0) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN google_id VARCHAR(255) UNIQUE
      `);
      console.log('Added google_id column');
    } else {
      console.log('google_id column already exists');
    }

    // Check if profile_picture column exists
    const { rows: profilePictureExists } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'profile_picture'
    `);

    if (profilePictureExists.length === 0) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN profile_picture VARCHAR(500)
      `);
      console.log('Added profile_picture column');
    } else {
      console.log('profile_picture column already exists');
    }

    // Check if is_verified column exists
    const { rows: isVerifiedExists } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_verified'
    `);

    if (isVerifiedExists.length === 0) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN is_verified BOOLEAN DEFAULT false
      `);
      console.log('Added is_verified column');
    } else {
      console.log('is_verified column already exists');
    }

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
      CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
    `);

    await client.query('COMMIT');
    console.log('Google OAuth migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding Google OAuth columns:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addGoogleOAuthColumns()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default addGoogleOAuthColumns; 