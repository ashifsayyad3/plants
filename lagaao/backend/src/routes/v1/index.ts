import { Router }              from 'express';
import healthRoute              from '../health.route';
import authRoute                from '../../modules/auth/auth.route';
import dashboardRoute           from '../../modules/dashboard/dashboard.route';
import userRoute                from '../../modules/user/user.route';
import roleRoute                from '../../modules/role/role.route';
import fileRoute                from '../../modules/file/file.route';
import notificationRoute        from '../../modules/notification/notification.route';
import activityLogRoute         from '../../modules/activity-log/activity-log.route';
import { auditMiddleware }      from '../../middleware/activity-log.middleware';

const router = Router();

// ─── Blanket audit (mutating requests only, after body parsing) ───────────────
router.use(auditMiddleware);

router.use('/',               healthRoute);
router.use('/auth',           authRoute);
router.use('/dashboard',      dashboardRoute);
router.use('/users',          userRoute);
router.use('/roles',          roleRoute);
router.use('/files',          fileRoute);
router.use('/notifications',  notificationRoute);
router.use('/activity-logs',  activityLogRoute);

export default router;
