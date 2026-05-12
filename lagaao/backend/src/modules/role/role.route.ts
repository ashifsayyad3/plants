import { Router }      from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler.util';
import { ResponseUtil } from '../../utils/response.util';
import { Role }         from './role.model';
import { Permission }   from '../permission/permission.model';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Roles and permissions reference data
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:          { type: integer, example: 1 }
 *         name:        { type: string, example: "Admin" }
 *         slug:        { type: string, example: "admin" }
 *         description: { type: string, nullable: true }
 *         isSystem:    { type: boolean, example: false }
 *     Permission:
 *       type: object
 *       properties:
 *         id:     { type: integer }
 *         name:   { type: string, example: "users:read" }
 *         module: { type: string, example: "users" }
 *         action: { type: string, example: "read" }
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: List all roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: All roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Role' }
 */
router.get('/', asyncHandler(async (_req, res) => {
  const roles = await Role.findAll({
    attributes: ['id', 'name', 'slug', 'description', 'isSystem'],
    order: [['name', 'ASC']],
  });
  return ResponseUtil.success(res, roles);
}));

/**
 * @swagger
 * /roles/{id}/permissions:
 *   get:
 *     summary: Get a role with its assigned permissions
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Role with permissions array
 *       404: { description: Not found }
 */
router.get('/:id/permissions', asyncHandler(async (req, res) => {
  const role = await Role.findByPk(req.params['id'], {
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
  });
  if (!role) return ResponseUtil.notFound(res, 'Role not found');
  return ResponseUtil.success(res, role);
}));

/**
 * @swagger
 * /roles/permissions/all:
 *   get:
 *     summary: List all permissions in the system
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: All permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Permission' }
 */
router.get('/permissions/all', asyncHandler(async (_req, res) => {
  const permissions = await Permission.findAll({
    order: [['module', 'ASC'], ['action', 'ASC']],
  });
  return ResponseUtil.success(res, permissions);
}));

export default router;
