import { User } from './user.model';

export class ExportService {
  toCsv(users: User[]): string {
    const headers = ['UUID', 'Name', 'Email', 'Phone', 'Status', 'Email Verified', 'Last Login', 'Created At'];
    const rows = users.map((u: any) => [
      u.uuid,
      u.name,
      u.email,
      u.phone ?? '',
      u.status,
      u.emailVerifiedAt ? new Date(u.emailVerifiedAt).toISOString() : '',
      u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : '',
      new Date(u.createdAt).toISOString(),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));

    return [headers.join(','), ...rows].join('\n');
  }
}
