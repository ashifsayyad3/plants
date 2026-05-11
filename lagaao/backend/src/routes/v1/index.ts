import { Router }       from 'express';
import healthRoute     from '../health.route';
import authRoute       from '../../modules/auth/auth.route';
import dashboardRoute  from '../../modules/dashboard/dashboard.route';

const router = Router();

router.use('/',          healthRoute);
router.use('/auth',      authRoute);
router.use('/dashboard', dashboardRoute);

// ── Future routes ─────────────────────────────────────────────────────────────
// router.use('/users',      userRoutes);
// router.use('/listings',   listingRoutes);
// router.use('/categories', categoryRoutes);

export default router;
