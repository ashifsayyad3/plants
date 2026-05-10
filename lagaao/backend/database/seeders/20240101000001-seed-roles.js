'use strict';

const now = new Date();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('roles', [
      {
        name:        'Super Admin',
        slug:        'super_admin',
        description: 'Unrestricted access to everything',
        is_system:   true,
        created_at:  now,
        updated_at:  now,
      },
      {
        name:        'Admin',
        slug:        'admin',
        description: 'Full access except system configuration',
        is_system:   true,
        created_at:  now,
        updated_at:  now,
      },
      {
        name:        'Moderator',
        slug:        'moderator',
        description: 'Can manage listings and users, cannot change settings',
        is_system:   true,
        created_at:  now,
        updated_at:  now,
      },
      {
        name:        'User',
        slug:        'user',
        description: 'Standard authenticated user — can manage own listings',
        is_system:   true,
        created_at:  now,
        updated_at:  now,
      },
      {
        name:        'Guest',
        slug:        'guest',
        description: 'Read-only access to public content',
        is_system:   true,
        created_at:  now,
        updated_at:  now,
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', { is_system: true }, {});
  },
};
