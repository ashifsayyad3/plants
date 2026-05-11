import { Request, Response } from 'express';
import { activityLogService } from './activity-log.service';
import { ResponseUtil }       from '../../utils/response.util';
import { asyncHandler }       from '../../utils/async-handler.util';

export const listActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1, limit = 50, userId, action, subjectType,
    subjectId, ipAddress, from, to, search,
  } = req.query as any;

  const result = await activityLogService.list({
    page: +page, limit: +limit,
    userId:      userId      ? +userId     : undefined,
    subjectId:   subjectId   ? +subjectId  : undefined,
    action, subjectType, ipAddress, from, to, search,
  });

  return ResponseUtil.paginated(res, result.rows.map(activityLogService.toPublicView), result.meta);
});

export const getActivityLog = asyncHandler(async (req: Request, res: Response) => {
  const log = await activityLogService.findById(+req.params['id']);
  return ResponseUtil.success(res, activityLogService.toPublicView(log));
});

export const getActionSummary = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query['days'] ? +req.query['days'] : 7;
  const summary = await activityLogService.actionSummary(days);
  return ResponseUtil.success(res, summary);
});
