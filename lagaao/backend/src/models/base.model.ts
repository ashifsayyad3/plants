import {
  Model,
  DataTypes,
  ModelStatic,
  Sequelize,
  ModelAttributes,
  ModelOptions,
  InitOptions,
} from 'sequelize';
import { BaseAttributes } from '../types/common.types';

/**
 * BaseModel adds audit columns to every Sequelize model that extends it.
 *
 * Audit columns:
 *   - createdAt  / updatedAt  — auto-managed by Sequelize (timestamps: true)
 *   - deletedAt               — soft-delete via paranoid: true
 *   - createdBy / updatedBy   — FK to users.id, set in service layer
 *
 * Usage:
 *   class User extends BaseModel<UserAttributes, UserCreationAttributes> {
 *     static initModel(sequelize: Sequelize): typeof User {
 *       return super.initBase(User, sequelize, {
 *         name: DataTypes.STRING,
 *         email: DataTypes.STRING,
 *       });
 *     }
 *   }
 */
export abstract class BaseModel<
  TModelAttributes extends BaseAttributes,
  TCreationAttributes extends Partial<TModelAttributes> = Partial<TModelAttributes>,
> extends Model<TModelAttributes, TCreationAttributes> {
  declare id: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
  declare createdBy: number | null;
  declare updatedBy: number | null;

  // ─── Audit Column Definitions ──────────────────────────────────────────────

  protected static get auditAttributes(): ModelAttributes {
    return {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      createdBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: 'FK to users.id — who created this record',
      },
      updatedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: 'FK to users.id — who last updated this record',
      },
    };
  }

  // ─── Base Init Helper ──────────────────────────────────────────────────────

  protected static initBase<M extends BaseModel<BaseAttributes>>(
    modelClass: ModelStatic<M>,
    sequelizeInstance: Sequelize,
    columns: ModelAttributes,
    options: Partial<ModelOptions> = {},
  ): any {
    modelClass.init(
      {
        ...BaseModel.auditAttributes,
        ...columns,
      } as any,
      {
        sequelize: sequelizeInstance,
        timestamps: true,
        paranoid: true,
        underscored: true,
        ...options,
      } as InitOptions,
    );

    return modelClass;
  }

  // ─── Convenience Scopes ───────────────────────────────────────────────────

  /**
   * Returns a scope that filters records created by a specific user.
   */
  static createdByScope(userId: number) {
    return { where: { createdBy: userId } };
  }
}
