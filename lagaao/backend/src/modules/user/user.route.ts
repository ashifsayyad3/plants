import { Router } from 'express';
import { authenticate, authorize, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  CreateUserSchema, UpdateUserSchema, ChangeStatusSchema,
  AssignRolesSchema, BulkActionSchema, ListUsersQuerySchema,
  UuidParamSchema, AdminChangePasswordSchema,
} from './user.validators';
import {
  listUsers, getUser, createUser, updateUser, changeUserStatus,
  adminChangePassword, deleteUser, assignRoles, bulkAction,
  getUserActivity, updateAvatar, exportUsers,
} from './user.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── List / Export ───────────────────────────────────────────────────────────
router.get(
  '/',
  requirePermission('users:read'),
  validate({ query: ListUsersQuerySchema }),
  listUsers,
);

router.get(
  '/export',
  authorize('admin', 'super_admin'),
  validate({ query: ListUsersQuerySchema }),
  exportUsers,
);

// ─── Bulk ────────────────────────────────────────────────────────────────────
router.post(
  '/bulk',
  authorize('admin', 'super_admin'),
  validate({ body: BulkActionSchema }),
  bulkAction,
);

// ─── Single user ─────────────────────────────────────────────────────────────
router.get(
  '/:uuid',
  requirePermission('users:read'),
  validate({ params: UuidParamSchema }),
  getUser,
);

router.post(
  '/',
  requirePermission('users:write'),
  validate({ body: CreateUserSchema }),
  createUser,
);

router.put(
  '/:uuid',
  requirePermission('users:write'),
  validate({ params: UuidParamSchema, body: UpdateUserSchema }),
  updateUser,
);

router.patch(
  '/:uuid/status',
  authorize('admin', 'super_admin'),
  validate({ params: UuidParamSchema, body: ChangeStatusSchema }),
  changeUserStatus,
);

router.patch(
  '/:uuid/password',
  authorize('admin', 'super_admin'),
  validate({ params: UuidParamSchema, body: AdminChangePasswordSchema }),
  adminChangePassword,
);

router.delete(
  '/:uuid',
  requirePermission('users:delete'),
  validate({ params: UuidParamSchema }),
  deleteUser,
);

// ─── Roles ───────────────────────────────────────────────────────────────────
router.put(
  '/:uuid/roles',
  authorize('admin', 'super_admin'),
  validate({ params: UuidParamSchema, body: AssignRolesSchema }),
  assignRoles,
);

// ─── Activity ────────────────────────────────────────────────────────────────
router.get(
  '/:uuid/activity',
  requirePermission('users:read'),
  validate({ params: UuidParamSchema }),
  getUserActivity,
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
router.patch(
  '/:uuid/avatar',
  validate({ params: UuidParamSchema }),
  updateAvatar,
);

export default router;
