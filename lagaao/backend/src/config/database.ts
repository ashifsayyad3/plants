import { Sequelize } from 'sequelize';
import { env } from './env';
import { logger } from './logger';

// ─── Models ───────────────────────────────────────────────────────────────────
import { Role }           from '../modules/role/role.model';
import { Permission }     from '../modules/permission/permission.model';
import { RolePermission } from '../modules/permission/role-permission.model';
import { File }           from '../modules/file/file.model';
import { User }           from '../modules/user/user.model';
import { UserRole }       from '../modules/user/user-role.model';
import { ActivityLog }    from '../modules/activity-log/activity-log.model';
import { Notification }   from '../modules/notification/notification.model';
import { Setting }             from '../modules/setting/setting.model';
import { RefreshToken }        from '../modules/auth/refresh-token.model';
import { PasswordResetToken }  from '../modules/auth/password-reset-token.model';

// ─── Sequelize Instance ───────────────────────────────────────────────────────

export const sequelize = new Sequelize({
  dialect:  'mysql',
  host:     env.DB.HOST,
  port:     env.DB.PORT,
  database: env.DB.NAME,
  username: env.DB.USER,
  password: env.DB.PASS,
  logging:  env.isDev() ? (sql: string) => logger.debug(sql) : false,
  pool: {
    max:     10,
    min:     2,
    acquire: 30_000,
    idle:    10_000,
  },
  define: {
    underscored: true,
    timestamps:  true,
    paranoid:    true,
    charset:     'utf8mb4',
    collate:     'utf8mb4_unicode_ci',
  },
  timezone: '+05:30',
});

// ─── Model Registration ───────────────────────────────────────────────────────

function registerModels(): void {
  // Order matters: leaf models first, then models with FKs pointing to them
  Role.initModel(sequelize);
  Permission.initModel(sequelize);
  RolePermission.initModel(sequelize);
  File.initModel(sequelize);
  User.initModel(sequelize);
  UserRole.initModel(sequelize);
  ActivityLog.initModel(sequelize);
  Notification.initModel(sequelize);
  Setting.initModel(sequelize);
  RefreshToken.initModel(sequelize);
  PasswordResetToken.initModel(sequelize);
}

// ─── Association Wiring ───────────────────────────────────────────────────────

function registerAssociations(): void {
  // Each model's associate() method uses require('../index') to avoid
  // circular imports. All models must be init'd before this runs.
  Role.associate();
  Permission.associate();
  File.associate();
  User.associate();
  ActivityLog.associate();
  Notification.associate();
  // RolePermission, UserRole, Setting, PasswordResetToken have no associations to declare
  RefreshToken.associate();
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    registerModels();
    registerAssociations();
    logger.info('Models registered and associations wired');

    if (env.isDev()) {
      // alter:true brings schema in sync without dropping data
      // Switch to migrations-only in production
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized (alter mode)');
    }
  } catch (error) {
    logger.error('Unable to connect to database', { error });
    process.exit(1);
  }
}

// ─── Re-export models for convenience ────────────────────────────────────────
export {
  Role, Permission, RolePermission,
  File, User, UserRole,
  ActivityLog, Notification, Setting,
};
