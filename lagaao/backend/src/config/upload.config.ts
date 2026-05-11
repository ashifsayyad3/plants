import path from 'path';

// ─── Root storage path ────────────────────────────────────────────────────────
export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

// ─── Collection definitions ───────────────────────────────────────────────────
export interface CollectionConfig {
  folder:        string;   // sub-path under UPLOAD_ROOT
  maxSizeBytes:  number;
  maxCount:      number;   // max files per request
  allowedMimes:  readonly string[];
  optimize:      boolean;  // run sharp on upload
  maxWidthPx?:   number;   // resize if wider
  maxHeightPx?:  number;
  thumbWidthPx?: number;   // generate thumb if set
  isPublic:      boolean;  // serve without auth check
}

export const COLLECTIONS: Record<string, CollectionConfig> = {
  avatar: {
    folder:       'images/avatars',
    maxSizeBytes: 2 * 1024 * 1024,   // 2 MB
    maxCount:     1,
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
    optimize:     true,
    maxWidthPx:   400,
    maxHeightPx:  400,
    thumbWidthPx: 80,
    isPublic:     true,
  },
  listing_image: {
    folder:       'images/listings',
    maxSizeBytes: 5 * 1024 * 1024,   // 5 MB
    maxCount:     10,
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    optimize:     true,
    maxWidthPx:   1920,
    maxHeightPx:  1080,
    thumbWidthPx: 320,
    isPublic:     true,
  },
  document: {
    folder:       'documents',
    maxSizeBytes: 10 * 1024 * 1024,  // 10 MB
    maxCount:     5,
    allowedMimes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    optimize:  false,
    isPublic:  false,
  },
  general: {
    folder:       'general',
    maxSizeBytes: 8 * 1024 * 1024,   // 8 MB
    maxCount:     5,
    allowedMimes: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'application/pdf', 'text/plain', 'text/csv',
    ],
    optimize:  true,
    maxWidthPx: 2048,
    isPublic:  false,
  },
};

// ─── Allowed extensions (double-validation with MIME) ─────────────────────────
export const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv',
]);

// ─── Temp folder (auto-cleaned) ───────────────────────────────────────────────
export const TEMP_FOLDER     = 'temp';
export const TEMP_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Public URL prefix ────────────────────────────────────────────────────────
export const PUBLIC_UPLOAD_PREFIX = '/uploads';
