import { Request, Response } from 'express';
import { ResponseUtil } from '../../utils/response.util';

/**
 * Thin base controller providing shared response helpers.
 * Module controllers extend this and inject their service.
 *
 * Usage:
 *   class UserController extends BaseController {
 *     constructor(private service: UserService) { super(); }
 *     list = asyncHandler(async (req, res) => {
 *       const result = await this.service.findAll(req.query);
 *       this.sendPaginated(res, result.rows, result.meta);
 *     });
 *   }
 */
export abstract class BaseController {
  protected sendSuccess<T>(res: Response, data?: T, message?: string, statusCode?: number): Response {
    return ResponseUtil.success(res, data, message, statusCode);
  }

  protected sendCreated<T>(res: Response, data?: T, message?: string): Response {
    return ResponseUtil.created(res, data, message);
  }

  protected sendPaginated<T>(
    res: Response,
    rows: T[],
    meta: import('../../types/common.types').PaginationMeta,
    message?: string,
  ): Response {
    return ResponseUtil.paginated(res, rows, meta, message);
  }

  protected sendNoContent(res: Response): Response {
    return ResponseUtil.noContent(res);
  }

  protected sendError(res: Response, message: string, statusCode?: number, req?: Request): Response {
    return ResponseUtil.error(res, message, statusCode, undefined, req);
  }
}
