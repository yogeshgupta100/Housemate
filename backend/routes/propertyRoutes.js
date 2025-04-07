import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  getUserProperties,
  getFeaturedProperties,
  getPropertiesByCategory
} from '../controllers/propertyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/properties'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg, .jpeg and .webp format allowed!'));
  }
});

// Public routes
router.get('/', getProperties);
router.get('/featured', getFeaturedProperties);
router.get('/category/:category', getPropertiesByCategory);
router.get('/:id', getProperty);
router.post('/', upload.array('images', 5), createProperty);

// Protected routes (require authentication)
router.use(protect);

// User property routes (accessible to all authenticated users)
router.get('/user/properties', getUserProperties);
router.put('/:id', upload.array('images', 5), updateProperty);
router.delete('/:id', deleteProperty);

// Admin-only routes
router.use('/admin', authorize('admin'));
// Add any admin-specific routes here if needed

export default router;