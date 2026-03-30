import { Router } from 'express';
import { z } from 'zod';
import { saveSubscription, removeSubscription } from '../services/push.service.js';
import { AppError } from '../lib/app-error.js';

const router = Router();

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

// POST /api/push/subscribe — store a push subscription from a browser/PWA
router.post('/subscribe', async (req, res, next) => {
  try {
    const result = subscribeSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, 'Invalid push subscription object', 'VALIDATION_ERROR');
    }
    const { endpoint, keys } = result.data;
    const userAgent = req.headers['user-agent'];
    await saveSubscription(endpoint, keys.p256dh, keys.auth, userAgent);
    res.status(201).json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/push/subscribe — remove a push subscription (user revoked permission)
router.delete('/subscribe', async (req, res, next) => {
  try {
    const { endpoint } = req.body as { endpoint?: unknown };
    if (typeof endpoint !== 'string' || !endpoint) {
      throw new AppError(400, 'endpoint is required', 'VALIDATION_ERROR');
    }
    await removeSubscription(endpoint);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
