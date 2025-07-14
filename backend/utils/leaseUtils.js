/**
 * Utility functions for lease period calculations and expiration checks
 */

/**
 * Calculate lease end date based on move-in date and lease period
 * @param {Date|string} moveInDate - The move-in date
 * @param {string} leasePeriod - Lease period string (e.g., "11 months", "1 year")
 * @returns {Date} The calculated lease end date
 */
export const calculateLeaseEndDate = (
  moveInDate,
  leasePeriod = "11 months"
) => {
  if (!moveInDate) return null;

  const startDate = new Date(moveInDate);
  const [number, unit] = leasePeriod.split(" ");
  const months = unit.toLowerCase().includes("month")
    ? parseInt(number)
    : parseInt(number) * 12;

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);

  return endDate;
};

/**
 * Check if a transaction is expired based on lease end date
 * @param {Date|string} leaseEndDate - The lease end date
 * @returns {boolean} True if expired, false otherwise
 */
export const isTransactionExpired = (leaseEndDate) => {
  if (!leaseEndDate) return false;

  const endDate = new Date(leaseEndDate);
  const currentDate = new Date();

  return currentDate > endDate;
};

/**
 * Check if a transaction should be visible (not expired and has valid status)
 * @param {Object} transaction - Transaction object
 * @returns {boolean} True if transaction should be visible
 */
export const isTransactionVisible = (transaction) => {
  // Check if transaction is expired
  if (
    transaction.is_expired ||
    isTransactionExpired(transaction.lease_end_date)
  ) {
    return false;
  }

  // Only show transactions with specific statuses
  const validStatuses = ["pending", "active", "completed", "failed"];
  return validStatuses.includes(transaction.status);
};

/**
 * Check if a property should be visible in user panel (not expired)
 * @param {Object} property - Property object
 * @param {Array} userTransactions - User's transactions for this property
 * @returns {boolean} True if property should be visible
 */
export const isPropertyVisible = (property, userTransactions = []) => {
  // For sale properties, always show them
  if (property.listing_type === "sale") {
    return true;
  }

  // For rent properties, check if user has active, non-expired transactions
  const activeTransactions = userTransactions.filter(
    (transaction) =>
      transaction.property_id === property.id &&
      isTransactionVisible(transaction)
  );

  return activeTransactions.length > 0;
};

/**
 * Update expired transactions in the database
 * @param {Object} pool - Database connection pool
 */
export const updateExpiredTransactions = async (pool) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Update transactions that are expired
    const { rowCount } = await client.query(`
      UPDATE transactions 
      SET is_expired = true, 
          updated_at = CURRENT_TIMESTAMP
      WHERE lease_end_date < CURRENT_TIMESTAMP 
        AND is_expired = false
    `);

    if (rowCount > 0) {
      console.log(`Updated ${rowCount} expired transactions`);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating expired transactions:", error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get lease period options
 * @returns {Array} Array of lease period options
 */
export const getLeasePeriodOptions = () => [
  "1 month",
  "3 months",
  "6 months",
  "11 months",
  "1 year",
  "2 years",
  "3 years",
];

/**
 * Format lease period for display
 * @param {string} leasePeriod - Lease period string
 * @returns {string} Formatted lease period
 */
export const formatLeasePeriod = (leasePeriod) => {
  if (!leasePeriod) return "Not specified";

  const [number, unit] = leasePeriod.split(" ");
  const num = parseInt(number);

  if (unit.toLowerCase().includes("month")) {
    return num === 1 ? "1 month" : `${num} months`;
  } else if (unit.toLowerCase().includes("year")) {
    return num === 1 ? "1 year" : `${num} years`;
  }

  return leasePeriod;
};
