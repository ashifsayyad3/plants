import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate }                from '../../middleware/validate.middleware';
import { ListActivityLogsSchema, ActivityLogIdParamSchema } from './activity-log.validators';
import { listActivityLogs, getActivityLog, getActionSummary } from './activity-log.controller';

const router = Router();

// All activity log routes are admin-only
router.use(authenticate, authorize('admin', 'super_admin'));

/**
 * @swagger
 * tags:
 *   name: Activity Logs
 *   description: Audit trail — admin only
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ActivityLog:
 *       type: object
 *       properties:
 *         id:          { type: string, example: "1" }
 *         userId:      { type: integer, nullable: true }
 *         user:
 *           type: object
 *           nullable: true
 *           properties:
 *             name:  { type: string }
 *             email: { type: string }
 *         action:      { type: string, example: "api.post./users" }
 *         subjectType: { type: string, nullable: true }
 *         subjectId:   { type: integer, nullable: true }
 *         oldValues:   { type: object, nullable: true }
 *         newValues:   { type: object, nullable: true }
 *         ipAddress:   { type: string, nullable: true }
 *         userAgent:   { type: string, nullable: true }
 *         requestId:   { type: string, nullable: true }
 *         createdAt:   { type: string, format: date-time }
 */

/**
 * @swagger
 * /activity-logs:
 *   get:
 *     summary: List activity log entries with filters
 *     tags: [Activity Logs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by action string
 *       - in: query
 *         name: userId
 *         schema: { type: integer }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: subjectType
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Paginated activity log list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ActivityLog' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       403: { description: Forbidden }
 */
router.get('/', validate({ query: ListActivityLogsSchema }), listActivityLogs);

/**
 * @swagger
 * /activity-logs/summary:
 *   get:
 *     summary: Get action count summary for the last N days
 *     tags: [Activity Logs]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 7 }
 *         description: Number of days to summarise
 *     responses:
 *       200:
 *         description: Action summary grouped by day and action
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:   { type: string, format: date }
 *                       action: { type: string }
 *                       count:  { type: integer }
 *       403: { description: Forbidden }
 */
router.get('/summary', getActionSummary);

/**
 * @swagger
 * /activity-logs/{id}:
 *   get:
 *     summary: Get a single activity log entry
 *     tags: [Activity Logs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Activity log entry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/ActivityLog' }
 *       404: { description: Not found }
 *       403: { description: Forbidden }
 */
router.get('/:id', validate({ params: ActivityLogIdParamSchema }), getActivityLog);

export default router;
