import pool from '../config/postgres.js';

class Room {
  static async create(floorId, roomData) {
    const {
      roomNumber,
      roomType,
      area,
      description,
      rentAmount,
      availableFrom,
      hasBalcony,
      capacity,
      occupied
    } = roomData;

    const query = `
      INSERT INTO rooms (
        floor_id, room_number, room_type, area, description,
        rent_amount, available_from, has_balcony, capacity, occupied
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      floorId,
      roomNumber,
      roomType,
      area,
      description,
      rentAmount,
      availableFrom,
      hasBalcony,
      capacity || 1,
      occupied || 0
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async update(roomId, roomData) {
    const {
      roomNumber,
      roomType,
      area,
      description,
      rentAmount,
      availableFrom,
      hasBalcony,
      capacity,
      occupied
    } = roomData;

    const query = `
      UPDATE rooms
      SET
        room_number = COALESCE($1, room_number),
        room_type = COALESCE($2, room_type),
        area = COALESCE($3, area),
        description = COALESCE($4, description),
        rent_amount = COALESCE($5, rent_amount),
        available_from = COALESCE($6, available_from),
        has_balcony = COALESCE($7, has_balcony),
        capacity = COALESCE($8, capacity),
        occupied = COALESCE($9, occupied),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    const values = [
      roomNumber,
      roomType,
      area,
      description,
      rentAmount,
      availableFrom,
      hasBalcony,
      capacity,
      occupied,
      roomId
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getByFloorId(floorId) {
    const query = `
      SELECT *
      FROM rooms
      WHERE floor_id = $1
      ORDER BY room_number
    `;

    try {
      const result = await pool.query(query, [floorId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async getById(roomId) {
    const query = `
      SELECT *
      FROM rooms
      WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [roomId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(roomId) {
    const query = `
      DELETE FROM rooms
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [roomId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Room; 