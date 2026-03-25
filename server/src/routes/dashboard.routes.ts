import { Router } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (_req, res, next) => {
  try {
    const result = await dashboardService.getStats();
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// GET /api/dashboard/activity?limit=20
router.get('/activity', async (req, res, next) => {
  try {
    const limit =
      req.query['limit'] !== undefined ? Math.min(Number(req.query['limit']), 100) : 20;
    const result = await dashboardService.getRecentActivity(limit);
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;
