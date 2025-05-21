import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// import * as propertyController from '../controllers/propertyController.js';
import { getLocationSuggestions ,createProperty, getAllProperties, searchProperties, searchPropertiesByCoordinates, getPropertyById ,updateProperty, deleteProperty} from '../controllers/propertyController.js';

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


router.post('/add', upload.array('images', 5), createProperty);

router.get('/', getAllProperties);
router.get('/search', searchProperties);
router.get('/searchByCoordinates', searchPropertiesByCoordinates);
router.get('/locations', getLocationSuggestions);
router.get('/:id', getPropertyById);

router.put('/:id', upload.array('images', 5), updateProperty);
router.delete('/:id', deleteProperty);

export default router;