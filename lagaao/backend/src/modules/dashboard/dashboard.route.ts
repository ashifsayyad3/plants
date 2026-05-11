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

router.get('/stats',         getKpiStats);
router.get('/charts',        getCharts);
router.get('/activity',      getRecentActivity);
router.get('/notifications', getRecentNotifications);

export default router;
