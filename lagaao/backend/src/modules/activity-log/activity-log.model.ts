import { DataTypes, Sequelize, Optional, Model } from 'sequelize';

// Activity logs use BIGINT id and no soft-delete, so no BaseModel
export interface ActivityLogAttributes {
  id: bigint;
  userId: number | null;
  action: string;
  subjectType: string | null;
  subjectId: number | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLogCreationAttributes
  extends Optional<
    ActivityLogAttributes,
    'id' | 'userId' | 'subjectType' | 'subjectId' | 'oldValues' | 'newValues' | 'ipAddress' | 'userAgent' | 'requestId' | 'meta' | 'createdAt' | 'updatedAt'
  > {}

export class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> {
  declare id: bigint;
  declare userId: number | null;
  declare action: string;
  declare subjectType: string | null;
  declare subjectId: number | null;
  declare oldValues: Record<string, unknown> | null;
  declare newValues: Record<string, unknown> | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare requestId: string | null;
  declare meta: Record<string, unknown> | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  // ─── Static log factory ───────────────────────────────────────────────────

  static async log(params: {
    userId?: number | null;
    action: string;
    subjectType?: string;
    subjectId?: number;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    meta?: Record<string, unknown>;
  }): Promise<ActivityLog> {
    return ActivityLog.create({
      userId:      params.userId ?? null,
      action:      params.action,
      subjectType: params.subjectType ?? null,
      subjectId:   params.subjectId ?? null,
      oldValues:   params.oldValues ?? null,
      newValues:   params.newValues ?? null,
      ipAddress:   params.ipAddress ?? null,
      userAgent:   params.userAgent ?? null,
      requestId:   params.requestId ?? null,
      meta:        params.meta ?? null,
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  static initModel(sequelize: Sequelize): typeof ActivityLog {
    ActivityLog.init(
      {
        id:          { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        userId:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        action:      { type: DataTypes.STRING(100),      allowNull: false },
        subjectType: { type: DataTypes.STRING(80),       allowNull: true },
        subjectId:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        oldValues:   { type: DataTypes.JSON,             allowNull: true },
        newValues:   { type: DataTypes.JSON,             allowNull: true },
        ipAddress:   { type: DataTypes.STRING(45),       allowNull: true },
        userAgent:   { type: DataTypes.STRING(500),      allowNull: true },
        requestId:   { type: DataTypes.CHAR(36),         allowNull: true },
        meta:        { type: DataTypes.JSON,             allowNull: true },
        createdAt:   { type: DataTypes.DATE,             allowNull: false },
        updatedAt:   { type: DataTypes.DATE,             allowNull: false },
      },
      {
        sequelize,
        tableName:   'activity_logs',
        modelName:   'ActivityLog',
        underscored: true,
        timestamps:  true,
        paranoid:    false,
      },
    );
    return ActivityLog;
  }

  // ─── Associations ──────────────────────────────────────────────────────────

  static associate(): void {
    const { User } = require('../index');
    ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }
}
