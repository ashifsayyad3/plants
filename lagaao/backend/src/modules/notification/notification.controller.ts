import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import { ResponseUtil }        from '../../utils/response.util';
import { asyncHandler }        from '../../utils/async-handler.util';

const actor   = (req: Request) => (req as any).user as { id: number; roles: string[] };
const isAdmin = (req: Request) => ['admin', 'super_admin'].some((r) => actor(req).roles?.includes(r));

// ─── My notifications (paginated) ────────────────────────────────────────────

export const listMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, channel, type, unreadOnly } = req.query as any;
  const result = await notificationService.list({
    userId: actor(req).id,
    page:   +page, limit: +limit,
    channel, type,
    unreadOnly: unreadOnly === 'true',
  });
  return ResponseUtil.paginated(res, result.rows.map(notificationService.toPublicView), result.meta);
});

// ─── Unread count ─────────────────────────────────────────────────────────────

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.unreadCount(actor(req).id);
  return ResponseUtil.success(res, { count });
});

// ─── Mark one read ────────────────────────────────────────────────────────────

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notif = await notificationService.markRead(req.params['uuid'], actor(req).id);
  return ResponseUtil.success(res, notificationService.toPublicView(notif), 'Marked as read');
});

// ─── Mark bulk read ───────────────────────────────────────────────────────────

export const markBulkRead = asyncHandler(async (req: Request, res: Response) => {
  const { uuids } = req.body;
  const count = await notificationService.markBulkRead(uuids, actor(req).id);
  return ResponseUtil.success(res, { updated: count }, `${count} notification(s) marked as read`);
});

// ─── Mark all read ────────────────────────────────────────────────────────────

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.markAllRead(actor(req).id);
  return ResponseUtil.success(res, { updated: count }, 'All notifications marked as read');
});

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.delete(req.params['uuid'], actor(req).id, isAdmin(req));
  return ResponseUtil.noContent(res);
});

// ─── Admin: list all ──────────────────────────────────────────────────────────

export const adminListNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, userId, channel, type, unreadOnly } = req.query as any;
  const result = await notificationService.listAll({
    page: +page, limit: +limit,
    userId: userId ? +userId : undefined,
    channel, type,
    unreadOnly: unreadOnly === 'true',
  });
  return ResponseUtil.paginated(res, result.rows.map(notificationService.toPublicView), result.meta);
});

// ─── Admin: create (system notification) ─────────────────────────────────────

export const adminCreateNotification = asyncHandler(async (req: Request, res: Response) => {
  const notif = await notificationService.create(req.body);
  return ResponseUtil.created(res, notificationService.toPublicView(notif), 'Notification created');
});
