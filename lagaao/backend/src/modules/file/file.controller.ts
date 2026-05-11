import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileService }  from './file.service';
import { ResponseUtil } from '../../utils/response.util';
import { asyncHandler } from '../../utils/async-handler.util';
import {
  createUploader,
  isMulterError,
  multerErrorMessage,
} from '../../middleware/upload.middleware';
import { COLLECTIONS } from '../../config/upload.config';
import { AppError }    from '../../middleware/error.middleware';

// ─── Upload: single file ──────────────────────────────────────────────────────

export const uploadSingle = asyncHandler(async (req: Request, res: Response) => {
  const { collection = 'general', modelType, modelId, isPublic } = req.query as any;
  const multerFile = req.file;

  if (!multerFile) return ResponseUtil.badRequest(res, 'No file provided');

  const file = await fileService.save({
    multerFile,
    collection,
    uploadedBy: (req as any).user?.id,
    modelType,
    modelId:    modelId ? parseInt(modelId, 10) : undefined,
    isPublic:   isPublic === 'true' || isPublic === true,
  });

  return ResponseUtil.created(res, file, 'File uploaded successfully');
});

// ─── Upload: multiple files ───────────────────────────────────────────────────

export const uploadMultiple = asyncHandler(async (req: Request, res: Response) => {
  const { collection = 'general', modelType, modelId, isPublic } = req.query as any;
  const multerFiles = req.files as Express.Multer.File[] | undefined;

  if (!multerFiles?.length) return ResponseUtil.badRequest(res, 'No files provided');

  const saved = await Promise.all(
    multerFiles.map((f) =>
      fileService.save({
        multerFile: f,
        collection,
        uploadedBy: (req as any).user?.id,
        modelType,
        modelId:    modelId ? parseInt(modelId, 10) : undefined,
        isPublic:   isPublic === 'true' || isPublic === true,
      }),
    ),
  );

  return ResponseUtil.created(res, saved, `${saved.length} file(s) uploaded`);
});

// ─── Download (private files, streamed with auth) ─────────────────────────────

export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  const { filePath, file } = await fileService.resolveDownloadPath(
    req.params['uuid'],
    (req as any).user?.id,
    (req as any).user?.roles?.includes('admin') || (req as any).user?.roles?.includes('super_admin'),
  );

  const ext = path.extname(file.path).slice(1);
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Length', file.size);
  res.setHeader('Cache-Control', 'private, max-age=3600');

  const inline = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'pdf'].includes(ext);
  const disposition = inline
    ? `inline; filename="${file.originalName}"`
    : `attachment; filename="${file.originalName}"`;
  res.setHeader('Content-Disposition', disposition);

  fs.createReadStream(filePath).pipe(res);
});

// ─── Get file metadata ────────────────────────────────────────────────────────

export const getFile = asyncHandler(async (req: Request, res: Response) => {
  const file = await fileService.findByUuid(req.params['uuid']);
  return ResponseUtil.success(res, fileService.toPublicView(file));
});

// ─── List by model ────────────────────────────────────────────────────────────

export const listByModel = asyncHandler(async (req: Request, res: Response) => {
  const { modelType, modelId, collection } = req.query as any;
  const files = await fileService.listByModel(modelType, parseInt(modelId, 10), collection);
  return ResponseUtil.success(res, files);
});

// ─── List my files ────────────────────────────────────────────────────────────

export const listMyFiles = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const page   = parseInt((req.query['page'] as string) || '1', 10);
  const limit  = parseInt((req.query['limit'] as string) || '20', 10);
  const result = await fileService.listByUploader(userId, page, limit);
  return ResponseUtil.success(res, result);
});

// ─── Attach to model ──────────────────────────────────────────────────────────

export const attachFile = asyncHandler(async (req: Request, res: Response) => {
  const { modelType, modelId } = req.body;
  const file = await fileService.attachToModel(
    req.params['uuid'],
    modelType,
    modelId,
    (req as any).user?.id,
  );
  return ResponseUtil.success(res, file, 'File attached');
});

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = ['admin', 'super_admin'].some((r) => (req as any).user?.roles?.includes(r));
  await fileService.delete(req.params['uuid'], (req as any).user?.id, isAdmin);
  return ResponseUtil.noContent(res);
});

// ─── Available collections ────────────────────────────────────────────────────

export const getCollections = asyncHandler(async (_req: Request, res: Response) => {
  const info = Object.entries(COLLECTIONS).map(([key, c]) => ({
    key,
    maxSizeMb:    Math.round(c.maxSizeBytes / (1024 * 1024)),
    maxCount:     c.maxCount,
    allowedMimes: c.allowedMimes,
    isPublic:     c.isPublic,
  }));
  return ResponseUtil.success(res, info);
});

// ─── Multer error adapter (used in route as extra error handler) ───────────────

export function handleMulterError(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (isMulterError(err)) {
    ResponseUtil.badRequest(res, multerErrorMessage(err));
    return;
  }
  if (err instanceof AppError) {
    ResponseUtil.error(res, err.message, err.statusCode);
    return;
  }
  next(err);
}
