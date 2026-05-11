import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate }                from '../../middleware/validate.middleware';
import { ListActivityLogsSchema, ActivityLogIdParamSchema } from './activity-log.validators';
import { listActivityLogs, getActivityLog, getActionSummary } from './activity-log.controller';

const router = Router();

// All activity log routes are admin-only
router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/',          validate({ query: ListActivityLogsSchema }), listActivityLogs);
router.get('/summary',   getActionSummary);
router.get('/:id',       validate({ params: ActivityLogIdParamSchema }), getActivityLog);

export default router;
