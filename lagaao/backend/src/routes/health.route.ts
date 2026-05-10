import { Router, Request, Response } from 'express';
import { sequelize } from '../config/database';
import { ResponseUtil } from '../utils/response.util';
import { asyncHandler } from '../utils/async-handler.util';
import { env } from '../config/env';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: System
 *   description: System health and diagnostics
 *
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns API and database connection status. No auth required.
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         status:    { type: string, example: ok }
 *                         app:       { type: string, example: Lagaao }
 *                         environment: { type: string, example: development }
 *                         timestamp: { type: string, format: date-time }
 *                         database:  { type: string, example: connected }
 *                         uptime:    { type: integer, example: 3600 }
 *       503:
 *         description: Database unreachable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    await sequelize.authenticate();
    ResponseUtil.success(res, {
      status: 'ok',
      app: env.APP_NAME,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: Math.floor(process.uptime()),
    });
  }),
);

export default router;
