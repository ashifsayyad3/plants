import morgan, { StreamOptions } from 'morgan';
import { logger } from '../config/logger';
import { env } from '../config/env';

const stream: StreamOptions = {
  write: (message: string) => logger.http(message.trim()),
};

const skip = () => env.NODE_ENV === 'test';

export const morganMiddleware = morgan(
  env.isDev() ? 'dev' : ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream, skip },
);
