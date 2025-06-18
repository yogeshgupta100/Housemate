import pool from '../config/postgres.js';

class RoomAvailabilityRequest {
  static async create({ roomId, propertyId, ownerId }) {
    const query = `
      INSERT INTO room_availability_requests (room_id, property_id, owner_id)
      VALUES ($1, $2, $3)
      RETURNING *`;
    const values = [roomId, propertyId, ownerId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getAllPending() {
    const query = `
      SELECT rar.*, 
        r.*, 
        p.*, 
        f.id as floor_id, f.floor_number, 
        u.id as user_id, u.first_name, u.last_name, u.email, u.phone, u.gender, u.user_type, u.profile_image
      FROM room_availability_requests rar
      JOIN rooms r ON rar.room_id = r.id
      JOIN floors f ON r.floor_id = f.id
      JOIN properties p ON rar.property_id = p.id
      JOIN users u ON rar.owner_id = u.id
      WHERE rar.status = 'pending'
      ORDER BY rar.created_at DESC`;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getByIdWithDetails(id) {
    // First, check if the request exists
    const checkQuery = 'SELECT * FROM room_availability_requests WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    console.log('Check if request exists:', checkResult.rows);
    
    if (checkResult.rows.length === 0) {
      console.log('Request does not exist');
      return null;
    }
    
    const request = checkResult.rows[0];
    console.log('Request found:', request);
    
    // Check each join step by step
    const roomQuery = 'SELECT * FROM rooms WHERE id = $1';
    const roomResult = await pool.query(roomQuery, [request.room_id]);
    console.log('Room check:', roomResult.rows);
    
    if (roomResult.rows.length === 0) {
      console.log('Room not found');
      return null;
    }
    
    const floorQuery = 'SELECT * FROM floors WHERE id = $1';
    const floorResult = await pool.query(floorQuery, [roomResult.rows[0].floor_id]);
    console.log('Floor check:', floorResult.rows);
    
    if (floorResult.rows.length === 0) {
      console.log('Floor not found');
      return null;
    }
    
    const propertyQuery = 'SELECT * FROM properties WHERE id = $1';
    const propertyResult = await pool.query(propertyQuery, [request.property_id]);
    console.log('Property check:', propertyResult.rows);
    
    if (propertyResult.rows.length === 0) {
      console.log('Property not found');
      return null;
    }
    
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [request.owner_id]);
    console.log('User check:', userResult.rows);
    
    if (userResult.rows.length === 0) {
      console.log('User not found');
      return null;
    }
    
    // If all checks pass, run the full query
    const query = `
      SELECT rar.*, 
        r.*, 
        p.*, 
        f.id as floor_id, f.floor_number, 
        u.id as user_id, u.first_name, u.last_name, u.email, u.phone, u.gender, u.user_type, u.profile_image
      FROM room_availability_requests rar
      JOIN rooms r ON rar.room_id = r.id
      JOIN floors f ON r.floor_id = f.id
      JOIN properties p ON rar.property_id = p.id
      JOIN users u ON rar.owner_id = u.id
      WHERE rar.id = $1
      LIMIT 1`;
    console.log('Executing query for ID:', id);
    console.log('SQL Query:', query);
    const result = await pool.query(query, [id]);
    console.log('Query result rows:', result.rows);
    return result.rows[0];
  }

  static async accept(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'UPDATE room_availability_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        ['accepted', id]
      );
      if (!rows[0]) throw new Error('Request not found');
      await client.query(
        'UPDATE rooms SET occupied = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [rows[0].room_id]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async reject(id) {
    const { rows } = await pool.query(
      'UPDATE room_availability_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['rejected', id]
    );
    if (!rows[0]) throw new Error('Request not found');
    return rows[0];
  }
}

export default RoomAvailabilityRequest; 