import { z } from 'zod';

export const ListActivityLogsSchema = z.object({
  page:        z.coerce.number().int().min(1).default(1),
  limit:       z.coerce.number().int().min(1).max(100).default(50),
  userId:      z.coerce.number().int().positive().optional(),
  action:      z.string().max(100).optional(),
  subjectType: z.string().max(80).optional(),
  subjectId:   z.coerce.number().int().positive().optional(),
  ipAddress:   z.string().max(45).optional(),
  from:        z.string().datetime().optional(),
  to:          z.string().datetime().optional(),
  search:      z.string().max(200).optional(),
});

export const ActivityLogIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
