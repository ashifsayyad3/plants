import { Router }    from 'express';
import healthRoute  from '../health.route';
import authRoute    from '../../modules/auth/auth.route';

const router = Router();

router.use('/',     healthRoute);
router.use('/auth', authRoute);

// ── Future routes ─────────────────────────────────────────────────────────────
// router.use('/users',      userRoutes);
// router.use('/listings',   listingRoutes);
// router.use('/categories', categoryRoutes);

export default router;
