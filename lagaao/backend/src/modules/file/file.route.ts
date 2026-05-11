import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { validate }       from '../../middleware/validate.middleware';
import { createUploader } from '../../middleware/upload.middleware';
import { COLLECTIONS }    from '../../config/upload.config';
import {
  UploadQuerySchema, FileUuidParamSchema, AttachSchema, ListByModelSchema,
} from './file.validators';
import {
  uploadSingle, uploadMultiple, downloadFile, getFile,
  listByModel, listMyFiles, attachFile, deleteFile,
  getCollections, handleMulterError,
} from './file.controller';

const router = Router();

// ─── Public: metadata only ────────────────────────────────────────────────────
router.get('/collections', getCollections);

// ─── Public download (public files don't need auth; private ones do) ──────────
// optionalAuthenticate populates req.user if token present; controller enforces access
router.get(
  '/:uuid/download',
  optionalAuthenticate,
  validate({ params: FileUuidParamSchema }),
  downloadFile,
);

// ─── All other routes require authentication ───────────────────────────────────
router.use(authenticate);

// ─── Upload ───────────────────────────────────────────────────────────────────

// Build a combined uploader that picks the collection from the query string.
// Since multer must be instantiated before the collection is known from the
// request, we use a middleware that creates the right uploader on the fly.
const dynamicSingle = (req: Request, res: Response, next: NextFunction): void => {
  const collection = (req.query['collection'] as string) || 'general';
  const cfg        = COLLECTIONS[collection];
  const maxCount   = cfg?.maxCount ?? 5;
  createUploader(collection).single('file')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
};

const dynamicMultiple = (req: Request, res: Response, next: NextFunction): void => {
  const collection = (req.query['collection'] as string) || 'general';
  const cfg        = COLLECTIONS[collection];
  const maxCount   = cfg?.maxCount ?? 5;
  createUploader(collection).array('files', maxCount)(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
};

router.post(
  '/upload',
  validate({ query: UploadQuerySchema }),
  dynamicSingle,
  uploadSingle,
);

router.post(
  '/upload/multiple',
  validate({ query: UploadQuerySchema }),
  dynamicMultiple,
  uploadMultiple,
);

// ─── List ─────────────────────────────────────────────────────────────────────
router.get('/my', listMyFiles);
router.get('/by-model', validate({ query: ListByModelSchema }), listByModel);

// ─── Single file operations ───────────────────────────────────────────────────
router.get(  '/:uuid', validate({ params: FileUuidParamSchema }), getFile);
router.patch('/:uuid/attach', validate({ params: FileUuidParamSchema, body: AttachSchema }), attachFile);
router.delete('/:uuid', validate({ params: FileUuidParamSchema }), deleteFile);

export default router;
