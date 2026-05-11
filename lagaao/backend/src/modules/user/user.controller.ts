import { Request, Response } from 'express';
import { userService }   from './user.service';
import { ResponseUtil }  from '../../utils/response.util';
import { asyncHandler }  from '../../utils/async-handler.util';
import { ExportService } from './user-export.service';

// ─── List ──────────────────────────────────────────────────────────────────────

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.list(req.query as any);
  return ResponseUtil.paginated(res, result.rows.map((u: any) => u.toPublicJSON ? u.toPublicJSON() : u), result.meta);
});

// ─── Get One ───────────────────────────────────────────────────────────────────

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.findByUuid(req.params['uuid']);
  return ResponseUtil.success(res, (user as any).toPublicJSON ? (user as any).toPublicJSON() : user);
});

// ─── Create ────────────────────────────────────────────────────────────────────

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.create(req.body, (req as any).user?.id);
  return ResponseUtil.created(res, (user as any).toPublicJSON ? (user as any).toPublicJSON() : user, 'User created successfully');
});

// ─── Update ────────────────────────────────────────────────────────────────────

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.update(req.params['uuid'], req.body, (req as any).user?.id);
  return ResponseUtil.success(res, (user as any).toPublicJSON ? (user as any).toPublicJSON() : user, 'User updated');
});

// ─── Change Status ─────────────────────────────────────────────────────────────

export const changeUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.changeStatus(req.params['uuid'], req.body, (req as any).user?.id);
  return ResponseUtil.success(res, (user as any).toPublicJSON ? (user as any).toPublicJSON() : user, 'Status updated');
});

// ─── Change Password (admin) ───────────────────────────────────────────────────

export const adminChangePassword = asyncHandler(async (req: Request, res: Response) => {
  await userService.changePassword(req.params['uuid'], req.body, (req as any).user?.id);
  return ResponseUtil.success(res, null, 'Password changed');
});

// ─── Delete ────────────────────────────────────────────────────────────────────

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.delete(req.params['uuid'], (req as any).user?.id);
  return ResponseUtil.noContent(res);
});

// ─── Assign Roles ──────────────────────────────────────────────────────────────

export const assignRoles = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.assignRoles(req.params['uuid'], req.body, (req as any).user?.id);
  return ResponseUtil.success(res, (user as any).toPublicJSON ? (user as any).toPublicJSON() : user, 'Roles updated');
});

// ─── Bulk Action ───────────────────────────────────────────────────────────────

export const bulkAction = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.bulkAction(req.body, (req as any).user?.id);
  return ResponseUtil.success(res, result, `Bulk action completed. ${result.affected} user(s) affected.`);
});

// ─── Activity ──────────────────────────────────────────────────────────────────

export const getUserActivity = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query['limit'] as string) || 30, 100);
  const logs  = await userService.getActivity(req.params['uuid'], limit);
  return ResponseUtil.success(res, logs);
});

// ─── Avatar Upload ─────────────────────────────────────────────────────────────

export const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  const { avatarUrl } = req.body as { avatarUrl: string };
  if (!avatarUrl || !avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
    return ResponseUtil.badRequest(res, 'Invalid avatar URL');
  }
  const user = await userService.updateAvatar(req.params['uuid'], avatarUrl, (req as any).user?.id);
  return ResponseUtil.success(res, (user as any).toPublicJSON ? (user as any).toPublicJSON() : user, 'Avatar updated');
});

// ─── Export ────────────────────────────────────────────────────────────────────

export const exportUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.list({ ...req.query as any, limit: 10000, page: 1 });
  const exportSvc = new ExportService();
  const csv = exportSvc.toCsv(result.rows as any[]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="users-${Date.now()}.csv"`);
  return res.send(csv);
});
