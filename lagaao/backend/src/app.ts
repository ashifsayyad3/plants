import express, { Application } from 'express';
import helmet      from 'helmet';
import cors        from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit   from 'express-rate-limit';
import path        from 'path';
import { env }                   from './config/env';
import { morganMiddleware }      from './middleware/morgan.middleware';
import { requestIdMiddleware }   from './middleware/request-id.middleware';
import { globalErrorHandler, notFoundHandler } from './middleware/error.middleware';
import { CONSTANTS }             from './config/constants';
import { loadRoutes }            from './routes/index';
import { setupSwagger }          from './utils/swagger.util';
import { UPLOAD_ROOT, PUBLIC_UPLOAD_PREFIX } from './config/upload.config';
import { ensureDir }             from './middleware/upload.middleware';
import { startCleanupJob }       from './utils/cleanup.util';

export function createApp(): Application {
  const app = express();

  // ─── Trust proxy (required for rate-limiting behind Nginx on VPS) ─────────
  app.set('trust proxy', 1);

  // ─── Security Headers ─────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy:  { policy: 'cross-origin' },
      contentSecurityPolicy:      env.isProd(), // disable in dev for Swagger
    }),
  );

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin && env.isDev()) return callback(null, true);
        if (!origin || env.ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      credentials:    true, // required for cookies
      methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );

  // ─── Global Rate Limiting ─────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs:       env.RATE_LIMIT.WINDOW_MS,
      max:            env.RATE_LIMIT.MAX,
      standardHeaders: true,
      legacyHeaders:  false,
      message:        { success: false, message: CONSTANTS.MESSAGES.TOO_MANY_REQUESTS },
    }),
  );

  // ─── Body Parsing + Cookie + Compression ─────────────────────────────────
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ─── Request ID (before logging so ID appears in every log line) ──────────
  app.use(requestIdMiddleware);

  // ─── HTTP Access Logging ──────────────────────────────────────────────────
  app.use(morganMiddleware);

  // ─── Static file serving (public uploads only) ───────────────────────────
  ensureDir(UPLOAD_ROOT);
  app.use(
    PUBLIC_UPLOAD_PREFIX,
    express.static(UPLOAD_ROOT, {
      maxAge:   '7d',
      etag:     true,
      dotfiles: 'deny',
      setHeaders: (res, filePath) => {
        // Prevent scripts from being executed via direct URL
        if (!filePath.match(/\.(jpg|jpeg|png|webp|gif|pdf|svg)$/i)) {
          res.setHeader('Content-Disposition', 'attachment');
        }
      },
    }),
  );

  // ─── Background jobs ──────────────────────────────────────────────────────
  startCleanupJob();

  // ─── Swagger Docs ─────────────────────────────────────────────────────────
  setupSwagger(app);

  // ─── API Routes ───────────────────────────────────────────────────────────
  loadRoutes(app);

  // ─── 404 + Global Error Handler (must be LAST) ───────────────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
