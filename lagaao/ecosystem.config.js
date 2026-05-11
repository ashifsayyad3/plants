/**
 * PM2 Ecosystem Configuration
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'lagaao-api',
      script: './backend/dist/server.js',
      cwd: '/var/www/lagaao',

      // ─── Instances ─────────────────────────────────────────────────────────
      instances: 'max',          // one worker per CPU core
      exec_mode: 'cluster',      // cluster mode for zero-downtime reload

      // ─── Environment ───────────────────────────────────────────────────────
      env: {
        NODE_ENV: 'development',
        PORT:     3000,
      },
      env_production: {
        NODE_ENV:    'production',
        PORT:        3000,
      },

      // ─── Restart policy ────────────────────────────────────────────────────
      max_memory_restart: '512M',
      restart_delay:      3000,
      max_restarts:       10,
      min_uptime:         '10s',
      autorestart:        true,

      // ─── Logging ───────────────────────────────────────────────────────────
      error_file:   '/var/log/lagaao/api-error.log',
      out_file:     '/var/log/lagaao/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:   true,        // merge cluster logs into single file

      // ─── Source maps ───────────────────────────────────────────────────────
      source_map_support: true,

      // ─── Watch (DISABLED in production) ────────────────────────────────────
      watch: false,

      // ─── Env file loaded by the app itself (not PM2) ───────────────────────
      // The app reads .env via dotenv; PM2 just needs NODE_ENV and PORT.
    },
  ],
};
