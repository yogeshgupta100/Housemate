import express from 'express';
import { getLocationSuggestions, createProperty, getAllProperties, searchProperties, searchPropertiesByCoordinates, getPropertyById, updateProperty, deleteProperty, getPropertiesByUser, getFilterOptions, getPropertyRoomStatus, checkDuplicateProperty, updateRoomDescription, updateRoomOccupancy, getAllPropertiesForAdmin, mapPropertyToUser } from '../controllers/propertyController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

router.use((req, res, next) => {
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
});

router.post('/add', protect, createProperty);
router.post('/', protect, createProperty);
router.get('/', getAllProperties);
router.get('/search', searchProperties);
router.get('/search/coordinates', searchPropertiesByCoordinates);
router.get('/location-suggestions', getLocationSuggestions);
router.get('/filter-options', getFilterOptions);
router.get('/:id', getPropertyById);
router.put('/:id', protect, updateProperty);
router.delete('/:id', protect, deleteProperty);
router.get('/user/:userId', getPropertiesByUser);
router.get('/:id/room-status', getPropertyRoomStatus);
router.put('/rooms/:roomId/description', updateRoomDescription);
router.put('/rooms/:roomId/occupy', updateRoomOccupancy);
router.get('/check-duplicate', checkDuplicateProperty);
router.get('/admin/all', getAllPropertiesForAdmin);
router.post('/map-user', mapPropertyToUser);

export default router;