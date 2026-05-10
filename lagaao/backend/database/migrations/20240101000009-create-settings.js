'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      // Dot-notation key: "mail.driver", "app.maintenance", "sms.twilio_sid"
      key: {
        type:      Sequelize.STRING(120),
        allowNull: false,
        unique:    true,
      },
      // Stored as string; cast on read using `type` column
      value: {
        type:      Sequelize.TEXT,
        allowNull: true,
      },
      // "string" | "integer" | "float" | "boolean" | "json" | "array"
      type: {
        type:         Sequelize.ENUM('string', 'integer', 'float', 'boolean', 'json', 'array'),
        allowNull:    false,
        defaultValue: 'string',
      },
      // "app" | "mail" | "payment" | "sms" | "storage" | "feature"
      group: {
        type:         Sequelize.STRING(60),
        allowNull:    false,
        defaultValue: 'app',
      },
      label: {
        type:      Sequelize.STRING(120),
        allowNull: true,
        comment:   'UI-friendly label for admin panel',
      },
      description: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      is_public: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        comment:      'If true, value is exposed to frontend via /api/v1/settings/public',
      },
      is_encrypted: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        comment:      'If true, value is stored AES-encrypted',
      },
      created_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      updated_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('settings', ['key'],        { name: 'idx_settings_key',        unique: true });
    await queryInterface.addIndex('settings', ['group'],      { name: 'idx_settings_group' });
    await queryInterface.addIndex('settings', ['is_public'],  { name: 'idx_settings_is_public' });
    await queryInterface.addIndex('settings', ['deleted_at'], { name: 'idx_settings_deleted_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('settings');
  },
};
