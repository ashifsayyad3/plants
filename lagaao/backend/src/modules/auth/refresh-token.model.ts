import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface RefreshTokenAttributes {
  id: number;
  userId: number;
  tokenHash: string;
  deviceType: string;
  deviceName: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenCreationAttributes
  extends Optional<RefreshTokenAttributes, 'id' | 'deviceType' | 'deviceName' | 'ipAddress' | 'revokedAt' | 'createdAt' | 'updatedAt'> {}

export class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> {
  declare id: number;
  declare userId: number;
  declare tokenHash: string;
  declare deviceType: string;
  declare deviceName: string | null;
  declare ipAddress: string | null;
  declare expiresAt: Date;
  declare revokedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  isExpired(): boolean   { return new Date() > this.expiresAt; }
  isRevoked(): boolean   { return this.revokedAt !== null; }
  isValid(): boolean     { return !this.isExpired() && !this.isRevoked(); }

  static initModel(sequelize: Sequelize): typeof RefreshToken {
    RefreshToken.init({
      id:         { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      tokenHash:  { type: DataTypes.CHAR(64),         allowNull: false, unique: true },
      deviceType: { type: DataTypes.STRING(30),        allowNull: false, defaultValue: 'web' },
      deviceName: { type: DataTypes.STRING(120),       allowNull: true },
      ipAddress:  { type: DataTypes.STRING(45),        allowNull: true },
      expiresAt:  { type: DataTypes.DATE,              allowNull: false },
      revokedAt:  { type: DataTypes.DATE,              allowNull: true },
      createdAt:  { type: DataTypes.DATE,              allowNull: false },
      updatedAt:  { type: DataTypes.DATE,              allowNull: false },
    }, {
      sequelize,
      tableName:   'refresh_tokens',
      modelName:   'RefreshToken',
      underscored: true,
      timestamps:  true,
      paranoid:    false,
    });
    return RefreshToken;
  }

  static associate(): void {
    const { User } = require('../index');
    RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }
}
