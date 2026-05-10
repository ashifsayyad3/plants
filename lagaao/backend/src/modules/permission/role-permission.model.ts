import { DataTypes, Sequelize, Optional, Model } from 'sequelize';

export interface RolePermissionAttributes {
  id: number;
  roleId: number;
  permissionId: number;
  grantedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissionCreationAttributes
  extends Optional<RolePermissionAttributes, 'id' | 'grantedBy' | 'createdAt' | 'updatedAt'> {}

export class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> {
  declare id: number;
  declare roleId: number;
  declare permissionId: number;
  declare grantedBy: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  static initModel(sequelize: Sequelize): typeof RolePermission {
    RolePermission.init(
      {
        id:           { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        roleId:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        permissionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        grantedBy:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        createdAt:    { type: DataTypes.DATE,             allowNull: false },
        updatedAt:    { type: DataTypes.DATE,             allowNull: false },
      },
      {
        sequelize,
        tableName:   'role_permissions',
        modelName:   'RolePermission',
        underscored: true,
        timestamps:  true,
        paranoid:    false,
      },
    );
    return RolePermission;
  }
}
