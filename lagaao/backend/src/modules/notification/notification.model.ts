import { DataTypes, Sequelize, Optional } from 'sequelize';
import { BaseModel } from '../../models/base.model';
import { BaseAttributes } from '../../types/common.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

// ─── Attribute Interface ───────────────────────────────────────────────────────

export interface NotificationAttributes extends BaseAttributes {
  uuid: string;
  userId: number;
  channel: NotificationChannel;
  type: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  notifiableType: string | null;
  notifiableId: number | null;
  readAt: Date | null;
  sentAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  meta: Record<string, unknown> | null;
}

export interface NotificationCreationAttributes
  extends Optional<
    NotificationAttributes,
    | 'id'
    | 'channel'
    | 'body'
    | 'actionUrl'
    | 'notifiableType'
    | 'notifiableId'
    | 'readAt'
    | 'sentAt'
    | 'failedAt'
    | 'failureReason'
    | 'meta'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'createdBy'
    | 'updatedBy'
  > {}

// ─── Model ────────────────────────────────────────────────────────────────────

export class Notification extends BaseModel<NotificationAttributes, NotificationCreationAttributes> {
  declare uuid: string;
  declare userId: number;
  declare channel: NotificationChannel;
  declare type: string;
  declare title: string;
  declare body: string | null;
  declare actionUrl: string | null;
  declare notifiableType: string | null;
  declare notifiableId: number | null;
  declare readAt: Date | null;
  declare sentAt: Date | null;
  declare failedAt: Date | null;
  declare failureReason: string | null;
  declare meta: Record<string, unknown> | null;

  isRead(): boolean {
    return this.readAt !== null;
  }

  async markAsRead(): Promise<void> {
    if (!this.readAt) {
      await this.update({ readAt: new Date() });
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  static initModel(sequelize: Sequelize): typeof Notification {
    super.initBase(Notification, sequelize, {
      uuid:           { type: DataTypes.CHAR(36),       allowNull: false, unique: true },
      userId:         { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      channel:        { type: DataTypes.ENUM('in_app', 'email', 'sms', 'push'), allowNull: false, defaultValue: 'in_app' },
      type:           { type: DataTypes.STRING(100),    allowNull: false },
      title:          { type: DataTypes.STRING(255),    allowNull: false },
      body:           { type: DataTypes.TEXT,           allowNull: true },
      actionUrl:      { type: DataTypes.STRING(500),   allowNull: true },
      notifiableType: { type: DataTypes.STRING(80),    allowNull: true },
      notifiableId:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      readAt:         { type: DataTypes.DATE,          allowNull: true },
      sentAt:         { type: DataTypes.DATE,          allowNull: true },
      failedAt:       { type: DataTypes.DATE,          allowNull: true },
      failureReason:  { type: DataTypes.STRING(500),   allowNull: true },
      meta:           { type: DataTypes.JSON,          allowNull: true },
    }, {
      tableName: 'notifications',
      modelName: 'Notification',
    });

    Notification.beforeCreate(async (n) => {
      const { v4: uuidv4 } = await import('uuid');
      if (!n.uuid) n.uuid = uuidv4();
    });

    return Notification;
  }

  // ─── Associations ──────────────────────────────────────────────────────────

  static associate(): void {
    const { User } = require('../index');
    Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }
}
