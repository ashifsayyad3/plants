'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Seeds one super admin user.
 * Password is read from SEED_ADMIN_PASSWORD env var — fall back to a temp
 * password that MUST be changed before going to production.
 */
module.exports = {
  async up(queryInterface) {
    const now      = new Date();
    const password = process.env.SEED_ADMIN_PASSWORD || 'Change@Me123!';
    const hash     = await bcrypt.hash(password, 12);

    await queryInterface.bulkInsert('users', [{
      uuid:              uuidv4(),
      name:              'Super Admin',
      email:             'admin@lagaao.com',
      password_hash:     hash,
      status:            'active',
      email_verified_at: now,
      created_at:        now,
      updated_at:        now,
    }], {});

    // Assign super_admin role
    const [userRows] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@lagaao.com' LIMIT 1`,
    );
    const [roleRows] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE slug = 'super_admin' LIMIT 1`,
    );

    if (userRows.length && roleRows.length) {
      await queryInterface.bulkInsert('user_roles', [{
        user_id:    userRows[0].id,
        role_id:    roleRows[0].id,
        created_at: now,
        updated_at: now,
      }], {});
    }

    console.log('\n✅ Super Admin seeded');
    console.log('   Email:    admin@lagaao.com');
    console.log(`   Password: ${password}`);
    console.log('   ⚠️  Change this password immediately after first login!\n');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_roles', null, {});
    await queryInterface.bulkDelete('users', { email: 'admin@lagaao.com' }, {});
  },
};
