import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { errorHandler } from './utils/error.js';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import newsRoutes from './routes/newsRoute.js';
import userRoutes from './routes/userRoutes.js';
import appointmentRoutes from './routes/appointmentRoute.js';
import adminRoutes from './routes/adminRoute.js';
import favoritesRoutes from './routes/favoritesRoutes.js';
import pool from './config/postgres.js';
// Load env vars
dotenv.config();

// Connect to database
// connectDB();

pool.connect()
  .then(() => console.log('✅ PostgreSQL Connected'))
  .catch(err => {
    console.error('❌ PostgreSQL Connection Error:', err.message);
    process.exit(1);
  });

// Create Express app
const app = express();

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors());

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes

// import productRoutes from './routes/productRoute.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoritesRoutes);

// Error handling
app.use(errorHandler);

// // Handle 404 routes
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});