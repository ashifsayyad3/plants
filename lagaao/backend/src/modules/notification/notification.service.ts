import { Op } from 'sequelize';
import { Notification, NotificationCreationAttributes } from './notification.model';
import { AppError } from '../../middleware/error.middleware';
import { PaginatedResult } from '../../types/common.types';
import { buildPagination, toPaginatedResult } from '../../utils/pagination.util';

interface ListOptions {
  page?:      number;
  limit?:     number;
  userId:     number;
  channel?:   string;
  unreadOnly?: boolean;
  type?:      string;
}

interface CreateParams {
  userId:         number;
  type:           string;
  title:          string;
  body?:          string;
  channel?:       'in_app' | 'email' | 'sms' | 'push';
  actionUrl?:     string;
  notifiableType?: string;
  notifiableId?:  number;
  meta?:          Record<string, unknown>;
}

class NotificationService {

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(params: CreateParams): Promise<Notification> {
    return Notification.create({
      userId:         params.userId,
      type:           params.type,
      title:          params.title,
      body:           params.body ?? null,
      channel:        params.channel ?? 'in_app',
      actionUrl:      params.actionUrl ?? null,
      notifiableType: params.notifiableType ?? null,
      notifiableId:   params.notifiableId ?? null,
      meta:           params.meta ?? null,
      sentAt:         new Date(),
    } as NotificationCreationAttributes);
  }

  // ─── Bulk create (fan-out to multiple users) ──────────────────────────────

  async createBulk(userIds: number[], params: Omit<CreateParams, 'userId'>): Promise<void> {
    const rows = userIds.map((uid) => ({
      userId:         uid,
      type:           params.type,
      title:          params.title,
      body:           params.body ?? null,
      channel:        params.channel ?? 'in_app',
      actionUrl:      params.actionUrl ?? null,
      notifiableType: params.notifiableType ?? null,
      notifiableId:   params.notifiableId ?? null,
      meta:           params.meta ?? null,
      sentAt:         new Date(),
    })) as NotificationCreationAttributes[];

    await Notification.bulkCreate(rows, { validate: true });
  }

  // ─── List (paginated) ─────────────────────────────────────────────────────

  async list(opts: ListOptions): Promise<PaginatedResult<Notification>> {
    const where: Record<string, unknown> = { userId: opts.userId };
    if (opts.channel)    where['channel'] = opts.channel;
    if (opts.type)       where['type']    = opts.type;
    if (opts.unreadOnly) where['readAt']  = null;

    const pagination = buildPagination(opts.page, opts.limit);
    const { count, rows } = await Notification.findAndCountAll({
      where,
      order:  [['createdAt', 'DESC']],
      limit:  pagination.limit,
      offset: pagination.offset,
    });

    return toPaginatedResult(rows, count, pagination);
  }

  // ─── Admin: list all users' notifications ─────────────────────────────────

  async listAll(opts: {
    page?: number; limit?: number;
    userId?: number; type?: string; channel?: string; unreadOnly?: boolean;
  }): Promise<PaginatedResult<Notification>> {
    const where: Record<string, unknown> = {};
    if (opts.userId)    where['userId']  = opts.userId;
    if (opts.channel)   where['channel'] = opts.channel;
    if (opts.type)      where['type']    = opts.type;
    if (opts.unreadOnly) where['readAt'] = null;

    const pagination = buildPagination(opts.page, opts.limit);
    const { count, rows } = await Notification.findAndCountAll({
      where,
      order:  [['createdAt', 'DESC']],
      limit:  pagination.limit,
      offset: pagination.offset,
    });

    return toPaginatedResult(rows, count, pagination);
  }

  // ─── Unread count ─────────────────────────────────────────────────────────

  async unreadCount(userId: number): Promise<number> {
    return Notification.count({ where: { userId, readAt: null } });
  }

  // ─── Mark one as read ─────────────────────────────────────────────────────

  async markRead(uuid: string, userId: number): Promise<Notification> {
    const notif = await Notification.findOne({ where: { uuid } });
    if (!notif) throw new AppError('Notification not found', 404);
    if (notif.userId !== userId) throw new AppError('Forbidden', 403);
    await notif.markAsRead();
    return notif;
  }

  // ─── Mark bulk as read ────────────────────────────────────────────────────

  async markBulkRead(uuids: string[], userId: number): Promise<number> {
    const [count] = await Notification.update(
      { readAt: new Date() },
      { where: { uuid: { [Op.in]: uuids }, userId, readAt: null } },
    );
    return count;
  }

  // ─── Mark all as read ─────────────────────────────────────────────────────

  async markAllRead(userId: number): Promise<number> {
    const [count] = await Notification.update(
      { readAt: new Date() },
      { where: { userId, readAt: null } },
    );
    return count;
  }

  // ─── Delete one ───────────────────────────────────────────────────────────

  async delete(uuid: string, userId: number, isAdmin: boolean): Promise<void> {
    const notif = await Notification.findOne({ where: { uuid } });
    if (!notif) throw new AppError('Notification not found', 404);
    if (!isAdmin && notif.userId !== userId) throw new AppError('Forbidden', 403);
    await notif.destroy();
  }

  // ─── Public view (DTO) ────────────────────────────────────────────────────

  toPublicView(n: Notification) {
    return {
      uuid:           n.uuid,
      type:           n.type,
      title:          n.title,
      body:           n.body,
      channel:        n.channel,
      actionUrl:      n.actionUrl,
      notifiableType: n.notifiableType,
      notifiableId:   n.notifiableId,
      isRead:         n.isRead(),
      readAt:         n.readAt,
      sentAt:         n.sentAt,
      meta:           n.meta,
      createdAt:      n.createdAt,
    };
  }
}

export const notificationService = new NotificationService();
