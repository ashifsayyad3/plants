import { Router }           from 'express';
import { AuthController }   from './auth.controller';
import { validate }         from '../../middleware/validate.middleware';
import { authenticate }     from '../../middleware/auth.middleware';
import { authLimiter, resendLimiter, refreshLimiter } from './auth.rate-limit';
import {
  RegisterSchema, LoginSchema, ForgotPasswordSchema,
  ResetPasswordSchema, VerifyEmailSchema, ChangePasswordSchema,
} from './auth.schemas';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization
 */

// ─── Public Routes ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: "Ali Hassan" }
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               phone:    { type: string, example: "+923001234567" }
 *     responses:
 *       201: { description: Account created }
 *       409: { description: Email already exists }
 *       422: { description: Validation error }
 */
router.post('/register',
  authLimiter,
  validate({ body: RegisterSchema }),
  AuthController.register,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive access + refresh tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:      { type: string, format: email }
 *               password:   { type: string }
 *               rememberMe: { type: boolean, default: false }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login',
  authLimiter,
  validate({ body: LoginSchema }),
  AuthController.login,
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using httpOnly cookie or body token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200: { description: New access token issued }
 *       401: { description: Refresh token invalid or expired }
 */
router.post('/refresh',
  refreshLimiter,
  AuthController.refresh,
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 *     security: []
 */
router.post('/forgot-password',
  authLimiter,
  validate({ body: ForgotPasswordSchema }),
  AuthController.forgotPassword,
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 *     security: []
 */
router.post('/reset-password',
  authLimiter,
  validate({ body: ResetPasswordSchema }),
  AuthController.resetPassword,
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email using token from email
 *     tags: [Auth]
 *     security: []
 */
router.post('/verify-email',
  validate({ body: VerifyEmailSchema }),
  AuthController.verifyEmail,
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification link
 *     tags: [Auth]
 *     security: []
 */
router.post('/resend-verification',
  resendLimiter,
  AuthController.resendVerification,
);

// ─── Protected Routes (require valid access token) ────────────────────────────

router.use(authenticate);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 */
router.get('/me',           AuthController.me);

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: List active sessions for the current user
 *     tags: [Auth]
 */
router.get('/sessions',     AuthController.sessions);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout from current device
 *     tags: [Auth]
 */
router.post('/logout',      AuthController.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth]
 */
router.post('/logout-all',  AuthController.logoutAll);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (must re-login after)
 *     tags: [Auth]
 */
router.post('/change-password',
  validate({ body: ChangePasswordSchema }),
  AuthController.changePassword,
);

export default router;
