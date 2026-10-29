import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { prisma } from './utils/prisma';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

// Route modules
import authRoutes from './modules/auth/authRoutes';
import userRoutes from './modules/users/userRoutes';
import orgRoutes from './modules/organizations/orgRoutes';
import listingRoutes from './modules/listings/listingRoutes';
import requestRoutes from './modules/requests/requestRoutes';
import assignmentRoutes from './modules/assignments/assignmentRoutes';
import matchingRoutes from './modules/matching/matchingRoutes';
import notificationRoutes from './modules/notifications/notificationRoutes';
import adminRoutes from './modules/admin/adminRoutes';
import analyticsRoutes from './modules/analytics/analyticsRoutes';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS configuration
  const allowedOrigins = [config.corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'];
  app.use(
    cors({
      origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps, curl, postman)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in local dev
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // General Rate Limiter & Auth Context
  app.use('/api/', apiRateLimiter);
  app.use(authenticate);

  // Health Endpoint
  app.get('/api/v1/health', async (req: Request, res: Response) => {
    try {
      // Check database connection safely
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        version: '1.0.0',
        environment: config.nodeEnv,
      });
    } catch {
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // REST API Routes under /api/v1
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/organizations', orgRoutes);
  app.use('/api/v1/listings', listingRoutes);
  app.use('/api/v1/requests', requestRoutes);
  app.use('/api/v1/assignments', assignmentRoutes);
  app.use('/api/v1/volunteer', assignmentRoutes); // Alias for spec convenience
  app.use('/api/v1/matches', matchingRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Endpoint '${req.method} ${req.originalUrl}' not found.`,
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
