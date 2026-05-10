'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      name: {
        type:      Sequelize.STRING(60),
        allowNull: false,
        unique:    true,
        comment:   'Human-readable label e.g. Super Admin',
      },
      slug: {
        type:      Sequelize.STRING(60),
        allowNull: false,
        unique:    true,
        comment:   'Machine key e.g. super_admin — used in code checks',
      },
      description: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      is_system: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        comment:      'System roles cannot be deleted via UI',
      },
      created_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      updated_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('roles', ['slug'],       { name: 'idx_roles_slug' });
    await queryInterface.addIndex('roles', ['is_system'],  { name: 'idx_roles_is_system' });
    await queryInterface.addIndex('roles', ['deleted_at'], { name: 'idx_roles_deleted_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('roles');
  },
};
