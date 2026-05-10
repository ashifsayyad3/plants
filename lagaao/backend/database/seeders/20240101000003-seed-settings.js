'use strict';

const now = new Date();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('settings', [
      // ── App ───────────────────────────────────────────────────────────────
      { key: 'app.name',              value: 'Lagaao',               type: 'string',  group: 'app',     label: 'App Name',              is_public: true,  is_encrypted: false, created_at: now, updated_at: now },
      { key: 'app.tagline',           value: 'Find Everything Near', type: 'string',  group: 'app',     label: 'Tagline',               is_public: true,  is_encrypted: false, created_at: now, updated_at: now },
      { key: 'app.contact_email',     value: 'hello@lagaao.com',     type: 'string',  group: 'app',     label: 'Contact Email',         is_public: true,  is_encrypted: false, created_at: now, updated_at: now },
      { key: 'app.support_phone',     value: null,                   type: 'string',  group: 'app',     label: 'Support Phone',         is_public: true,  is_encrypted: false, created_at: now, updated_at: now },
      { key: 'app.maintenance_mode',  value: 'false',                type: 'boolean', group: 'app',     label: 'Maintenance Mode',      is_public: true,  is_encrypted: false, created_at: now, updated_at: now },
      { key: 'app.timezone',          value: 'Asia/Karachi',         type: 'string',  group: 'app',     label: 'Timezone',              is_public: false, is_encrypted: false, created_at: now, updated_at: now },
      { key: 'app.currency',          value: 'PKR',                  type: 'string',  group: 'app',     label: 'Currency Code',         is_public: true,  is_encrypted: false, created_at: now, updated_at: now },
      { key: 'app.currency_symbol',   value: '₨',                    type: 'string',  group: 'app',     label: 'Currency Symbol',       is_public: true,  is_encrypted: false, created_at: now, updated_at: now },
      { key: 'app.per_page',          value: '20',                   type: 'integer', group: 'app',     label: 'Items Per Page',        is_public: true,  is_encrypted: false, created_at: now, updated_at: now },

      // ── Feature Flags ─────────────────────────────────────────────────────
      { key: 'feature.registration',  value: 'true',                 type: 'boolean', group: 'feature', label: 'Allow Registration',    is_public: true,  is_encrypted: false, created_at: now, updated_at: now },
      { key: 'feature.email_verify',  value: 'true',                 type: 'boolean', group: 'feature', label: 'Require Email Verify',  is_public: false, is_encrypted: false, created_at: now, updated_at: now },
      { key: 'feature.sms_otp',       value: 'false',                type: 'boolean', group: 'feature', label: 'SMS OTP Login',         is_public: false, is_encrypted: false, created_at: now, updated_at: now },

      // ── Mail ─────────────────────────────────────────────────────────────
      { key: 'mail.driver',           value: 'smtp',                 type: 'string',  group: 'mail',    label: 'Mail Driver',           is_public: false, is_encrypted: false, created_at: now, updated_at: now },
      { key: 'mail.from_address',     value: 'noreply@lagaao.com',   type: 'string',  group: 'mail',    label: 'From Address',          is_public: false, is_encrypted: false, created_at: now, updated_at: now },
      { key: 'mail.from_name',        value: 'Lagaao',               type: 'string',  group: 'mail',    label: 'From Name',             is_public: false, is_encrypted: false, created_at: now, updated_at: now },

      // ── Storage ───────────────────────────────────────────────────────────
      { key: 'storage.driver',        value: 'local',                type: 'string',  group: 'storage', label: 'Storage Driver',        is_public: false, is_encrypted: false, created_at: now, updated_at: now },
      { key: 'storage.max_file_size', value: '10485760',             type: 'integer', group: 'storage', label: 'Max File Size (bytes)', is_public: true,  is_encrypted: false, created_at: now, updated_at: now },
      { key: 'storage.allowed_types', value: '["image/jpeg","image/png","image/webp","application/pdf"]', type: 'array', group: 'storage', label: 'Allowed MIME Types', is_public: true, is_encrypted: false, created_at: now, updated_at: now },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('settings', null, {});
  },
};
