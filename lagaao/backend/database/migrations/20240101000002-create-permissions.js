'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      // e.g. "listings:create" — the full compound key used in code
      name: {
        type:      Sequelize.STRING(100),
        allowNull: false,
        unique:    true,
      },
      // e.g. "listings"
      module: {
        type:      Sequelize.STRING(60),
        allowNull: false,
      },
      // e.g. "create" | "read" | "update" | "delete" | "export"
      action: {
        type:      Sequelize.STRING(60),
        allowNull: false,
      },
      description: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      created_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      updated_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('permissions', ['module'],          { name: 'idx_permissions_module' });
    await queryInterface.addIndex('permissions', ['module', 'action'],{ name: 'idx_permissions_module_action', unique: true });
    await queryInterface.addIndex('permissions', ['deleted_at'],      { name: 'idx_permissions_deleted_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('permissions');
  },
};
