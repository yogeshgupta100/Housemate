import pool from '../config/postgres.js';

async function addRoomDetailsColumns() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add rent_amount column if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rooms' AND column_name = 'rent_amount'
        ) THEN
          ALTER TABLE rooms ADD COLUMN rent_amount DECIMAL(10,2);
        END IF;
      END $$;
    `);

    // Add available_from column if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rooms' AND column_name = 'available_from'
        ) THEN
          ALTER TABLE rooms ADD COLUMN available_from DATE;
        END IF;
      END $$;
    `);

    // Add has_balcony column if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rooms' AND column_name = 'has_balcony'
        ) THEN
          ALTER TABLE rooms ADD COLUMN has_balcony BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `);

    // Add capacity column if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rooms' AND column_name = 'capacity'
        ) THEN
          ALTER TABLE rooms ADD COLUMN capacity INTEGER DEFAULT 1;
        END IF;
      END $$;
    `);

    // Add occupied column if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rooms' AND column_name = 'occupied'
        ) THEN
          ALTER TABLE rooms ADD COLUMN occupied INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('Successfully added room details columns');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding room details columns:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
addRoomDetailsColumns()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 