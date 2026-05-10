'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type:          Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      uuid: {
        type:      Sequelize.CHAR(36),
        allowNull: false,
        unique:    true,
      },
      user_id: {
        type:       Sequelize.INTEGER.UNSIGNED,
        allowNull:  false,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      // "in_app" | "email" | "sms" | "push"
      channel: {
        type:         Sequelize.ENUM('in_app', 'email', 'sms', 'push'),
        allowNull:    false,
        defaultValue: 'in_app',
      },
      type: {
        type:      Sequelize.STRING(100),
        allowNull: false,
        comment:   'e.g. listing.approved, message.received, payment.success',
      },
      title: {
        type:      Sequelize.STRING(255),
        allowNull: false,
      },
      body: {
        type:      Sequelize.TEXT,
        allowNull: true,
      },
      // Redirect URL when user clicks notification
      action_url: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },
      // Polymorphic reference to the entity that triggered this notification
      notifiable_type: {
        type:      Sequelize.STRING(80),
        allowNull: true,
      },
      notifiable_id: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      read_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      sent_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      failed_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      failure_reason: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },
      meta: {
        type:      Sequelize.JSON,
        allowNull: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('notifications', ['uuid'],                               { name: 'idx_notifications_uuid',        unique: true });
    await queryInterface.addIndex('notifications', ['user_id'],                            { name: 'idx_notifications_user_id' });
    await queryInterface.addIndex('notifications', ['user_id', 'read_at'],                { name: 'idx_notifications_user_unread' });
    await queryInterface.addIndex('notifications', ['channel'],                            { name: 'idx_notifications_channel' });
    await queryInterface.addIndex('notifications', ['type'],                               { name: 'idx_notifications_type' });
    await queryInterface.addIndex('notifications', ['notifiable_type', 'notifiable_id'],  { name: 'idx_notifications_notifiable' });
    await queryInterface.addIndex('notifications', ['deleted_at'],                         { name: 'idx_notifications_deleted_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
