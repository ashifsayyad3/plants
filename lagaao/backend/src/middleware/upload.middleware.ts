import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import fs   from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import {
  UPLOAD_ROOT, COLLECTIONS, ALLOWED_EXTENSIONS, TEMP_FOLDER, CollectionConfig,
} from '../config/upload.config';
import { AppError } from './error.middleware';

// ─── Ensure directory exists ──────────────────────────────────────────────────

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ─── Disk storage factory ─────────────────────────────────────────────────────

function buildStorage(collection: string): StorageEngine {
  const config = COLLECTIONS[collection];
  const folder = config
    ? path.join(UPLOAD_ROOT, config.folder)
    : path.join(UPLOAD_ROOT, TEMP_FOLDER);

  ensureDir(folder);

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, folder);
    },
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const safe = ALLOWED_EXTENSIONS.has(ext) ? ext : '';
      cb(null, `${uuidv4()}${safe}`);
    },
  });
}

// ─── File filter ──────────────────────────────────────────────────────────────

function buildFilter(config: CollectionConfig | null) {
  return (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new AppError(`File extension "${ext}" is not allowed`, 400));
    }

    const allowed = config?.allowedMimes;
    if (allowed && !allowed.includes(file.mimetype)) {
      return cb(new AppError(
        `MIME type "${file.mimetype}" is not allowed for this collection. Allowed: ${allowed.join(', ')}`,
        400,
      ));
    }

    cb(null, true);
  };
}

// ─── Public factory ───────────────────────────────────────────────────────────

export function createUploader(collection = 'general') {
  const config   = COLLECTIONS[collection] ?? null;
  const maxCount = config?.maxCount ?? 5;
  const maxSize  = config?.maxSizeBytes ?? 8 * 1024 * 1024;

  return multer({
    storage:  buildStorage(collection),
    fileFilter: buildFilter(config),
    limits: {
      fileSize:  maxSize,
      files:     maxCount,
      fieldSize: 1024,       // 1 KB for non-file fields
    },
  });
}

// ─── Multer error normaliser (used in route error handler) ────────────────────

export function isMulterError(err: unknown): err is multer.MulterError {
  return err instanceof multer.MulterError;
}

export function multerErrorMessage(err: multer.MulterError): string {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':  return 'File is too large for this collection';
    case 'LIMIT_FILE_COUNT': return 'Too many files in this request';
    case 'LIMIT_UNEXPECTED_FILE': return 'Unexpected file field name';
    default: return err.message;
  }
}
