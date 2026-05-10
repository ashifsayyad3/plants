'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_logs', {
      id: {
        type:          Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
        comment:       'BIGINT — activity logs grow fast',
      },
      // Who did it
      user_id: {
        type:       Sequelize.INTEGER.UNSIGNED,
        allowNull:  true,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
        comment:    'NULL = system-generated event',
      },
      // What they did
      action: {
        type:      Sequelize.STRING(100),
        allowNull: false,
        comment:   'e.g. user.login, listing.created, setting.updated',
      },
      // What they did it on (polymorphic)
      subject_type: {
        type:      Sequelize.STRING(80),
        allowNull: true,
        comment:   'e.g. User, Listing, Setting',
      },
      subject_id: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      // Diff: before and after state
      old_values: {
        type:      Sequelize.JSON,
        allowNull: true,
      },
      new_values: {
        type:      Sequelize.JSON,
        allowNull: true,
      },
      // Context
      ip_address: {
        type:      Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },
      request_id: {
        type:      Sequelize.CHAR(36),
        allowNull: true,
      },
      meta: {
        type:      Sequelize.JSON,
        allowNull: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      // No paranoid — activity logs are never soft-deleted
    });

    await queryInterface.addIndex('activity_logs', ['user_id'],                      { name: 'idx_activity_logs_user_id' });
    await queryInterface.addIndex('activity_logs', ['action'],                       { name: 'idx_activity_logs_action' });
    await queryInterface.addIndex('activity_logs', ['subject_type', 'subject_id'],  { name: 'idx_activity_logs_subject' });
    await queryInterface.addIndex('activity_logs', ['created_at'],                  { name: 'idx_activity_logs_created_at' });
    await queryInterface.addIndex('activity_logs', ['request_id'],                  { name: 'idx_activity_logs_request_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('activity_logs');
  },
};
