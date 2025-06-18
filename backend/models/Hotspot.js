import pool from '../config/postgres.js';

class Hotspot {
  static async create(sceneId, yaw, pitch, target) {
    try {
      const query = `
        INSERT INTO hotspots (scene_id, yaw, pitch, target)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [sceneId, yaw, pitch, target];
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getBySceneId(sceneId) {
    try {
      const query = 'SELECT * FROM hotspots WHERE scene_id = $1';
      const { rows } = await pool.query(query, [sceneId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM hotspots WHERE id = $1 RETURNING *';
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async deleteBySceneId(sceneId) {
    try {
      const query = 'DELETE FROM hotspots WHERE scene_id = $1 RETURNING *';
      const { rows } = await pool.query(query, [sceneId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

export default Hotspot; 