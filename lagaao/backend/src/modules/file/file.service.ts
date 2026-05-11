import path  from 'path';
import fs    from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Op }           from 'sequelize';
import { File }         from './file.model';
import { COLLECTIONS, UPLOAD_ROOT, TEMP_FOLDER, TEMP_MAX_AGE_MS } from '../../config/upload.config';
import { optimiseImage } from '../../utils/image.util';
import { NotFoundError, AppError, ForbiddenError } from '../../middleware/error.middleware';
import { logger } from '../../config/logger';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface SaveFileDto {
  multerFile:  Express.Multer.File;
  collection:  string;
  uploadedBy?: number;
  modelType?:  string;
  modelId?:    number;
  isPublic?:   boolean;
}

export interface FilePublicView {
  id:           number;
  uuid:         string;
  originalName: string;
  mimeType:     string;
  size:         number;
  collection:   string;
  isPublic:     boolean;
  url:          string;
  thumbUrl:     string | null;
  meta:         Record<string, unknown> | null;
  createdAt:    Date;
}

// ─── FileService ──────────────────────────────────────────────────────────────

export class FileService {

  // ── Save after multer upload ───────────────────────────────────────────────

  async save(dto: SaveFileDto): Promise<FilePublicView> {
    const { multerFile, collection, uploadedBy, modelType, modelId } = dto;
    const config   = COLLECTIONS[collection];
    const isPublic = dto.isPublic ?? config?.isPublic ?? false;

    // Run image optimisation (may change the path/filename to .webp)
    let imageMeta: Record<string, unknown> | null = null;
    let finalPath = multerFile.path;
    let finalMime = multerFile.mimetype;
    let finalSize = multerFile.size;

    if (config?.optimize && multerFile.mimetype.startsWith('image/')) {
      try {
        const result = await optimiseImage(multerFile.path, config);
        if (result) {
          finalPath = multerFile.path.replace(/\.[^.]+$/, '.webp');
          finalMime = 'image/webp';
          finalSize = fs.existsSync(finalPath) ? fs.statSync(finalPath).size : finalSize;
          imageMeta = {
            width:     result.width,
            height:    result.height,
            format:    result.format,
            thumbPath: result.thumbPath
              ? path.relative(UPLOAD_ROOT, result.thumbPath).replace(/\\/g, '/')
              : null,
          };
        }
      } catch (err) {
        logger.warn('Image optimisation failed', { err });
      }
    }

    const relativePath = path.relative(UPLOAD_ROOT, finalPath).replace(/\\/g, '/');

    const file = await File.create({
      uuid:         uuidv4(),
      disk:         'local',
      path:         relativePath,
      originalName: multerFile.originalname,
      mimeType:     finalMime,
      size:         finalSize,
      collection:   collection || 'general',
      modelType:    modelType ?? null,
      modelId:      modelId   ?? null,
      isPublic,
      uploadedBy:   uploadedBy ?? null,
      meta:         imageMeta,
    });

    return this.toPublicView(file);
  }

  // ── Find by UUID ──────────────────────────────────────────────────────────

  async findByUuid(uuid: string): Promise<File> {
    const file = await File.findOne({ where: { uuid } });
    if (!file) throw new NotFoundError('File not found');
    return file;
  }

  // ── List by model (polymorphic) ───────────────────────────────────────────

  async listByModel(modelType: string, modelId: number, collection?: string): Promise<FilePublicView[]> {
    const where: Record<string, unknown> = { modelType, modelId };
    if (collection) where['collection'] = collection;
    const files = await File.findAll({ where, order: [['createdAt', 'DESC']] });
    return files.map((f) => this.toPublicView(f));
  }

  // ── List by uploader ──────────────────────────────────────────────────────

  async listByUploader(uploadedBy: number, page = 1, limit = 20): Promise<{ rows: FilePublicView[]; total: number }> {
    const offset = (page - 1) * limit;
    const { rows, count } = await File.findAndCountAll({
      where: { uploadedBy },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return { rows: rows.map((f) => this.toPublicView(f)), total: count };
  }

  // ── Attach to model ───────────────────────────────────────────────────────

  async attachToModel(uuid: string, modelType: string, modelId: number, actorId?: number): Promise<FilePublicView> {
    const file = await this.findByUuid(uuid);
    if (file.uploadedBy !== actorId) throw new ForbiddenError('You do not own this file');
    await file.update({ modelType, modelId });
    return this.toPublicView(file);
  }

  // ── Delete (soft then unlink) ─────────────────────────────────────────────

  async delete(uuid: string, actorId?: number, isAdmin = false): Promise<void> {
    const file = await this.findByUuid(uuid);

    if (!isAdmin && file.uploadedBy !== actorId) {
      throw new ForbiddenError('You do not have permission to delete this file');
    }

    // Remove physical files
    this.unlinkSafe(path.join(UPLOAD_ROOT, file.path));
    const thumbPath = (file.meta as any)?.thumbPath;
    if (thumbPath) this.unlinkSafe(path.join(UPLOAD_ROOT, thumbPath));

    await file.destroy(); // soft delete
  }

  // ── Stream path for download ──────────────────────────────────────────────

  async resolveDownloadPath(uuid: string, actorId?: number, isAdmin = false): Promise<{ filePath: string; file: File }> {
    const file    = await this.findByUuid(uuid);
    const absPath = path.join(UPLOAD_ROOT, file.path);

    if (!file.isPublic && !isAdmin && file.uploadedBy !== actorId) {
      throw new ForbiddenError('Access denied');
    }
    if (!fs.existsSync(absPath)) throw new NotFoundError('File not found on disk');

    return { filePath: absPath, file };
  }

  // ── Orphan cleanup (call from cron or startup) ────────────────────────────

  async cleanupOrphans(): Promise<number> {
    const cutoff = new Date(Date.now() - TEMP_MAX_AGE_MS);
    const orphans = await File.findAll({
      where: {
        modelType: null,
        collection: 'general',
        createdAt: { [Op.lt]: cutoff },
      },
      paranoid: false,
    });

    let cleaned = 0;
    for (const f of orphans) {
      this.unlinkSafe(path.join(UPLOAD_ROOT, f.path));
      await f.destroy({ force: true });
      cleaned++;
    }

    logger.info(`[FileService] Cleaned up ${cleaned} orphaned files`);
    return cleaned;
  }

  // ── Public view mapper ────────────────────────────────────────────────────

  toPublicView(file: File): FilePublicView {
    const meta     = file.meta as Record<string, unknown> | null;
    const thumbRel = meta?.['thumbPath'] as string | undefined;

    return {
      id:           file.id,
      uuid:         file.uuid,
      originalName: file.originalName,
      mimeType:     file.mimeType,
      size:         file.size,
      collection:   file.collection,
      isPublic:     file.isPublic,
      url:          this.buildUrl(file),
      thumbUrl:     thumbRel ? `/uploads/${thumbRel}` : null,
      meta,
      createdAt:    file.createdAt,
    };
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private buildUrl(file: File): string {
    if (file.isPublic) return `/uploads/${file.path}`;
    return `/api/v1/files/${file.uuid}/download`;
  }

  private unlinkSafe(p: string): void {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); }
    catch (e) { logger.warn('Could not delete file', { path: p, err: e }); }
  }
}

export const fileService = new FileService();
