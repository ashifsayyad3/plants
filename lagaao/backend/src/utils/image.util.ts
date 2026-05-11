import path from 'path';
import fs   from 'fs';
import { ensureDir } from '../middleware/upload.middleware';
import { CollectionConfig } from '../config/upload.config';

export interface ImageMeta {
  width:     number;
  height:    number;
  format:    string;
  thumbPath: string | null;
}

/**
 * Optimise an uploaded image with Sharp (lazy-loaded to avoid crash when Sharp
 * is not installed — server degrades gracefully with a warning).
 *
 * Returns metadata (dimensions, format, thumb path) stored in File.meta.
 */
export async function optimiseImage(
  filePath: string,
  config:   CollectionConfig,
): Promise<ImageMeta | null> {
  let sharp: typeof import('sharp');
  try {
    sharp = (await import('sharp')).default as any;
  } catch {
    console.warn('[upload] sharp not installed — skipping image optimisation');
    return null;
  }

  const img     = sharp(filePath);
  const meta    = await img.metadata();
  const w       = meta.width  ?? 0;
  const h       = meta.height ?? 0;
  const maxW    = config.maxWidthPx  ?? 2048;
  const maxH    = config.maxHeightPx ?? 2048;

  // ── Resize if needed ────────────────────────────────────────────────────────
  const needsResize = (config.maxWidthPx && w > maxW) || (config.maxHeightPx && h > maxH);
  const pipeline    = needsResize
    ? img.resize(maxW, maxH, { fit: 'inside', withoutEnlargement: true })
    : img;

  // ── Convert + write back to same path (overwrite original) ─────────────────
  const outputPath = filePath.replace(/\.[^.]+$/, '.webp');
  await pipeline.webp({ quality: 82 }).toFile(outputPath);

  if (outputPath !== filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath); // remove original non-webp
  }

  // ── Thumbnail ───────────────────────────────────────────────────────────────
  let thumbPath: string | null = null;
  if (config.thumbWidthPx) {
    const thumbDir  = path.join(path.dirname(outputPath), 'thumbs');
    ensureDir(thumbDir);
    thumbPath = path.join(thumbDir, path.basename(outputPath));
    await sharp(outputPath)
      .resize(config.thumbWidthPx, config.thumbWidthPx, { fit: 'cover' })
      .webp({ quality: 70 })
      .toFile(thumbPath);
  }

  const finalMeta = await sharp(outputPath).metadata();

  return {
    width:     finalMeta.width  ?? w,
    height:    finalMeta.height ?? h,
    format:    'webp',
    thumbPath: thumbPath ?? null,
  };
}

export function humanSize(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
