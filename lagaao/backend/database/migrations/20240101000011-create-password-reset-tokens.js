'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('password_reset_tokens', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      email: {
        type:      Sequelize.STRING(191),
        allowNull: false,
      },
      // SHA-256 hash of the raw 6-digit OTP or signed URL token
      token_hash: {
        type:      Sequelize.CHAR(64),
        allowNull: false,
      },
      expires_at: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('password_reset_tokens', ['email'],      { name: 'idx_prt_email' });
    await queryInterface.addIndex('password_reset_tokens', ['token_hash'], { name: 'idx_prt_token_hash' });
    await queryInterface.addIndex('password_reset_tokens', ['expires_at'], { name: 'idx_prt_expires_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('password_reset_tokens');
  },
};
