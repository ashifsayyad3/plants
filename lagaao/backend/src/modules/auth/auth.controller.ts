import { Request, Response } from 'express';
import { authService }   from './auth.service';
import { ResponseUtil }  from '../../utils/response.util';
import { CONSTANTS }     from '../../config/constants';
import { env }           from '../../config/env';
import { asyncHandler }  from '../../utils/async-handler.util';
import { AppError }      from '../../middleware/error.middleware';
import type {
  RegisterDto, LoginDto, ForgotPasswordDto,
  ResetPasswordDto, VerifyEmailDto, ChangePasswordDto,
} from './auth.schemas';

// ─── Cookie helper ────────────────────────────────────────────────────────────

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(CONSTANTS.COOKIE.REFRESH_TOKEN_NAME, token, {
    httpOnly: true,
    secure:   env.COOKIE.SECURE,
    sameSite: 'strict',
    domain:   env.isProd() ? env.COOKIE.DOMAIN : undefined,
    maxAge:   CONSTANTS.COOKIE.MAX_AGE_MS,
    path:     '/api/v1/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(CONSTANTS.COOKIE.REFRESH_TOKEN_NAME, {
    httpOnly: true,
    secure:   env.COOKIE.SECURE,
    sameSite: 'strict',
    path:     '/api/v1/auth',
  });
}

function getRefreshToken(req: Request): string {
  const fromCookie = req.cookies?.[CONSTANTS.COOKIE.REFRESH_TOKEN_NAME] as string | undefined;
  const fromBody   = (req.body as { refreshToken?: string }).refreshToken;
  const token      = fromCookie ?? fromBody;
  if (!token) throw new AppError('Refresh token required', CONSTANTS.HTTP_STATUS.UNAUTHORIZED);
  return token;
}

// ─── Controller ───────────────────────────────────────────────────────────────

export const AuthController = {

  register: asyncHandler(async (req: Request, res: Response) => {
    const dto   = req.body as RegisterDto;
    const { user, verifyToken } = await authService.register(dto, req.ip);

    // In production, send verifyToken via email — not in response
    // Here we include it in dev mode for easy testing
    const data: Record<string, unknown> = { user };
    if (env.isDev()) data.verifyToken = verifyToken;

    ResponseUtil.created(res, data, CONSTANTS.MESSAGES.REGISTRATION_SUCCESS);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const dto     = req.body as LoginDto;
    const { user, tokens } = await authService.login(dto, req.ip, req.headers['user-agent']);

    setRefreshCookie(res, tokens.refreshToken);

    ResponseUtil.success(res, {
      user,
      accessToken: tokens.accessToken,
      expiresIn:   tokens.expiresIn,
    });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = getRefreshToken(req);
    const { user, tokens } = await authService.refresh(rawToken, req.ip, req.headers['user-agent']);

    setRefreshCookie(res, tokens.refreshToken);

    ResponseUtil.success(res, {
      user,
      accessToken: tokens.accessToken,
      expiresIn:   tokens.expiresIn,
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = getRefreshToken(req);
    await authService.logout(rawToken, req.user!.id);
    clearRefreshCookie(res);
    ResponseUtil.success(res, null, CONSTANTS.MESSAGES.LOGOUT_SUCCESS);
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAll(req.user!.id);
    clearRefreshCookie(res);
    ResponseUtil.success(res, null, 'Logged out from all devices');
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const dto   = req.body as ForgotPasswordDto;
    const token = await authService.forgotPassword(dto);

    // Always return same message — prevents email enumeration
    const data: Record<string, unknown> = {};
    if (env.isDev()) data.resetToken = token; // expose in dev only

    ResponseUtil.success(res, data, CONSTANTS.MESSAGES.EMAIL_SENT);
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as ResetPasswordDto;
    await authService.resetPassword(dto, req.ip);
    clearRefreshCookie(res);
    ResponseUtil.success(res, null, CONSTANTS.MESSAGES.PASSWORD_RESET_SUCCESS);
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as VerifyEmailDto;
    await authService.verifyEmail(dto);
    ResponseUtil.success(res, null, 'Email verified successfully');
  }),

  resendVerification: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    const token = await authService.resendVerification(email);

    const data: Record<string, unknown> = {};
    if (env.isDev()) data.verifyToken = token;

    ResponseUtil.success(res, data, CONSTANTS.MESSAGES.EMAIL_SENT);
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as ChangePasswordDto;
    await authService.changePassword(req.user!.id, dto, req.ip);
    clearRefreshCookie(res);
    ResponseUtil.success(res, null, 'Password changed. Please log in again.');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const { User } = await import('../user/user.model');
    const user = await User.findByPk(req.user!.id);
    if (!user) throw new AppError('User not found', CONSTANTS.HTTP_STATUS.NOT_FOUND);
    ResponseUtil.success(res, user.toPublicJSON());
  }),

  sessions: asyncHandler(async (req: Request, res: Response) => {
    const sessions = await authService.getSessions(req.user!.id);
    ResponseUtil.success(res, sessions);
  }),
};
