import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { uploadDirs } from './middleware/uploadMiddleware.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Routes
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import lectureRoutes from './routes/lectureRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Strip `$`-prefixed operators from query filters as a second line of defence
mongoose.set('sanitizeFilter', true);

const app = express();

// Security headers; images are loaded cross-origin by the Vite client
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Only the configured frontend origin(s) may call the API from a browser
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins }));

// Middleware
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Brute-force protection for login/registration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// Only public images are served statically. Lecture videos and materials are
// streamed through /api/lectures/:id/... after an access check.
app.use('/uploads/thumbnails', express.static(uploadDirs.thumbnails));
app.use('/uploads/profile', express.static(uploadDirs.profile));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/payments', paymentRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

export default app;
