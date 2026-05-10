import {
  DataTypes,
  Sequelize,
  Optional,
  HasManyGetAssociationsMixin,
  BelongsToManyGetAssociationsMixin,
} from 'sequelize';
import bcrypt from 'bcryptjs';
import { BaseModel } from '../../models/base.model';
import { BaseAttributes } from '../../types/common.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'inactive' | 'banned' | 'pending';

// ─── Attribute Interface ───────────────────────────────────────────────────────

export interface UserAttributes extends BaseAttributes {
  uuid: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  avatarId: number | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  meta: Record<string, unknown> | null;
}

export interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | 'id'
    | 'phone'
    | 'avatarId'
    | 'status'
    | 'emailVerifiedAt'
    | 'phoneVerifiedAt'
    | 'lastLoginAt'
    | 'lastLoginIp'
    | 'meta'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'createdBy'
    | 'updatedBy'
  > {}

// ─── Model ────────────────────────────────────────────────────────────────────

export class User extends BaseModel<UserAttributes, UserCreationAttributes> {
  declare uuid: string;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare phone: string | null;
  declare avatarId: number | null;
  declare status: UserStatus;
  declare emailVerifiedAt: Date | null;
  declare phoneVerifiedAt: Date | null;
  declare lastLoginAt: Date | null;
  declare lastLoginIp: string | null;
  declare meta: Record<string, unknown> | null;

  // Association mixins
  declare getRoles: BelongsToManyGetAssociationsMixin<import('../role/role.model').Role>;
  declare getNotifications: HasManyGetAssociationsMixin<import('../notification/notification.model').Notification>;

  // ─── Instance methods ─────────────────────────────────────────────────────

  async verifyPassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash);
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  isEmailVerified(): boolean {
    return this.emailVerifiedAt !== null;
  }

  /** Strips sensitive fields for API responses */
  toPublicJSON(): Omit<UserAttributes, 'passwordHash'> {
    const { passwordHash: _removed, ...rest } = this.toJSON() as UserAttributes;
    return rest;
  }

  // ─── Static helpers ──────────────────────────────────────────────────────

  static async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12);
  }

  static findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email: email.toLowerCase().trim() } });
  }

  static findByUuid(uuid: string): Promise<User | null> {
    return User.findOne({ where: { uuid } });
  }

  // ─── Hooks ────────────────────────────────────────────────────────────────

  static registerHooks(): void {
    User.beforeCreate(async (user) => {
      const { v4: uuidv4 } = await import('uuid');
      if (!user.uuid) user.uuid = uuidv4();
      user.email = user.email.toLowerCase().trim();
    });

    User.beforeUpdate(async (user) => {
      if (user.changed('email')) {
        user.email = user.email.toLowerCase().trim();
      }
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  static initModel(sequelize: Sequelize): typeof User {
    super.initBase(User, sequelize, {
      uuid: {
        type:      DataTypes.CHAR(36),
        allowNull: false,
        unique:    true,
      },
      name: {
        type:      DataTypes.STRING(120),
        allowNull: false,
        validate:  { notEmpty: true, len: [2, 120] },
      },
      email: {
        type:      DataTypes.STRING(191),
        allowNull: false,
        unique:    true,
        validate:  { isEmail: true },
      },
      passwordHash: {
        type:      DataTypes.STRING(255),
        allowNull: false,
      },
      phone: {
        type:      DataTypes.STRING(20),
        allowNull: true,
      },
      avatarId: {
        type:      DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      status: {
        type:         DataTypes.ENUM('active', 'inactive', 'banned', 'pending'),
        allowNull:    false,
        defaultValue: 'pending',
      },
      emailVerifiedAt: {
        type:      DataTypes.DATE,
        allowNull: true,
      },
      phoneVerifiedAt: {
        type:      DataTypes.DATE,
        allowNull: true,
      },
      lastLoginAt: {
        type:      DataTypes.DATE,
        allowNull: true,
      },
      lastLoginIp: {
        type:      DataTypes.STRING(45),
        allowNull: true,
      },
      meta: {
        type:      DataTypes.JSON,
        allowNull: true,
      },
    }, { tableName: 'users', modelName: 'User' });

    User.registerHooks();
    return User;
  }

  // ─── Associations ──────────────────────────────────────────────────────────

  static associate(): void {
    const { Role, UserRole, Notification, ActivityLog, File } = require('../index');

    User.belongsToMany(Role, {
      through:    UserRole,
      foreignKey: 'userId',
      otherKey:   'roleId',
      as:         'roles',
    });

    User.hasMany(UserRole,     { foreignKey: 'userId', as: 'userRoles' });
    User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
    User.hasMany(ActivityLog,  { foreignKey: 'userId', as: 'activityLogs' });

    User.belongsTo(File, { foreignKey: 'avatarId', as: 'avatar' });
  }
}
