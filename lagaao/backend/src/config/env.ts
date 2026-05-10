import Joi from 'joi';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT:     Joi.number().integer().min(1).max(65535).default(3000),
  APP_NAME: Joi.string().default('Lagaao'),
  APP_URL:  Joi.string().uri().default('http://localhost:3000'),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().integer().default(3306),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required().allow(''),

  JWT_SECRET:              Joi.string().min(32).required(),
  JWT_EXPIRES_IN:          Joi.string().default('15m'),
  JWT_REFRESH_SECRET:      Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN:  Joi.string().default('7d'),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().default(900_000),
  RATE_LIMIT_MAX:       Joi.number().integer().default(100),

  // Tighter limits for auth endpoints
  AUTH_RATE_LIMIT_WINDOW_MS: Joi.number().integer().default(900_000),
  AUTH_RATE_LIMIT_MAX:       Joi.number().integer().default(10),

  ALLOWED_ORIGINS:  Joi.string().default('http://localhost:4200'),
  SWAGGER_ENABLED:  Joi.boolean().default(true),

  COOKIE_SECURE:    Joi.boolean().default(false),
  COOKIE_DOMAIN:    Joi.string().default('localhost'),
})
  .unknown(true)
  .options({ abortEarly: false });

const { error, value: v } = schema.validate(process.env);

if (error) {
  const details = error.details.map((d) => `  • ${d.message}`).join('\n');
  throw new Error(`\n[ENV VALIDATION FAILED]\n${details}\n`);
}

export const env = {
  NODE_ENV: v.NODE_ENV as 'development' | 'production' | 'test',
  PORT:     v.PORT     as number,
  APP_NAME: v.APP_NAME as string,
  APP_URL:  v.APP_URL  as string,

  DB: {
    HOST: v.DB_HOST as string,
    PORT: v.DB_PORT as number,
    NAME: v.DB_NAME as string,
    USER: v.DB_USER as string,
    PASS: v.DB_PASS as string,
  },

  JWT_SECRET:             v.JWT_SECRET             as string,
  JWT_EXPIRES_IN:         v.JWT_EXPIRES_IN         as string,
  JWT_REFRESH_SECRET:     v.JWT_REFRESH_SECRET     as string,
  JWT_REFRESH_EXPIRES_IN: v.JWT_REFRESH_EXPIRES_IN as string,

  RATE_LIMIT: {
    WINDOW_MS: v.RATE_LIMIT_WINDOW_MS as number,
    MAX:       v.RATE_LIMIT_MAX       as number,
  },

  AUTH_RATE_LIMIT: {
    WINDOW_MS: v.AUTH_RATE_LIMIT_WINDOW_MS as number,
    MAX:       v.AUTH_RATE_LIMIT_MAX       as number,
  },

  ALLOWED_ORIGINS: (v.ALLOWED_ORIGINS as string).split(',').map((s: string) => s.trim()),
  SWAGGER_ENABLED: v.SWAGGER_ENABLED as boolean,

  COOKIE: {
    SECURE: v.COOKIE_SECURE as boolean,
    DOMAIN: v.COOKIE_DOMAIN as string,
  },

  isProd:  () => v.NODE_ENV === 'production',
  isDev:   () => v.NODE_ENV === 'development',
  isTest:  () => v.NODE_ENV === 'test',
} as const;
