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
import pdfRoutes from './routes/pdfRoutes.js';
import pool from './config/postgres.js';
import otpRoutes from './routes/otpRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

pool.connect()
  .then(() => console.log('✅ PostgreSQL Connected'))
  .catch(err => {
    console.error('❌ PostgreSQL Connection Error:', err.message);
    process.exit(1);
  });

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/pg', pdfRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/upload', uploadRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});