import { DataTypes, Sequelize, Optional, Model } from 'sequelize';

// Junction table — no BaseModel since it has no audit columns
export interface UserRoleAttributes {
  id: number;
  userId: number;
  roleId: number;
  scopeType: string | null;
  scopeId: number | null;
  assignedBy: number | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleCreationAttributes
  extends Optional<UserRoleAttributes, 'id' | 'scopeType' | 'scopeId' | 'assignedBy' | 'expiresAt' | 'createdAt' | 'updatedAt'> {}

export class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> {
  declare id: number;
  declare userId: number;
  declare roleId: number;
  declare scopeType: string | null;
  declare scopeId: number | null;
  declare assignedBy: number | null;
  declare expiresAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  static initModel(sequelize: Sequelize): typeof UserRole {
    UserRole.init(
      {
        id:         { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        userId:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        roleId:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        scopeType:  { type: DataTypes.STRING(80),       allowNull: true },
        scopeId:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        assignedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        expiresAt:  { type: DataTypes.DATE,             allowNull: true },
        createdAt:  { type: DataTypes.DATE,             allowNull: false },
        updatedAt:  { type: DataTypes.DATE,             allowNull: false },
      },
      {
        sequelize,
        tableName:   'user_roles',
        modelName:   'UserRole',
        underscored: true,
        timestamps:  true,
        paranoid:    false,
      },
    );
    return UserRole;
  }
}
