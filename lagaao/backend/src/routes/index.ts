import { Application } from 'express';
import { CONSTANTS } from '../config/constants';
import { logger } from '../config/logger';
import v1Routes from './v1/index';

/**
 * Route loader — mounts all versioned API routers onto the Express app.
 *
 * Centralising this here means app.ts never needs to know about individual
 * modules; it just calls loadRoutes(app) once.
 */
export function loadRoutes(app: Application): void {
  // V1 routes
  app.use(CONSTANTS.API_PREFIX, v1Routes);
  logger.info(`Routes mounted at ${CONSTANTS.API_PREFIX}`);

  // V2 example (add when needed):
  // app.use('/api/v2', v2Routes);
}
