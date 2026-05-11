import { Op, WhereOptions } from 'sequelize';
import { ActivityLog, ActivityLogAttributes } from './activity-log.model';
import { User } from '../user/user.model';
import { PaginatedResult } from '../../types/common.types';
import { buildPagination, toPaginatedResult } from '../../utils/pagination.util';

interface ListOpts {
  page:        number;
  limit:       number;
  userId?:     number;
  action?:     string;
  subjectType?: string;
  subjectId?:  number;
  ipAddress?:  string;
  from?:       string;
  to?:         string;
  search?:     string;
}

class ActivityLogService {

  async list(opts: ListOpts): Promise<PaginatedResult<ActivityLog & { user?: { name: string; email: string } }>> {
    const where: WhereOptions<ActivityLogAttributes> = {};

    if (opts.userId)      where['userId']      = opts.userId;
    if (opts.action)      where['action']      = { [Op.like]: `%${opts.action}%` } as any;
    if (opts.subjectType) where['subjectType'] = opts.subjectType;
    if (opts.subjectId)   where['subjectId']   = opts.subjectId;
    if (opts.ipAddress)   where['ipAddress']   = opts.ipAddress;

    if (opts.from || opts.to) {
      where['createdAt'] = {
        ...(opts.from ? { [Op.gte]: new Date(opts.from) } : {}),
        ...(opts.to   ? { [Op.lte]: new Date(opts.to)   } : {}),
      } as any;
    }

    if (opts.search) {
      (where as any)[Op.or] = [
        { action:      { [Op.like]: `%${opts.search}%` } },
        { subjectType: { [Op.like]: `%${opts.search}%` } },
        { ipAddress:   { [Op.like]: `%${opts.search}%` } },
      ];
    }

    const pagination = buildPagination(opts.page, opts.limit);

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      include: [{
        model:      User,
        as:         'user',
        attributes: ['name', 'email'],
        required:   false,
      }],
      order:  [['createdAt', 'DESC']],
      limit:  pagination.limit,
      offset: pagination.offset,
    });

    return toPaginatedResult(rows as any, count, pagination);
  }

  async findById(id: number): Promise<ActivityLog> {
    const log = await ActivityLog.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['name', 'email'], required: false }],
    });
    if (!log) throw new Error('Activity log not found');
    return log;
  }

  // ─── Summary counts by action for admin dashboard ─────────────────────────

  async actionSummary(days = 7): Promise<{ action: string; count: number }[]> {
    const { sequelize } = require('../../config/database');
    const from = new Date(Date.now() - days * 86_400_000);

    const rows: any[] = await sequelize.query(
      `SELECT action, COUNT(*) AS count
       FROM activity_logs
       WHERE created_at >= :from
       GROUP BY action
       ORDER BY count DESC
       LIMIT 20`,
      { replacements: { from }, type: 'SELECT' },
    );

    return rows.map((r: any) => ({ action: r.action, count: Number(r.count) }));
  }

  toPublicView(log: any) {
    return {
      id:          log.id?.toString(),
      userId:      log.userId,
      user:        log.user ? { name: log.user.name, email: log.user.email } : null,
      action:      log.action,
      subjectType: log.subjectType,
      subjectId:   log.subjectId,
      oldValues:   log.oldValues,
      newValues:   log.newValues,
      ipAddress:   log.ipAddress,
      userAgent:   log.userAgent,
      requestId:   log.requestId,
      meta:        log.meta,
      createdAt:   log.createdAt,
    };
  }
}

export const activityLogService = new ActivityLogService();
