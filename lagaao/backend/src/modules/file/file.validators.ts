import { z } from 'zod';
import { COLLECTIONS } from '../../config/upload.config';

const collectionKeys = Object.keys(COLLECTIONS) as [string, ...string[]];

export const UploadQuerySchema = z.object({
  collection: z.enum(collectionKeys).default('general'),
  modelType:  z.string().max(80).optional(),
  modelId:    z.coerce.number().int().positive().optional(),
  isPublic:   z.coerce.boolean().optional(),
});

export const FileUuidParamSchema = z.object({
  uuid: z.string().uuid('Invalid file UUID'),
});

export const AttachSchema = z.object({
  modelType: z.string().min(1).max(80),
  modelId:   z.number().int().positive(),
});

export const ListByModelSchema = z.object({
  modelType:  z.string().min(1).max(80),
  modelId:    z.coerce.number().int().positive(),
  collection: z.string().optional(),
});

export type UploadQueryDto   = z.infer<typeof UploadQuerySchema>;
export type AttachDto        = z.infer<typeof AttachSchema>;
export type ListByModelDto   = z.infer<typeof ListByModelSchema>;
