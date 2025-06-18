import PropertyScene from '../models/PropertyScene.js';
import Scene from '../models/Scene.js';
import { uploadToS3 } from '../services/s3Service.js';

const propertySceneController = {
  // Add a scene to a property
  async addScene(req, res) {
    try {
      const { propertyId } = req.params;
      const { name, image } = req.body;

      if (!name || !image) {
        return res.status(400).json({
          success: false,
          message: 'Name and image are required'
        });
      }

      // Upload image to S3
      const imageUrl = await uploadToS3(image, 'scenes');

      // Create scene
      const scene = await Scene.create(name, imageUrl);

      // Link scene to property
      const propertyScene = await PropertyScene.create(propertyId, scene.id);

      res.status(201).json({
        success: true,
        data: {
          ...propertyScene,
          scene: {
            ...scene,
            image_url: imageUrl
          }
        }
      });
    } catch (error) {
      console.error('Error adding scene to property:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add scene to property',
        error: error.message
      });
    }
  },

  // Get all scenes for a property
  async getPropertyScenes(req, res) {
    try {
      const { propertyId } = req.params;
      const scenes = await PropertyScene.getByPropertyId(propertyId);

      res.json({
        success: true,
        data: scenes
      });
    } catch (error) {
      console.error('Error getting property scenes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get property scenes',
        error: error.message
      });
    }
  },

  // Remove a scene from a property
  async removeScene(req, res) {
    try {
      const { propertyId, sceneId } = req.params;
      const deletedPropertyScene = await PropertyScene.delete(propertyId, sceneId);

      if (!deletedPropertyScene) {
        return res.status(404).json({
          success: false,
          message: 'Property scene not found'
        });
      }

      res.json({
        success: true,
        message: 'Scene removed from property successfully'
      });
    } catch (error) {
      console.error('Error removing scene from property:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove scene from property',
        error: error.message
      });
    }
  }
};

export default propertySceneController; 