'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refresh_tokens', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      user_id: {
        type:       Sequelize.INTEGER.UNSIGNED,
        allowNull:  false,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      // SHA-256 hash of the raw token — never store raw tokens
      token_hash: {
        type:      Sequelize.CHAR(64),
        allowNull: false,
        unique:    true,
      },
      // "web" | "mobile" | "api" — lets users see and revoke per device
      device_type: {
        type:         Sequelize.STRING(30),
        allowNull:    false,
        defaultValue: 'web',
      },
      device_name: {
        type:      Sequelize.STRING(120),
        allowNull: true,
        comment:   'e.g. Chrome on Windows — parsed from user-agent',
      },
      ip_address: {
        type:      Sequelize.STRING(45),
        allowNull: true,
      },
      expires_at: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
      revoked_at: {
        type:      Sequelize.DATE,
        allowNull: true,
        comment:   'Set on logout — index checked before every refresh',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('refresh_tokens', ['token_hash'],           { name: 'idx_refresh_tokens_hash',     unique: true });
    await queryInterface.addIndex('refresh_tokens', ['user_id'],              { name: 'idx_refresh_tokens_user_id' });
    await queryInterface.addIndex('refresh_tokens', ['user_id', 'revoked_at'],{ name: 'idx_refresh_tokens_active' });
    await queryInterface.addIndex('refresh_tokens', ['expires_at'],           { name: 'idx_refresh_tokens_expires' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
