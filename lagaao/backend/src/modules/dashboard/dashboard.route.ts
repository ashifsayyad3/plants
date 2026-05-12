import { Router } from 'express';
import { authenticate }  from '../../middleware/auth.middleware';
import { authorize }     from '../../middleware/auth.middleware';
import {
  getKpiStats,
  getCharts,
  getRecentActivity,
  getRecentNotifications,
} from './dashboard.controller';

const router = Router();

// All dashboard endpoints require authentication + admin or super_admin role
router.use(authenticate, authorize('admin', 'super_admin'));

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin dashboard KPIs and charts — admin only
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get KPI statistics (user counts, file counts, etc.)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: KPI data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:       { type: integer }
 *                     activeUsers:      { type: integer }
 *                     newUsersToday:    { type: integer }
 *                     totalFiles:       { type: integer }
 *                     totalNotifications: { type: integer }
 *       403: { description: Forbidden }
 */
router.get('/stats', getKpiStats);

/**
 * @swagger
 * /dashboard/charts:
 *   get:
 *     summary: Get chart data for the last 30 days
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Chart series data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     userRegistrations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label: { type: string, example: "2026-05-01" }
 *                           value: { type: integer }
 *       403: { description: Forbidden }
 */
router.get('/charts', getCharts);

/**
 * @swagger
 * /dashboard/activity:
 *   get:
 *     summary: Get recent activity log entries for the dashboard feed
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Recent activity entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ActivityLog' }
 *       403: { description: Forbidden }
 */
router.get('/activity', getRecentActivity);

/**
 * @swagger
 * /dashboard/notifications:
 *   get:
 *     summary: Get recent notifications for the dashboard panel
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Recent notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Notification' }
 *       403: { description: Forbidden }
 */
router.get('/notifications', getRecentNotifications);

export default router;
