'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      // UUID for external exposure — never expose numeric id in APIs
      uuid: {
        type:         Sequelize.CHAR(36),
        allowNull:    false,
        unique:       true,
        comment:      'Public-facing identifier — never expose numeric id',
      },
      name: {
        type:      Sequelize.STRING(120),
        allowNull: false,
      },
      email: {
        type:      Sequelize.STRING(191),
        allowNull: false,
        unique:    true,
        comment:   '191 chars max for utf8mb4 compatibility with older MySQL index limits',
      },
      password_hash: {
        type:      Sequelize.STRING(255),
        allowNull: false,
      },
      phone: {
        type:      Sequelize.STRING(20),
        allowNull: true,
      },
      // FK constraint added in 20240101000004-create-files.js after files table exists
      avatar_id: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      status: {
        type:         Sequelize.ENUM('active', 'inactive', 'banned', 'pending'),
        allowNull:    false,
        defaultValue: 'pending',
      },
      email_verified_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      phone_verified_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      last_login_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      last_login_ip: {
        type:      Sequelize.STRING(45),
        allowNull: true,
        comment:   '45 chars supports IPv6',
      },
      meta: {
        type:         Sequelize.JSON,
        allowNull:    true,
        comment:      'Flexible key-value store for user preferences / extra data',
      },
      created_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      updated_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // Indexes — ordered by query frequency
    await queryInterface.addIndex('users', ['uuid'],              { name: 'idx_users_uuid',         unique: true });
    await queryInterface.addIndex('users', ['email'],             { name: 'idx_users_email',        unique: true });
    await queryInterface.addIndex('users', ['phone'],             { name: 'idx_users_phone' });
    await queryInterface.addIndex('users', ['status'],            { name: 'idx_users_status' });
    await queryInterface.addIndex('users', ['email_verified_at'], { name: 'idx_users_email_verified' });
    await queryInterface.addIndex('users', ['last_login_at'],     { name: 'idx_users_last_login' });
    await queryInterface.addIndex('users', ['deleted_at'],        { name: 'idx_users_deleted_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
