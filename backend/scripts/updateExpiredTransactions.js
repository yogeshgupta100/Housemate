import pool from "../config/postgres.js";
import { updateExpiredTransactions } from "../utils/leaseUtils.js";

const updateExpiredTransactionsJob = async () => {
  try {
    console.log("Starting expired transactions update job...");

    // Update expired transactions
    await updateExpiredTransactions(pool);

    console.log("Expired transactions update job completed successfully");
  } catch (error) {
    console.error("Error in expired transactions update job:", error);
  } finally {
    // Close the pool connection
    await pool.end();
  }
};

// Run the job
updateExpiredTransactionsJob()
  .then(() => {
    console.log("Job completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Job failed:", error);
    process.exit(1);
  });
