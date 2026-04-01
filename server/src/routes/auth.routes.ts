import { Router } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/login — validate credentials, return JWT
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const result = await authService.login(username, password);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — returns current user info (requires valid token)
router.get('/me', requireAuth, (_req, res, next) => {
  try {
    const data = authService.getMe();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
