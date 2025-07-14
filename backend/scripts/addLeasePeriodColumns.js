import pool from "../config/postgres.js";

const addLeasePeriodColumns = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if columns already exist
    const { rows: existingColumns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name IN ('lease_period', 'lease_end_date', 'is_expired')
    `);

    const existingColumnNames = existingColumns.map((col) => col.column_name);

    // Add lease_period column if it doesn't exist
    if (!existingColumnNames.includes("lease_period")) {
      await client.query(`
        ALTER TABLE transactions 
        ADD COLUMN lease_period VARCHAR(50) DEFAULT '11 months'
      `);
      console.log("Added lease_period column to transactions table");
    }

    // Add lease_end_date column if it doesn't exist
    if (!existingColumnNames.includes("lease_end_date")) {
      await client.query(`
        ALTER TABLE transactions 
        ADD COLUMN lease_end_date TIMESTAMP WITH TIME ZONE
      `);
      console.log("Added lease_end_date column to transactions table");
    }

    // Add is_expired column if it doesn't exist
    if (!existingColumnNames.includes("is_expired")) {
      await client.query(`
        ALTER TABLE transactions 
        ADD COLUMN is_expired BOOLEAN DEFAULT false
      `);
      console.log("Added is_expired column to transactions table");
    }

    // Add index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_lease_end_date 
      ON transactions(lease_end_date)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_is_expired 
      ON transactions(is_expired)
    `);

    await client.query("COMMIT");
    console.log("Migration completed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the migration
addLeasePeriodColumns()
  .then(() => {
    console.log("Lease period columns migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
