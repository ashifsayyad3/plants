import { fileService } from '../modules/file/file.service';
import { logger }      from '../config/logger';

let _timer: NodeJS.Timeout | null = null;
const INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

export function startCleanupJob(): void {
  if (_timer) return;
  _timer = setInterval(async () => {
    try {
      const n = await fileService.cleanupOrphans();
      if (n > 0) logger.info(`[Cleanup] Removed ${n} orphaned files`);
    } catch (err) {
      logger.error('[Cleanup] Orphan cleanup failed', { err });
    }
  }, INTERVAL_MS);

  // Unref so it doesn't prevent process exit
  _timer.unref();
  logger.info('[Cleanup] Orphan file cleanup job started (interval: 6h)');
}

export function stopCleanupJob(): void {
  if (_timer) { clearInterval(_timer); _timer = null; }
}
