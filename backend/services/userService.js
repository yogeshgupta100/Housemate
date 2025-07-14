import pool from "../config/postgres.js";

class UserService {
  async getAllUsers() {
    const { rows } = await pool.query(
      "SELECT id, first_name, last_name, email, user_type, created_at FROM users"
    );
    return rows;
  }

  async getUserById(id) {
    const { rows } = await pool.query(
      "SELECT id, first_name, last_name, email, user_type, created_at FROM users WHERE id = $1",
      [id]
    );
    if (rows.length === 0) {
      throw new Error("User not found");
    }
    return rows[0];
  }

  async updateUser(id, updateData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // First get the existing user data
      const {
        rows: [existingUser],
      } = await client.query("SELECT * FROM users WHERE id = $1", [id]);

      if (!existingUser) {
        throw new Error("User not found");
      }

      // Convert camelCase to snake_case for updateData
      const convertedUpdateData = {};
      for (const [key, value] of Object.entries(updateData)) {
        const snakeKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`
        );
        convertedUpdateData[snakeKey] = value;
      }

      // Only update the fields that are provided in updateData
      const setClause = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(convertedUpdateData)) {
        if (value !== undefined) {
          setClause.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (setClause.length === 0) return existingUser;

      values.push(id);
      const { rows } = await client.query(
        `UPDATE users 
         SET ${setClause.join(", ")}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING id, first_name, last_name, email, phone, gender, role_id, user_type, company_name, city, state, bio, profile_image, marital_status, govt_id_number, id_card_images, verification_status, profession, nationality, bank_details, created_at, updated_at`,
        values
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteUser(id) {
    const { rows } = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );
    return rows[0];
  }

  async getPaginatedUsers(query = {}, skip = 0, limit = 10) {
    let sql =
      "SELECT id, first_name, last_name, email, user_type, is_verified, created_at FROM users";
    const params = [];
    let whereConditions = [];

    if (query.search) {
      whereConditions.push(
        `(first_name ILIKE $${params.length + 1} OR last_name ILIKE $${
          params.length + 1
        } OR email ILIKE $${params.length + 1})`
      );
      params.push(`%${query.search}%`);
    }

    if (query.userType && query.userType !== "all") {
      whereConditions.push(`user_type = $${params.length + 1}`);
      params.push(query.userType);
    }

    if (query.verificationStatus && query.verificationStatus !== "all") {
      const isVerified = query.verificationStatus === "verified";
      whereConditions.push(`is_verified = $${params.length + 1}`);
      params.push(isVerified);
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${
      params.length + 2
    }`;
    params.push(limit, skip);

    const { rows } = await pool.query(sql, params);
    return rows;
  }

  async getTotalUsers(query = {}) {
    let sql = "SELECT COUNT(*) FROM users";
    const params = [];
    let whereConditions = [];

    if (query.search) {
      whereConditions.push(
        `(first_name ILIKE $${params.length + 1} OR last_name ILIKE $${
          params.length + 1
        } OR email ILIKE $${params.length + 1})`
      );
      params.push(`%${query.search}%`);
    }

    if (query.userType && query.userType !== "all") {
      whereConditions.push(`user_type = $${params.length + 1}`);
      params.push(query.userType);
    }

    if (query.verificationStatus && query.verificationStatus !== "all") {
      const isVerified = query.verificationStatus === "verified";
      whereConditions.push(`is_verified = $${params.length + 1}`);
      params.push(isVerified);
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    const { rows } = await pool.query(sql, params);
    return parseInt(rows[0].count);
  }
}

export default new UserService();
