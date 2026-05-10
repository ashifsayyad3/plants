'use strict';

const now = new Date();

/**
 * Permission name convention: "module:action"
 * Modules: users, roles, permissions, listings, settings, notifications, files, reports
 * Actions: create, read, update, delete, export, import, approve, reject, ban
 */
const MODULES = {
  users:         ['create', 'read', 'update', 'delete', 'ban', 'export'],
  roles:         ['create', 'read', 'update', 'delete'],
  permissions:   ['create', 'read', 'update', 'delete'],
  listings:      ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export'],
  settings:      ['read', 'update'],
  notifications: ['read', 'delete', 'send'],
  files:         ['create', 'read', 'delete'],
  reports:       ['read', 'export'],
  activity_logs: ['read', 'export'],
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const permissions = [];

    for (const [module, actions] of Object.entries(MODULES)) {
      for (const action of actions) {
        permissions.push({
          name:        `${module}:${action}`,
          module,
          action,
          description: `Can ${action} ${module}`,
          created_at:  now,
          updated_at:  now,
        });
      }
    }

    await queryInterface.bulkInsert('permissions', permissions, {});

    // ── Wire Super Admin to ALL permissions via role_permissions ──────────────
    const [roleRows] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE slug = 'super_admin' LIMIT 1`,
    );
    const [permRows] = await queryInterface.sequelize.query(
      `SELECT id FROM permissions`,
    );

    if (roleRows.length && permRows.length) {
      const superAdminId = roleRows[0].id;
      const rolePerm = permRows.map((p) => ({
        role_id:       superAdminId,
        permission_id: p.id,
        created_at:    now,
        updated_at:    now,
      }));
      await queryInterface.bulkInsert('role_permissions', rolePerm, {});
    }

    // ── Wire Admin to all non-system permissions ──────────────────────────────
    const [adminRows] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE slug = 'admin' LIMIT 1`,
    );
    const [nonSettingsPerms] = await queryInterface.sequelize.query(
      `SELECT id FROM permissions WHERE module != 'settings'`,
    );

    if (adminRows.length && nonSettingsPerms.length) {
      const adminId = adminRows[0].id;
      const adminPerm = nonSettingsPerms.map((p) => ({
        role_id:       adminId,
        permission_id: p.id,
        created_at:    now,
        updated_at:    now,
      }));
      await queryInterface.bulkInsert('role_permissions', adminPerm, {});
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
  },
};
