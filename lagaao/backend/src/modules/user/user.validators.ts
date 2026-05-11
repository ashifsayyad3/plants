import { z } from 'zod';

// ─── Reusable ─────────────────────────────────────────────────────────────────

const uuidParam = z.object({ uuid: z.string().uuid('Invalid user UUID') });

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

// ─── Create User ──────────────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:    z.string().email('Invalid email address').max(191).transform((v) => v.toLowerCase().trim()),
  password: passwordSchema,
  phone:    z.string().max(20).optional().nullable(),
  status:   z.enum(['active', 'inactive', 'pending', 'banned']).default('active'),
  roleIds:  z.array(z.number().int().positive()).min(1, 'Assign at least one role').optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// ─── Update User ──────────────────────────────────────────────────────────────

export const UpdateUserSchema = z.object({
  name:  z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  meta:  z.record(z.unknown()).optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

// ─── Change Status ────────────────────────────────────────────────────────────

export const ChangeStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'banned', 'pending']),
  reason: z.string().max(255).optional(),
});

export type ChangeStatusDto = z.infer<typeof ChangeStatusSchema>;

// ─── Assign Roles ─────────────────────────────────────────────────────────────

export const AssignRolesSchema = z.object({
  roleIds: z.array(z.number().int().positive()).min(1, 'Provide at least one role ID'),
});

export type AssignRolesDto = z.infer<typeof AssignRolesSchema>;

// ─── Bulk Action ──────────────────────────────────────────────────────────────

export const BulkActionSchema = z.object({
  uuids:  z.array(z.string().uuid()).min(1, 'Select at least one user').max(100),
  action: z.enum(['activate', 'deactivate', 'ban', 'delete']),
});

export type BulkActionDto = z.infer<typeof BulkActionSchema>;

// ─── List Query ───────────────────────────────────────────────────────────────

export const ListUsersQuerySchema = z.object({
  page:    z.coerce.number().int().positive().default(1),
  limit:   z.coerce.number().int().positive().max(100).default(15),
  search:  z.string().max(100).optional(),
  status:  z.enum(['active', 'inactive', 'banned', 'pending']).optional(),
  roleId:  z.coerce.number().int().positive().optional(),
  sortBy:  z.enum(['name', 'email', 'createdAt', 'lastLoginAt', 'status']).default('createdAt'),
  sortDir: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type ListUsersQueryDto = z.infer<typeof ListUsersQuerySchema>;

// ─── Change Password (by admin) ───────────────────────────────────────────────

export const AdminChangePasswordSchema = z.object({
  newPassword: passwordSchema,
});

export type AdminChangePasswordDto = z.infer<typeof AdminChangePasswordSchema>;

// ─── Params ───────────────────────────────────────────────────────────────────

export const UuidParamSchema = uuidParam;
