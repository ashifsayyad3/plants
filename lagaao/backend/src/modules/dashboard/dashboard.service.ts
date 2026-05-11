import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { User }        from '../user/user.model';
import { Role }        from '../role/role.model';
import { ActivityLog } from '../activity-log/activity-log.model';
import { Notification } from '../notification/notification.model';

export interface KpiStats {
  totalUsers:       number;
  activeUsers:      number;
  newUsersToday:    number;
  newUsersThisWeek: number;
  totalRoles:       number;
  totalNotifications: number;
  unreadNotifications: number;
  pendingUsers:     number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardCharts {
  userGrowth:      ChartDataPoint[];  // last 30 days
  usersByStatus:   ChartDataPoint[];
  activityByType:  ChartDataPoint[];  // last 7 days
}

export interface ActivityEntry {
  id:        number;
  action:    string;
  module:    string;
  ipAddress: string | null;
  createdAt: Date;
  user: {
    id:    number;
    name:  string;
    email: string;
  } | null;
}

export interface NotificationEntry {
  id:        number;
  title:     string;
  body:      string;
  type:      string;
  channel:   string;
  isRead:    boolean;
  createdAt: Date;
}

export class DashboardService {
  async getKpiStats(): Promise<KpiStats> {
    const now       = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      newUsersToday,
      newUsersThisWeek,
      totalRoles,
      totalNotifications,
      unreadNotifications,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      User.count({ where: { status: 'pending' } }),
      User.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
      User.count({ where: { createdAt: { [Op.gte]: weekStart } } }),
      Role.count(),
      Notification.count(),
      Notification.count({ where: { readAt: null } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      newUsersToday,
      newUsersThisWeek,
      totalRoles,
      totalNotifications,
      unreadNotifications,
    };
  }

  async getCharts(): Promise<DashboardCharts> {
    const [userGrowth, usersByStatus, activityByType] = await Promise.all([
      this.getUserGrowthLast30Days(),
      this.getUsersByStatus(),
      this.getActivityByType(),
    ]);
    return { userGrowth, usersByStatus, activityByType };
  }

  async getRecentActivity(limit = 20): Promise<ActivityEntry[]> {
    const logs = await ActivityLog.findAll({
      limit,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
        required: false,
      }],
    });

    return logs.map((log: any) => ({
      id:        log.id,
      action:    log.action,
      module:    log.subjectType ?? 'system',
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
      user:      log.user ? { id: log.user.id, name: log.user.name, email: log.user.email } : null,
    }));
  }

  async getRecentNotifications(limit = 10): Promise<NotificationEntry[]> {
    const notifications = await Notification.findAll({
      limit,
      order: [['createdAt', 'DESC']],
    });

    return notifications.map((n: any) => ({
      id:        n.id,
      title:     n.title,
      body:      n.body ?? '',
      type:      n.type,
      channel:   n.channel,
      isRead:    n.readAt !== null,
      createdAt: n.createdAt,
    }));
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async getUserGrowthLast30Days(): Promise<ChartDataPoint[]> {
    const results: Array<{ day: string; count: string }> = await sequelize.query(
      `SELECT DATE(created_at) as day, COUNT(*) as count
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         AND deleted_at IS NULL
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      { type: 'SELECT' as any },
    ) as any;

    // Fill in missing days with 0
    const map = new Map(results.map((r) => [r.day, parseInt(r.count, 10)]));
    const points: ChartDataPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      points.push({ label: key, value: map.get(key) ?? 0 });
    }
    return points;
  }

  private async getUsersByStatus(): Promise<ChartDataPoint[]> {
    const results: Array<{ status: string; count: string }> = await sequelize.query(
      `SELECT status, COUNT(*) as count
       FROM users WHERE deleted_at IS NULL GROUP BY status`,
      { type: 'SELECT' as any },
    ) as any;

    return results.map((r) => ({ label: r.status, value: parseInt(r.count, 10) }));
  }

  private async getActivityByType(): Promise<ChartDataPoint[]> {
    const results: Array<{ action: string; count: string }> = await sequelize.query(
      `SELECT action, COUNT(*) as count
       FROM activity_logs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY action ORDER BY count DESC LIMIT 10`,
      { type: 'SELECT' as any },
    ) as any;

    return results.map((r) => ({ label: r.action, value: parseInt(r.count, 10) }));
  }
}

export const dashboardService = new DashboardService();
