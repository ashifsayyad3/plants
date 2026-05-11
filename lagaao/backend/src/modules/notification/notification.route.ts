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

// ─── User routes ──────────────────────────────────────────────────────────────
router.get('/',                validate({ query: ListNotificationsSchema }), listMyNotifications);
router.get('/unread-count',    getUnreadCount);
router.patch('/mark-all-read', markAllRead);
router.patch('/mark-bulk-read', validate({ body: BulkMarkReadSchema }), markBulkRead);
router.patch('/:uuid/read',    validate({ params: NotifUuidParamSchema }), markRead);
router.delete('/:uuid',        validate({ params: NotifUuidParamSchema }), deleteNotification);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin/all',
  authorize('admin', 'super_admin'),
  validate({ query: ListNotificationsSchema }),
  adminListNotifications,
);
router.post('/admin/create',
  authorize('admin', 'super_admin'),
  validate({ body: CreateNotificationSchema }),
  adminCreateNotification,
);

export default router;
