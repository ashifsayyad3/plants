'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('files', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      uuid: {
        type:      Sequelize.CHAR(36),
        allowNull: false,
        unique:    true,
      },
      // "local" | "s3" | "gcs" — extensible storage backend
      disk: {
        type:         Sequelize.STRING(30),
        allowNull:    false,
        defaultValue: 'local',
      },
      // Relative path on disk or key in S3 bucket
      path: {
        type:      Sequelize.STRING(500),
        allowNull: false,
      },
      original_name: {
        type:      Sequelize.STRING(255),
        allowNull: false,
      },
      mime_type: {
        type:      Sequelize.STRING(100),
        allowNull: false,
      },
      size: {
        type:      Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   'File size in bytes',
      },
      // "avatar" | "listing_image" | "document" etc.
      collection: {
        type:         Sequelize.STRING(60),
        allowNull:    false,
        defaultValue: 'default',
      },
      // Polymorphic: which model owns this file
      model_type: {
        type:      Sequelize.STRING(80),
        allowNull: true,
      },
      model_id: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      is_public: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      meta: {
        type:      Sequelize.JSON,
        allowNull: true,
        comment:   'width, height, duration, thumbnails, etc.',
      },
      uploaded_by: {
        type:       Sequelize.INTEGER.UNSIGNED,
        allowNull:  true,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      created_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      updated_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('files', ['uuid'],                    { name: 'idx_files_uuid',        unique: true });
    await queryInterface.addIndex('files', ['collection'],              { name: 'idx_files_collection' });
    await queryInterface.addIndex('files', ['model_type', 'model_id'], { name: 'idx_files_polymorphic' });
    await queryInterface.addIndex('files', ['uploaded_by'],             { name: 'idx_files_uploaded_by' });
    await queryInterface.addIndex('files', ['deleted_at'],              { name: 'idx_files_deleted_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('files');
  },
};
