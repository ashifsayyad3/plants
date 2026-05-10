import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User }                   from '../user/user.model';
import { Role }                   from '../role/role.model';
import { Permission }             from '../permission/permission.model';
import { RefreshToken }           from './refresh-token.model';
import { PasswordResetToken }     from './password-reset-token.model';
import { ActivityLog }            from '../activity-log/activity-log.model';
import {
  signAccessToken, signRefreshToken, signEmailToken,
  verifyRefreshToken, verifyEmailToken,
  hashToken, generateJti, parseTtlMs,
} from '../../utils/jwt.util';
import { AppError, ConflictError, UnauthorizedError } from '../../middleware/error.middleware';
import { CONSTANTS }              from '../../config/constants';
import { env }                    from '../../config/env';
import { logger }                 from '../../config/logger';
import type {
  RegisterDto, LoginDto, ForgotPasswordDto,
  ResetPasswordDto, VerifyEmailDto, ChangePasswordDto,
} from './auth.schemas';

// ─── Types returned to controller ─────────────────────────────────────────────

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number; // seconds
}

export interface AuthUser {
  id:      number;
  uuid:    string;
  name:    string;
  email:   string;
  status:  string;
  roles:   string[];
  permissions: string[];
  emailVerifiedAt: Date | null;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export class AuthService {

  // ── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, ipAddress?: string): Promise<{ user: AuthUser; verifyToken: string }> {
    const existing = await User.findByEmail(dto.email);
    if (existing) throw new ConflictError('An account with this email already exists');

    const passwordHash = await User.hashPassword(dto.password);
    const user = await User.create({
      uuid:         uuidv4(),
      name:         dto.name,
      email:        dto.email,
      passwordHash,
      phone:        dto.phone ?? null,
      status:       'pending',
    });

    // Assign default 'user' role
    const userRole = await Role.findOne({ where: { slug: 'user' } });
    if (userRole) {
      const { UserRole } = await import('../user/user-role.model');
      await UserRole.create({ userId: user.id, roleId: userRole.id });
    }

    const verifyToken = signEmailToken(user.id, user.email, 'verify_email');

    await ActivityLog.log({
      userId:     user.id,
      action:     'user.registered',
      subjectType: 'User',
      subjectId:  user.id,
      ipAddress,
    });

    logger.info('New user registered', { userId: user.id, email: user.email });

    return {
      user:        await this.buildAuthUser(user),
      verifyToken,
    };
  }

  // ── Login ────────────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ user: AuthUser; tokens: TokenPair }> {
    const user = await User.findByEmail(dto.email);

    // Constant-time failure — don't reveal whether email exists
    if (!user || !(await user.verifyPassword(dto.password))) {
      throw new UnauthorizedError(CONSTANTS.MESSAGES.INVALID_CREDENTIALS);
    }

    this.assertAccountAllowed(user);

    const tokens  = await this.issueTokenPair(user, ipAddress, userAgent);
    const authUser = await this.buildAuthUser(user);

    // Update last login
    await user.update({ lastLoginAt: new Date(), lastLoginIp: ipAddress ?? null });

    await ActivityLog.log({
      userId: user.id, action: 'user.login',
      subjectType: 'User', subjectId: user.id,
      ipAddress, userAgent,
    });

    return { user: authUser, tokens };
  }

  // ── Refresh ──────────────────────────────────────────────────────────────────

  async refresh(
    rawToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ user: AuthUser; tokens: TokenPair }> {
    const payload = verifyRefreshToken(rawToken);
    const hash    = hashToken(rawToken);

    const stored = await RefreshToken.findOne({ where: { tokenHash: hash } });
    if (!stored || !stored.isValid()) {
      throw new UnauthorizedError('Refresh token has been revoked or expired');
    }

    const user = await User.findByPk(stored.userId);
    if (!user) throw new UnauthorizedError(CONSTANTS.MESSAGES.UNAUTHORIZED);

    this.assertAccountAllowed(user);

    // Rotate: revoke old token, issue fresh pair
    await stored.update({ revokedAt: new Date() });
    const tokens   = await this.issueTokenPair(user, ipAddress, userAgent);
    const authUser = await this.buildAuthUser(user);

    logger.debug('Refresh token rotated', { userId: user.id, jti: payload.jti });

    return { user: authUser, tokens };
  }

  // ── Logout ───────────────────────────────────────────────────────────────────

  async logout(rawToken: string, userId: number): Promise<void> {
    const hash = hashToken(rawToken);
    const rows = await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { tokenHash: hash, userId, revokedAt: null } },
    );

    if (rows[0] === 0) {
      logger.warn('Logout called with unknown token', { userId });
    }

    await ActivityLog.log({ userId, action: 'user.logout' });
  }

  // ── Logout All Devices ───────────────────────────────────────────────────────

  async logoutAll(userId: number): Promise<void> {
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { userId, revokedAt: null } },
    );
    await ActivityLog.log({ userId, action: 'user.logout_all' });
  }

  // ── Forgot Password ──────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<string> {
    const user = await User.findByEmail(dto.email);

    // Always return same message — prevents email enumeration
    if (!user || user.status === 'banned') {
      return CONSTANTS.MESSAGES.EMAIL_SENT;
    }

    // Invalidate previous reset tokens
    await PasswordResetToken.update(
      { usedAt: new Date() },
      { where: { email: dto.email, usedAt: null } },
    );

    const rawToken = signEmailToken(user.id, user.email, 'reset_password');
    const hash     = hashToken(rawToken);

    await PasswordResetToken.create({
      email:     user.email,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + CONSTANTS.AUTH.RESET_TOKEN_EXPIRES_MIN * 60_000),
    });

    logger.info('Password reset token issued', { userId: user.id });

    // Return the raw token so the controller can hand it to the mail service
    // In production, send via email — never return in response body
    return rawToken;
  }

  // ── Reset Password ────────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string): Promise<void> {
    const payload = verifyEmailToken(dto.token);

    if (payload.purpose !== 'reset_password') {
      throw new AppError(CONSTANTS.MESSAGES.TOKEN_INVALID, CONSTANTS.HTTP_STATUS.BAD_REQUEST);
    }

    const hash  = hashToken(dto.token);
    const record = await PasswordResetToken.findOne({
      where: { tokenHash: hash, email: payload.email },
    });

    if (!record || !record.isValid()) {
      throw new AppError(CONSTANTS.MESSAGES.TOKEN_INVALID, CONSTANTS.HTTP_STATUS.BAD_REQUEST);
    }

    const user = await User.findByPk(payload.sub);
    if (!user) throw new UnauthorizedError(CONSTANTS.MESSAGES.UNAUTHORIZED);

    const passwordHash = await User.hashPassword(dto.password);
    await user.update({ passwordHash, status: user.status === 'pending' ? 'active' : user.status });

    // Mark token as used and revoke all refresh tokens (force re-login everywhere)
    await record.update({ usedAt: new Date() });
    await this.logoutAll(user.id);

    await ActivityLog.log({
      userId:   user.id,
      action:   'user.password_reset',
      subjectType: 'User', subjectId: user.id,
      ipAddress,
    });
  }

  // ── Verify Email ──────────────────────────────────────────────────────────────

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const payload = verifyEmailToken(dto.token);

    if (payload.purpose !== 'verify_email') {
      throw new AppError(CONSTANTS.MESSAGES.TOKEN_INVALID, CONSTANTS.HTTP_STATUS.BAD_REQUEST);
    }

    const user = await User.findByPk(payload.sub);
    if (!user) throw new UnauthorizedError(CONSTANTS.MESSAGES.UNAUTHORIZED);

    if (user.emailVerifiedAt) {
      throw new AppError(CONSTANTS.MESSAGES.EMAIL_ALREADY_VERIFIED, CONSTANTS.HTTP_STATUS.CONFLICT);
    }

    await user.update({
      emailVerifiedAt: new Date(),
      status: user.status === 'pending' ? 'active' : user.status,
    });

    await ActivityLog.log({ userId: user.id, action: 'user.email_verified' });
  }

  // ── Resend Verification Email ─────────────────────────────────────────────────

  async resendVerification(email: string): Promise<string> {
    const user = await User.findByEmail(email);
    if (!user || user.emailVerifiedAt) return CONSTANTS.MESSAGES.EMAIL_SENT;

    const verifyToken = signEmailToken(user.id, user.email, 'verify_email');
    return verifyToken;
  }

  // ── Change Password (authenticated) ──────────────────────────────────────────

  async changePassword(userId: number, dto: ChangePasswordDto, ipAddress?: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new UnauthorizedError(CONSTANTS.MESSAGES.UNAUTHORIZED);

    const valid = await user.verifyPassword(dto.currentPassword);
    if (!valid) {
      throw new AppError('Current password is incorrect', CONSTANTS.HTTP_STATUS.BAD_REQUEST);
    }

    const passwordHash = await User.hashPassword(dto.newPassword);
    await user.update({ passwordHash });
    await this.logoutAll(userId);

    await ActivityLog.log({ userId, action: 'user.password_changed', ipAddress });
  }

  // ── Active Sessions ───────────────────────────────────────────────────────────

  async getSessions(userId: number): Promise<RefreshToken[]> {
    return RefreshToken.findAll({
      where: {
        userId,
        revokedAt:  null,
        expiresAt:  { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });
  }

  // ── Internals ─────────────────────────────────────────────────────────────────

  private assertAccountAllowed(user: User): void {
    if (user.status === 'banned')   throw new AppError(CONSTANTS.MESSAGES.ACCOUNT_BANNED,    CONSTANTS.HTTP_STATUS.FORBIDDEN);
    if (user.status === 'inactive') throw new AppError(CONSTANTS.MESSAGES.ACCOUNT_INACTIVE,  CONSTANTS.HTTP_STATUS.FORBIDDEN);
  }

  async buildAuthUser(user: User): Promise<AuthUser> {
    const rolesData = await Role.findAll({
      include: [{ model: Permission, as: 'permissions' }],
      // @ts-expect-error — Sequelize M:N through join
      through: { model: (await import('../user/user-role.model')).UserRole, where: { userId: user.id } },
    });

    const roles       = rolesData.map((r) => r.slug);
    const permissions = [
      ...new Set(
        rolesData.flatMap((r) =>
          ((r as unknown as { permissions?: Permission[] }).permissions ?? []).map((p) => p.name),
        ),
      ),
    ];

    return {
      id: user.id, uuid: user.uuid, name: user.name, email: user.email,
      status: user.status, roles, permissions, emailVerifiedAt: user.emailVerifiedAt,
    };
  }

  private async issueTokenPair(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    // Enforce max session limit — revoke oldest if exceeded
    const activeSessions = await RefreshToken.count({
      where: { userId: user.id, revokedAt: null, expiresAt: { [Op.gt]: new Date() } },
    });

    if (activeSessions >= CONSTANTS.AUTH.MAX_ACTIVE_SESSIONS) {
      const oldest = await RefreshToken.findOne({
        where: { userId: user.id, revokedAt: null },
        order: [['createdAt', 'ASC']],
      });
      if (oldest) await oldest.update({ revokedAt: new Date() });
    }

    const jti      = generateJti();
    const rawRefresh = signRefreshToken(user.id, jti);
    const hash     = hashToken(rawRefresh);
    const expiresMs = parseTtlMs(env.JWT_REFRESH_EXPIRES_IN);

    await RefreshToken.create({
      userId:     user.id,
      tokenHash:  hash,
      deviceType: 'web',
      deviceName: userAgent?.substring(0, 120) ?? null,
      ipAddress:  ipAddress ?? null,
      expiresAt:  new Date(Date.now() + expiresMs),
    });

    const authUser  = await this.buildAuthUser(user);
    const accessToken = signAccessToken({
      sub:         user.id,
      uuid:        user.uuid,
      email:       user.email,
      roles:       authUser.roles,
      permissions: authUser.permissions,
    });

    return {
      accessToken,
      refreshToken: rawRefresh,
      expiresIn:    15 * 60, // 15 minutes in seconds
    };
  }
}

export const authService = new AuthService();
