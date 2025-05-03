import * as favoritesController from '../controllers/favoritesController.js';
import express from 'express';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

router.get('/', protect, favoritesController.getFavorites);
router.post('/:propertyId',protect, favoritesController.addFavorite);
router.delete('/:propertyId', protect, favoritesController.removeFavorite);
router.get('/:propertyId/check', protect, favoritesController.isPropertyFavorited);

export default router;
