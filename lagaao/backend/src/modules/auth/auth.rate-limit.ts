import rateLimit from 'express-rate-limit';
import { env }   from '../../config/env';
import { CONSTANTS } from '../../config/constants';

const message = { success: false, message: CONSTANTS.MESSAGES.TOO_MANY_REQUESTS };

/** 10 attempts per 15 minutes — login, register, forgot password */
export const authLimiter = rateLimit({
  windowMs:       env.AUTH_RATE_LIMIT.WINDOW_MS,
  max:            env.AUTH_RATE_LIMIT.MAX,
  standardHeaders: true,
  legacyHeaders:  false,
  message,
  skipSuccessfulRequests: false,
});

/** 5 resend attempts per 30 minutes */
export const resendLimiter = rateLimit({
  windowMs:       30 * 60 * 1000,
  max:            5,
  standardHeaders: true,
  legacyHeaders:  false,
  message,
});

/** 60 refresh attempts per minute (sliding window for normal app usage) */
export const refreshLimiter = rateLimit({
  windowMs:       60 * 1000,
  max:            60,
  standardHeaders: true,
  legacyHeaders:  false,
  message,
});
