import jwt from 'jsonwebtoken';
import { type Request, type Response, type NextFunction } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';

// Augment Express.Request so downstream handlers can read req.user without casting
declare global {
  namespace Express {
    interface Request {
      user?: { sub: string };
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    return;
  }

  const token = authHeader.slice(7); // Strip "Bearer " prefix

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    req.user = { sub: payload.sub };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      logger.debug('Auth: token expired');
      next(new AppError(401, 'Token expired', 'TOKEN_EXPIRED'));
    } else {
      logger.debug('Auth: invalid token');
      next(new AppError(401, 'Invalid token', 'UNAUTHORIZED'));
    }
  }
};
