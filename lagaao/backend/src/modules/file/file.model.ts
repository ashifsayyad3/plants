import { DataTypes, Sequelize, Optional } from 'sequelize';
import { BaseModel } from '../../models/base.model';
import { BaseAttributes } from '../../types/common.types';

// ─── Attribute Interface ───────────────────────────────────────────────────────

export type DiskType = 'local' | 's3' | 'gcs';

export interface FileAttributes extends BaseAttributes {
  uuid: string;
  disk: DiskType;
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
  collection: string;
  modelType: string | null;
  modelId: number | null;
  isPublic: boolean;
  uploadedBy: number | null;
  meta: Record<string, unknown> | null;
}

export interface FileCreationAttributes
  extends Optional<FileAttributes, 'id' | 'disk' | 'collection' | 'modelType' | 'modelId' | 'isPublic' | 'uploadedBy' | 'meta' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'createdBy' | 'updatedBy'> {}

// ─── Model ────────────────────────────────────────────────────────────────────

export class File extends BaseModel<FileAttributes, FileCreationAttributes> {
  declare uuid: string;
  declare disk: DiskType;
  declare path: string;
  declare originalName: string;
  declare mimeType: string;
  declare size: number;
  declare collection: string;
  declare modelType: string | null;
  declare modelId: number | null;
  declare isPublic: boolean;
  declare uploadedBy: number | null;
  declare meta: Record<string, unknown> | null;

  // ─── Derived helpers ──────────────────────────────────────────────────────

  get isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  get sizeKb(): number {
    return Math.round(this.size / 1024);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  static initModel(sequelize: Sequelize): typeof File {
    return super.initBase(File, sequelize, {
      uuid: {
        type:      DataTypes.CHAR(36),
        allowNull: false,
        unique:    true,
      },
      disk: {
        type:         DataTypes.STRING(30),
        allowNull:    false,
        defaultValue: 'local',
      },
      path: {
        type:      DataTypes.STRING(500),
        allowNull: false,
      },
      originalName: {
        type:      DataTypes.STRING(255),
        allowNull: false,
      },
      mimeType: {
        type:      DataTypes.STRING(100),
        allowNull: false,
      },
      size: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      collection: {
        type:         DataTypes.STRING(60),
        allowNull:    false,
        defaultValue: 'default',
      },
      modelType: {
        type:      DataTypes.STRING(80),
        allowNull: true,
      },
      modelId: {
        type:      DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      isPublic: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      uploadedBy: {
        type:      DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      meta: {
        type:      DataTypes.JSON,
        allowNull: true,
      },
    } as any, { tableName: 'files', modelName: 'File' }) as any;
  }

  // ─── Associations ──────────────────────────────────────────────────────────

  static associate(): void {
    const { User } = require('../index');

    File.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
  }
}
