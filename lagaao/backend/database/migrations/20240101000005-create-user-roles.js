'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_roles', {
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
      role_id: {
        type:       Sequelize.INTEGER.UNSIGNED,
        allowNull:  false,
        references: { model: 'roles', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      // Optional scope — e.g. grant role only for a specific entity
      scope_type: {
        type:      Sequelize.STRING(80),
        allowNull: true,
      },
      scope_id: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      assigned_by: {
        type:       Sequelize.INTEGER.UNSIGNED,
        allowNull:  true,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      expires_at: {
        type:      Sequelize.DATE,
        allowNull: true,
        comment:   'NULL means the role never expires',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // Composite unique: one role per user (within scope)
    await queryInterface.addIndex('user_roles', ['user_id', 'role_id', 'scope_type', 'scope_id'], {
      name:   'idx_user_roles_unique',
      unique: true,
    });
    await queryInterface.addIndex('user_roles', ['user_id'],  { name: 'idx_user_roles_user_id' });
    await queryInterface.addIndex('user_roles', ['role_id'],  { name: 'idx_user_roles_role_id' });
    await queryInterface.addIndex('user_roles', ['expires_at'], { name: 'idx_user_roles_expires_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_roles');
  },
};
