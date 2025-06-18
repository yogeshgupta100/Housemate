import pool from '../config/postgres.js';

class Scene {
  static async create(imageUrl, roomId) {
    try {
      const { rows } = await pool.query(
        'INSERT INTO scenes (image_url, room_id) VALUES ($1, $2) RETURNING *',
        [imageUrl, roomId]
      );
      return rows[0];
    } catch (error) {
      console.error('Error creating scene:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const query = 'SELECT * FROM scenes';
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM scenes WHERE id = $1',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error getting scene:', error);
      throw error;
    }
  }

  static async getByRoomId(roomId) {
    try {
      console.log('Executing getByRoomId query for roomId:', roomId);
      const query = 'SELECT * FROM scenes WHERE room_id = $1';
      console.log('Query:', query);
      const { rows } = await pool.query(query, [roomId]);
      console.log('Query result:', rows);
      return rows;
    } catch (error) {
      console.error('Error getting scenes by room:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const { rows } = await pool.query(
        'DELETE FROM scenes WHERE id = $1 RETURNING *',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error deleting scene:', error);
      throw error;
    }
  }

  static async checkTableStructure() {
    try {
      const { rows } = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'scenes'
        ORDER BY ordinal_position;
      `);
      console.log('Scenes table structure:', rows);
      return rows;
    } catch (error) {
      console.error('Error checking table structure:', error);
      throw error;
    }
  }
}

export default Scene; 