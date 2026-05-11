import { Router }      from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler.util';
import { ResponseUtil } from '../../utils/response.util';
import { Role }         from './role.model';
import { Permission }   from '../permission/permission.model';

const router = Router();

router.use(authenticate);

// GET /roles — full list for dropdowns
router.get('/', asyncHandler(async (_req, res) => {
  const roles = await Role.findAll({
    attributes: ['id', 'name', 'slug', 'description', 'isSystem'],
    order: [['name', 'ASC']],
  });
  return ResponseUtil.success(res, roles);
}));

// GET /roles/:id/permissions
router.get('/:id/permissions', asyncHandler(async (req, res) => {
  const role = await Role.findByPk(req.params['id'], {
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
  });
  if (!role) return ResponseUtil.notFound(res, 'Role not found');
  return ResponseUtil.success(res, role);
}));

// GET /permissions — all permissions
router.get('/permissions/all', asyncHandler(async (_req, res) => {
  const permissions = await Permission.findAll({
    order: [['module', 'ASC'], ['action', 'ASC']],
  });
  return ResponseUtil.success(res, permissions);
}));

export default router;
