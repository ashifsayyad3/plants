import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ResponseUtil } from '../utils/response.util';
import { CONSTANTS } from '../config/constants';

type ValidationTarget = 'body' | 'params' | 'query';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Validates request body, params, and/or query against Zod schemas.
 * On failure returns 400 with structured field-level errors.
 * On success, the parsed (coerced) values replace the originals on the request.
 *
 * Usage:
 *   router.post('/users', validate({ body: CreateUserSchema }), handler);
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const targets: ValidationTarget[] = ['body', 'params', 'query'];
    const allErrors: Record<string, string[]> = {};

    for (const target of targets) {
      const schema = schemas[target];
      if (!schema) continue;

      const result = schema.safeParse(req[target]);

      if (!result.success) {
        const fieldErrors = formatZodErrors(result.error);
        Object.assign(allErrors, fieldErrors);
      } else {
        // Replace with parsed/coerced value (e.g. string "1" → number 1)
        (req as unknown as Record<string, unknown>)[target] = result.data;
      }
    }

    if (Object.keys(allErrors).length > 0) {
      ResponseUtil.badRequest(res, CONSTANTS.MESSAGES.VALIDATION_ERROR, allErrors);
      return;
    }

    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_root';
    if (!formatted[field]) formatted[field] = [];
    formatted[field].push(issue.message);
  }

  return formatted;
}
