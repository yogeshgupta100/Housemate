import pool from '../config/postgres.js';

class PropertyScene {
  static async create(propertyId, sceneId) {
    try {
      const { rows } = await pool.query(
        'INSERT INTO property_scenes (property_id, scene_id) VALUES ($1, $2) RETURNING *',
        [propertyId, sceneId]
      );
      return rows[0];
    } catch (error) {
      console.error('Error creating property scene:', error);
      throw error;
    }
  }

  static async getByPropertyId(propertyId) {
    try {
      const { rows } = await pool.query(
        `SELECT ps.*, s.name, s.image_url, 
         (SELECT json_agg(h.*) FROM hotspots h WHERE h.scene_id = s.id) as hotspots
         FROM property_scenes ps
         JOIN scenes s ON ps.scene_id = s.id
         WHERE ps.property_id = $1`,
        [propertyId]
      );
      return rows;
    } catch (error) {
      console.error('Error getting property scenes:', error);
      throw error;
    }
  }

  static async delete(propertyId, sceneId) {
    try {
      const { rows } = await pool.query(
        'DELETE FROM property_scenes WHERE property_id = $1 AND scene_id = $2 RETURNING *',
        [propertyId, sceneId]
      );
      return rows[0];
    } catch (error) {
      console.error('Error deleting property scene:', error);
      throw error;
    }
  }
}

export default PropertyScene; 