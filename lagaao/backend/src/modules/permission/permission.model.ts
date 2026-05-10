import { DataTypes, Sequelize, Optional } from 'sequelize';
import { BaseModel } from '../../models/base.model';
import { BaseAttributes } from '../../types/common.types';

// ─── Attribute Interface ───────────────────────────────────────────────────────

export interface PermissionAttributes extends BaseAttributes {
  name: string;
  module: string;
  action: string;
  description: string | null;
}

export interface PermissionCreationAttributes
  extends Optional<PermissionAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'createdBy' | 'updatedBy'> {}

// ─── Model ────────────────────────────────────────────────────────────────────

export class Permission extends BaseModel<PermissionAttributes, PermissionCreationAttributes> {
  declare name: string;
  declare module: string;
  declare action: string;
  declare description: string | null;

  // ─── Static helpers ──────────────────────────────────────────────────────

  /** Build a permission name from module + action: "listings:create" */
  static buildName(module: string, action: string): string {
    return `${module}:${action}`;
  }

  static findByName(name: string): Promise<Permission | null> {
    return Permission.findOne({ where: { name } });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  static initModel(sequelize: Sequelize): typeof Permission {
    return super.initBase(Permission, sequelize, {
      name: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        unique:    true,
        validate:  { notEmpty: true },
      },
      module: {
        type:      DataTypes.STRING(60),
        allowNull: false,
        validate:  { notEmpty: true },
      },
      action: {
        type:      DataTypes.STRING(60),
        allowNull: false,
        validate:  { notEmpty: true },
      },
      description: {
        type:      DataTypes.STRING(255),
        allowNull: true,
      },
    }, {
      tableName: 'permissions',
      modelName: 'Permission',
      indexes: [
        { unique: true, fields: ['module', 'action'] },
      ],
    });
  }

  // ─── Associations ──────────────────────────────────────────────────────────

  static associate(): void {
    const { Role, RolePermission } = require('../index');

    Permission.belongsToMany(Role, {
      through:    RolePermission,
      foreignKey: 'permissionId',
      otherKey:   'roleId',
      as:         'roles',
    });

    Permission.hasMany(RolePermission, { foreignKey: 'permissionId', as: 'rolePermissions' });
  }
}
