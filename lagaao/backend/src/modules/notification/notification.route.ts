import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate }                from '../../middleware/validate.middleware';
import {
  ListNotificationsSchema, NotifUuidParamSchema,
  BulkMarkReadSchema, CreateNotificationSchema,
} from './notification.validators';
import {
  listMyNotifications, getUnreadCount, markRead, markBulkRead,
  markAllRead, deleteNotification, adminListNotifications, adminCreateNotification,
} from './notification.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notification management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         uuid:      { type: string, format: uuid }
 *         title:     { type: string, example: "Welcome to Lagaao!" }
 *         body:      { type: string, example: "Your account is ready." }
 *         type:      { type: string, enum: [info, success, warning, error] }
 *         channel:   { type: string, enum: [in_app, email, sms, push] }
 *         isRead:    { type: boolean }
 *         actionUrl: { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List notifications for the authenticated user
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: channel
 *         schema: { type: string, enum: [in_app, email, sms, push] }
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated notification list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Notification' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get('/', validate({ query: ListNotificationsSchema }), listMyNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get count of unread notifications for the current user
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     count: { type: integer, example: 5 }
 */
router.get('/unread-count', getUnreadCount);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read for the current user
 *     tags: [Notifications]
 *     responses:
 *       200: { description: All marked read }
 */
router.patch('/mark-all-read', markAllRead);

/**
 * @swagger
 * /notifications/mark-bulk-read:
 *   patch:
 *     summary: Mark a list of notifications as read
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uuids]
 *             properties:
 *               uuids:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *     responses:
 *       200: { description: Marked read }
 */
router.patch('/mark-bulk-read', validate({ body: BulkMarkReadSchema }), markBulkRead);

/**
 * @swagger
 * /notifications/{uuid}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Marked read }
 *       404: { description: Not found }
 */
router.patch('/:uuid/read', validate({ params: NotifUuidParamSchema }), markRead);

/**
 * @swagger
 * /notifications/{uuid}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Deleted }
 *       404: { description: Not found }
 */
router.delete('/:uuid', validate({ params: NotifUuidParamSchema }), deleteNotification);

// ─── Admin routes ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /notifications/admin/all:
 *   get:
 *     summary: Admin — list all notifications across all users
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: channel
 *         schema: { type: string }
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Paginated list }
 *       403: { description: Forbidden }
 */
router.get('/admin/all',
  authorize('admin', 'super_admin'),
  validate({ query: ListNotificationsSchema }),
  adminListNotifications,
);

/**
 * @swagger
 * /notifications/admin/create:
 *   post:
 *     summary: Admin — send a notification to a user
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, title, body]
 *             properties:
 *               userId:    { type: integer, example: 1 }
 *               title:     { type: string, example: "Important Update" }
 *               body:      { type: string }
 *               type:      { type: string, enum: [info, success, warning, error], default: info }
 *               channel:   { type: string, enum: [in_app, email, sms, push], default: in_app }
 *               actionUrl: { type: string, nullable: true }
 *     responses:
 *       201: { description: Notification sent }
 *       400: { description: Validation error }
 */
router.post('/admin/create',
  authorize('admin', 'super_admin'),
  validate({ body: CreateNotificationSchema }),
  adminCreateNotification,
);

export default router;
