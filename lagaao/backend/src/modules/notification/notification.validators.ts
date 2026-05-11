import { z } from 'zod';

export const CreateNotificationSchema = z.object({
  userId:         z.number().int().positive(),
  type:           z.string().min(1).max(100),
  title:          z.string().min(1).max(255),
  body:           z.string().max(2000).optional(),
  channel:        z.enum(['in_app', 'email', 'sms', 'push']).default('in_app'),
  actionUrl:      z.string().url().max(500).optional(),
  notifiableType: z.string().max(80).optional(),
  notifiableId:   z.number().int().positive().optional(),
  meta:           z.record(z.unknown()).optional(),
});

export const ListNotificationsSchema = z.object({
  page:      z.coerce.number().int().min(1).default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  channel:   z.enum(['in_app', 'email', 'sms', 'push']).optional(),
  unreadOnly: z.coerce.boolean().optional(),
  type:      z.string().max(100).optional(),
});

export const NotifUuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

export const BulkMarkReadSchema = z.object({
  uuids: z.array(z.string().uuid()).min(1).max(100),
});
