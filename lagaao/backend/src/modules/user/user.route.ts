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

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRecord:
 *       type: object
 *       properties:
 *         id:               { type: integer, example: 1 }
 *         uuid:             { type: string, format: uuid }
 *         name:             { type: string, example: "Ali Hassan" }
 *         email:            { type: string, format: email }
 *         phone:            { type: string, example: "+923001234567" }
 *         status:           { type: string, enum: [active, inactive, pending, banned] }
 *         emailVerifiedAt:  { type: string, format: date-time, nullable: true }
 *         lastLoginAt:      { type: string, format: date-time, nullable: true }
 *         createdAt:        { type: string, format: date-time }
 *         roles:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:   { type: integer }
 *               name: { type: string }
 *               slug: { type: string }
 */

// ─── List / Export ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List users with filters and pagination
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or email
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, pending, banned] }
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *         description: Filter by role slug
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/UserRecord' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       403: { description: Forbidden }
 */
router.get(
  '/',
  requirePermission('users:read'),
  validate({ query: ListUsersQuerySchema }),
  listUsers,
);

/**
 * @swagger
 * /users/export:
 *   get:
 *     summary: Export users as CSV
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, pending, banned] }
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema: { type: string }
 *       403: { description: Forbidden }
 */
router.get(
  '/export',
  authorize('admin', 'super_admin'),
  validate({ query: ListUsersQuerySchema }),
  exportUsers,
);

// ─── Bulk ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /users/bulk:
 *   post:
 *     summary: Bulk action on multiple users
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, action]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1, 2, 3]
 *               action:
 *                 type: string
 *                 enum: [activate, deactivate, ban, delete]
 *     responses:
 *       200: { description: Bulk action applied }
 *       400: { description: Validation error }
 *       403: { description: Forbidden }
 */
router.post(
  '/bulk',
  authorize('admin', 'super_admin'),
  validate({ body: BulkActionSchema }),
  bulkAction,
);

// ─── Single user ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /users/{uuid}:
 *   get:
 *     summary: Get a single user by UUID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/UserRecord' }
 *       404: { description: Not found }
 */
router.get(
  '/:uuid',
  requirePermission('users:read'),
  validate({ params: UuidParamSchema }),
  getUser,
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: "Ali Hassan" }
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               phone:    { type: string }
 *               status:   { type: string, enum: [active, inactive, pending] }
 *               roleIds:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       201: { description: User created }
 *       409: { description: Email already exists }
 *       422: { description: Validation error }
 */
router.post(
  '/',
  requirePermission('users:write'),
  validate({ body: CreateUserSchema }),
  createUser,
);

/**
 * @swagger
 * /users/{uuid}:
 *   put:
 *     summary: Update a user's profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:  { type: string }
 *               phone: { type: string }
 *               meta:  { type: object }
 *     responses:
 *       200: { description: User updated }
 *       404: { description: Not found }
 */
router.put(
  '/:uuid',
  requirePermission('users:write'),
  validate({ params: UuidParamSchema, body: UpdateUserSchema }),
  updateUser,
);

/**
 * @swagger
 * /users/{uuid}/status:
 *   patch:
 *     summary: Change a user's status
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, inactive, pending, banned] }
 *     responses:
 *       200: { description: Status updated }
 *       404: { description: Not found }
 */
router.patch(
  '/:uuid/status',
  authorize('admin', 'super_admin'),
  validate({ params: UuidParamSchema, body: ChangeStatusSchema }),
  changeUserStatus,
);

/**
 * @swagger
 * /users/{uuid}/password:
 *   patch:
 *     summary: Admin — change a user's password without the old password
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password changed }
 *       404: { description: Not found }
 */
router.patch(
  '/:uuid/password',
  authorize('admin', 'super_admin'),
  validate({ params: UuidParamSchema, body: AdminChangePasswordSchema }),
  adminChangePassword,
);

/**
 * @swagger
 * /users/{uuid}:
 *   delete:
 *     summary: Soft-delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Deleted }
 *       404: { description: Not found }
 */
router.delete(
  '/:uuid',
  requirePermission('users:delete'),
  validate({ params: UuidParamSchema }),
  deleteUser,
);

// ─── Roles ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /users/{uuid}/roles:
 *   put:
 *     summary: Replace a user's assigned roles
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleIds]
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1, 2]
 *     responses:
 *       200: { description: Roles updated }
 *       404: { description: Not found }
 */
router.put(
  '/:uuid/roles',
  authorize('admin', 'super_admin'),
  validate({ params: UuidParamSchema, body: AssignRolesSchema }),
  assignRoles,
);

// ─── Activity ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /users/{uuid}/activity:
 *   get:
 *     summary: Get recent activity log entries for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Activity list }
 *       404: { description: Not found }
 */
router.get(
  '/:uuid/activity',
  requirePermission('users:read'),
  validate({ params: UuidParamSchema }),
  getUserActivity,
);

// ─── Avatar ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /users/{uuid}/avatar:
 *   patch:
 *     summary: Update a user's avatar (file UUID reference)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileUuid]
 *             properties:
 *               fileUuid: { type: string, format: uuid }
 *     responses:
 *       200: { description: Avatar updated }
 *       404: { description: Not found }
 */
router.patch(
  '/:uuid/avatar',
  validate({ params: UuidParamSchema }),
  updateAvatar,
);

export default router;
