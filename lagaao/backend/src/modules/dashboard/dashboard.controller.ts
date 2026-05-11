import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { HTTP_STATUS, MESSAGES } from '../../config/constants';

function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: any) => fn(req, res).catch(next);
}

export const getKpiStats = asyncHandler(async (_req, res) => {
  const data = await dashboardService.getKpiStats();
  res.status(HTTP_STATUS.OK).json({ success: true, message: 'KPI stats retrieved', data });
});

export const getCharts = asyncHandler(async (_req, res) => {
  const data = await dashboardService.getCharts();
  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Chart data retrieved', data });
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 100);
  const data  = await dashboardService.getRecentActivity(limit);
  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Activity retrieved', data });
});

export const getRecentNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 50);
  const data  = await dashboardService.getRecentNotifications(limit);
  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Notifications retrieved', data });
});
