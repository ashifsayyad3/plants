import { DataTypes, Sequelize, Optional } from 'sequelize';
import { BaseModel } from '../../models/base.model';
import { BaseAttributes } from '../../types/common.types';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type SettingType   = 'string' | 'integer' | 'float' | 'boolean' | 'json' | 'array';
export type SettingGroup  = 'app' | 'mail' | 'payment' | 'sms' | 'storage' | 'feature';

// â”€â”€â”€ Attribute Interface â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface SettingAttributes extends BaseAttributes {
  key: string;
  value: string | null;
  type: SettingType;
  group: SettingGroup;
  label: string | null;
  description: string | null;
  isPublic: boolean;
  isEncrypted: boolean;
}

export interface SettingCreationAttributes
  extends Optional<SettingAttributes, 'id' | 'value' | 'type' | 'group' | 'label' | 'description' | 'isPublic' | 'isEncrypted' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'createdBy' | 'updatedBy'> {}

// â”€â”€â”€ Model â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class Setting extends BaseModel<SettingAttributes, SettingCreationAttributes> {
  declare key: string;
  declare value: string | null;
  declare type: SettingType;
  declare group: SettingGroup;
  declare label: string | null;
  declare description: string | null;
  declare isPublic: boolean;
  declare isEncrypted: boolean;

  /**
   * Returns the value cast to the correct type.
   * Always use this instead of reading .value directly.
   */
  castValue(): unknown {
    if (this.value === null) return null;

    switch (this.type) {
      case 'integer': return parseInt(this.value, 10);
      case 'float':   return parseFloat(this.value);
      case 'boolean': return this.value === 'true' || this.value === '1';
      case 'json':
      case 'array':
        try { return JSON.parse(this.value); } catch { return null; }
      default:        return this.value;
    }
  }

  // â”€â”€â”€ Static helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  static async get(key: string): Promise<unknown> {
    const setting = await Setting.findOne({ where: { key } });
    return setting?.castValue() ?? null;
  }

  static async set(key: string, value: unknown): Promise<void> {
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await Setting.upsert({ key, value: strValue } as SettingCreationAttributes);
  }

  static async getGroup(group: SettingGroup): Promise<Record<string, unknown>> {
    const settings = await Setting.findAll({ where: { group } });
    return Object.fromEntries(settings.map((s) => [s.key, s.castValue()]));
  }

  static async getPublic(): Promise<Record<string, unknown>> {
    const settings = await Setting.findAll({ where: { isPublic: true } });
    return Object.fromEntries(settings.map((s) => [s.key, s.castValue()]));
  }

  // â”€â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  static initModel(sequelize: Sequelize): typeof Setting {
    return super.initBase(Setting, sequelize, {
      key: {
        type:      DataTypes.STRING(120),
        allowNull: false,
        unique:    true,
        validate:  { notEmpty: true },
      },
      value: {
        type:      DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type:         DataTypes.ENUM('string', 'integer', 'float', 'boolean', 'json', 'array'),
        allowNull:    false,
        defaultValue: 'string',
      },
      group: {
        type:         DataTypes.STRING(60),
        allowNull:    false,
        defaultValue: 'app',
      },
      label: {
        type:      DataTypes.STRING(120),
        allowNull: true,
      },
      description: {
        type:      DataTypes.STRING(255),
        allowNull: true,
      },
      isPublic: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      isEncrypted: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
    }, { tableName: 'settings', modelName: 'Setting' });
  }
}

