import express from 'express';
import propertySceneController from '../controllers/propertySceneController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize(1)); // Assuming 1 is the admin role ID

// Add a scene to a property
router.post('/:propertyId', propertySceneController.addScene);

// Get all scenes for a property
router.get('/:propertyId', propertySceneController.getPropertyScenes);

// Remove a scene from a property
router.delete('/:propertyId/scenes/:sceneId', propertySceneController.removeScene);

export default router; 