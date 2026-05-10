import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface PasswordResetTokenAttributes {
  id: number;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetTokenCreationAttributes
  extends Optional<PasswordResetTokenAttributes, 'id' | 'usedAt' | 'createdAt' | 'updatedAt'> {}

export class PasswordResetToken extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes> {
  declare id: number;
  declare email: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare usedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  isExpired(): boolean { return new Date() > this.expiresAt; }
  isUsed(): boolean    { return this.usedAt !== null; }
  isValid(): boolean   { return !this.isExpired() && !this.isUsed(); }

  static initModel(sequelize: Sequelize): typeof PasswordResetToken {
    PasswordResetToken.init({
      id:        { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      email:     { type: DataTypes.STRING(191),      allowNull: false },
      tokenHash: { type: DataTypes.CHAR(64),         allowNull: false },
      expiresAt: { type: DataTypes.DATE,             allowNull: false },
      usedAt:    { type: DataTypes.DATE,             allowNull: true },
      createdAt: { type: DataTypes.DATE,             allowNull: false },
      updatedAt: { type: DataTypes.DATE,             allowNull: false },
    }, {
      sequelize,
      tableName:   'password_reset_tokens',
      modelName:   'PasswordResetToken',
      underscored: true,
      timestamps:  true,
      paranoid:    false,
    });
    return PasswordResetToken;
  }
}
