import pool from '../config/postgres.js';

const addTransactionColumns = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if columns already exist
    const { rows: existingColumns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name IN ('rent_amount', 'deposit_amount')
    `);
    
    const existingColumnNames = existingColumns.map(col => col.column_name);
    
    // Add rent_amount column if it doesn't exist
    if (!existingColumnNames.includes('rent_amount')) {
      await client.query(`
        ALTER TABLE transactions 
        ADD COLUMN rent_amount DECIMAL(10,2) DEFAULT 0
      `);
      console.log('Added rent_amount column to transactions table');
    }
    
    // Add deposit_amount column if it doesn't exist
    if (!existingColumnNames.includes('deposit_amount')) {
      await client.query(`
        ALTER TABLE transactions 
        ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0
      `);
      console.log('Added deposit_amount column to transactions table');
    }
    
    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the migration
addTransactionColumns()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 