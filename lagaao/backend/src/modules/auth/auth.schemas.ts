import { z } from 'zod';

// ─── Password rule (reused) ───────────────────────────────────────────────────
const passwordSchema = z
  .string()
  .min(8,  'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Z]/,    'Password must contain at least one uppercase letter')
  .regex(/[a-z]/,    'Password must contain at least one lowercase letter')
  .regex(/[0-9]/,    'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ─── Register ─────────────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  name:     z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email:    z.string().trim().email('Invalid email address').toLowerCase(),
  password: passwordSchema,
  phone:    z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number').optional(),
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email:      z.string().trim().email().toLowerCase(),
  password:   z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

// ─── Refresh ──────────────────────────────────────────────────────────────────
export const RefreshSchema = z.object({
  // cookie is read by middleware; body refresh is also supported
  refreshToken: z.string().optional(),
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

// ─── Reset Password ───────────────────────────────────────────────────────────
export const ResetPasswordSchema = z
  .object({
    token:           z.string().min(1, 'Token is required'),
    password:        passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// ─── Change Password (authenticated) ─────────────────────────────────────────
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword:     passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different from current password',
    path:    ['newPassword'],
  });

// ─── Types ────────────────────────────────────────────────────────────────────
export type RegisterDto       = z.infer<typeof RegisterSchema>;
export type LoginDto          = z.infer<typeof LoginSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto  = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmailDto    = z.infer<typeof VerifyEmailSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
