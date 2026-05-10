/**
 * Sequelize CLI config (plain JS — CLI does not run through ts-node).
 * Values are read from .env at the time the CLI command runs.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    dialect:  'mysql',
    dialectOptions: {
      bigNumberStrings: true,
      decimalNumbers:   true,
    },
    define: {
      underscored: true,
      timestamps:  true,
      paranoid:    true,
      charset:     'utf8mb4',
      collate:     'utf8mb4_unicode_ci',
    },
    timezone: '+05:30',
  },

  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME + '_test',
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    dialect:  'mysql',
    logging:  false,
    define: {
      underscored: true,
      timestamps:  true,
      paranoid:    true,
    },
  },

  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    dialect:  'mysql',
    logging:  false,
    pool: {
      max:     10,
      min:     2,
      acquire: 30000,
      idle:    10000,
    },
    dialectOptions: {
      bigNumberStrings: true,
      decimalNumbers:   true,
      // GoDaddy shared hosting may require SSL:
      // ssl: { rejectUnauthorized: false },
    },
    define: {
      underscored: true,
      timestamps:  true,
      paranoid:    true,
      charset:     'utf8mb4',
      collate:     'utf8mb4_unicode_ci',
    },
    timezone: '+05:30',
  },
};
