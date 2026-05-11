export type UploadCollection = 'avatar' | 'listing_image' | 'document' | 'general';

export interface FileRecord {
  id:           number;
  uuid:         string;
  originalName: string;
  mimeType:     string;
  size:         number;
  collection:   string;
  isPublic:     boolean;
  url:          string;
  thumbUrl:     string | null;
  meta:         { width?: number; height?: number; format?: string; thumbPath?: string } | null;
  createdAt:    string;
}

export interface CollectionInfo {
  key:          string;
  maxSizeMb:    number;
  maxCount:     number;
  allowedMimes: string[];
  isPublic:     boolean;
}

// ─── Upload state per file ────────────────────────────────────────────────────

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  id:         string;       // client-side temp ID
  file:       File;         // browser File object
  status:     UploadStatus;
  progress:   number;       // 0-100
  error?:     string;
  record?:    FileRecord;   // populated after success
  preview?:   string;       // data URL for images
}

// ─── Type helpers ─────────────────────────────────────────────────────────────

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isPdf(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

export function fileIcon(mimeType: string): string {
  if (isImage(mimeType))   return 'image';
  if (isPdf(mimeType))     return 'picture_as_pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table_chart';
  if (mimeType.includes('word') || mimeType.includes('document'))     return 'description';
  if (mimeType === 'text/csv')  return 'table_chart';
  if (mimeType === 'text/plain') return 'article';
  return 'insert_drive_file';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1048576)     return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
