import pool from '../config/postgres.js';

class UserService {
  async getAllUsers() {
    const { rows } = await pool.query('SELECT id, first_name, last_name, email, user_type, created_at FROM users');
    return rows;
  }

  async getUserById(id) {
    const { rows } = await pool.query(
      'SELECT id, first_name, last_name, email, user_type, created_at FROM users WHERE id = $1',
      [id]
    );
    if (rows.length === 0) {
      throw new Error('User not found');
    }
    return rows[0];
  }

  async updateUser(id, updateData) {
    const { firstName, lastName, email, userType } = updateData;
    const { rows } = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3, user_type = $4
       WHERE id = $5
       RETURNING id, first_name, last_name, email, user_type, created_at`,
      [firstName, lastName, email, userType, id]
    );
    return rows[0];
  }

  async deleteUser(id) {
    const { rows } = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0];
  }

  async getPaginatedUsers(query = {}, skip = 0, limit = 10) {
    let sql = 'SELECT id, first_name, last_name, email, user_type, created_at FROM users';
    const params = [];
    
    if (query.search) {
      sql += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1`;
      params.push(`%${query.search}%`);
    }
    
    if (query.userType && query.userType !== 'all') {
      sql += params.length ? ' AND' : ' WHERE';
      sql += ` user_type = $${params.length + 1}`;
      params.push(query.userType);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, skip);
    
    const { rows } = await pool.query(sql, params);
    return rows;
  }

  async getTotalUsers(query = {}) {
    let sql = 'SELECT COUNT(*) FROM users';
    const params = [];
    
    if (query.search) {
      sql += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1`;
      params.push(`%${query.search}%`);
    }
    
    if (query.userType && query.userType !== 'all') {
      sql += params.length ? ' AND' : ' WHERE';
      sql += ` user_type = $${params.length + 1}`;
      params.push(query.userType);
    }
    
    const { rows } = await pool.query(sql, params);
    return parseInt(rows[0].count);
  }
}

export default new UserService();