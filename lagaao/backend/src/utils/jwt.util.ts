import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import { CONSTANTS } from '../config/constants';

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: number;         // user.id
  uuid: string;        // user.uuid (public-safe)
  email: string;
  roles: string[];     // role slugs e.g. ['admin', 'user']
  permissions: string[]; // e.g. ['listings:create', 'users:read']
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: number;
  jti: string;  // unique token id — matched against DB hash
  type: 'refresh';
}

export interface EmailTokenPayload {
  sub: number;
  email: string;
  purpose: 'verify_email' | 'reset_password';
  type: 'email';
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return (jwt.sign as any)(
    { ...payload, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN, issuer: 'lagaao.com', audience: 'lagaao-client' },
  );
}

export function signRefreshToken(userId: number, jti: string): string {
  return (jwt.sign as any)(
    { sub: userId, jti, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN, issuer: 'lagaao.com' },
  );
}

export function signEmailToken(
  userId: number,
  email: string,
  purpose: EmailTokenPayload['purpose'],
): string {
  return (jwt.sign as any)(
    { sub: userId, email, purpose, type: 'email' },
    env.JWT_SECRET,
    { expiresIn: '10m', issuer: 'lagaao.com' },
  );
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: 'lagaao.com',
      audience: 'lagaao-client',
    }) as unknown as AccessTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Access token expired', CONSTANTS.HTTP_STATUS.UNAUTHORIZED);
    }
    throw new AppError('Invalid access token', CONSTANTS.HTTP_STATUS.UNAUTHORIZED);
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'lagaao.com',
    }) as unknown as RefreshTokenPayload;
  } catch {
    throw new AppError('Invalid or expired refresh token', CONSTANTS.HTTP_STATUS.UNAUTHORIZED);
  }
}

export function verifyEmailToken(token: string): EmailTokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: 'lagaao.com',
    }) as unknown as EmailTokenPayload;
  } catch {
    throw new AppError('Invalid or expired token', CONSTANTS.HTTP_STATUS.BAD_REQUEST);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** SHA-256 hash of a raw token — stored in DB instead of raw value */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Generate a cryptographically random refresh token JTI */
export function generateJti(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Parse refresh token TTL string (e.g. "7d") into milliseconds */
export function parseTtlMs(ttl: string): number {
  const unit = ttl.slice(-1);
  const val  = parseInt(ttl, 10);
  const map: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return val * (map[unit] ?? 86_400_000);
}
