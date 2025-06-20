import express from 'express';
import sceneController from '../controllers/sceneController.js';
import { protect, authorize } from '../middleware/auth.js';
import Scene from '../models/Scene.js';
import axios from 'axios';

console.log('Initializing scene routes...');

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log('Scene Route accessed:', {
    method: req.method,
    path: req.path,
    query: req.query,
    params: req.params,
    body: req.body
  });
  next();
});

// Proxy route for images - must be before auth middleware
router.get('/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });

    // Set appropriate headers
    res.set('Content-Type', response.headers['content-type']);
    res.set('Content-Length', response.headers['content-length']);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.set('Access-Control-Allow-Origin', '*'); // Allow all origins for images

    res.send(response.data);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to proxy image',
      error: error.message
    });
  }
});

// Apply authentication middleware to all routes below
router.use(protect);

// Room-based scene routes
// Create a new scene with hotspots for a room
router.post('/rooms/:roomId', sceneController.createScene);

// Get all scenes for a room
router.get('/rooms/:roomId', sceneController.getRoomScenes);

// Property-based scene routes
// Create a new scene with hotspots for a property
router.post('/properties/:propertyId', sceneController.createPropertyScene);

// Get all scenes for a property
router.get('/properties/:propertyId', sceneController.getPropertyScenes);

// General scene routes
// Get a single scene with its hotspots
router.get('/:id', sceneController.getScene);

// Delete a scene and its hotspots
router.delete('/:id', sceneController.deleteScene);

// Debug route to check table structure
router.get('/debug/structure', async (req, res) => {
  try {
    const structure = await Scene.checkTableStructure();
    res.json({
      success: true,
      data: structure
    });
  } catch (error) {
    console.error('Error checking table structure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check table structure',
      error: error.message
    });
  }
});

console.log('Scene routes initialized');

export default router; 