import { Router }       from 'express';
import healthRoute     from '../health.route';
import authRoute       from '../../modules/auth/auth.route';
import dashboardRoute  from '../../modules/dashboard/dashboard.route';
import userRoute       from '../../modules/user/user.route';
import roleRoute       from '../../modules/role/role.route';
import fileRoute       from '../../modules/file/file.route';

const router = Router();

router.use('/',          healthRoute);
router.use('/auth',      authRoute);
router.use('/dashboard', dashboardRoute);
router.use('/users',     userRoute);
router.use('/roles',     roleRoute);
router.use('/files',     fileRoute);

// ── Future routes ─────────────────────────────────────────────────────────────
// router.use('/users',      userRoutes);
// router.use('/listings',   listingRoutes);
// router.use('/categories', categoryRoutes);

export default router;
