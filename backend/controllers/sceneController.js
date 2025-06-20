import Scene from '../models/Scene.js';
import Hotspot from '../models/Hotspot.js';
import { uploadToS3 } from '../services/s3Service.js';

const sceneController = {
  // Create a new scene with hotspots for a room
  async createScene(req, res) {
    try {
      const { roomId } = req.params;
      const { image, hotspots, name } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Image is required'
        });
      }

      let imageUrl = image;
      // Only upload to S3 if image is not already a URL
      if (image && !image.startsWith('http')) {
        imageUrl = await uploadToS3(image, 'scenes');
      }

      // Create scene
      const scene = await Scene.create(imageUrl, roomId, null, name, 'room');

      // Create hotspots if provided
      if (hotspots && Array.isArray(hotspots)) {
        for (const hotspot of hotspots) {
          await Hotspot.create(scene.id, hotspot.yaw, hotspot.pitch, hotspot.target);
        }
      }

      // Get the complete scene with hotspots
      const completeScene = await Scene.getById(scene.id);
      const sceneHotspots = await Hotspot.getBySceneId(scene.id);

      res.status(201).json({
        success: true,
        data: {
          ...completeScene,
          hotspots: sceneHotspots
        }
      });
    } catch (error) {
      console.error('Error creating scene:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create scene',
        error: error.message
      });
    }
  },

  // Create a new scene with hotspots for a property
  async createPropertyScene(req, res) {
    try {
      const { propertyId } = req.params;
      const { image, hotspots, name } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Image is required'
        });
      }

      let imageUrl = image;
      // Only upload to S3 if image is not already a URL
      if (image && !image.startsWith('http')) {
        imageUrl = await uploadToS3(image, 'scenes');
      }

      // Create scene
      const scene = await Scene.create(imageUrl, null, propertyId, name, 'property');

      // Create hotspots if provided
      if (hotspots && Array.isArray(hotspots)) {
        for (const hotspot of hotspots) {
          await Hotspot.create(scene.id, hotspot.yaw, hotspot.pitch, hotspot.target);
        }
      }

      // Get the complete scene with hotspots
      const completeScene = await Scene.getById(scene.id);
      const sceneHotspots = await Hotspot.getBySceneId(scene.id);

      res.status(201).json({
        success: true,
        data: {
          ...completeScene,
          hotspots: sceneHotspots
        }
      });
    } catch (error) {
      console.error('Error creating property scene:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create property scene',
        error: error.message
      });
    }
  },

  // Get all scenes for a room
  async getRoomScenes(req, res) {
    try {
      const { roomId } = req.params;
      console.log('Fetching scenes for room:', roomId);
      
      const scenes = await Scene.getByRoomId(roomId);
      console.log('Found scenes:', scenes);

      const scenesWithHotspots = await Promise.all(
        scenes.map(async (scene) => {
          const hotspots = await Hotspot.getBySceneId(scene.id);
          return {
            ...scene,
            hotspots
          };
        })
      );

      console.log('Scenes with hotspots:', scenesWithHotspots);

      res.json({
        success: true,
        data: scenesWithHotspots
      });
    } catch (error) {
      console.error('Error fetching room scenes:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch room scenes',
        error: error.message
      });
    }
  },

  // Get all scenes for a property
  async getPropertyScenes(req, res) {
    try {
      const { propertyId } = req.params;
      console.log('Fetching scenes for property:', propertyId);
      
      const scenes = await Scene.getByPropertyId(propertyId);
      console.log('Found scenes:', scenes);

      const scenesWithHotspots = await Promise.all(
        scenes.map(async (scene) => {
          const hotspots = await Hotspot.getBySceneId(scene.id);
          return {
            ...scene,
            hotspots
          };
        })
      );

      console.log('Property scenes with hotspots:', scenesWithHotspots);

      res.json({
        success: true,
        data: scenesWithHotspots
      });
    } catch (error) {
      console.error('Error fetching property scenes:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch property scenes',
        error: error.message
      });
    }
  },

  // Get a single scene with its hotspots
  async getScene(req, res) {
    try {
      const { id } = req.params;
      console.log('Fetching scene with id:', id);
      
      const scene = await Scene.getById(id);
      console.log('Found scene:', scene);
      
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      const hotspots = await Hotspot.getBySceneId(id);
      console.log('Found hotspots:', hotspots);

      res.json({
        success: true,
        data: {
          ...scene,
          hotspots
        }
      });
    } catch (error) {
      console.error('Error fetching scene:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scene',
        error: error.message
      });
    }
  },

  // Delete a scene and its hotspots
  async deleteScene(req, res) {
    try {
      const { id } = req.params;
      console.log('Deleting scene with id:', id);
      
      // Delete hotspots first (due to foreign key constraint)
      await Hotspot.deleteBySceneId(id);
      
      // Delete scene
      const deletedScene = await Scene.delete(id);

      if (!deletedScene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      res.json({
        success: true,
        message: 'Scene deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting scene:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to delete scene',
        error: error.message
      });
    }
  }
};

export default sceneController; 