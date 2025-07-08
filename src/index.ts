import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { db } from './services/database'
import publicRoutes from './routes/public';
import privateRoutes from './routes/private';
import cookieParser from 'cookie-parser'

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
app.use(cors({
  // origin: true,
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins && allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api', publicRoutes);
app.use('/api', privateRoutes);

// Connect to services
// Promise.all([
//   cache.connect(),
// ]).catch(console.error);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  next()
})

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and database connections...');
  await Promise.all([
    db.$disconnect()
    // cache.disconnect(),
  ]);
  process.exit(0);
});

export default app; 