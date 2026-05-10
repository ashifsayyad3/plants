import { DataTypes, Sequelize, Optional, BelongsToManyGetAssociationsMixin, BelongsToManyAddAssociationMixin } from 'sequelize';
import { BaseModel } from '../../models/base.model';
import { BaseAttributes } from '../../types/common.types';

// ─── Attribute Interface ───────────────────────────────────────────────────────

export interface RoleAttributes extends BaseAttributes {
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
}

export interface RoleCreationAttributes
  extends Optional<RoleAttributes, 'id' | 'description' | 'isSystem' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'createdBy' | 'updatedBy'> {}

// ─── Model ────────────────────────────────────────────────────────────────────

export class Role extends BaseModel<RoleAttributes, RoleCreationAttributes> {
  declare name: string;
  declare slug: string;
  declare description: string | null;
  declare isSystem: boolean;

  // Association mixins (populated by associate())
  declare getPermissions: BelongsToManyGetAssociationsMixin<import('../permission/permission.model').Permission>;
  declare addPermission: BelongsToManyAddAssociationMixin<import('../permission/permission.model').Permission, number>;

  // ─── Static helpers ──────────────────────────────────────────────────────

  static findBySlug(slug: string): Promise<Role | null> {
    return Role.findOne({ where: { slug } });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  static initModel(sequelize: Sequelize): typeof Role {
    return super.initBase(Role, sequelize, {
      name: {
        type:      DataTypes.STRING(60),
        allowNull: false,
        unique:    true,
        validate:  { notEmpty: true, len: [2, 60] },
      },
      slug: {
        type:      DataTypes.STRING(60),
        allowNull: false,
        unique:    true,
        validate:  { is: /^[a-z_]+$/ },
      },
      description: {
        type:      DataTypes.STRING(255),
        allowNull: true,
      },
      isSystem: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
    }, { tableName: 'roles', modelName: 'Role' });
  }

  // ─── Associations ──────────────────────────────────────────────────────────

  static associate(): void {
    const { Permission, User, RolePermission, UserRole } = require('../index');

    Role.belongsToMany(Permission, {
      through:    RolePermission,
      foreignKey: 'roleId',
      otherKey:   'permissionId',
      as:         'permissions',
    });

    Role.belongsToMany(User, {
      through:    UserRole,
      foreignKey: 'roleId',
      otherKey:   'userId',
      as:         'users',
    });

    Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'rolePermissions' });
    Role.hasMany(UserRole,       { foreignKey: 'roleId', as: 'userRoles' });
  }
}
