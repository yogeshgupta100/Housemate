import express from 'express';
import { getLocationSuggestions, createProperty, getAllProperties, searchProperties, searchPropertiesByCoordinates, getPropertyById, updateProperty, deleteProperty, getPropertiesByUser, getFilterOptions } from '../controllers/propertyController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

// Property routes
router.post('/add', protect, createProperty);
router.get('/', getAllProperties);
router.get('/search', searchProperties);
router.get('/search/coordinates', searchPropertiesByCoordinates);
router.get('/location-suggestions', getLocationSuggestions);
router.get('/filter-options', getFilterOptions);
router.get('/:id', getPropertyById);
router.put('/:id', protect, updateProperty);
router.delete('/:id', protect, deleteProperty);
router.get('/user/:userId', getPropertiesByUser);

export default router;