import pool from "../config/postgres.js";

const createPaymentTables = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Add payment-related columns to transactions table
    const { rows: existingColumns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name IN (
        'payment_status', 'payment_method', 'payment_amount', 
        'payment_date', 'razorpay_order_id', 'razorpay_payment_id',
        'payment_receipt_url', 'payment_notes'
      )
    `);

    const existingColumnNames = existingColumns.map((col) => col.column_name);

    // Add payment columns if they don't exist
    const paymentColumns = [
      {
        name: "payment_status",
        type: "VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded'))",
      },
      {
        name: "payment_method",
        type: "VARCHAR(50) CHECK (payment_method IN ('razorpay', 'cash', 'bank_transfer', 'upi', 'card', 'wallet'))",
      },
      {
        name: "payment_amount",
        type: "DECIMAL(10,2) DEFAULT 0",
      },
      {
        name: "payment_date",
        type: "TIMESTAMP",
      },
      {
        name: "razorpay_order_id",
        type: "VARCHAR(255)",
      },
      {
        name: "razorpay_payment_id",
        type: "VARCHAR(255)",
      },
      {
        name: "payment_receipt_url",
        type: "TEXT",
      },
      {
        name: "payment_notes",
        type: "TEXT",
      },
    ];

    for (const column of paymentColumns) {
      if (!existingColumnNames.includes(column.name)) {
        await client.query(`
          ALTER TABLE transactions 
          ADD COLUMN ${column.name} ${column.type}
        `);
        console.log(`Added ${column.name} column to transactions table`);
      }
    }

    // Create payments table for detailed payment tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        razorpay_signature VARCHAR(255),
        payment_receipt_url TEXT,
        payment_notes TEXT,
        processed_by INTEGER REFERENCES users(id), -- Admin who processed cash payment
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
      CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
    `);

    await client.query("COMMIT");
    console.log("Payment tables and columns created successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the migration
createPaymentTables()
  .then(() => {
    console.log("Payment system setup completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Payment system setup failed:", error);
    process.exit(1);
  });
