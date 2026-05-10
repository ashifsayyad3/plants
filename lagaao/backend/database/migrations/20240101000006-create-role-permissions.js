'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_permissions', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      role_id: {
        type:       Sequelize.INTEGER.UNSIGNED,
        allowNull:  false,
        references: { model: 'roles', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      permission_id: {
        type:       Sequelize.INTEGER.UNSIGNED,
        allowNull:  false,
        references: { model: 'permissions', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      granted_by: {
        type:       Sequelize.INTEGER.UNSIGNED,
        allowNull:  true,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('role_permissions', ['role_id', 'permission_id'], {
      name:   'idx_role_permissions_unique',
      unique: true,
    });
    await queryInterface.addIndex('role_permissions', ['role_id'],       { name: 'idx_role_permissions_role_id' });
    await queryInterface.addIndex('role_permissions', ['permission_id'], { name: 'idx_role_permissions_perm_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('role_permissions');
  },
};
